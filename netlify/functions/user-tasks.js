const { neon } = require('@neondatabase/serverless');
const { 
  createSuccessResponse, 
  createErrorResponse, 
  authenticateUserWithStackAuth,
  closeConnections
} = require('./db-utils');

/**
 * Serverless function to fetch user's tasks using Neon's authenticated connection
 */
exports.handler = async (event, context) => {
  // Optimize for serverless environment
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Request tracking info
  const requestId = Math.random().toString(36).substring(2, 8);
  const requestOrigin = event.headers.origin || event.headers.Origin;
  console.log(`[USER-TASKS:${requestId}] New request received from ${requestOrigin}`);
  
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method not allowed');
  }
  
  try {
    // Extract auth token from request headers
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(401, 'Authentication required', {}, requestOrigin);
    }

    // Authenticate the user
    console.log(`[USER-TASKS:${requestId}] Authenticating user`);
    let userInfo;
    try {
      userInfo = await authenticateUserWithStackAuth(authHeader);
      if (!userInfo || !userInfo.userId) {
        return createErrorResponse(401, 'Invalid authentication token', {}, requestOrigin);
      }
      console.log(`[USER-TASKS:${requestId}] User authenticated: ${userInfo.userId}`);
    } catch (authError) {
      console.error(`[USER-TASKS:${requestId}] Authentication error:`, authError);
      return createErrorResponse(401, 'Authentication failed', {}, requestOrigin);
    }

    // Initialize the Neon serverless connection with authentication
    console.log(`[USER-TASKS:${requestId}] Connecting to database with authenticated role`);
    
    // Check if we have the DATABASE_AUTHENTICATED_URL environment variable
    const authenticatedUrl = process.env.DATABASE_AUTHENTICATED_URL;
    if (!authenticatedUrl) {
      console.error(`[USER-TASKS:${requestId}] DATABASE_AUTHENTICATED_URL not set`);
      return createErrorResponse(500, 'Server configuration error', {}, requestOrigin);
    }
    
    // Create the SQL executor with JWT token for authentication
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const sql = neon(authenticatedUrl, {
      // Pass the JWT token for authentication
      authToken: async () => token
    });
    
    // Execute the query
    console.log(`[USER-TASKS:${requestId}] Fetching tasks for user ${userInfo.userId}`);
    try {
      // Using Row Level Security (RLS) to filter by user_id automatically
      // But also adding explicit WHERE clause for better performance
      const tasks = await sql`
        SELECT * FROM tasks 
        WHERE user_id = ${userInfo.userId} 
        ORDER BY created_at DESC
      `;
      
      console.log(`[USER-TASKS:${requestId}] Successfully fetched ${tasks.length} tasks`);
      return createSuccessResponse(tasks, 'Tasks fetched successfully', requestOrigin);
    } catch (sqlError) {
      console.error(`[USER-TASKS:${requestId}] Database query error:`, sqlError);
      return createErrorResponse(500, 'Error fetching tasks', 
        { error: sqlError.message }, requestOrigin);
    }
    
  } catch (error) {
    console.error(`[USER-TASKS:${requestId}] Unexpected error:`, error);
    return createErrorResponse(500, 'An unexpected error occurred', 
      { error: error.message }, requestOrigin);
  } finally {
    // Ensure connections are closed properly
    try {
      await closeConnections();
      console.log(`[USER-TASKS:${requestId}] Database connections closed`);
    } catch (closeError) {
      console.error(`[USER-TASKS:${requestId}] Error closing connections:`, closeError);
    }
  }
};
