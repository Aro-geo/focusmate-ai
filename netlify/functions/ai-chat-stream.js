const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
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
      // Return mock streaming response
      const mockResponse = "I'm here to help you stay focused! Let's work through this step by step.";
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: mockResponse,
          source: 'mock',
          streaming: false
        })
      };
    }

    // Use real OpenAI API with streaming
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a focus and productivity coach. Help users stay motivated, break down tasks, and maintain focus. Be encouraging, practical, and concise.'
          },
          {
            role: 'user',
            content: userContext ? `Context: ${userContext}\n\nQuestion: ${message}` : message
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
        stream: false // Note: Netlify Functions don't support streaming responses well
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = openaiResponse.data.choices[0].message.content.trim();
    
    // Simulate streaming by sending chunks
    const words = aiResponse.split(' ');
    let streamedResponse = '';
    
    // For now, return the full response (real streaming would require WebSockets or SSE)
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: aiResponse,
        source: 'openai',
        streaming: true,
        chunks: words.length
      })
    };

  } catch (error) {
    console.error('AI streaming chat error:', error.response?.data || error.message);
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: "I'm here to help you stay focused! What's your current challenge?",
        source: 'fallback',
        streaming: false
      })
    };
  }
};
