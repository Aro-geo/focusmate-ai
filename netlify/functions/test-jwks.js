const axios = require('axios');
const { 
  createErrorResponse, 
  createSuccessResponse, 
  handleOptions,
  getStackAuthConfig
} = require('./db-utils');

exports.handler = async (event, context) => {
  const requestId = Math.random().toString(36).substring(2, 8);
  const timestamp = new Date().toISOString();
  const requestOrigin = event.headers.origin || event.headers.Origin;
  
  console.log(`[JWKS-TEST:${requestId}] ${timestamp} - JWKS URL test request`);
  
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions(requestOrigin);
  }

  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed', {}, requestOrigin);
  }

  try {
    const config = getStackAuthConfig();
    
    console.log(`[JWKS-TEST:${requestId}] Testing JWKS URL: ${config.jwksUrl}`);
    
    // Test fetching JWKS
    const jwksResponse = await axios.get(config.jwksUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'FocusMate-AI/1.0'
      }
    });

    const jwks = jwksResponse.data;
    
    console.log(`[JWKS-TEST:${requestId}] JWKS fetched successfully`);
    console.log(`[JWKS-TEST:${requestId}] Keys count: ${jwks.keys?.length || 0}`);

    return createSuccessResponse(
      {
        status: 'success',
        message: 'JWKS URL is accessible',
        config: {
          projectId: config.projectId,
          jwksUrl: config.jwksUrl,
          keysCount: jwks.keys?.length || 0
        },
        jwks: {
          keys: jwks.keys?.map(key => ({
            kid: key.kid,
            kty: key.kty,
            alg: key.alg,
            use: key.use
          })) || []
        },
        timestamp: timestamp
      },
      requestOrigin
    );

  } catch (error) {
    console.error(`[JWKS-TEST:${requestId}] JWKS test failed:`, error.message);
    
    return createErrorResponse(
      500,
      'JWKS URL test failed',
      {
        error: error.message,
        code: error.code,
        url: getStackAuthConfig().jwksUrl
      },
      requestOrigin
    );
  }
};
