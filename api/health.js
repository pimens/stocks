// Health check endpoint
module.exports = (req, res) => {
  res.json({ status: 'OK', message: 'Stock Screener API is running on Vercel' });
};
