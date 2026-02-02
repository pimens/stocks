const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');
const indicatorService = require('../services/indicatorService');

// Get list of popular Indonesian stocks
router.get('/popular', (req, res) => {
  try {
    const stocks = stockService.getPopularStocks();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock data with indicators
router.get('/data/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '3mo', interval = '1d' } = req.query;
    
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
});

// Get real-time quotes for multiple stocks
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of stock symbols' });
    }
    
    const quotes = await stockService.getQuote(symbols);
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Screen stocks based on criteria
router.post('/screen', async (req, res) => {
  try {
    const { symbols, criteria } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of stock symbols' });
    }
    
    const results = [];
    
    for (const symbol of symbols) {
      try {
        const stockData = await stockService.getStockData(symbol, '3mo', '1d');
        const indicators = indicatorService.calculateAllIndicators(stockData.prices);
        const signals = indicatorService.generateSignals(indicators);
        
        // Get fundamental data for enhanced screening
        let fundamentals = {};
        try {
          const quotes = await stockService.getQuote([symbol]);
          if (quotes && quotes.length > 0) {
            fundamentals = quotes[0];
          }
        } catch (err) {
          console.warn(`Could not fetch fundamentals for ${symbol}:`, err.message);
        }
        
        const screening = indicatorService.screenStock(stockData.prices, indicators, criteria || {}, fundamentals);
        
        results.push({
          symbol,
          price: indicators.current.price,
          indicators: indicators.current,
          fundamentals,
          signals,
          screening
        });
      } catch (err) {
        console.error(`Error screening ${symbol}:`, err.message);
        results.push({
          symbol,
          error: err.message
        });
      }
    }
    
    // Sort by screening score
    results.sort((a, b) => (b.screening?.score || 0) - (a.screening?.score || 0));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch get data for multiple stocks
router.post('/batch', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of stock symbols' });
    }
    
    const results = [];
    
    for (const symbol of symbols) {
      try {
        const stockData = await stockService.getStockData(symbol, '3mo', '1d');
        const indicators = indicatorService.calculateAllIndicators(stockData.prices);
        const signals = indicatorService.generateSignals(indicators);
        
        results.push({
          symbol,
          ...stockData,
          indicators,
          signals
        });
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err.message);
        results.push({
          symbol,
          error: err.message
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order book for a stock
router.get('/orderbook/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const orderBook = await stockService.getOrderBook(symbol);
    res.json(orderBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get broker summary for a stock
router.get('/broker/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const brokerSummary = await stockService.getBrokerSummary(symbol);
    res.json(brokerSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
