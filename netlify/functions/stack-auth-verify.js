const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { 
  createErrorResponse, 
  createSuccessResponse, 
  handleOptions 
} = require('./db-utils');

// JWKS client for Stack Auth
const client = jwksClient({
  jwksUri: process.env.STACK_AUTH_JWKS_URL || `https://api.stack-auth.com/api/v1/projects/${process.env.VITE_STACK_PROJECT_ID}/.well-known/jwks.json`,
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function verifyStackAuthToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: process.env.VITE_STACK_PROJECT_ID,
      issuer: 'https://api.stack-auth.com',
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

exports.handler = async (event, context) => {
  const requestId = Math.random().toString(36).substring(2, 8);
  const timestamp = new Date().toISOString();
  const requestOrigin = event.headers.origin || event.headers.Origin;
  
  console.log(`[STACK-AUTH:${requestId}] ${timestamp} - Stack Auth verification request`);
  console.log(`[STACK-AUTH:${requestId}] HTTP Method: ${event.httpMethod}`);
  console.log(`[STACK-AUTH:${requestId}] Origin: ${requestOrigin || 'Unknown'}`);
  
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions(requestOrigin);
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed', {}, requestOrigin);
  }

  try {
    const { token, action } = JSON.parse(event.body);
    
    if (!token) {
      return createErrorResponse(400, 'Token is required', {}, requestOrigin);
    }

    console.log(`[STACK-AUTH:${requestId}] Action: ${action || 'verify'}`);
    console.log(`[STACK-AUTH:${requestId}] Token length: ${token.length} chars`);
    console.log(`[STACK-AUTH:${requestId}] JWKS URL: ${process.env.STACK_AUTH_JWKS_URL}`);

    switch (action) {
      case 'verify':
      default:
        try {
          const decoded = await verifyStackAuthToken(token);
          console.log(`[STACK-AUTH:${requestId}] Token verified successfully`);
          console.log(`[STACK-AUTH:${requestId}] User ID: ${decoded.sub}`);
          console.log(`[STACK-AUTH:${requestId}] Email: ${decoded.email}`);
          
          return createSuccessResponse(
            {
              valid: true,
              payload: decoded,
              user: {
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name || decoded.email?.split('@')[0],
                picture: decoded.picture,
                verified: decoded.email_verified || false
              }
            },
            requestOrigin
          );
        } catch (verifyError) {
          console.error(`[STACK-AUTH:${requestId}] Token verification failed:`, verifyError.message);
          
          return createErrorResponse(
            401, 
            'Invalid or expired token', 
            { 
              error: verifyError.message,
              code: verifyError.name 
            }, 
            requestOrigin
          );
        }

      case 'jwks':
        // Return JWKS URL for client-side use
        return createSuccessResponse(
          {
            jwksUrl: process.env.STACK_AUTH_JWKS_URL,
            projectId: process.env.VITE_STACK_PROJECT_ID,
            issuer: 'https://api.stack-auth.com'
          },
          requestOrigin
        );

      case 'config':
        // Return Stack Auth configuration
        return createSuccessResponse(
          {
            projectId: process.env.VITE_STACK_PROJECT_ID,
            publishableKey: process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
            jwksUrl: process.env.STACK_AUTH_JWKS_URL
          },
          requestOrigin
        );

    }

  } catch (error) {
    console.error(`[STACK-AUTH:${requestId}] Unexpected error:`, error);
    return createErrorResponse(
      500, 
      'Internal server error', 
      { error: error.message }, 
      requestOrigin
    );
  }
};
