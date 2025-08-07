const jwt = require('jsonwebtoken');
const { 
  query, 
  createErrorResponse, 
  createSuccessResponse, 
  handleOptions 
} = require('./db-utils');

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Get token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(401, 'Authorization token required');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (event.httpMethod === 'GET') {
      // Get user profile
      const result = await query(
        'SELECT id, username, email, created_at FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return createErrorResponse(404, 'User not found');
      }

      return createSuccessResponse({ user: result.rows[0] }, 'User profile retrieved');
    }

    if (event.httpMethod === 'PUT') {
      // Update user profile
      const { username, email } = JSON.parse(event.body);
      
      const result = await query(
        'UPDATE users SET username = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, username, email, created_at',
        [username, email, decoded.userId]
      );

      if (result.rows.length === 0) {
        return createErrorResponse(404, 'User not found');
      }

      return createSuccessResponse({ user: result.rows[0] }, 'User profile updated');
    }

    return createErrorResponse(405, 'Method Not Allowed');

  } catch (error) {
    console.error('User profile error:', error);
    
    if (error.message === 'Invalid token') {
      return createErrorResponse(401, 'Invalid authorization token');
    }
    
    return createErrorResponse(500, 'Server error: ' + error.message);
  }
};
