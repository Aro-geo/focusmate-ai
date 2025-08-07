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
    const { sessionData } = JSON.parse(event.body);
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to mock response
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          summary: "Great work completing this session! You showed excellent focus and determination.",
          insights: "Your productivity patterns show consistent effort. Keep building these positive habits!",
          suggestions: [
            "Take a well-deserved break",
            "Reflect on what worked well",
            "Plan your next focused session"
          ],
          source: 'mock'
        })
      };
    }

    // Create context-aware prompt from session data
    const sessionInfo = {
      duration: sessionData?.duration || 'unknown',
      completed: sessionData?.completed || false,
      tasks: sessionData?.tasks || [],
      mood: sessionData?.mood || 'neutral',
      distractions: sessionData?.distractions || 0
    };

    const prompt = `Analyze this focus session and provide insights:
Duration: ${sessionInfo.duration} minutes
Completed: ${sessionInfo.completed}
Tasks: ${JSON.stringify(sessionInfo.tasks)}
Mood: ${sessionInfo.mood}
Distractions: ${sessionInfo.distractions}

Provide a summary, insights, and 3 suggestions for improvement.`;

    // Use real OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity coach analyzing focus sessions. Provide encouraging feedback with specific insights and actionable suggestions. Format your response as: Summary: [brief summary], Insights: [analysis], Suggestions: [3 numbered suggestions]'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
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
    
    // Parse the response to extract summary, insights, and suggestions
    const lines = aiResponse.split('\n').filter(line => line.trim());
    let summary = '';
    let insights = '';
    let suggestions = [];

    for (const line of lines) {
      if (line.toLowerCase().includes('summary:')) {
        summary = line.replace(/summary:/i, '').trim();
      } else if (line.toLowerCase().includes('insights:')) {
        insights = line.replace(/insights:/i, '').trim();
      } else if (line.toLowerCase().includes('suggestions:')) {
        // Next lines should be suggestions
        continue;
      } else if (line.match(/^\d+\./)) {
        suggestions.push(line.replace(/^\d+\.\s*/, '').trim());
      }
    }

    // Fallback if parsing fails
    if (!summary) summary = "Great work on completing this focus session!";
    if (!insights) insights = "Your dedication to focused work is building excellent productivity habits.";
    if (suggestions.length === 0) {
      suggestions = [
        "Take a refreshing break to recharge",
        "Reflect on what strategies worked best",
        "Set clear intentions for your next session"
      ];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary,
        insights,
        suggestions: suggestions.slice(0, 3),
        source: 'openai'
      })
    };

  } catch (error) {
    console.error('Session summary error:', error);
    
    // Fallback response on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary: "Excellent work completing this session!",
        insights: "Every focused session contributes to building stronger productivity habits.",
        suggestions: [
          "Take a well-deserved break",
          "Review what you accomplished",
          "Plan your next productive session"
        ],
        source: 'fallback'
      })
    };
  }
};
