const path = require('path');
const stockService = require(path.join(__dirname, '../../lib/stockService'));
const indicatorService = require(path.join(__dirname, '../../lib/indicatorService'));

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Parse the path: /api/stocks/action/param -> action, param
  const pathParts = event.path.replace('/.netlify/functions/stocks', '').replace('/api/stocks', '').split('/').filter(Boolean);
  const action = pathParts[0] || '';
  const param = pathParts[1] || event.queryStringParameters?.symbol;

  try {
    // GET /api/stocks/popular
    if (action === 'popular' && event.httpMethod === 'GET') {
      const stocks = stockService.getPopularStocks();
      return { statusCode: 200, headers, body: JSON.stringify(stocks) };
    }

    // GET /api/stocks/data/:symbol
    if (action === 'data' && event.httpMethod === 'GET') {
      const symbol = param || event.queryStringParameters?.symbol;
      const range = event.queryStringParameters?.range || '3mo';
      const interval = event.queryStringParameters?.interval || '1d';
      
      if (!symbol) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Symbol is required' }) };
      }
      
      const stockData = await stockService.getStockData(symbol, range, interval);
      const indicators = indicatorService.calculateAllIndicators(stockData.prices);
      const signals = indicatorService.generateSignals(indicators);
      
      return { statusCode: 200, headers, body: JSON.stringify({ ...stockData, indicators, signals }) };
    }

    // POST /api/stocks/quotes
    if (action === 'quotes' && event.httpMethod === 'POST') {
      const { symbols } = JSON.parse(event.body || '{}');
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide an array of stock symbols' }) };
      }
      
      const quotes = await stockService.getQuote(symbols);
      return { statusCode: 200, headers, body: JSON.stringify(quotes) };
    }

    // POST /api/stocks/screen
    if (action === 'screen' && event.httpMethod === 'POST') {
      const { symbols, criteria } = JSON.parse(event.body || '{}');
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide an array of stock symbols' }) };
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
            if (quotes && quotes.length > 0) fundamentals = quotes[0];
          } catch (err) {}
          
          const screening = indicatorService.screenStock(stockData.prices, indicators, criteria || {}, fundamentals);
          results.push({ symbol, price: indicators.current.price, indicators: indicators.current, fundamentals, signals, screening });
        } catch (err) {
          results.push({ symbol, error: err.message });
        }
      }
      
      results.sort((a, b) => (b.screening?.score || 0) - (a.screening?.score || 0));
      return { statusCode: 200, headers, body: JSON.stringify(results) };
    }

    // POST /api/stocks/batch
    if (action === 'batch' && event.httpMethod === 'POST') {
      const { symbols } = JSON.parse(event.body || '{}');
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide an array of stock symbols' }) };
      }
      
      const results = [];
      for (const symbol of symbols) {
        try {
          const stockData = await stockService.getStockData(symbol, '3mo', '1d');
          const indicators = indicatorService.calculateAllIndicators(stockData.prices);
          const signals = indicatorService.generateSignals(indicators);
          results.push({ symbol, ...stockData, indicators, signals });
        } catch (err) {
          results.push({ symbol, error: err.message });
        }
      }
      
      return { statusCode: 200, headers, body: JSON.stringify(results) };
    }

    // GET /api/stocks/orderbook/:symbol
    if (action === 'orderbook' && event.httpMethod === 'GET') {
      const symbol = param || event.queryStringParameters?.symbol;
      if (!symbol) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Symbol is required' }) };
      }
      const orderBook = await stockService.getOrderBook(symbol);
      return { statusCode: 200, headers, body: JSON.stringify(orderBook) };
    }

    // GET /api/stocks/broker/:symbol
    if (action === 'broker' && event.httpMethod === 'GET') {
      const symbol = param || event.queryStringParameters?.symbol;
      if (!symbol) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Symbol is required' }) };
      }
      const brokerSummary = await stockService.getBrokerSummary(symbol);
      return { statusCode: 200, headers, body: JSON.stringify(brokerSummary) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Endpoint not found' }) };
  } catch (error) {
    console.error('Stock API Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
