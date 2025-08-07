const { 
  query, 
  createErrorResponse, 
  createSuccessResponse, 
  handleOptions, 
  validateRequiredFields 
} = require('./db-utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    if (event.httpMethod === 'POST') {
      // Store AI interaction
      const { 
        user_id, 
        prompt, 
        response, 
        context, 
        source,
        interaction_type 
      } = JSON.parse(event.body);

      validateRequiredFields(
        { user_id, prompt, response, interaction_type }, 
        ['user_id', 'prompt', 'response', 'interaction_type']
      );

      const result = await query(`
        INSERT INTO ai_interactions (
          user_id, 
          prompt, 
          response, 
          context, 
          source, 
          interaction_type, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, created_at
      `, [user_id, prompt, response, context, source, interaction_type]);

      return createSuccessResponse({
        interaction_id: result.rows[0].id,
        created_at: result.rows[0].created_at
      }, 'AI interaction stored successfully');
    }

    if (event.httpMethod === 'GET') {
      // Get AI interaction history
      const urlParams = new URLSearchParams(event.queryStringParameters || {});
      const user_id = urlParams.get('user_id');
      const limit = parseInt(urlParams.get('limit')) || 50;
      const interaction_type = urlParams.get('type');

      validateRequiredFields({ user_id }, ['user_id']);

      let queryText = `
        SELECT id, prompt, response, context, source, interaction_type, created_at
        FROM ai_interactions 
        WHERE user_id = $1
      `;
      let params = [user_id];

      if (interaction_type) {
        queryText += ` AND interaction_type = $${params.length + 1}`;
        params.push(interaction_type);
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await query(queryText, params);

      return createSuccessResponse({
        interactions: result.rows,
        count: result.rows.length
      }, 'AI interactions retrieved successfully');
    }

    return createErrorResponse(405, 'Method Not Allowed');

  } catch (error) {
    console.error('AI interactions error:', error);
    
    if (error.message.includes('Missing required fields')) {
      return createErrorResponse(400, error.message);
    }
    
    return createErrorResponse(500, 'Failed to process AI interaction: ' + error.message);
  }
};
