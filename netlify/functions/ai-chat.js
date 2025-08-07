const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { message, context: userContext } = JSON.parse(event.body);
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to mock responses if no API key
      const responses = [
        "Great question! Let me help you focus on that task.",
        "I suggest breaking this down into smaller, manageable steps.",
        "You're making excellent progress! Keep up the momentum!",
        "Consider using the Pomodoro technique for this challenge.",
        "That's a thoughtful reflection. How can we apply this insight?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          response: randomResponse,
          source: 'mock'
        })
      };
    }

    // Use real OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a focus and productivity coach. Help users stay motivated, break down tasks, and maintain focus. Be encouraging, practical, and concise. Respond in 1-2 sentences.'
          },
          {
            role: 'user',
            content: userContext ? `Context: ${userContext}\n\nQuestion: ${message}` : message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = openaiResponse.data.choices[0].message.content.trim();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        source: 'openai'
      })
    };
  } catch (error) {
    console.error('AI chat error:', error.response?.data || error.message);
    
    // Fallback to mock response on error
    const fallbackResponses = [
      "I'm here to help you stay focused! What's your current challenge?",
      "Let's break this down step by step. What's the first action you can take?",
      "You've got this! Sometimes the best way forward is to start small."
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: fallbackResponse,
        source: 'fallback'
      })
    };
  }
};