exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'OK', message: 'Stock Screener API is running on Netlify' })
  };
};
