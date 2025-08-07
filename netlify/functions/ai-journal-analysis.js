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
    const { journalEntries } = JSON.parse(event.body);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        insights: "Your reflection shows great self-awareness and dedication to growth. Keep documenting your journey!",
        suggestions: [
          "Continue reflecting on your daily experiences",
          "Set specific goals for tomorrow",
          "Celebrate your achievements, no matter how small"
        ],
        source: 'mock'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Analysis failed',
        message: error.message
      })
    };
  }
};