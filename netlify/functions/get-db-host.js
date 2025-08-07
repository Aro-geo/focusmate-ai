const { authenticateUserWithStackAuth, createSuccessResponse, createErrorResponse } = require('./db-utils');

/**
 * This function provides the database host information to authenticated clients
 * It's a safer approach than exposing the full connection string in client-side env vars
 */
exports.handler = async (event, context) => {
  // Request ID for tracking logs
  const requestId = Math.random().toString(36).substring(2, 8);
  const timestamp = new Date().toISOString();
  const requestOrigin = event.headers.origin || event.headers.Origin;
  
  console.log(`[DB-HOST:${requestId}] ${timestamp} - New request received`);
  
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed', {}, requestOrigin);
  }

  try {
    // Authentication is required
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(401, 'Authentication required', {}, requestOrigin);
    }

    // Verify user is authenticated
    try {
      const authResult = await authenticateUserWithStackAuth(authHeader);
      if (!authResult || !authResult.userId) {
        return createErrorResponse(401, 'Invalid authentication token', {}, requestOrigin);
      }
      console.log(`[DB-HOST:${requestId}] User authenticated: ${authResult.userId}`);
    } catch (authError) {
      console.error(`[DB-HOST:${requestId}] Authentication error:`, authError);
      return createErrorResponse(401, 'Authentication failed', {}, requestOrigin);
    }

    // Extract the host from the authenticated URL
    const dbUrl = process.env.DATABASE_AUTHENTICATED_URL;
    if (!dbUrl) {
      console.error(`[DB-HOST:${requestId}] DATABASE_AUTHENTICATED_URL not set`);
      return createErrorResponse(500, 'Server configuration error', {}, requestOrigin);
    }
    
    // Parse the URL to extract host
    const matches = dbUrl.match(/@([^/]+)\//);
    if (!matches || matches.length < 2) {
      console.error(`[DB-HOST:${requestId}] Cannot parse host from DATABASE_AUTHENTICATED_URL`);
      return createErrorResponse(500, 'Invalid database URL format', {}, requestOrigin);
    }
    
    const host = matches[1];
    
    // Return only the host information, not the full connection string
    return createSuccessResponse({ 
      host,
      ttl: 3600 // Time in seconds this info is valid
    }, 'Database host retrieved successfully', requestOrigin);
    
  } catch (error) {
    console.error(`[DB-HOST:${requestId}] Error:`, error);
    return createErrorResponse(500, 'Server error', {}, requestOrigin);
  }
};
