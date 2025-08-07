const { query } = require('./db-utils');

/**
 * This function sets up the necessary database tables and Row Level Security (RLS) policies
 * for working with Neon's authenticated connections
 */
exports.handler = async (event, context) => {
  // Request tracking
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`[DB-SETUP-RLS:${requestId}] Starting database RLS setup`);
  
  try {
    // Check if we're authorized to run this migration
    // In production, you should have additional security here
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }
    
    // 1. Create tasks table if it doesn't exist
    console.log(`[DB-SETUP-RLS:${requestId}] Creating tasks table if needed`);
    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        task TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_id INTEGER NOT NULL
      )
    `);
    
    // 2. Enable Row Level Security on the tasks table
    console.log(`[DB-SETUP-RLS:${requestId}] Enabling Row Level Security`);
    await query(`
      ALTER TABLE tasks ENABLE ROW LEVEL SECURITY
    `);
    
    // 3. Create a policy that allows users to see only their own tasks
    console.log(`[DB-SETUP-RLS:${requestId}] Creating RLS policies`);
    
    // Drop existing policies if they exist
    try {
      await query(`DROP POLICY IF EXISTS tasks_user_select ON tasks`);
      await query(`DROP POLICY IF EXISTS tasks_user_insert ON tasks`);
      await query(`DROP POLICY IF EXISTS tasks_user_update ON tasks`);
      await query(`DROP POLICY IF EXISTS tasks_user_delete ON tasks`);
    } catch (e) {
      console.log(`[DB-SETUP-RLS:${requestId}] Error dropping policies (can be ignored):`, e.message);
    }
    
    // Create policies for each operation
    // SELECT policy - users can only see their own tasks
    await query(`
      CREATE POLICY tasks_user_select ON tasks
        FOR SELECT
        USING (user_id = auth.user_id())
    `);
    
    // INSERT policy - users can only insert tasks for themselves
    await query(`
      CREATE POLICY tasks_user_insert ON tasks
        FOR INSERT
        WITH CHECK (user_id = auth.user_id())
    `);
    
    // UPDATE policy - users can only update their own tasks
    await query(`
      CREATE POLICY tasks_user_update ON tasks
        FOR UPDATE
        USING (user_id = auth.user_id())
    `);
    
    // DELETE policy - users can only delete their own tasks
    await query(`
      CREATE POLICY tasks_user_delete ON tasks
        FOR DELETE
        USING (user_id = auth.user_id())
    `);
    
    console.log(`[DB-SETUP-RLS:${requestId}] Database RLS setup completed successfully`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Database RLS setup completed successfully'
      })
    };
    
  } catch (error) {
    console.error(`[DB-SETUP-RLS:${requestId}] Error setting up database:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Error setting up database',
        error: error.message
      })
    };
  }
};
