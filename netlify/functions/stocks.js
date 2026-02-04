const stockService = require('./stockService');
const indicatorService = require('./indicatorService');

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

    // POST /api/stocks/regression-data
    if (action === 'regression-data' && event.httpMethod === 'POST') {
      const { 
        symbols, 
        startDate, 
        endDate,
        upThreshold = 1.0,
        downThreshold = -0.5,
        includeNeutral = false
      } = JSON.parse(event.body || '{}');
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide an array of stock symbols' }) };
      }
      
      if (!startDate || !endDate) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide startDate and endDate' }) };
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

      allData.sort((a, b) => {
        if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
        return new Date(a.date) - new Date(b.date);
      });

      const upCount = allData.filter(d => d.target === 1).length;
      const downCount = allData.filter(d => d.target === 0).length;
      const neutralCount = allData.filter(d => d.target === -1).length;
      const totalNonNeutral = upCount + downCount;

      const summary = {
        totalRecords: allData.length,
        symbolsProcessed: [...new Set(allData.map(d => d.symbol))].length,
        dateRange: { start: startDate, end: endDate },
        thresholds: options,
        targetDistribution: {
          up: upCount,
          down: downCount,
          neutral: neutralCount,
          upPercent: totalNonNeutral > 0 ? (upCount / totalNonNeutral * 100).toFixed(2) : 0,
          downPercent: totalNonNeutral > 0 ? (downCount / totalNonNeutral * 100).toFixed(2) : 0
        },
        errors: errors.length > 0 ? errors : undefined
      };

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({
          summary,
          data: allData,
          columns: allData.length > 0 ? Object.keys(allData[0]) : []
        })
      };
    }

    // POST /api/stocks/predict-data
    if (action === 'predict-data' && event.httpMethod === 'POST') {
      const { symbol, targetDate } = JSON.parse(event.body || '{}');
      
      if (!symbol) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide a stock symbol' }) };
      }
      
      if (!targetDate) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide a target date' }) };
      }

      const stockData = await stockService.getStockData(symbol, '1y', '1d');
      
      if (!stockData.prices || stockData.prices.length < 60) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not enough historical data for this stock' }) };
      }

      const indicatorData = indicatorService.getIndicatorsForDate(stockData.prices, targetDate);
      
      if (indicatorData.error) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: indicatorData.error }) };
      }
      
      indicatorData.symbol = symbol.toUpperCase();

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({
          success: true,
          data: indicatorData,
          info: {
            symbol: symbol.toUpperCase(),
            targetDate: indicatorData.targetDate,
            indicatorDate: indicatorData.indicatorDate,
            message: `Indicators from ${indicatorData.indicatorDate} will be used to predict ${indicatorData.targetDate}`
          }
        })
      };
    }

    // POST /api/stocks/live-indicators
    if (action === 'live-indicators' && event.httpMethod === 'POST') {
      const { symbol, targetDate, useRealtime = true } = JSON.parse(event.body || '{}');
      
      if (!symbol) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide a stock symbol' }) };
      }
      
      if (!targetDate) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide a target date' }) };
      }

      const today = new Date().toISOString().split('T')[0];
      const isToday = targetDate === today;
      
      const stockData = await stockService.getStockData(symbol, '1y', '1d');
      
      if (!stockData.prices || stockData.prices.length < 60) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not enough historical data for this stock' }) };
      }

      let prices = [...stockData.prices];
      let isRealtime = false;

      if (isToday && useRealtime) {
        try {
          const quotes = await stockService.getQuote([symbol]);
          if (quotes && quotes.length > 0) {
            const currentQuote = quotes[0];
            const lastPrice = prices[prices.length - 1];
            const lastPriceDate = new Date(lastPrice.date).toISOString().split('T')[0];
            
            if (lastPriceDate === today) {
              prices[prices.length - 1] = {
                ...lastPrice,
                date: lastPrice.date,
                open: lastPrice.open,
                high: Math.max(lastPrice.high || 0, currentQuote.regularMarketPrice || 0),
                low: Math.min(lastPrice.low || Infinity, currentQuote.regularMarketPrice || Infinity),
                close: currentQuote.regularMarketPrice || lastPrice.close,
                volume: currentQuote.regularMarketVolume || lastPrice.volume
              };
              isRealtime = true;
            } else {
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
          console.warn('Could not fetch realtime data:', realtimeErr.message);
        }
      }

      const indicatorData = indicatorService.getIndicatorsForDate(prices, targetDate);
      
      if (indicatorData.error) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: indicatorData.error }) };
      }
      
      indicatorData.symbol = symbol.toUpperCase();

      const featureCount = Object.keys(indicatorData).filter(
        key => !['symbol', 'targetDate', 'indicatorDate', 'actualData'].includes(key)
      ).length;

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({
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
        })
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Endpoint not found' }) };
  } catch (error) {
    console.error('Stock API Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
