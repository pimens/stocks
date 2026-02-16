import { useState, useEffect, useCallback, useMemo } from 'react'
import { stockApi } from '../services/api'

const ML_FEATURES = [
  'closePosition', 'bodyRangeRatio', 'upperWickRatio', 'lowerWickRatio',
  'deltaRSI', 'deltaMACDHist', 'deltaStochK', 'deltaADX', 'deltaCCI', 'deltaMFI',
  'sma5', 'sma10', 'sma20', 'sma50',
  'ema9', 'ema12', 'ema21', 'ema26',
  'distanceFromSMA5', 'distanceFromSMA10', 'distanceFromSMA20', 'distanceFromSMA50',
  'aboveSMA5', 'aboveSMA10', 'aboveSMA20', 'aboveSMA50',
  'rsi', 'rsiOversold', 'rsiOverbought', 'rsiNeutral',
  'macd', 'macdSignal', 'macdHistogram', 'macdBullish', 'macdGoldenCross', 'macdDeathCross', 'macdCrossUp', 'macdCrossDown',
  'bbUpper', 'bbMiddle', 'bbLower', 'bbWidth', 'bbPosition', 'nearBBUpper', 'nearBBLower',
  'stochK', 'stochD', 'stochOversold', 'stochOverbought',
  'adx', 'plusDI', 'minusDI', 'strongTrend', 'bullishDI',
  'atr', 'atrPercent',
  'obv', 'obvTrend',
  'williamsR', 'williamsROversold', 'williamsROverbought',
  'cci', 'cciOversold', 'cciOverbought',
  'mfi', 'mfiOversold', 'mfiOverbought',
  'roc', 'momentum', 'trix',
  'tenkanSen', 'kijunSen', 'senkouSpanA', 'senkouSpanB', 'aboveCloud', 'belowCloud',
  'psar', 'psarBullish',
  'supertrend', 'supertrendBullish',
  'vwap', 'aboveVWAP',
  'pricePosition', 'volumeRatio', 'highVolume',
  'bodySize', 'upperWick', 'lowerWick', 'isBullishCandle', 'isDoji',
  'gapUp', 'gapDown', 'gapPercent',
  'return1d', 'return3d', 'return5d'
]

const INDICATOR_GROUPS = {
  'Harga Real-Time': ['currentOpen', 'currentHigh', 'currentLow', 'currentClose', 'currentVolume', 'prevClose', 'priceChange', 'priceChangePercent'],
  'Price Action': ['closePosition', 'bodyRangeRatio', 'upperWickRatio', 'lowerWickRatio', 'gapUp', 'gapDown', 'gapPercent'],
  'Moving Averages': ['sma5', 'sma10', 'sma20', 'sma50', 'ema9', 'ema12', 'ema21', 'ema26'],
  'MA Distance & Position': ['distanceFromSMA5', 'distanceFromSMA10', 'distanceFromSMA20', 'distanceFromSMA50', 'aboveSMA5', 'aboveSMA10', 'aboveSMA20', 'aboveSMA50'],
  'RSI': ['rsi', 'deltaRSI', 'rsiOversold', 'rsiOverbought', 'rsiNeutral'],
  'MACD': ['macd', 'macdSignal', 'macdHistogram', 'deltaMACDHist', 'macdBullish', 'macdGoldenCross', 'macdDeathCross', 'macdCrossUp', 'macdCrossDown'],
  'Bollinger Bands': ['bbUpper', 'bbMiddle', 'bbLower', 'bbWidth', 'bbPosition', 'nearBBUpper', 'nearBBLower'],
  'Stochastic': ['stochK', 'stochD', 'deltaStochK', 'stochOversold', 'stochOverbought'],
  'ADX & DI': ['adx', 'deltaADX', 'plusDI', 'minusDI', 'strongTrend', 'bullishDI'],
  'ATR (Volatility)': ['atr', 'atrPercent'],
  'Volume': ['obv', 'obvTrend', 'volumeRatio', 'highVolume'],
  'Williams %R': ['williamsR', 'williamsROversold', 'williamsROverbought'],
  'CCI': ['cci', 'deltaCCI', 'cciOversold', 'cciOverbought'],
  'MFI': ['mfi', 'deltaMFI', 'mfiOversold', 'mfiOverbought'],
  'Momentum': ['roc', 'momentum', 'trix'],
  'Ichimoku': ['tenkanSen', 'kijunSen', 'senkouSpanA', 'senkouSpanB', 'aboveCloud', 'belowCloud'],
  'PSAR & SuperTrend': ['psar', 'psarBullish', 'supertrend', 'supertrendBullish'],
  'VWAP': ['vwap', 'aboveVWAP'],
  'Price Position': ['pricePosition'],
  'Candlestick': ['bodySize', 'upperWick', 'lowerWick', 'isBullishCandle', 'isDoji'],
  'Returns': ['return1d', 'return3d', 'return5d']
}

const formatValue = (value, key) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? '✓' : '✗'
  if (key.includes('Oversold') || key.includes('Overbought') || key.includes('Bullish') || 
      key.includes('above') || key.includes('below') || key.includes('Cross') ||
      key.includes('strongTrend') || key.includes('highVolume') || key.includes('isDoji') ||
      key.includes('gap') && !key.includes('Percent') || key.includes('Neutral')) {
    return value === 1 ? '✓ Yes' : '✗ No'
  }
  if (key.includes('Volume') && !key.includes('Ratio')) {
    return value.toLocaleString()
  }
  if (key.includes('Percent') || key.includes('distance') || key.includes('return')) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }
  if (typeof value === 'number') {
    if (Math.abs(value) < 0.01) return value.toFixed(4)
    if (Math.abs(value) < 1) return value.toFixed(3)
    return value.toFixed(2)
  }
  return String(value)
}

const getValueColor = (value, key) => {
  if (value === null || value === undefined) return 'text-gray-500'
  
  // Boolean indicators
  if (key.includes('Bullish') || key.includes('above') || key === 'gapUp') {
    return value === 1 ? 'text-green-400' : 'text-gray-400'
  }
  if (key.includes('Bearish') || key.includes('below') || key === 'gapDown') {
    return value === 1 ? 'text-red-400' : 'text-gray-400'
  }
  
  // Oversold/Overbought
  if (key.includes('Oversold')) return value === 1 ? 'text-green-400' : 'text-gray-400'
  if (key.includes('Overbought')) return value === 1 ? 'text-red-400' : 'text-gray-400'
  
  // Price change
  if (key === 'priceChange' || key === 'priceChangePercent') {
    return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400'
  }
  
  // Returns
  if (key.includes('return') || key.includes('distance') || key.includes('Percent')) {
    return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400'
  }
  
  // RSI
  if (key === 'rsi') {
    if (value < 30) return 'text-green-400'
    if (value > 70) return 'text-red-400'
    return 'text-yellow-400'
  }
  
  // Stochastic
  if (key === 'stochK' || key === 'stochD') {
    if (value < 20) return 'text-green-400'
    if (value > 80) return 'text-red-400'
    return 'text-yellow-400'
  }
  
  // MFI
  if (key === 'mfi') {
    if (value < 20) return 'text-green-400'
    if (value > 80) return 'text-red-400'
    return 'text-yellow-400'
  }
  
  // CCI
  if (key === 'cci') {
    if (value < -100) return 'text-green-400'
    if (value > 100) return 'text-red-400'
    return 'text-yellow-400'
  }
  
  // Williams %R
  if (key === 'williamsR') {
    if (value < -80) return 'text-green-400'
    if (value > -20) return 'text-red-400'
    return 'text-yellow-400'
  }
  
  return 'text-white'
}

export default function IntradayIndicatorView() {
  const [symbol, setSymbol] = useState('')
  const [inputSymbol, setInputSymbol] = useState('')
  const [indicatorData, setIndicatorData] = useState(null)
  const [intradayInfo, setIntradayInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grouped')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')

  // Fetch intraday indicators
  const fetchIndicators = useCallback(async (sym) => {
    if (!sym) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await stockApi.getIntradayIndicators(sym)
      setIndicatorData(response)
      setIntradayInfo(response.intraday)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching intraday indicators:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputSymbol.trim()) {
      setSymbol(inputSymbol.trim().toUpperCase())
    }
  }

  // Fetch on symbol change
  useEffect(() => {
    if (symbol) {
      fetchIndicators(symbol)
    }
  }, [symbol, fetchIndicators])

  // Auto-refresh
  useEffect(() => {
    if (!symbol || !autoRefresh) return

    const interval = setInterval(() => {
      fetchIndicators(symbol)
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [symbol, autoRefresh, refreshInterval, fetchIndicators])

  // Filter indicators by search
  const filteredGroups = useMemo(() => {
    if (!indicatorData?.data) return {}
    
    const data = indicatorData.data
    const result = {}
    
    Object.entries(INDICATOR_GROUPS).forEach(([groupName, keys]) => {
      const filteredKeys = keys.filter(key => {
        if (!data.hasOwnProperty(key)) return false
        if (!searchFilter) return true
        return key.toLowerCase().includes(searchFilter.toLowerCase()) ||
               groupName.toLowerCase().includes(searchFilter.toLowerCase())
      })
      
      if (filteredKeys.length > 0) {
        result[groupName] = filteredKeys
      }
    })
    
    return result
  }, [indicatorData, searchFilter])

  // Count features
  const featureCount = useMemo(() => {
    if (!indicatorData?.data) return 0
    return Object.keys(indicatorData.data).filter(
      k => !['symbol', 'indicatorDate', 'isIntraday', 'marketStatus'].includes(k)
    ).length
  }, [indicatorData])

  // Format time
  const formatTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border border-orange-500/30 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          Realtime Intraday Indicators
        </h1>
        <p className="text-orange-200 mt-2">
          Lihat 90+ indikator teknikal secara real-time saat market sedang berjalan. 
          Data akan terus di-update berdasarkan harga terkini.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-400 text-sm mb-1">Kode Saham</label>
            <input
              type="text"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              placeholder="Contoh: BBCA, TLKM, ASII"
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputSymbol.trim()}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-6 py-2 rounded font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Loading...
              </span>
            ) : '⚡ Ambil Data Realtime'}
          </button>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-4 bg-gray-700/50 px-4 py-2 rounded">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-gray-300 text-sm">Auto Refresh</span>
            </label>
            
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm text-white"
              >
                <option value={10}>10 detik</option>
                <option value={30}>30 detik</option>
                <option value={60}>1 menit</option>
                <option value={120}>2 menit</option>
              </select>
            )}
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
          ❌ {error}
        </div>
      )}

      {/* Market Status Card */}
      {intradayInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`rounded-lg p-4 border ${intradayInfo.isMarketOpen ? 'bg-green-900/30 border-green-500/50' : 'bg-gray-800 border-gray-600'}`}>
            <p className="text-gray-400 text-xs">Status Market</p>
            <p className={`text-xl font-bold ${intradayInfo.isMarketOpen ? 'text-green-400' : 'text-gray-400'}`}>
              {intradayInfo.marketState || (intradayInfo.isMarketOpen ? 'OPEN' : 'CLOSED')}
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Last Update</p>
            <p className="text-white font-medium">{formatTime(lastUpdate)}</p>
          </div>
          
          {intradayInfo.todayData && (
            <>
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <p className="text-gray-400 text-xs">Harga Saat Ini</p>
                <p className="text-white font-bold text-xl">
                  Rp {intradayInfo.todayData.close?.toLocaleString()}
                </p>
              </div>
              
              <div className={`rounded-lg p-4 border ${intradayInfo.todayData.changePercent >= 0 ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
                <p className="text-gray-400 text-xs">Perubahan Hari Ini</p>
                <p className={`text-xl font-bold ${intradayInfo.todayData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {intradayInfo.todayData.changePercent >= 0 ? '+' : ''}{intradayInfo.todayData.changePercent?.toFixed(2)}%
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Live Price Candle */}
      {intradayInfo?.todayData && (
        <div className="bg-gray-800 border border-orange-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              Live Candle Hari Ini (Data Sementara)
            </h3>
            <span className="text-gray-400 text-sm">
              Updated: {formatTime(lastUpdate)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-gray-700/50 rounded p-3">
              <p className="text-gray-400 text-xs">Open</p>
              <p className="text-white font-medium">Rp {intradayInfo.todayData.open?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <p className="text-gray-400 text-xs">High</p>
              <p className="text-green-400 font-medium">Rp {intradayInfo.todayData.high?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <p className="text-gray-400 text-xs">Low</p>
              <p className="text-red-400 font-medium">Rp {intradayInfo.todayData.low?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <p className="text-gray-400 text-xs">Current</p>
              <p className="text-yellow-400 font-bold">Rp {intradayInfo.todayData.close?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <p className="text-gray-400 text-xs">Volume</p>
              <p className="text-white font-medium">{intradayInfo.todayData.volume?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <p className="text-gray-400 text-xs">Prev Close</p>
              <p className="text-gray-300 font-medium">Rp {intradayInfo.todayData.prevClose?.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Bid/Ask if available */}
          {(intradayInfo.todayData.bid || intradayInfo.todayData.ask) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-700">
              <div className="bg-green-900/30 rounded p-2">
                <p className="text-gray-400 text-xs">Bid</p>
                <p className="text-green-400 font-medium">
                  Rp {intradayInfo.todayData.bid?.toLocaleString()} 
                  <span className="text-xs text-gray-500 ml-1">x{intradayInfo.todayData.bidSize}</span>
                </p>
              </div>
              <div className="bg-red-900/30 rounded p-2">
                <p className="text-gray-400 text-xs">Ask</p>
                <p className="text-red-400 font-medium">
                  Rp {intradayInfo.todayData.ask?.toLocaleString()}
                  <span className="text-xs text-gray-500 ml-1">x{intradayInfo.todayData.askSize}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicator Display */}
      {indicatorData && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-gray-400 text-xs">Saham</p>
                <p className="text-white font-bold text-xl">{indicatorData.data?.symbol}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Total Indikator</p>
                <p className="text-orange-400 font-bold text-xl">{featureCount}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                <span className="text-orange-400 text-sm">REALTIME</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Cari indikator..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-orange-500"
              />
              
              {/* View Mode */}
              <div className="flex bg-gray-700 rounded overflow-hidden">
                {['grouped', 'table', 'compact'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-sm capitalize ${
                      viewMode === mode 
                        ? 'bg-orange-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Manual Refresh */}
              <button
                onClick={() => fetchIndicators(symbol)}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-yellow-200 text-sm">
              ⚠️ <strong>Perhatian:</strong> Data ini adalah data sementara (intraday) saat market sedang berjalan. 
              Indikator teknikal dihitung berdasarkan candle hari ini yang belum final (O/H/L/C bisa berubah sampai market tutup).
            </p>
          </div>

          {/* Grouped View */}
          {viewMode === 'grouped' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(filteredGroups).map(([groupName, keys]) => (
                <div key={groupName} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-700">
                    <h3 className="font-medium text-orange-400">{groupName}</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {keys.map((key) => {
                      const value = indicatorData.data[key]
                      const isMLFeature = ML_FEATURES.includes(key)
                      return (
                        <div key={key} className={`flex justify-between items-center ${isMLFeature ? 'bg-orange-900/20 px-2 py-1 rounded' : ''}`}>
                          <span className={`text-sm ${isMLFeature ? 'text-orange-300' : 'text-gray-400'}`}>
                            {isMLFeature && '⭐ '}{key}
                          </span>
                          <span className={`font-mono text-sm ${getValueColor(value, key)}`}>
                            {formatValue(value, key)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Kategori</th>
                      <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Indikator</th>
                      <th className="px-4 py-3 text-right text-gray-300 text-sm font-medium">Nilai</th>
                      <th className="px-4 py-3 text-center text-gray-300 text-sm font-medium">ML Feature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(filteredGroups).flatMap(([groupName, keys]) =>
                      keys.map((key, idx) => {
                        const value = indicatorData.data[key]
                        const isMLFeature = ML_FEATURES.includes(key)
                        return (
                          <tr key={`${groupName}-${key}`} className={`border-t border-gray-700 ${isMLFeature ? 'bg-orange-900/10' : ''}`}>
                            <td className="px-4 py-2 text-gray-400 text-sm">{idx === 0 ? groupName : ''}</td>
                            <td className="px-4 py-2 text-white text-sm">{key}</td>
                            <td className={`px-4 py-2 text-right font-mono text-sm ${getValueColor(value, key)}`}>
                              {formatValue(value, key)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {isMLFeature && <span className="text-orange-400">⭐</span>}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compact View */}
          {viewMode === 'compact' && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(filteredGroups).flatMap(([, keys]) =>
                  keys.map((key) => {
                    const value = indicatorData.data[key]
                    const isMLFeature = ML_FEATURES.includes(key)
                    return (
                      <div 
                        key={key} 
                        className={`px-3 py-1.5 rounded text-sm ${
                          isMLFeature 
                            ? 'bg-orange-900/30 border border-orange-500/50' 
                            : 'bg-gray-700 border border-gray-600'
                        }`}
                      >
                        <span className="text-gray-400">{key}:</span>{' '}
                        <span className={`font-mono ${getValueColor(value, key)}`}>
                          {formatValue(value, key)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Summary Analysis */}
          {indicatorData.data && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-3">📊 Ringkasan Sinyal Realtime</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Trend */}
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">Trend (MA)</p>
                  <p className={`font-bold ${
                    indicatorData.data.aboveSMA20 === 1 && indicatorData.data.aboveSMA50 === 1
                      ? 'text-green-400' 
                      : indicatorData.data.aboveSMA20 === 0 && indicatorData.data.aboveSMA50 === 0
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}>
                    {indicatorData.data.aboveSMA20 === 1 && indicatorData.data.aboveSMA50 === 1
                      ? '↗️ Bullish' 
                      : indicatorData.data.aboveSMA20 === 0 && indicatorData.data.aboveSMA50 === 0
                      ? '↘️ Bearish'
                      : '↔️ Mixed'}
                  </p>
                </div>

                {/* Momentum */}
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">RSI</p>
                  <p className={`font-bold ${
                    indicatorData.data.rsiOversold === 1
                      ? 'text-green-400' 
                      : indicatorData.data.rsiOverbought === 1
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}>
                    {indicatorData.data.rsi?.toFixed(1)} - {
                      indicatorData.data.rsiOversold === 1
                        ? 'Oversold' 
                        : indicatorData.data.rsiOverbought === 1
                        ? 'Overbought'
                        : 'Neutral'
                    }
                  </p>
                </div>

                {/* MACD */}
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">MACD</p>
                  <p className={`font-bold ${indicatorData.data.macdBullish === 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicatorData.data.macdBullish === 1 ? '📈 Bullish' : '📉 Bearish'}
                    {indicatorData.data.macdCrossUp === 1 && ' (Cross Up!)'}
                    {indicatorData.data.macdCrossDown === 1 && ' (Cross Down!)'}
                  </p>
                </div>

                {/* Volume */}
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">Volume</p>
                  <p className={`font-bold ${indicatorData.data.highVolume === 1 ? 'text-green-400' : 'text-gray-400'}`}>
                    {indicatorData.data.highVolume === 1 ? '🔥 High Volume' : '📊 Normal'}
                    <span className="text-sm text-gray-400 ml-1">({indicatorData.data.volumeRatio?.toFixed(2)}x)</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!indicatorData && !loading && !error && (
        <div className="bg-gray-800/50 border border-gray-700 border-dashed rounded-lg p-12 text-center">
          <span className="text-6xl mb-4 block">⚡</span>
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Lihat Indikator Realtime
          </h3>
          <p className="text-gray-500">
            Masukkan kode saham untuk melihat 90+ indikator teknikal secara real-time
          </p>
        </div>
      )}
    </div>
  )
}
