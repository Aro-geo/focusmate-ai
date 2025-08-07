const { Pool } = require('pg');

// Use the DATABASE_URL directly from netlify.toml
const DATABASE_URL = "postgresql://neondb_owner:npg_s8ahEI0jtxTM@ep-summer-term-abunoc3n.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAIInteractionsTable() {
  try {
    console.log('Creating AI interactions table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_interactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        context VARCHAR(100),
        source VARCHAR(20) DEFAULT 'openai',
        interaction_type VARCHAR(50) DEFAULT 'chat',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON ai_interactions(interaction_type);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);
    `);

    console.log('✅ AI interactions table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating AI interactions table:', error);
  } finally {
    await pool.end();
  }
}

createAIInteractionsTable();
