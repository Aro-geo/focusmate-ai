const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { 
  query, 
  createResponse, 
  createErrorResponse, 
  createSuccessResponse, 
  handleOptions, 
  validateRequiredFields,
  closeConnections
} = require('./db-utils');

exports.handler = async (event, context) => {
  // Request ID for tracking logs
  const requestId = Math.random().toString(36).substring(2, 8);
  const timestamp = new Date().toISOString();
  
  console.log(`[REGISTER:${requestId}] ${timestamp} - New registration request received`);
  console.log(`[REGISTER:${requestId}] HTTP Method: ${event.httpMethod}`);
  console.log(`[REGISTER:${requestId}] User-Agent: ${event.headers['user-agent'] || 'Unknown'}`);
  
  if (event.httpMethod === 'OPTIONS') {
    console.log(`[REGISTER:${requestId}] Handling CORS preflight request`);
    return handleOptions();
  }

  if (event.httpMethod !== 'POST') {
    console.log(`[REGISTER:${requestId}] Invalid method: ${event.httpMethod}`);
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    console.log(`[REGISTER:${requestId}] Parsing request body...`);
    const { name, email, password } = JSON.parse(event.body);
    
    // Log registration data (safely masked)
    const maskedEmail = email ? email.substring(0, 3) + '***@' + email.split('@')[1] : 'undefined';
    console.log(`[REGISTER:${requestId}] Registration attempt:`);
    console.log(`[REGISTER:${requestId}] - Name: ${name || 'undefined'}`);
    console.log(`[REGISTER:${requestId}] - Email: ${maskedEmail}`);
    console.log(`[REGISTER:${requestId}] - Password provided: ${!!password}`);
    console.log(`[REGISTER:${requestId}] - Password length: ${password?.length || 0} chars`);
    
    // Validate required fields
    console.log(`[REGISTER:${requestId}] Validating required fields...`);
    validateRequiredFields({ name, email, password }, ['name', 'email', 'password']);
    console.log(`[REGISTER:${requestId}] Field validation passed`);

    // Check if users table exists
    console.log(`[REGISTER:${requestId}] Checking if users table exists in Neon database...`);
    const tableCheckStart = Date.now();
    
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tableCheckDuration = Date.now() - tableCheckStart;
    console.log(`[REGISTER:${requestId}] Table check completed in ${tableCheckDuration}ms`);
    console.log(`[REGISTER:${requestId}] Users table exists: ${tableCheck.rows[0].exists}`);
    
    if (!tableCheck.rows[0].exists) {
      console.error(`[REGISTER:${requestId}] ❌ FATAL: Users table does not exist in database`);
      return createErrorResponse(500, 'Database not properly initialized. Please contact support.');
    }

    // Check if user already exists
    console.log(`[REGISTER:${requestId}] Checking if user already exists...`);
    const existingUserStart = Date.now();
    
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    const existingUserDuration = Date.now() - existingUserStart;
    console.log(`[REGISTER:${requestId}] Existing user check completed in ${existingUserDuration}ms`);
    console.log(`[REGISTER:${requestId}] Existing users found: ${existingUser.rows.length}`);

    if (existingUser.rows.length > 0) {
      console.log(`[REGISTER:${requestId}] ❌ REGISTRATION FAILED: User already exists with email ${maskedEmail}`);
      console.log(`[REGISTER:${requestId}] Existing user ID: ${existingUser.rows[0].id}`);
      console.log(`[REGISTER:${requestId}] Returning 400 Bad Request`);
      return createErrorResponse(400, 'User already exists with this email');
    }

    // Hash password
    console.log(`[REGISTER:${requestId}] User does not exist, proceeding with registration...`);
    console.log(`[REGISTER:${requestId}] Hashing password with bcrypt (12 rounds)...`);
    const hashStart = Date.now();
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const hashDuration = Date.now() - hashStart;
    console.log(`[REGISTER:${requestId}] Password hashing completed in ${hashDuration}ms`);
    console.log(`[REGISTER:${requestId}] Hash length: ${hashedPassword.length} chars`);
    
    // Create user
    console.log(`[REGISTER:${requestId}] Inserting new user into database...`);
    const insertStart = Date.now();
    
    const result = await query(
      'INSERT INTO users (username, email, password_hash, verified, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, username, email, verified, created_at',
      [name, email, hashedPassword, false]
    );
    
    const insertDuration = Date.now() - insertStart;
    console.log(`[REGISTER:${requestId}] User insertion completed in ${insertDuration}ms`);
    console.log(`[REGISTER:${requestId}] Rows inserted: ${result.rowCount}`);
    
    const user = result.rows[0];
    console.log(`[REGISTER:${requestId}] ✅ User created successfully:`);
    console.log(`[REGISTER:${requestId}] - User ID: ${user.id}`);
    console.log(`[REGISTER:${requestId}] - Username: ${user.username}`);
    console.log(`[REGISTER:${requestId}] - Email: ${maskedEmail}`);
    console.log(`[REGISTER:${requestId}] - Verified: ${user.verified}`);
    console.log(`[REGISTER:${requestId}] - Created at: ${user.created_at}`);
    
    // Do NOT generate JWT token - user needs to verify email first
    console.log(`[REGISTER:${requestId}] Skipping JWT token generation - email verification required`);
    
    const responseData = {
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        verified: user.verified,
        created_at: user.created_at
      }
      // No token provided
    };
    
    console.log(`[REGISTER:${requestId}] ✅ REGISTRATION SUCCESS for ${maskedEmail} (verification required)`);
    console.log(`[REGISTER:${requestId}] Total request duration: ${Date.now() - new Date(timestamp).getTime()}ms`);
    
    // Ensure database connections are properly closed
    try {
      await closeConnections();
      console.log(`[REGISTER:${requestId}] Database connections closed`);
    } catch (closeError) {
      console.error(`[REGISTER:${requestId}] Error closing connections:`, closeError);
    }
    
    return createResponse(201, responseData);

  } catch (error) {
    console.error(`[REGISTER:${requestId}] ❌ ERROR occurred:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.constructor.name
    });
    
    // Provide more specific error messages
    let errorMessage = 'Registration failed';
    let statusCode = 500;
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`[REGISTER:${requestId}] Database connection error: ${error.code}`);
      errorMessage = 'Database connection failed';
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error(`[REGISTER:${requestId}] Database schema error: ${error.message}`);
      errorMessage = 'Database tables not initialized. Please contact support.';
    } else if (error.message.includes('JWT')) {
      console.error(`[REGISTER:${requestId}] JWT configuration error: ${error.message}`);
      errorMessage = 'Authentication setup error';
    } else if (error.message.includes('Missing required fields')) {
      console.log(`[REGISTER:${requestId}] Validation error: ${error.message}`);
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      console.error(`[REGISTER:${requestId}] Invalid JSON in request body`);
      errorMessage = 'Invalid request format';
      statusCode = 400;
    } else if (error.code === '23505') { // PostgreSQL unique constraint violation
      console.log(`[REGISTER:${requestId}] Duplicate email constraint violation`);
      errorMessage = 'User already exists with this email';
      statusCode = 400;
    }
    
    console.log(`[REGISTER:${requestId}] Returning ${statusCode} error: ${errorMessage}`);
    console.log(`[REGISTER:${requestId}] Total request duration: ${Date.now() - new Date(timestamp).getTime()}ms`);
    
    // Ensure database connections are properly closed
    try {
      await closeConnections();
      console.log(`[REGISTER:${requestId}] Database connections closed`);
    } catch (closeError) {
      console.error(`[REGISTER:${requestId}] Error closing connections:`, closeError);
    }
    
    return createErrorResponse(statusCode, errorMessage, {
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};