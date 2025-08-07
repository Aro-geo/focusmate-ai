const jwt = require('jsonwebtoken');
const { 
  query, 
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

    if (event.httpMethod === 'GET') {
      // Get all tasks for user
      const result = await query(
        'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
        [decoded.userId]
      );

      return createSuccessResponse({ tasks: result.rows }, 'Tasks retrieved successfully');
    }

    if (event.httpMethod === 'POST') {
      // Create new task
      const { title, description, priority, due_date } = JSON.parse(event.body);
      
      validateRequiredFields({ title }, ['title']);
      
      const result = await query(
        'INSERT INTO tasks (user_id, title, description, priority, due_date, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [decoded.userId, title, description, priority || 'medium', due_date]
      );

      return createSuccessResponse({ task: result.rows[0] }, 'Task created successfully');
    }

    if (event.httpMethod === 'PUT') {
      // Update existing task
      const { id, title, description, priority, status, due_date, completed_at } = JSON.parse(event.body);
      
      validateRequiredFields({ id }, ['id']);
      
      const result = await query(
        'UPDATE tasks SET title = $1, description = $2, priority = $3, status = $4, due_date = $5, completed_at = $6, updated_at = NOW() WHERE id = $7 AND user_id = $8 RETURNING *',
        [title, description, priority, status, due_date, completed_at, id, decoded.userId]
      );

      if (result.rows.length === 0) {
        return createErrorResponse(404, 'Task not found');
      }

      return createSuccessResponse({ task: result.rows[0] }, 'Task updated successfully');
    }

    if (event.httpMethod === 'DELETE') {
      // Delete task
      const { id } = JSON.parse(event.body);
      
      validateRequiredFields({ id }, ['id']);
      
      const result = await query(
        'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, decoded.userId]
      );

      if (result.rows.length === 0) {
        return createErrorResponse(404, 'Task not found');
      }

      return createSuccessResponse({}, 'Task deleted successfully');
    }

    return createErrorResponse(405, 'Method Not Allowed');

  } catch (error) {
    console.error('Tasks error:', error);
    
    if (error.message === 'Invalid token') {
      return createErrorResponse(401, 'Invalid authorization token');
    }
    
    if (error.message.includes('Missing required fields')) {
      return createErrorResponse(400, error.message);
    }
    
    return createErrorResponse(500, 'Server error: ' + error.message);
  }
};
