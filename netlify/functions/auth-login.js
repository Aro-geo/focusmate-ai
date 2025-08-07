const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { 
  query, 
  createErrorResponse, 
  createSuccessResponse, 
  handleOptions, 
  validateRequiredFields,
  closeConnections
} = require('./db-utils');

exports.handler = async (event, context) => {
  // Optimize Lambda cold starts by not waiting for event loop to empty
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Request ID for tracking logs
  const requestId = Math.random().toString(36).substring(2, 8);
  const timestamp = new Date().toISOString();
  const requestOrigin = event.headers.origin || event.headers.Origin;
  
  console.log(`[LOGIN:${requestId}] ${timestamp} - New login request received`);
  console.log(`[LOGIN:${requestId}] HTTP Method: ${event.httpMethod}`);
  console.log(`[LOGIN:${requestId}] User-Agent: ${event.headers['user-agent'] || 'Unknown'}`);
  console.log(`[LOGIN:${requestId}] Origin: ${requestOrigin || 'Unknown'}`);
  
  if (event.httpMethod === 'OPTIONS') {
    console.log(`[LOGIN:${requestId}] Handling CORS preflight request`);
    return handleOptions(requestOrigin);
  }

  if (event.httpMethod !== 'POST') {
    console.log(`[LOGIN:${requestId}] Invalid method: ${event.httpMethod}`);
    return createErrorResponse(405, 'Method Not Allowed', {}, requestOrigin);
  }

  try {
    // Mark the function start time for timing metrics
    const functionStart = Date.now();
    console.log(`[LOGIN:${requestId}] Parsing request body...`);
    const { email, password } = JSON.parse(event.body);
    
    // Log email (safely masked)
    const maskedEmail = email ? email.substring(0, 3) + '***@' + email.split('@')[1] : 'undefined';
    console.log(`[LOGIN:${requestId}] Login attempt for email: ${maskedEmail}`);
    console.log(`[LOGIN:${requestId}] Password provided: ${!!password}`);
    console.log(`[LOGIN:${requestId}] Password length: ${password?.length || 0} chars`);
    
    // Validate required fields
    console.log(`[LOGIN:${requestId}] Validating required fields...`);
    validateRequiredFields({ email, password }, ['email', 'password']);
    console.log(`[LOGIN:${requestId}] Field validation passed`);

    // Database query
    console.log(`[LOGIN:${requestId}] Querying Neon database for user...`);
    const queryStart = Date.now();
    
    const result = await query(
      'SELECT id, username, email, password_hash, verified, created_at FROM users WHERE email = $1',
      [email]
    );
    
    const queryDuration = Date.now() - queryStart;
    console.log(`[LOGIN:${requestId}] Database query completed in ${queryDuration}ms`);
    console.log(`[LOGIN:${requestId}] Query result: ${result.rows.length} user(s) found`);

    if (result.rows.length === 0) {
      console.log(`[LOGIN:${requestId}] ❌ AUTH FAILURE: User not found for email ${maskedEmail}`);
      console.log(`[LOGIN:${requestId}] Returning 401 Unauthorized`);
      return createErrorResponse(401, 'User not found', { error: 'User not found' }, requestOrigin);
    }

    const user = result.rows[0];
    console.log(`[LOGIN:${requestId}] ✅ User found - ID: ${user.id}, Username: ${user.username}`);
    console.log(`[LOGIN:${requestId}] User created: ${user.created_at}`);
    console.log(`[LOGIN:${requestId}] User verified: ${user.verified}`);
    console.log(`[LOGIN:${requestId}] Password hash length: ${user.password_hash?.length || 0} chars`);

    // Check if user is verified
    if (!user.verified) {
      console.log(`[LOGIN:${requestId}] ❌ AUTH FAILURE: User ${maskedEmail} has not verified their email`);
      console.log(`[LOGIN:${requestId}] Returning 401 Unauthorized - email verification required`);
      return createErrorResponse(401, 'Please verify your email', { error: 'Please verify your email' }, requestOrigin);
    }
    // Password verification
    console.log(`[LOGIN:${requestId}] Verifying password with bcrypt...`);
    const bcryptStart = Date.now();
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    const bcryptDuration = Date.now() - bcryptStart;
    console.log(`[LOGIN:${requestId}] Bcrypt comparison completed in ${bcryptDuration}ms`);
    console.log(`[LOGIN:${requestId}] Password verification result: ${isValidPassword ? 'VALID' : 'INVALID'}`);
    
    if (!isValidPassword) {
      console.log(`[LOGIN:${requestId}] ❌ AUTH FAILURE: Invalid password for user ${maskedEmail}`);
      console.log(`[LOGIN:${requestId}] Returning 401 Unauthorized`);
      return createErrorResponse(401, 'Invalid email or password', { error: 'Invalid email or password' }, requestOrigin);
    }
    
    // JWT Token generation
    console.log(`[LOGIN:${requestId}] Password valid, generating JWT token...`);
    
    if (!process.env.JWT_SECRET) {
      console.error(`[LOGIN:${requestId}] ❌ FATAL: JWT_SECRET not configured in environment`);
      throw new Error('JWT_SECRET not configured');
    }
    
    console.log(`[LOGIN:${requestId}] JWT_SECRET available: ${!!process.env.JWT_SECRET}`);
    
    const tokenPayload = { userId: user.id, email: user.email };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log(`[LOGIN:${requestId}] ✅ JWT token generated successfully`);
    console.log(`[LOGIN:${requestId}] Token payload: userId=${user.id}, email=${maskedEmail}`);
    
    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token
    };
    
    console.log(`[LOGIN:${requestId}] ✅ LOGIN SUCCESS for user ${maskedEmail}`);
    console.log(`[LOGIN:${requestId}] Total request duration: ${Date.now() - new Date(timestamp).getTime()}ms`);
    
    // Ensure database connections are properly closed
    try {
      await closeConnections();
      console.log(`[LOGIN:${requestId}] Database connections closed`);
    } catch (closeError) {
      console.error(`[LOGIN:${requestId}] Error closing connections:`, closeError);
    }
    
    return createSuccessResponse(responseData, 'Login successful', requestOrigin);

  } catch (error) {
    console.error(`[LOGIN:${requestId}] ❌ ERROR occurred:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.constructor.name
    });
    
    let errorMessage = 'Login failed';
    let statusCode = 500;
    
    if (error.message.includes('Missing required fields')) {
      console.log(`[LOGIN:${requestId}] Validation error: ${error.message}`);
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`[LOGIN:${requestId}] Database connection error: ${error.code}`);
      errorMessage = 'Database connection failed';
    } else if (error.message.includes('JWT')) {
      console.error(`[LOGIN:${requestId}] JWT configuration error: ${error.message}`);
      errorMessage = 'Authentication setup error';
    } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      console.error(`[LOGIN:${requestId}] Invalid JSON in request body`);
      errorMessage = 'Invalid request format';
      statusCode = 400;
    }
    
    console.log(`[LOGIN:${requestId}] Returning ${statusCode} error: ${errorMessage}`);
    console.log(`[LOGIN:${requestId}] Total request duration: ${Date.now() - new Date(timestamp).getTime()}ms`);
    
    // Ensure database connections are properly closed
    try {
      await closeConnections();
      console.log(`[LOGIN:${requestId}] Database connections closed`);
    } catch (closeError) {
      console.error(`[LOGIN:${requestId}] Error closing connections:`, closeError);
    }
    
    return createErrorResponse(statusCode, errorMessage, {}, requestOrigin);
  }
};