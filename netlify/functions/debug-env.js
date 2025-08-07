const { createResponse, withCORS } = require('./db-utils');

exports.handler = withCORS(async (event) => {
  console.log('🔍 [debug-env] Environment check');

  if (event.httpMethod !== 'GET') {
    return createResponse(405, {
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    console.log('Environment variables check:', envCheck);

    return createResponse(200, {
      success: true,
      data: envCheck
    });

  } catch (error) {
    console.error('Environment check error:', error);
    return createResponse(500, {
      success: false,
      message: 'Environment check failed',
      error: error.message
    });
  }
});
