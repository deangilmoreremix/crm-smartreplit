export const handler = async (event: any, context: any) => {
  // Health check endpoint
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      function: 'health'
    })
  };
};