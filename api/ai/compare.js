const path = require('path');
const stockService = require(path.join(__dirname, '../lib/stockService'));
const indicatorService = require(path.join(__dirname, '../lib/indicatorService'));
const aiService = require(path.join(__dirname, '../lib/aiService'));

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbols, model = 'google/gemini-2.0-flash-001' } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 stock symbols to compare' });
    }
    
    // Get data for all stocks
    const stocksData = [];
    for (const symbol of symbols) {
      try {
        const stockData = await stockService.getStockData(symbol, '3mo', '1d');
        const indicators = indicatorService.calculateAllIndicators(stockData.prices);
        const signals = indicatorService.generateSignals(indicators);
        
        stocksData.push({
          symbol,
          stockData,
          indicators,
          signals
        });
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err.message);
      }
    }
    
    if (stocksData.length < 2) {
      return res.status(400).json({ error: 'Could not fetch enough stock data for comparison' });
    }
    
    // Get AI comparison
    const comparison = await aiService.compareStocks(stocksData, model);
    
    res.json({
      stocks: stocksData,
      comparison
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
