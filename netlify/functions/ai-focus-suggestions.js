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
    const { currentTask, timeRemaining, distractions } = JSON.parse(event.body);
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to mock responses
      const mockSuggestions = [
        "Break your task into smaller 15-minute chunks",
        "Remove distractions from your workspace", 
        "Set a specific goal for this session",
        "Use the two-minute rule for quick tasks",
        "Try the Pomodoro technique"
      ];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          suggestions: mockSuggestions.slice(0, 3),
          source: 'mock'
        })
      };
    }

    // Create context-aware prompt
    let prompt = `As a productivity coach, give 3 specific focus suggestions for this task: "${currentTask}"`;
    if (timeRemaining) prompt += ` (${timeRemaining} minutes remaining)`;
    if (distractions) prompt += `. Current distractions: ${distractions}`;
    prompt += '. Respond with actionable, specific advice.';

    // Use real OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a focus and productivity coach. Provide exactly 3 specific, actionable suggestions to help users focus better. Each suggestion should be one clear sentence.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = openaiResponse.data.choices[0].message.content;
    
    // Parse suggestions from AI response
    const suggestions = aiResponse
      .split('\n')
      .filter(line => line.trim() && (line.includes('1.') || line.includes('2.') || line.includes('3.') || line.includes('-')))
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
      .slice(0, 3);

    // Fallback if parsing fails
    if (suggestions.length === 0) {
      suggestions.push(aiResponse.trim());
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        suggestions,
        source: 'openai'
      })
    };

  } catch (error) {
    console.error('Focus suggestions error:', error);
    
    // Fallback suggestions on error
    const fallbackSuggestions = [
      "Break your task into smaller 15-minute chunks",
      "Remove distractions from your workspace",
      "Set a specific goal for this session"
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        suggestions: fallbackSuggestions,
        source: 'fallback'
      })
    };
  }
};
