const axios = require('axios');
const jwt = require('jsonwebtoken');
const { 
  query, 
  createErrorResponse, 
  createSuccessResponse, 
  createResponse, 
  handleOptions, 
  validateRequiredFields 
} = require('./db-utils');

// Rate limiting storage (in-memory for simplicity, could use Redis in production)
const rateLimitStore = new Map();

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Rate limiting function
const checkRateLimit = (userId, limit = 100, windowMs = 3600000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, []);
  }
  
  const userRequests = rateLimitStore.get(userId);
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => time > windowStart);
  rateLimitStore.set(userId, recentRequests);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  return true;
};

// Store AI interaction in database
const storeInteraction = async (userId, prompt, response, interactionType, source, context) => {
  try {
    await query(`
      INSERT INTO ai_interactions (
        user_id, prompt, response, interaction_type, source, context, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [userId, prompt, response, interactionType, source, context]);
  } catch (error) {
    console.error('Failed to store AI interaction:', error);
  }
};

// Main OpenAI API call function
const callOpenAI = async (messages, options = {}) => {
  const {
    model = 'gpt-3.5-turbo',
    maxTokens = 300,
    temperature = 0.7,
    stream = false
  } = options;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('OpenAI API request timeout');
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
};

// Generate fallback responses based on interaction type
const getFallbackResponse = (interactionType, context = '') => {
  const fallbacks = {
    chat: [
      "I'm here to help you stay focused! What's your current challenge?",
      "Let's break this down step by step. What's the first action you can take?",
      "You've got this! Sometimes the best way forward is to start small.",
      "Focus on progress, not perfection. What small win can you achieve right now?"
    ],
    focus_suggestions: [
      "Break your task into smaller 15-minute chunks",
      "Remove distractions from your workspace",
      "Set a specific goal for this session",
      "Use the Pomodoro technique for better focus",
      "Try the two-minute rule for quick tasks"
    ],
    session_summary: [
      "Great work completing this session! You showed excellent focus and determination.",
      "Every focused session contributes to building stronger productivity habits.",
      "Excellent progress! Keep building these positive work patterns."
    ],
    journal_analysis: [
      "Your reflection shows great self-awareness. Keep up the journaling habit!",
      "I notice your dedication to reflection and growth. This self-awareness will help you optimize your productivity.",
      "Your journal entries demonstrate consistent effort toward your goals. Keep reflecting on your progress!"
    ]
  };

  const responses = fallbacks[interactionType] || fallbacks.chat;
  return responses[Math.floor(Math.random() * responses.length)];
};

exports.handler = async (event, context) => {
  const requestOrigin = event.headers.origin || event.headers.Origin;
  
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions(requestOrigin);
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed', {}, requestOrigin);
  }

  try {
    const {
      messages,
      interactionType,
      context,
      options = {},
      requireAuth = true
    } = JSON.parse(event.body);

    let userId = null;

    // Authentication check (optional for some interactions)
    if (requireAuth) {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse(401, 'Authorization token required', {}, requestOrigin);
      }

      try {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        userId = decoded.userId;
      } catch (error) {
        return createErrorResponse(401, 'Invalid authorization token', {}, requestOrigin);
      }

      // Rate limiting check
      if (!checkRateLimit(userId)) {
        return createErrorResponse(429, 'Rate limit exceeded. Please try again later.', {
          source: 'rate_limit'
        }, requestOrigin);
      }
    }

    // Validate required fields
    validateRequiredFields({ messages }, ['messages']);
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return createErrorResponse(400, 'Messages must be a non-empty array', {}, requestOrigin);
    }

    let response;
    let source = 'openai';
    const userPrompt = messages[messages.length - 1]?.content || '';

    try {
      // Call OpenAI API
      const openaiResponse = await callOpenAI(messages, options);
      response = openaiResponse.choices[0]?.message?.content?.trim();

      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

    } catch (error) {
      console.error('OpenAI API error:', error.message);
      
      // Use fallback response
      response = getFallbackResponse(interactionType, context);
      source = 'fallback';
    }

    // Store interaction in database (if user is authenticated)
    if (userId) {
      await storeInteraction(
        userId,
        userPrompt,
        response,
        interactionType || 'chat',
        source,
        context || ''
      );
    }

    // Return response
    return createResponse(200, {
      success: true,
      response,
      source,
      interactionType,
      timestamp: new Date().toISOString(),
      usage: source === 'openai' ? {
        tokens: Math.ceil(response.length / 4), // Rough estimate
        model: options.model || 'gpt-3.5-turbo'
      } : undefined
    }, {}, requestOrigin);

  } catch (error) {
    console.error('OpenAI Proxy error:', error);
    
    if (error.message.includes('Missing required fields')) {
      return createErrorResponse(400, error.message, {}, requestOrigin);
    }
    
    return createErrorResponse(500, 'Internal server error', {}, requestOrigin);
  }
};
