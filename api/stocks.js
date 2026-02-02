const path = require('path');
const stockService = require(path.join(__dirname, './lib/stockService'));
const indicatorService = require(path.join(__dirname, './lib/indicatorService'));

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
  const pathParts = url.pathname.replace('/api/stocks', '').split('/').filter(Boolean);
  const action = pathParts[0] || '';
  const param = pathParts[1] || req.query.symbol;

  try {
    // GET /api/stocks/popular
    if (action === 'popular' && req.method === 'GET') {
      const stocks = stockService.getPopularStocks();
      return res.json(stocks);
    }

    // GET /api/stocks/data/:symbol
    if (action === 'data' && req.method === 'GET') {
      const symbol = param || req.query.symbol;
      const { range = '3mo', interval = '1d' } = req.query;
      
      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }
      
      const stockData = await stockService.getStockData(symbol, range, interval);
      const indicators = indicatorService.calculateAllIndicators(stockData.prices);
      const signals = indicatorService.generateSignals(indicators);
      
      return res.json({ ...stockData, indicators, signals });
    }

    // POST /api/stocks/quotes
    if (action === 'quotes' && req.method === 'POST') {
      const { symbols } = req.body;
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of stock symbols' });
      }
      
      const quotes = await stockService.getQuote(symbols);
      return res.json(quotes);
    }

    // POST /api/stocks/screen
    if (action === 'screen' && req.method === 'POST') {
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
      return res.json(results);
    }

    // POST /api/stocks/batch
    if (action === 'batch' && req.method === 'POST') {
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
          
          results.push({ symbol, ...stockData, indicators, signals });
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err.message);
          results.push({ symbol, error: err.message });
        }
      }
      
      return res.json(results);
    }

    // GET /api/stocks/orderbook/:symbol
    if (action === 'orderbook' && req.method === 'GET') {
      const symbol = param || req.query.symbol;
      
      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }
      
      const orderBook = await stockService.getOrderBook(symbol);
      return res.json(orderBook);
    }

    // GET /api/stocks/broker/:symbol
    if (action === 'broker' && req.method === 'GET') {
      const symbol = param || req.query.symbol;
      
      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }
      
      const brokerSummary = await stockService.getBrokerSummary(symbol);
      return res.json(brokerSummary);
    }

    // Not found
    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Stock API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
