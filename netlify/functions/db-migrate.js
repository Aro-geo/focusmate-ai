const { query, createResponse, handleOptions, createErrorResponse } = require('./db-utils');

exports.handler = async (event, context) => {
  const requestOrigin = event.headers.origin || event.headers.Origin;
  
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions(requestOrigin);
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed', {}, requestOrigin);
  }

  try {
    console.log('🔄 Starting database migration...');
    
    // Add verified column if it doesn't exist
    console.log('Adding verified column to users table...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE
    `);
    
    // Create a test verified user for testing
    console.log('Creating test verified user...');
    
    // Check if test user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      ['testverified@example.com']
    );
    
    if (existingUser.rows.length === 0) {
      // Hash password for test user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('testpass123', 12);
      
      await query(`
        INSERT INTO users (username, email, password_hash, verified, created_at) 
        VALUES ($1, $2, $3, $4, NOW())
      `, ['Test Verified User', 'testverified@example.com', hashedPassword, true]);
      
      console.log('✅ Test verified user created');
    } else {
      // Update existing user to be verified
      await query(`
        UPDATE users SET verified = TRUE WHERE email = $1
      `, ['testverified@example.com']);
      
      console.log('✅ Existing user updated to verified');
    }
    
    console.log('✅ Database migration completed successfully');
    
    return createResponse(200, {
      success: true,
      message: 'Database migration completed successfully',
      changes: [
        'Added verified column to users table',
        'Created/updated test verified user'
      ]
    }, {}, requestOrigin);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    return createErrorResponse(500, 'Migration failed', { error: error.message }, requestOrigin);
  }
};
