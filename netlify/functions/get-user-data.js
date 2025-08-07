const { createResponse, withCORS, authenticateUser } = require('./db-utils');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = withCORS(async (event) => {
  console.log('🔍 [get-user-data] Function called');
  console.log('🔍 [get-user-data] Method:', event.httpMethod);
  console.log('🔍 [get-user-data] Headers:', event.headers);

  if (event.httpMethod !== 'GET') {
    console.log('❌ [get-user-data] Method not allowed:', event.httpMethod);
    return createResponse(405, {
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Authenticate user and get user ID
    const authResult = await authenticateUser(event.headers.authorization);
    
    if (!authResult.success) {
      console.log('❌ [get-user-data] Authentication failed:', authResult.message);
      return createResponse(401, {
        success: false,
        message: authResult.message
      });
    }

    const userId = authResult.userId;
    console.log('✅ [get-user-data] User authenticated:', userId);

    // Fetch user data
    const userQuery = 'SELECT id, username, email, created_at FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      console.log('❌ [get-user-data] User not found:', userId);
      return createResponse(404, {
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    console.log('✅ [get-user-data] User found:', user.username || user.email);

    // Fetch user's tasks
    const tasksQuery = `
      SELECT id, title, description, status, priority, user_id, created_at, updated_at, completed_at
      FROM tasks 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const tasksResult = await pool.query(tasksQuery, [userId]);
    const tasks = tasksResult.rows;

    console.log('📋 [get-user-data] Tasks found:', tasks.length);

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      tasks: tasks,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate: Math.round(completionRate * 100) / 100 // Round to 2 decimal places
      }
    };

    console.log('✅ [get-user-data] Success - User data prepared');
    console.log('📊 [get-user-data] Stats:', userData.stats);

    return createResponse(200, {
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('❌ [get-user-data] Database error:', error);
    return createResponse(500, {
      success: false,
      message: 'Internal server error'
    });
  }
});
