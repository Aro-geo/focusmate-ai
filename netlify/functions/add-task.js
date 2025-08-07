const { neon } = require('@neondatabase/serverless');
const { authenticateUser, withCORS } = require('./db-utils');

const sql = neon(process.env.DATABASE_URL);

async function addTask(event, context) {
  console.log('Add task request received');
  
  if (event.httpMethod !== 'POST') {
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

    const { title, priority = 'medium' } = JSON.parse(event.body);

    if (!title || title.trim() === '') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Task title is required' })
      };
    }

    console.log('Adding task for user:', user.id, 'Title:', title);

    // Insert new task
    const result = await sql`
      INSERT INTO tasks (user_id, title, priority, status, created_at, updated_at)
      VALUES (${user.id}, ${title.trim()}, ${priority}, 'pending', NOW(), NOW())
      RETURNING id, title, priority, status, created_at, updated_at
    `;

    if (result.length === 0) {
      throw new Error('Failed to create task');
    }

    const newTask = result[0];
    console.log('Task created successfully:', newTask.id);

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        task: {
          id: newTask.id,
          title: newTask.title,
          priority: newTask.priority,
          status: newTask.status,
          createdAt: newTask.created_at,
          updatedAt: newTask.updated_at
        }
      })
    };

  } catch (error) {
    console.error('Error adding task:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to add task',
        details: error.message 
      })
    };
  }
}

exports.handler = withCORS(addTask);
