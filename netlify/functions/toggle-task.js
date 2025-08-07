const { neon } = require('@neondatabase/serverless');
const { authenticateUser, withCORS } = require('./db-utils');

const sql = neon(process.env.DATABASE_URL);

async function toggleTask(event, context) {
  console.log('Toggle task request received');
  
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Authenticate user
    const user = await authenticateUser(event);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const { taskId } = JSON.parse(event.body);

    if (!taskId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Task ID is required' })
      };
    }

    console.log('Toggling task for user:', user.id, 'Task ID:', taskId);

    // Get current task status
    const currentTask = await sql`
      SELECT id, status FROM tasks 
      WHERE id = ${taskId} AND user_id = ${user.id}
    `;

    if (currentTask.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Task not found' })
      };
    }

    // Toggle status
    const newStatus = currentTask[0].status === 'completed' ? 'pending' : 'completed';

    // Update task status
    const result = await sql`
      UPDATE tasks 
      SET status = ${newStatus}, updated_at = NOW()
      WHERE id = ${taskId} AND user_id = ${user.id}
      RETURNING id, title, priority, status, created_at, updated_at
    `;

    if (result.length === 0) {
      throw new Error('Failed to update task');
    }

    const updatedTask = result[0];
    console.log('Task status updated successfully:', updatedTask.id, 'New status:', newStatus);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          priority: updatedTask.priority,
          status: updatedTask.status,
          createdAt: updatedTask.created_at,
          updatedAt: updatedTask.updated_at
        }
      })
    };

  } catch (error) {
    console.error('Error toggling task:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to toggle task',
        details: error.message 
      })
    };
  }
}

exports.handler = withCORS(toggleTask);
