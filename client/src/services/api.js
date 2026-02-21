import axios from 'axios'

// Use environment variable for API base URL, fallback to relative path for Vercel
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export const stockApi = {
  // Get popular Indonesian stocks
  getPopularStocks: async () => {
    const response = await axios.get(`${API_BASE}/stocks/popular`)
    return response.data
  },

  // Get stock data with indicators
  getStockData: async (symbol, range = '3mo', interval = '1d') => {
    const response = await axios.get(`${API_BASE}/stocks/data/${symbol}`, {
      params: { range, interval }
    })
    return response.data
  },

  // Get quotes for multiple stocks
  getQuotes: async (symbols) => {
    const response = await axios.post(`${API_BASE}/stocks/quotes`, { symbols })
    return response.data
  },

  // Screen stocks based on criteria
  screenStocks: async (symbols, criteria) => {
    const response = await axios.post(`${API_BASE}/stocks/screen`, { symbols, criteria })
    return response.data
  },

  // Batch get data for multiple stocks
  getBatchData: async (symbols) => {
    const response = await axios.post(`${API_BASE}/stocks/batch`, { symbols })
    return response.data
  },

  // Get order book for a stock
  getOrderBook: async (symbol) => {
    const response = await axios.get(`${API_BASE}/stocks/orderbook/${symbol}`)
    return response.data
  },

  // Get broker summary for a stock
  getBrokerSummary: async (symbol) => {
    const response = await axios.get(`${API_BASE}/stocks/broker/${symbol}`)
    return response.data
  },

  // Get regression data with indicators for multiple stocks
  getRegressionData: async (symbols, startDate, endDate, options = {}) => {
    const { upThreshold = 1.0, downThreshold = -0.5, includeNeutral = false } = options
    const response = await axios.post(`${API_BASE}/stocks/regression-data`, {
      symbols,
      startDate,
      endDate,
      upThreshold,
      downThreshold,
      includeNeutral
    })
    return response.data
  },

  // Get indicator data for single stock prediction on a specific date
  getPredictData: async (symbol, targetDate) => {
    const response = await axios.post(`${API_BASE}/stocks/predict-data`, {
      symbol,
      targetDate
    })
    return response.data
  },

  // Get live indicator data (supports realtime calculation for today)
  // timeframe: 1 = daily, 3 = 3-day candles, 5 = weekly equivalent, etc.
  getLiveIndicators: async (symbol, targetDate, useRealtime = true, timeframe = 1) => {
    const response = await axios.post(`${API_BASE}/stocks/live-indicators`, {
      symbol,
      targetDate,
      useRealtime,
      timeframe
    })
    return response.data
  },

  // Get intraday indicators (real-time during market hours)
  getIntradayIndicators: async (symbol) => {
    const response = await axios.post(`${API_BASE}/stocks/intraday-indicators`, {
      symbol
    })
    return response.data
  }
}

export const aiApi = {
  // Get available AI models
  getModels: async () => {
    const response = await axios.get(`${API_BASE}/ai/models`)
    return response.data
  },

  // Get AI analysis for a stock
  analyzeStock: async (symbol, model = 'google/gemini-2.0-flash-001') => {
    const response = await axios.get(`${API_BASE}/ai/analyze/${symbol}`, {
      params: { model }
    })
    return response.data
  },

  // Compare multiple stocks
  compareStocks: async (symbols, model = 'google/gemini-2.0-flash-001') => {
    const response = await axios.post(`${API_BASE}/ai/compare`, { symbols, model })
    return response.data
  },

  // Analyze stock with custom indicators
  analyzeWithIndicators: async (symbol, indicators, date, model = 'google/gemini-2.0-flash-001') => {
    const response = await axios.post(`${API_BASE}/ai/analyze-indicators`, {
      symbol,
      indicators,
      date,
      model
    })
    return response.data
  }
}
