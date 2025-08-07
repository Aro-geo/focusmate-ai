exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      message: 'Auth routes are working on Netlify!',
      timestamp: new Date().toISOString()
    })
  };
};