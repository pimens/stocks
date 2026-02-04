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

// Get historical data with indicators for regression analysis
router.post('/regression-data', async (req, res) => {
  try {
    const { 
      symbols, 
      startDate, 
      endDate,
      upThreshold = 1.0,      // Default: +1% for UP
      downThreshold = -0.5,   // Default: -0.5% for DOWN
      includeNeutral = false  // Whether to include neutral data points
    } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of stock symbols' });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Please provide startDate and endDate' });
    }

    const allData = [];
    const errors = [];

    const options = {
      upThreshold: parseFloat(upThreshold),
      downThreshold: parseFloat(downThreshold),
      includeNeutral: Boolean(includeNeutral)
    };

    for (const symbol of symbols) {
      try {
        // Get longer range to ensure we have enough data for indicators
        const stockData = await stockService.getStockData(symbol, '1y', '1d');
        
        if (!stockData.prices || stockData.prices.length < 60) {
          errors.push({ symbol, error: 'Not enough historical data' });
          continue;
        }

        const dataset = indicatorService.generateRegressionDataset(
          stockData.prices,
          startDate,
          endDate,
          options
        );

        // Add symbol to each row
        const dataWithSymbol = dataset.map(row => ({
          symbol: symbol.toUpperCase(),
          ...row
        }));

        allData.push(...dataWithSymbol);
      } catch (err) {
        console.error(`Error processing ${symbol}:`, err.message);
        errors.push({ symbol, error: err.message });
      }
    }

    // Sort by symbol then date
    allData.sort((a, b) => {
      if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
      return new Date(a.date) - new Date(b.date);
    });

    // Calculate summary statistics
    const upCount = allData.filter(d => d.target === 1).length;
    const downCount = allData.filter(d => d.target === 0).length;
    const neutralCount = allData.filter(d => d.target === -1).length;
    const totalNonNeutral = upCount + downCount;

    const summary = {
      totalRecords: allData.length,
      symbolsProcessed: [...new Set(allData.map(d => d.symbol))].length,
      dateRange: {
        start: startDate,
        end: endDate
      },
      thresholds: {
        upThreshold: options.upThreshold,
        downThreshold: options.downThreshold,
        includeNeutral: options.includeNeutral
      },
      targetDistribution: {
        up: upCount,
        down: downCount,
        neutral: neutralCount,
        upPercent: totalNonNeutral > 0 ? (upCount / totalNonNeutral * 100).toFixed(2) : 0,
        downPercent: totalNonNeutral > 0 ? (downCount / totalNonNeutral * 100).toFixed(2) : 0
      },
      errors: errors.length > 0 ? errors : undefined
    };

    res.json({
      summary,
      data: allData,
      columns: allData.length > 0 ? Object.keys(allData[0]) : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stocks/predict-data - Get indicator data for prediction on a specific date
router.post('/predict-data', async (req, res) => {
  try {
    const { symbol, targetDate } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Please provide a stock symbol' });
    }
    
    if (!targetDate) {
      return res.status(400).json({ error: 'Please provide a target date' });
    }

    // Get enough historical data for indicators
    const stockData = await stockService.getStockData(symbol, '1y', '1d');
    
    if (!stockData.prices || stockData.prices.length < 60) {
      return res.status(400).json({ error: 'Not enough historical data for this stock' });
    }

    const indicatorData = indicatorService.getIndicatorsForDate(stockData.prices, targetDate);
    
    if (indicatorData.error) {
      return res.status(400).json({ error: indicatorData.error });
    }
    
    // Add symbol
    indicatorData.symbol = symbol.toUpperCase();

    res.json({
      success: true,
      data: indicatorData,
      info: {
        symbol: symbol.toUpperCase(),
        targetDate: indicatorData.targetDate,
        indicatorDate: indicatorData.indicatorDate,
        message: `Indicators from ${indicatorData.indicatorDate} will be used to predict ${indicatorData.targetDate}`
      }
    });
  } catch (error) {
    console.error('Predict data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stocks/live-indicators - Get live indicator data with realtime support
router.post('/live-indicators', async (req, res) => {
  try {
    const { symbol, targetDate, useRealtime = true } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Please provide a stock symbol' });
    }
    
    if (!targetDate) {
      return res.status(400).json({ error: 'Please provide a target date' });
    }

    const today = new Date().toISOString().split('T')[0];
    const isToday = targetDate === today;
    
    // Get historical data
    const stockData = await stockService.getStockData(symbol, '1y', '1d');
    
    if (!stockData.prices || stockData.prices.length < 60) {
      return res.status(400).json({ error: 'Not enough historical data for this stock' });
    }

    let prices = [...stockData.prices];
    let isRealtime = false;

    // If targeting today and useRealtime is true, try to get current price
    if (isToday && useRealtime) {
      try {
        const quotes = await stockService.getQuote([symbol]);
        if (quotes && quotes.length > 0) {
          const currentQuote = quotes[0];
          
          // Check if we already have today's data in prices
          const lastPrice = prices[prices.length - 1];
          const lastPriceDate = new Date(lastPrice.date).toISOString().split('T')[0];
          
          if (lastPriceDate === today) {
            // Update today's data with current realtime values
            prices[prices.length - 1] = {
              ...lastPrice,
              date: lastPrice.date,
              open: lastPrice.open, // Keep the original open
              high: Math.max(lastPrice.high || 0, currentQuote.regularMarketPrice || 0),
              low: Math.min(lastPrice.low || Infinity, currentQuote.regularMarketPrice || Infinity),
              close: currentQuote.regularMarketPrice || lastPrice.close,
              volume: currentQuote.regularMarketVolume || lastPrice.volume
            };
            isRealtime = true;
          } else {
            // Add today as a new entry with realtime data
            const prevClose = lastPrice.close;
            prices.push({
              date: new Date().toISOString(),
              open: currentQuote.regularMarketOpen || currentQuote.regularMarketPrice,
              high: currentQuote.regularMarketDayHigh || currentQuote.regularMarketPrice,
              low: currentQuote.regularMarketDayLow || currentQuote.regularMarketPrice,
              close: currentQuote.regularMarketPrice,
              volume: currentQuote.regularMarketVolume || 0,
              prevClose: prevClose
            });
            isRealtime = true;
          }
        }
      } catch (realtimeErr) {
        console.warn('Could not fetch realtime data, using historical:', realtimeErr.message);
      }
    }

    // Calculate indicators for the target date
    const indicatorData = indicatorService.getIndicatorsForDate(prices, targetDate);
    
    if (indicatorData.error) {
      return res.status(400).json({ error: indicatorData.error });
    }
    
    // Add symbol
    indicatorData.symbol = symbol.toUpperCase();

    // Count features
    const featureCount = Object.keys(indicatorData).filter(
      key => !['symbol', 'targetDate', 'indicatorDate', 'actualData'].includes(key)
    ).length;

    res.json({
      success: true,
      data: indicatorData,
      info: {
        symbol: symbol.toUpperCase(),
        targetDate: indicatorData.targetDate,
        indicatorDate: indicatorData.indicatorDate,
        isRealtime: isRealtime,
        featureCount: featureCount,
        message: isRealtime 
          ? `Using realtime data as of ${new Date().toLocaleTimeString()}`
          : `Indicators from ${indicatorData.indicatorDate} for predicting ${indicatorData.targetDate}`
      }
    });
  } catch (error) {
    console.error('Live indicators error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
