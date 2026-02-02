const path = require('path');
const stockService = require(path.join(__dirname, '../lib/stockService'));
const indicatorService = require(path.join(__dirname, '../lib/indicatorService'));

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { symbol } = req.query;
    const { range = '3mo', interval = '1d' } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    const stockData = await stockService.getStockData(symbol, range, interval);
    const indicators = indicatorService.calculateAllIndicators(stockData.prices);
    const signals = indicatorService.generateSignals(indicators);
    
    res.json({
      ...stockData,
      indicators,
      signals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
