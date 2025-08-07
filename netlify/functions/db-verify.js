const { healthCheck, createSuccessResponse, createErrorResponse } = require('./db-utils');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const requestOrigin = event.headers.origin || event.headers.Origin || '*';
  try {
    const result = await healthCheck({ timeout: 7000 });
    if (result.success) {
      return createSuccessResponse(result, 'Database connection verified', requestOrigin);
    } else {
      return createErrorResponse(503, 'Database connection failed', result, requestOrigin);
    }
  } catch (error) {
    return createErrorResponse(500, 'Unexpected error during DB verification', { error: error.message }, requestOrigin);
  }
};
