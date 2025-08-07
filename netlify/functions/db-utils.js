const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Load the Neon serverless driver
let neon;
try {
  neon = require('@neondatabase/serverless');
  console.log('✅ Neon serverless driver loaded successfully');
} catch (e) {
  console.error('❌ ERROR loading Neon serverless driver:', e.message);
  console.log('Falling back to standard pg for database connections');
}

let pool;
let sqlExecutor;

/**
 * Get Neon SQL executor for serverless connections
 * @returns {Function} SQL executor function
 */
function getSqlExecutor() {
  if (sqlExecutor) return sqlExecutor;

  try {
    if (!neon) {
      console.log('Neon serverless driver not available, skipping SQL executor initialization');
      return null;
    }
    
    // Parse Neon connection string - use direct connections when possible for better performance
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set for Neon SQL executor!');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Configure options for neon serverless driver
    const options = {
      // Default to true for improved serverless performance, unless explicitly disabled
      useSecureWebSocket: process.env.PGHOST_READONLY !== 'false',
      
      // Set appropriate connection timeouts
      connectionTimeoutMillis: 5000
    };
    
    console.log('Initializing Neon serverless SQL executor with connection string (masked): ' + 
      connectionString.substring(0, 20) + '...');
    
    // Create the SQL executor
    sqlExecutor = neon(connectionString, options);
    
    console.log('✅ Neon serverless SQL executor initialized');
    return sqlExecutor;
  } catch (err) {
    console.error('❌ Failed to initialize Neon serverless SQL executor:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    return null;
  }
}

/**
 * Get or create a Postgres connection pool
 * @returns {Pool} Postgres connection pool
 */
function getPool() {
  if (pool) return pool;

  try {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set!');
      console.error('Available env vars:', Object.keys(process.env)
        .filter(key => !key.toLowerCase().includes('secret') && !key.toLowerCase().includes('key'))
        .join(', '));
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('Creating new database pool with connection string (masked): ' + 
      (connectionString 
        ? connectionString.substring(0, 20) + '...' 
        : 'undefined'));
    
    // Configure pool with appropriate settings for serverless environment
    const poolConfig = {
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: parseInt(process.env.PGPOOL_MAX_SIZE || '3', 10), // Default to 3 connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 5000, // Connection timeout after 5 seconds
      allowExitOnIdle: true, // Allow the pool to exit when all clients finish
    };
    
    console.log('Pool configuration:', JSON.stringify({
      ...poolConfig,
      connectionString: '[MASKED]'
    }));
    
    pool = new Pool(poolConfig);
    
    // Set up pool error handling
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
    });
    
    // Set up pool connection events for monitoring
    pool.on('connect', () => {
      console.log('New client connected to the pool');
    });
    
    pool.on('remove', () => {
      console.log('Client removed from pool');
    });
    
    // Attempt an initial connection to verify setup
    console.log('Attempting test connection to database...');
    pool.connect()
      .then(client => {
        client.release();
        console.log('✅ Database pool initialized and verified');
      })
      .catch(err => {
        console.error('❌ Error during pool initialization:', err.message);
        console.error('Connection error details:', {
          code: err.code,
          message: err.message,
          stack: err.stack,
        });
        // Don't throw here, we'll let the query method handle retries
        pool = null;
      });
    
    return pool;
  } catch (err) {
    console.error('Failed to initialize connection pool:', err);
    throw err;
  }
}

// Removed duplicate getPool function

// Removed duplicate getSqlExecutor function

/**
 * Helper to determine if an error is retryable
 * @param {Error} err - The error to check
 * @returns {boolean} Whether the error is retryable
 */
function isRetryableError(err) {
  const retryableErrors = [
    'Connection terminated',
    'connection timeout',
    'Connection terminated unexpectedly',
    'ECONNREFUSED',
    'timeout expired',
    'Connection terminated due to connection timeout'
  ];
  
  return retryableErrors.some(message => 
    err.message && err.message.includes(message)
  );
}

/**
 * Log database query metrics for monitoring
 * @param {string} queryText - SQL query text
 * @param {number} duration - Query duration in ms
 * @param {boolean} success - Whether the query succeeded
 * @param {string} errorMessage - Error message if query failed
 */
function logQueryMetrics(queryText, duration, success, errorMessage = null) {
  const metrics = {
    timestamp: new Date().toISOString(),
    query_type: queryText.trim().split(' ')[0].toUpperCase(),
    duration_ms: duration,
    success,
    error: errorMessage
  };
  
  console.log(`DB_METRICS: ${JSON.stringify(metrics)}`);
}

/**
 * Execute a database query with retry logic
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Query result
 */
async function query(text, params = [], options = {}) {
  const { useNeon = true, retries = 2, retryDelay = 200 } = options;
  
  // Try to use Neon serverless driver first if available and not explicitly disabled
  if (useNeon && neon && getSqlExecutor()) {
    return neonQuery(text, params, { retries, retryDelay });
  } else {
    return poolQuery(text, params, { retries, retryDelay });
  }
}

/**
 * Execute a query using Neon serverless driver
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Query result
 */
async function neonQuery(text, params = [], options = {}) {
  const { retries = 2, retryDelay = 200 } = options;
  const executor = getSqlExecutor();
  let lastError;
  
  const queryStart = Date.now();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Neon query retry attempt ${attempt}/${retries}`);
      }
      
      const result = await executor(text, params);
      const duration = Date.now() - queryStart;
      
      console.log('Executed neon query', {
        text: text.substring(0, 50),
        duration,
        rows: result.length || 0
      });
      
      logQueryMetrics(text, duration, true);
      
      // Format like pg results for compatibility
      return {
        rows: result,
        rowCount: result.length,
        command: text.trim().split(' ')[0].toUpperCase()
      };
    } catch (err) {
      lastError = err;
      
      if (!isRetryableError(err) || attempt === retries) {
        const duration = Date.now() - queryStart;
        console.error('Neon query error:', {
          text: text.substring(0, 50),
          error: err.message
        });
        logQueryMetrics(text, duration, false, err.message);
        throw err;
      }
      
      console.log(`Will retry neon query after ${retryDelay}ms: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
}

/**
 * Execute a database query with retry logic using pg pool
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Query result
 */
async function poolQuery(text, params = [], options = {}) {
  const { retries = 2, retryDelay = 200 } = options;
  let lastError;
  
  // Get pool
  const pool = getPool();
  
  // For debug purposes
  const queryStart = Date.now();
  
  // Try with retries
  for (let attempt = 0; attempt <= retries; attempt++) {
    let client;
    try {
      client = await pool.connect();
      
      if (attempt > 0) {
        console.log(`Database query retry attempt ${attempt}/${retries}`);
      }
      
      const result = await client.query(text, params);
      const duration = Date.now() - queryStart;
      
      // Log success
      console.log('Executed query', {
        text: text.substring(0, 50), // First 50 chars only for logging
        duration,
        rows: result.rowCount
      });
      
      logQueryMetrics(text, duration, true);
      
      return result;
    } catch (err) {
      lastError = err;
      
      const duration = Date.now() - queryStart;
      
      // Only retry on connection-related errors
      if (!isRetryableError(err) || attempt === retries) {
        console.error('Database query error:', {
          text: text.substring(0, 50),
          error: err.message
        });
        logQueryMetrics(text, duration, false, err.message);
        throw err;
      }
      
      console.log(`Will retry query after ${retryDelay}ms: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    } finally {
      // Always release client back to pool
      if (client) {
        client.release();
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Function that receives client and executes queries
 * @returns {Promise<any>} Transaction result
 */
/**
 * Execute a database transaction with retry logic and proper error handling
 * @param {Function} callback - Transaction callback function that receives client
 * @param {Object} options - Transaction options
 * @returns {Promise<any>} - Result of the transaction
 */
async function transaction(callback, options = {}) {
  const { retries = 1, retryDelay = 300 } = options;
  const pool = getPool();
  let lastError;
  let client;
  
  // Start transaction metrics
  const txnStart = Date.now();
  
  // Try with retries
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Transaction retry attempt ${attempt}/${retries}`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      // Get client for this attempt
      client = await pool.connect();
      
      // Begin transaction
      await client.query('BEGIN');
      
      // Execute callback with transaction client
      const result = await callback(client);
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Log success
      const duration = Date.now() - txnStart;
      console.log(`Transaction completed successfully in ${duration}ms`);
      
      // Return result
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Only perform rollback if we have a client and the error is not connection-related
      if (client) {
        try {
          await client.query('ROLLBACK');
          console.log('Transaction rolled back');
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError.message);
        }
      }
      
      // If this error is not retryable or we're out of retries, rethrow
      if (!isRetryableError(error) || attempt === retries) {
        console.error('Transaction error:', {
          message: error.message,
          stack: error.stack,
          code: error.code
        });
        throw error;
      }
      
      console.log(`Will retry transaction: ${error.message}`);
    } finally {
      // Always release client back to pool if we have one
      if (client) {
        client.release();
        client = null;
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Check if database connection is healthy
 * @returns {Promise<boolean>} Connection status
 */
/**
 * Perform a database health check with detailed diagnostics
 * @param {Object} options - Health check options
 * @returns {Promise<Object>} Health check results
 */
async function healthCheck(options = {}) {
  const { timeout = 5000 } = options;
  const start = Date.now();
  
  try {
    // Set a timeout to prevent hanging on connection issues
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Database health check timed out after ${timeout}ms`)), timeout);
    });
    
    // Query promise
    const queryPromise = query('SELECT NOW() as current_time, version() as pg_version');
    
    // Race the query against the timeout
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    const duration = Date.now() - start;
    
    return {
      success: true,
      latency_ms: duration,
      timestamp: result.rows[0].current_time,
      postgres_version: result.rows[0].pg_version,
      connection_type: neon && sqlExecutor ? 'neon_serverless' : 'pg_pool'
    };
  } catch (error) {
    console.error('Database health check failed:', error.message);
    
    return {
      success: false,
      latency_ms: Date.now() - start,
      error: error.message,
      code: error.code,
      connection_type: neon && sqlExecutor ? 'neon_serverless' : 'pg_pool'
    };
  }
}

/**
 * Close the database pool (for cleanup)
 */
/**
 * Close database pool with timeout protection
 * @param {Object} options - Options for closing pool
 * @returns {Promise<boolean>} - Whether pool was closed successfully
 */
async function closePool(options = {}) {
  const { timeout = 5000 } = options;
  
  if (!pool) {
    console.log('No active database pool to close');
    return true;
  }
  
  console.log('Closing database pool...');
  
  try {
    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database pool close timed out')), timeout);
    });
    
    // Close the pool
    const closePromise = pool.end();
    
    // Race against timeout
    await Promise.race([closePromise, timeoutPromise]);
    
    pool = null;
    console.log('Database pool closed successfully');
    return true;
  } catch (error) {
    console.error('Error closing database pool:', error.message);
    // Force reset the pool reference anyway
    pool = null;
    return false;
  }
}

/**
 * Common CORS headers for all responses
 */
const getAllowedOrigin = (requestOrigin) => {
  const allowedOrigins = [
    'https://focusmate-ai.netlify.app',
    'http://localhost:3000',
    'http://localhost:8888'
  ];
  
  if (allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  // Default to production domain
  return 'https://focusmate-ai.netlify.app';
};

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Standard response helper
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @param {Object} additionalHeaders - Additional headers
 * @param {string} requestOrigin - Origin header from request
 * @returns {Object} Netlify function response
 */
function createResponse(statusCode, data, additionalHeaders = {}, requestOrigin = null) {
  const dynamicCorsHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin)
  };
  
  return {
    statusCode,
    headers: { ...dynamicCorsHeaders, ...additionalHeaders },
    body: JSON.stringify(data)
  };
}

/**
 * Error response helper
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @param {string} requestOrigin - Origin header from request
 * @param {Object} additionalHeaders - Additional HTTP headers to include
 * @returns {Object} Netlify function error response
 */
function createErrorResponse(statusCode, message, details = {}, requestOrigin = null, additionalHeaders = {}) {
  return createResponse(statusCode, {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    ...details
  }, additionalHeaders, requestOrigin);
}

/**
 * Success response helper
 * @param {Object} data - Success data
 * @param {string} message - Success message
 * @param {string} requestOrigin - Origin header from request
 * @param {Object} additionalHeaders - Additional HTTP headers to include
 * @returns {Object} Netlify function success response
 */
function createSuccessResponse(data, message = 'Success', requestOrigin = null, additionalHeaders = {}) {
  return createResponse(200, {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }, additionalHeaders, requestOrigin);
}

/**
 * Handle OPTIONS preflight requests
 * @param {string} requestOrigin - Origin header from request
 * @returns {Object} OPTIONS response
 */
function handleOptions(requestOrigin = null) {
  return createResponse(200, {}, {}, requestOrigin);
}

/**
 * Validate required fields in request body
 * @param {Object} body - Parsed request body
 * @param {Array<string>} requiredFields - Array of required field names
 * @throws {Error} If any required field is missing
 */
function validateRequiredFields(body, requiredFields) {
  const missingFields = requiredFields.filter(field => 
    body[field] === undefined || body[field] === null || body[field] === ''
  );
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Authenticate user from JWT token
 * @param {string} authHeader - Authorization header value
 * @returns {Promise<Object>} Authentication result with userId
 */
async function authenticateUser(authHeader) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        message: 'Missing or invalid authorization header'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return {
        success: false,
        message: 'Missing authentication token'
      };
    }

    // Verify JWT signature and decode
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable not set');
      return {
        success: false,
        message: 'Server configuration error'
      };
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify user exists in database
      const userQuery = 'SELECT id FROM users WHERE id = $1';
      const userResult = await query(userQuery, [payload.userId]);
      
      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      return {
        success: true,
        userId: payload.userId
      };

    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return {
          success: false,
          message: 'Authentication expired. Please login again.'
        };
      } else if (jwtError.name === 'JsonWebTokenError') {
        return {
          success: false,
          message: 'Invalid authentication token'
        };
      } else {
        return {
          success: false,
          message: 'Authentication failed'
        };
      }
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'Authentication failed'
    };
  }
}

/**
 * CORS wrapper for Netlify functions
 * @param {Function} handler - The actual function handler
 * @returns {Function} Wrapped handler with CORS support
 */
function withCORS(handler) {
  return async (event, context) => {
    const requestOrigin = event.headers.origin;
    
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return handleOptions(requestOrigin);
    }
    
    try {
      // Call the actual handler
      const response = await handler(event, context);
      
      // Ensure response has CORS headers
      if (response && response.headers) {
        const dynamicCorsHeaders = {
          ...corsHeaders,
          'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin)
        };
        response.headers = { ...dynamicCorsHeaders, ...response.headers };
      }
      
      return response;
    } catch (error) {
      console.error('Handler error:', error);
      return createErrorResponse(500, 'Internal server error', {}, requestOrigin);
    }
  };
}

/**
 * Stack Auth helper functions
 */
async function verifyStackAuthToken(token) {
  try {
    // This would integrate with the stack-auth-verify function
    // For now, we'll do basic JWT validation
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      throw new Error('Invalid token format');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT structure');
    }

    // Decode payload (in production, use proper JWKS verification)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return {
      valid: true,
      payload,
      userId: payload.sub,
      email: payload.email
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Get Stack Auth configuration
 */
function getStackAuthConfig() {
  return {
    projectId: process.env.VITE_STACK_PROJECT_ID,
    publishableKey: process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
    jwksUrl: process.env.STACK_AUTH_JWKS_URL || `https://api.stack-auth.com/api/v1/projects/${process.env.VITE_STACK_PROJECT_ID}/.well-known/jwks.json`,
    secretKey: process.env.STACK_SECRET_SERVER_KEY
  };
}

/**
 * Authenticate user with either JWT or Stack Auth token
 */
async function authenticateUserWithStackAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header found');
  }

  const token = authHeader.substring(7);
  
  // Try Stack Auth token first (if it looks like a Stack Auth token)
  if (token.startsWith('st_')) {
    const stackAuthResult = await verifyStackAuthToken(token);
    if (stackAuthResult.valid) {
      return {
        type: 'stack-auth',
        userId: stackAuthResult.userId,
        email: stackAuthResult.email,
        payload: stackAuthResult.payload
      };
    }
  }
  
  // Fall back to regular JWT
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return {
      type: 'jwt',
      userId: payload.userId,
      email: payload.email,
      payload
    };
  } catch (jwtError) {
    throw new Error('Invalid token');
  }
}

/**
 * Close all database connections
 * This should be called when the Lambda is about to exit to prevent connection leaks
 */
async function closeConnections() {
  if (pool) {
    try {
      console.log('Closing database connection pool');
      await pool.end();
      console.log('Database connection pool closed successfully');
    } catch (err) {
      console.error('Error closing database connection pool:', err);
    } finally {
      pool = null;
    }
  }
  
  // The Neon serverless driver doesn't need explicit closing
  sqlExecutor = null;
}

module.exports = {
  getPool,
  getSqlExecutor,
  query,
  transaction,
  healthCheck,
  closePool,
  closeConnections, // Add our new function for proper cleanup
  corsHeaders,
  createResponse,
  createErrorResponse,
  createSuccessResponse,
  handleOptions,
  validateRequiredFields,
  authenticateUser,
  verifyStackAuthToken,
  getStackAuthConfig,
  authenticateUserWithStackAuth,
  withCORS
};
