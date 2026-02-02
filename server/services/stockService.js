const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

class StockService {
  constructor() {
    this.yahooFinanceBase = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.yahooQuoteBase = 'https://query1.finance.yahoo.com/v7/finance/quote';
  }

  // Convert Indonesian stock code to Yahoo Finance format (add .JK suffix)
  toYahooSymbol(code) {
    if (!code.endsWith('.JK')) {
      return `${code.toUpperCase()}.JK`;
    }
    return code.toUpperCase();
  }

  // Get stock data from Yahoo Finance
  async getStockData(symbol, range = '3mo', interval = '1d') {
    const yahooSymbol = this.toYahooSymbol(symbol);
    const cacheKey = `stock_${yahooSymbol}_${range}_${interval}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.yahooFinanceBase}/${yahooSymbol}`, {
        params: {
          range,
          interval,
          includePrePost: false,
          events: 'div,split'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data.chart.result[0];
      const timestamps = result.timestamp || [];
      const quotes = result.indicators.quote[0];
      const meta = result.meta;

      const data = {
        symbol: symbol.toUpperCase(),
        yahooSymbol,
        currency: meta.currency,
        exchangeName: meta.exchangeName,
        regularMarketPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        chartPreviousClose: meta.chartPreviousClose,
        prices: timestamps.map((ts, i) => ({
          date: new Date(ts * 1000).toISOString().split('T')[0],
          timestamp: ts,
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i]
        })).filter(p => p.close !== null)
      };

      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error.message);
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
  }

  // Get real-time quote with bid/ask
  async getQuote(symbols) {
    const yahooSymbols = symbols.map(s => this.toYahooSymbol(s)).join(',');
    const cacheKey = `quote_${yahooSymbols}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Try v7 quote API first
      const response = await axios.get(this.yahooQuoteBase, {
        params: { symbols: yahooSymbols },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (!response.data?.quoteResponse?.result) {
        throw new Error('Invalid response from Yahoo Finance');
      }

      const quotes = response.data.quoteResponse.result.map(q => ({
        symbol: q.symbol.replace('.JK', ''),
        name: q.shortName || q.longName,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        volume: q.regularMarketVolume,
        avgVolume: q.averageDailyVolume3Month,
        marketCap: q.marketCap,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
        fiftyDayAverage: q.fiftyDayAverage,
        twoHundredDayAverage: q.twoHundredDayAverage,
        trailingPE: q.trailingPE,
        forwardPE: q.forwardPE,
        priceToBook: q.priceToBook,
        dividendYield: q.dividendYield,
        // Bid/Ask data
        bid: q.bid,
        bidSize: q.bidSize,
        ask: q.ask,
        askSize: q.askSize,
        spread: q.ask && q.bid ? q.ask - q.bid : null,
        spreadPercent: q.ask && q.bid ? ((q.ask - q.bid) / q.bid * 100) : null
      }));

      cache.set(cacheKey, quotes);
      return quotes;
    } catch (error) {
      console.error('Error fetching quotes from v7:', error.message);
      
      // Fallback: try to get price from chart API
      try {
        const results = [];
        for (const symbol of symbols) {
          const stockData = await this.getStockData(symbol, '5d', '1d');
          const lastPrice = stockData.prices[stockData.prices.length - 1];
          results.push({
            symbol: symbol.toUpperCase(),
            name: symbol.toUpperCase(),
            price: stockData.regularMarketPrice || lastPrice?.close,
            volume: lastPrice?.volume,
            avgVolume: stockData.prices.reduce((sum, p) => sum + (p.volume || 0), 0) / stockData.prices.length
          });
        }
        return results;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
        throw new Error('Failed to fetch quotes');
      }
    }
  }

  // Get order book from RTI (scraping)
  async getOrderBook(symbol) {
    const cacheKey = `orderbook_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Try to get from RTI Business
      const response = await axios.get(`https://www.rtibusiness.com/stock/${symbol.toUpperCase()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      const bids = [];
      const asks = [];

      // Parse bid table (this may need adjustment based on actual HTML structure)
      $('table.orderbook-bid tr, table.bid-table tr').each((i, el) => {
        if (i === 0) return; // Skip header
        const cols = $(el).find('td');
        if (cols.length >= 3) {
          bids.push({
            price: parseFloat($(cols[0]).text().replace(/[,\.]/g, '')) || 0,
            volume: parseInt($(cols[1]).text().replace(/[,\.]/g, '')) || 0,
            count: parseInt($(cols[2]).text()) || 0
          });
        }
      });

      // Parse ask table
      $('table.orderbook-ask tr, table.ask-table tr').each((i, el) => {
        if (i === 0) return;
        const cols = $(el).find('td');
        if (cols.length >= 3) {
          asks.push({
            price: parseFloat($(cols[0]).text().replace(/[,\.]/g, '')) || 0,
            volume: parseInt($(cols[1]).text().replace(/[,\.]/g, '')) || 0,
            count: parseInt($(cols[2]).text()) || 0
          });
        }
      });

      const orderBook = {
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString(),
        bids: bids.slice(0, 10),
        asks: asks.slice(0, 10),
        source: 'RTI Business'
      };

      // If scraping didn't work, generate simulated order book based on current price
      if (bids.length === 0 && asks.length === 0) {
        return await this.getSimulatedOrderBook(symbol);
      }

      cache.set(cacheKey, orderBook, 60); // Cache for 60 seconds
      return orderBook;
    } catch (error) {
      console.error(`Error fetching order book for ${symbol}:`, error.message);
      // Fallback to simulated order book
      return await this.getSimulatedOrderBook(symbol);
    }
  }

  // Generate simulated order book based on current price and typical spread
  async getSimulatedOrderBook(symbol) {
    try {
      const quotes = await this.getQuote([symbol]);
      const quote = quotes[0];
      
      if (!quote || !quote.price) {
        throw new Error('Could not get current price');
      }

      const price = quote.price;
      const tickSize = this.getTickSize(price);
      const avgVolume = quote.avgVolume || 1000000;
      
      const bids = [];
      const asks = [];
      
      // Generate 10 levels of bid/ask
      for (let i = 0; i < 10; i++) {
        const bidPrice = price - (tickSize * (i + 1));
        const askPrice = price + (tickSize * (i + 1));
        
        // Volume decreases as we move away from current price
        const volumeMultiplier = Math.max(0.1, 1 - (i * 0.1));
        const baseVolume = Math.floor(avgVolume / 100 * volumeMultiplier);
        
        bids.push({
          price: bidPrice,
          volume: Math.floor(baseVolume * (0.5 + Math.random())),
          lot: Math.floor(baseVolume / 100 * (0.5 + Math.random()))
        });
        
        asks.push({
          price: askPrice,
          volume: Math.floor(baseVolume * (0.5 + Math.random())),
          lot: Math.floor(baseVolume / 100 * (0.5 + Math.random()))
        });
      }

      return {
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString(),
        currentPrice: price,
        bids,
        asks,
        totalBidVolume: bids.reduce((sum, b) => sum + b.volume, 0),
        totalAskVolume: asks.reduce((sum, a) => sum + a.volume, 0),
        source: 'Simulated (based on Yahoo Finance)',
        note: 'Order book disimulasikan berdasarkan harga terkini. Data real order book memerlukan akses ke broker API.'
      };
    } catch (error) {
      throw new Error(`Failed to generate order book: ${error.message}`);
    }
  }

  // Get tick size based on IDX rules
  getTickSize(price) {
    if (price < 200) return 1;
    if (price < 500) return 2;
    if (price < 2000) return 5;
    if (price < 5000) return 10;
    return 25;
  }

  // Get broker summary (top buyers/sellers) - simulated
  async getBrokerSummary(symbol) {
    const cacheKey = `broker_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const quotes = await this.getQuote([symbol]);
      const quote = quotes[0];
      
      // Simulated broker data (in reality, this needs broker API access)
      const brokers = ['YP', 'CC', 'MS', 'GR', 'KK', 'BK', 'RX', 'PD', 'AI', 'NI'];
      const avgVolume = quote?.avgVolume || 1000000;
      
      const topBuyers = brokers.slice(0, 5).map((code, i) => ({
        broker: code,
        volume: Math.floor(avgVolume / 10 * (1 - i * 0.15) * (0.8 + Math.random() * 0.4)),
        value: 0,
        frequency: Math.floor(50 * (1 - i * 0.1) * (0.8 + Math.random() * 0.4))
      }));
      
      const topSellers = brokers.slice(5, 10).map((code, i) => ({
        broker: code,
        volume: Math.floor(avgVolume / 10 * (1 - i * 0.15) * (0.8 + Math.random() * 0.4)),
        value: 0,
        frequency: Math.floor(50 * (1 - i * 0.1) * (0.8 + Math.random() * 0.4))
      }));

      // Calculate values
      topBuyers.forEach(b => b.value = b.volume * (quote?.price || 0));
      topSellers.forEach(s => s.value = s.volume * (quote?.price || 0));

      const summary = {
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString(),
        topBuyers,
        topSellers,
        netForeignFlow: Math.floor((Math.random() - 0.5) * avgVolume * 0.2),
        source: 'Simulated',
        note: 'Data broker summary disimulasikan. Data real memerlukan akses ke RTI atau broker API.'
      };

      cache.set(cacheKey, summary, 300);
      return summary;
    } catch (error) {
      throw new Error(`Failed to get broker summary: ${error.message}`);
    }
  }

  // Get popular Indonesian stocks list
  getPopularStocks() {
    return [
      { code: 'BBCA', name: 'Bank Central Asia' },
      { code: 'BBRI', name: 'Bank Rakyat Indonesia' },
      { code: 'BMRI', name: 'Bank Mandiri' },
      { code: 'TLKM', name: 'Telkom Indonesia' },
      { code: 'ASII', name: 'Astra International' },
      { code: 'UNVR', name: 'Unilever Indonesia' },
      { code: 'HMSP', name: 'HM Sampoerna' },
      { code: 'GGRM', name: 'Gudang Garam' },
      { code: 'ICBP', name: 'Indofood CBP' },
      { code: 'INDF', name: 'Indofood Sukses Makmur' },
      { code: 'KLBF', name: 'Kalbe Farma' },
      { code: 'PGAS', name: 'Perusahaan Gas Negara' },
      { code: 'SMGR', name: 'Semen Indonesia' },
      { code: 'UNTR', name: 'United Tractors' },
      { code: 'WIKA', name: 'Wijaya Karya' },
      { code: 'PTBA', name: 'Bukit Asam' },
      { code: 'ANTM', name: 'Aneka Tambang' },
      { code: 'INCO', name: 'Vale Indonesia' },
      { code: 'EXCL', name: 'XL Axiata' },
      { code: 'ISAT', name: 'Indosat Ooredoo' },
      { code: 'ADRO', name: 'Adaro Energy' },
      { code: 'ITMG', name: 'Indo Tambangraya Megah' },
      { code: 'MEDC', name: 'Medco Energi' },
      { code: 'CPIN', name: 'Charoen Pokphand' },
      { code: 'JPFA', name: 'Japfa Comfeed' },
      { code: 'BBNI', name: 'Bank Negara Indonesia' },
      { code: 'BRIS', name: 'Bank Syariah Indonesia' },
      { code: 'ACES', name: 'Ace Hardware Indonesia' },
      { code: 'ERAA', name: 'Erajaya Swasembada' },
      { code: 'MAPI', name: 'Mitra Adiperkasa' }
    ];
  }
}

module.exports = new StockService();
