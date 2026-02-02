const stockService = require('./stockService');
const indicatorService = require('./indicatorService');
const aiService = require('./aiService');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const pathParts = event.path.replace('/.netlify/functions/ai', '').replace('/api/ai', '').split('/').filter(Boolean);
  const action = pathParts[0] || '';
  const param = pathParts[1] || event.queryStringParameters?.symbol;

  try {
    // GET /api/ai/models
    if (action === 'models' && event.httpMethod === 'GET') {
      const models = aiService.getAvailableModels();
      return { statusCode: 200, headers, body: JSON.stringify(models) };
    }

    // GET /api/ai/analyze/:symbol
    if (action === 'analyze' && event.httpMethod === 'GET') {
      const symbol = param || event.queryStringParameters?.symbol;
      const model = event.queryStringParameters?.model || 'google/gemini-2.0-flash-001';
      
      if (!symbol) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Symbol is required' }) };
      }
      
      const stockData = await stockService.getStockData(symbol, '3mo', '1d');
      const indicators = indicatorService.calculateAllIndicators(stockData.prices);
      const signals = indicatorService.generateSignals(indicators);
      const aiAnalysis = await aiService.analyzeStock(stockData, indicators, signals, model);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ symbol, stockData: { ...stockData, indicators, signals }, aiAnalysis })
      };
    }

    // POST /api/ai/compare
    if (action === 'compare' && event.httpMethod === 'POST') {
      const { symbols, model = 'google/gemini-2.0-flash-001' } = JSON.parse(event.body || '{}');
      
      if (!symbols || !Array.isArray(symbols) || symbols.length < 2) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide at least 2 stock symbols' }) };
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
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Could not fetch enough stock data' }) };
      }
      
      const comparison = await aiService.compareStocks(stocksData, model);
      return { statusCode: 200, headers, body: JSON.stringify({ stocks: stocksData, comparison }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Endpoint not found' }) };
  } catch (error) {
    console.error('AI API Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
