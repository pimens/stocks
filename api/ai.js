const path = require('path');
const stockService = require(path.join(__dirname, '../lib/stockService'));
const indicatorService = require(path.join(__dirname, '../lib/indicatorService'));
const aiService = require(path.join(__dirname, '../lib/aiService'));

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse the path to determine which endpoint to use
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.replace('/api/ai', '').split('/').filter(Boolean);
  const action = pathParts[0] || '';
  const param = pathParts[1] || req.query.symbol;

  try {
    // GET /api/ai/models
    if (action === 'models' && req.method === 'GET') {
      const models = aiService.getAvailableModels();
      return res.json(models);
    }

    // GET /api/ai/analyze/:symbol
    if (action === 'analyze' && req.method === 'GET') {
      const symbol = param || req.query.symbol;
      const { model = 'google/gemini-2.0-flash-001' } = req.query;
      
      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }
      
      const stockData = await stockService.getStockData(symbol, '3mo', '1d');
      const indicators = indicatorService.calculateAllIndicators(stockData.prices);
      const signals = indicatorService.generateSignals(indicators);
      const aiAnalysis = await aiService.analyzeStock(stockData, indicators, signals, model);
      
      return res.json({
        symbol,
        stockData: { ...stockData, indicators, signals },
        aiAnalysis
      });
    }

    // POST /api/ai/compare
    if (action === 'compare' && req.method === 'POST') {
      const { symbols, model = 'google/gemini-2.0-flash-001' } = req.body;
      
      if (!symbols || !Array.isArray(symbols) || symbols.length < 2) {
        return res.status(400).json({ error: 'Please provide at least 2 stock symbols to compare' });
      }
      
      const stocksData = [];
      for (const symbol of symbols) {
        try {
          const stockData = await stockService.getStockData(symbol, '3mo', '1d');
          const indicators = indicatorService.calculateAllIndicators(stockData.prices);
          const signals = indicatorService.generateSignals(indicators);
          
          stocksData.push({ symbol, stockData, indicators, signals });
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err.message);
        }
      }
      
      if (stocksData.length < 2) {
        return res.status(400).json({ error: 'Could not fetch enough stock data for comparison' });
      }
      
      const comparison = await aiService.compareStocks(stocksData, model);
      
      return res.json({ stocks: stocksData, comparison });
    }

    // Not found
    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
