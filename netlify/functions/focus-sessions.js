const jwt = require('jsonwebtoken');
const { 
  query, 
  transaction,
  createErrorResponse, 
  createSuccessResponse, 
  handleOptions, 
  validateRequiredFields 
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
    const userId = decoded.userId;

    if (event.httpMethod === 'GET') {
      // Get focus sessions for user
      const result = await query(
        'SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 50',
        [userId]
      );

      // Also get user statistics
      const statsResult = await query(`
        SELECT 
          COUNT(*) as total_sessions,
          SUM(duration_minutes) as total_minutes,
          AVG(duration_minutes) as avg_duration,
          COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_sessions
        FROM focus_sessions 
        WHERE user_id = $1
      `, [userId]);

      return createSuccessResponse({
        sessions: result.rows,
        statistics: statsResult.rows[0]
      }, 'Focus sessions retrieved successfully');
    }

    if (event.httpMethod === 'POST') {
      // Create new focus session
      const { session_type, duration_minutes, started_at, notes } = JSON.parse(event.body);
      
      validateRequiredFields({ session_type, duration_minutes }, ['session_type', 'duration_minutes']);
      
      const result = await query(
        'INSERT INTO focus_sessions (user_id, session_type, duration_minutes, started_at, notes, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [userId, session_type, duration_minutes, started_at, notes]
      );

      return createSuccessResponse({
        session: result.rows[0]
      }, 'Focus session created successfully');
    }

    if (event.httpMethod === 'PUT') {
      // Update existing session (usually to mark as completed)
      const { id, completed_at, notes } = JSON.parse(event.body);
      
      validateRequiredFields({ id }, ['id']);
      
      const result = await query(
        'UPDATE focus_sessions SET completed_at = $1, notes = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
        [completed_at, notes, id, userId]
      );

      if (result.rows.length === 0) {
        return createErrorResponse(404, 'Session not found');
      }

      return createSuccessResponse({
        session: result.rows[0]
      }, 'Focus session updated successfully');
    }

    return createErrorResponse(405, 'Method Not Allowed');

  } catch (error) {
    console.error('Focus sessions error:', error);
    
    if (error.message === 'Invalid token') {
      return createErrorResponse(401, 'Invalid authorization token');
    }
    
    if (error.message.includes('Missing required fields')) {
      return createErrorResponse(400, error.message);
    }
    
    return createErrorResponse(500, 'Server error: ' + error.message);
  }
};
