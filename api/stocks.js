const path = require('path');
const stockService = require(path.join(__dirname, '../lib/stockService'));
const indicatorService = require(path.join(__dirname, '../lib/indicatorService'));

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

    // POST /api/stocks/predict-data - Get indicator data for prediction on a specific date
    if (action === 'predict-data' && req.method === 'POST') {
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

      return res.json({
        success: true,
        data: indicatorData,
        info: {
          symbol: symbol.toUpperCase(),
          targetDate: indicatorData.targetDate,
          indicatorDate: indicatorData.indicatorDate,
          message: `Indicators from ${indicatorData.indicatorDate} will be used to predict ${indicatorData.targetDate}`
        }
      });
    }

    // POST /api/stocks/intraday-indicators - Get realtime intraday indicators
    if (action === 'intraday-indicators' && req.method === 'POST') {
      const { symbol } = req.body;
      
      if (!symbol) {
        return res.status(400).json({ error: 'Please provide a stock symbol' });
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      // Get historical daily data
      const stockData = await stockService.getStockData(symbol, '1y', '1d');
      
      if (!stockData.prices || stockData.prices.length < 60) {
        return res.status(400).json({ error: 'Not enough historical data for this stock' });
      }

      let prices = [...stockData.prices];
      let intradayInfo = {
        isMarketOpen: false,
        lastUpdate: now.toISOString(),
        todayData: null
      };

      // Try to get current realtime data
      try {
        const quotes = await stockService.getQuote([symbol]);
        if (quotes && quotes.length > 0) {
          const currentQuote = quotes[0];
          
          const marketState = currentQuote.marketState || 'CLOSED';
          intradayInfo.isMarketOpen = ['REGULAR', 'PRE', 'POST'].includes(marketState);
          intradayInfo.marketState = marketState;
          
          const lastPrice = prices[prices.length - 1];
          const lastPriceDate = new Date(lastPrice.date).toISOString().split('T')[0];
          
          const todayCandle = {
            date: now.toISOString(),
            open: currentQuote.regularMarketOpen || currentQuote.regularMarketPrice,
            high: currentQuote.regularMarketDayHigh || currentQuote.regularMarketPrice,
            low: currentQuote.regularMarketDayLow || currentQuote.regularMarketPrice,
            close: currentQuote.regularMarketPrice,
            volume: currentQuote.regularMarketVolume || 0,
            prevClose: currentQuote.regularMarketPreviousClose || lastPrice.close
          };
          
          intradayInfo.todayData = {
            ...todayCandle,
            change: currentQuote.regularMarketChange,
            changePercent: currentQuote.regularMarketChangePercent,
            bid: currentQuote.bid,
            ask: currentQuote.ask,
            bidSize: currentQuote.bidSize,
            askSize: currentQuote.askSize
          };
          
          if (lastPriceDate === today) {
            prices[prices.length - 1] = {
              ...lastPrice,
              date: lastPrice.date,
              open: lastPrice.open,
              high: Math.max(lastPrice.high || 0, todayCandle.high || 0),
              low: Math.min(lastPrice.low || Infinity, todayCandle.low || Infinity),
              close: todayCandle.close,
              volume: todayCandle.volume
            };
          } else {
            prices.push(todayCandle);
          }
        }
      } catch (realtimeErr) {
        console.warn('Could not fetch realtime data:', realtimeErr.message);
        intradayInfo.realtimeError = realtimeErr.message;
      }

      const indicatorData = indicatorService.getIntradayIndicators(prices);
      
      if (indicatorData.error) {
        return res.status(400).json({ error: indicatorData.error });
      }
      
      indicatorData.symbol = symbol.toUpperCase();

      const featureCount = Object.keys(indicatorData).filter(
        key => !['symbol', 'indicatorDate', 'isIntraday', 'marketStatus'].includes(key)
      ).length;

      return res.json({
        success: true,
        data: indicatorData,
        intraday: intradayInfo,
        info: {
          symbol: symbol.toUpperCase(),
          indicatorDate: indicatorData.indicatorDate,
          featureCount: featureCount,
          isIntraday: true,
          lastUpdate: now.toISOString(),
          message: `Realtime indicators as of ${now.toLocaleTimeString('id-ID')} WIB`
        }
      });
    }

    // POST /api/stocks/live-indicators - Get live indicator data with realtime support
    if (action === 'live-indicators' && req.method === 'POST') {
      const { symbol, targetDate, useRealtime = true, timeframe = 1 } = req.body;
      
      if (!symbol) {
        return res.status(400).json({ error: 'Please provide a stock symbol' });
      }
      
      if (!targetDate) {
        return res.status(400).json({ error: 'Please provide a target date' });
      }

      // Validate timeframe
      const tf = parseInt(timeframe, 10);
      if (isNaN(tf) || tf < 1 || tf > 30) {
        return res.status(400).json({ error: 'Timeframe must be between 1 and 30 days' });
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

      // Calculate indicators for the target date with timeframe
      const indicatorData = indicatorService.getIndicatorsForDate(prices, targetDate, tf);
      
      if (indicatorData.error) {
        return res.status(400).json({ error: indicatorData.error });
      }
      
      // Add symbol and timeframe
      indicatorData.symbol = symbol.toUpperCase();
      indicatorData.timeframe = tf;

      // Count features
      const featureCount = Object.keys(indicatorData).filter(
        key => !['symbol', 'targetDate', 'indicatorDate', 'actualData', 'timeframe'].includes(key)
      ).length;

      return res.json({
        success: true,
        data: indicatorData,
        info: {
          symbol: symbol.toUpperCase(),
          targetDate: indicatorData.targetDate,
          indicatorDate: indicatorData.indicatorDate,
          timeframe: tf,
          isRealtime: isRealtime,
          featureCount: featureCount,
          message: isRealtime 
            ? `Using realtime data as of ${new Date().toLocaleTimeString()}${tf > 1 ? ` (${tf}-day timeframe)` : ''}`
            : `Indicators from ${indicatorData.indicatorDate} for predicting ${indicatorData.targetDate}${tf > 1 ? ` (${tf}-day timeframe)` : ''}`
        }
      });
    }

    // Not found
    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Stock API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
