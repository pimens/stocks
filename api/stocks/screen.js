const path = require('path');
const stockService = require(path.join(__dirname, '../lib/stockService'));
const indicatorService = require(path.join(__dirname, '../lib/indicatorService'));

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
        results.push({ symbol, error: err.message });
      }
    }
    
    results.sort((a, b) => (b.screening?.score || 0) - (a.screening?.score || 0));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
