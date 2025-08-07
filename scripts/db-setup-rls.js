const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create auth schema and JWT functions
    await client.query(`
      -- Create auth schema if it doesn't exist
      CREATE SCHEMA IF NOT EXISTS auth;

      -- Create a function to get the current user_id from JWT
      CREATE OR REPLACE FUNCTION auth.user_id() RETURNS INTEGER AS $$
      BEGIN
        RETURN nullif(current_setting('request.jwt.claim.user_id', true), '')::INTEGER;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('Created auth schema and functions');

    // Create todos table
    await client.query(`
      -- Create todos table if it doesn't exist
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        task TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('Created todos table');

    // Apply Row Level Security
    await client.query(`
      -- Enable RLS on todos table
      ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

      -- Drop any existing policies
      DROP POLICY IF EXISTS todos_isolation_policy ON todos;

      -- Create RLS policy for todos
      CREATE POLICY todos_isolation_policy ON todos
        USING (user_id = auth.user_id());
    `);

    console.log('Applied Row Level Security policies');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

setupDatabase();
