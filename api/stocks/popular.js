const stockService = require('../lib/stockService');

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const stocks = stockService.getPopularStocks();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
