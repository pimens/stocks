const path = require('path');
const stockService = require(path.join(__dirname, '../lib/stockService'));
const indicatorService = require(path.join(__dirname, '../lib/indicatorService'));
const aiService = require(path.join(__dirname, '../lib/aiService'));

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { symbol, model = 'google/gemini-2.0-flash-001' } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Get stock data and calculate indicators
    const stockData = await stockService.getStockData(symbol, '3mo', '1d');
    const indicators = indicatorService.calculateAllIndicators(stockData.prices);
    const signals = indicatorService.generateSignals(indicators);
    
    // Get AI analysis
    const aiAnalysis = await aiService.analyzeStock(stockData, indicators, signals, model);
    
    res.json({
      symbol,
      stockData: {
        ...stockData,
        indicators,
        signals
      },
      aiAnalysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
