const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const stockService = require('../services/stockService');
const indicatorService = require('../services/indicatorService');

// Get available AI models
router.get('/models', (req, res) => {
  try {
    const models = aiService.getAvailableModels();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze a single stock
router.get('/analyze/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { model = 'google/gemini-2.0-flash-001' } = req.query;
    
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
});

// Compare multiple stocks
router.post('/compare', async (req, res) => {
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
});

// Custom analysis prompt
router.post('/custom', async (req, res) => {
  try {
    const { symbol, prompt, model = 'google/gemini-2.0-flash-001' } = req.body;
    
    if (!symbol || !prompt) {
      return res.status(400).json({ error: 'Please provide symbol and prompt' });
    }
    
    const stockData = await stockService.getStockData(symbol, '3mo', '1d');
    const indicators = indicatorService.calculateAllIndicators(stockData.prices);
    const signals = indicatorService.generateSignals(indicators);
    
    // Modify aiService to handle custom prompts
    const aiAnalysis = await aiService.analyzeStock(stockData, indicators, signals, model);
    
    res.json({
      symbol,
      analysis: aiAnalysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
