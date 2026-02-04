import { useState, useEffect, useMemo } from 'react'
import { stockApi } from '../services/api'

const ML_API_BASE = import.meta.env.VITE_ML_API_BASE || 'http://localhost:8000'

const POPULAR_STOCKS = [
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'UNVR', 'HMSP', 'GGRM', 'ICBP',
  'INDF', 'KLBF', 'PGAS', 'SMGR', 'UNTR', 'WIKA', 'PTBA', 'ANTM', 'INCO', 'EXCL'
]

// Group features by category
const FEATURE_CATEGORIES = {
  'Price Data': {
    icon: '💵',
    features: ['prevClose', 'prevOpen', 'prevHigh', 'prevLow', 'prevVolume']
  },
  'Candlestick': {
    icon: '🕯️',
    features: ['closePosition', 'bodyRangeRatio', 'upperWickRatio', 'lowerWickRatio', 'bodySize', 'upperWick', 'lowerWick', 'isBullishCandle', 'isDoji']
  },
  'Moving Averages': {
    icon: '📈',
    features: ['sma5', 'sma10', 'sma20', 'sma50', 'ema5', 'ema10', 'ema12', 'ema26']
  },
  'Price vs MA': {
    icon: '⚖️',
    features: ['priceAboveSMA5', 'priceAboveSMA10', 'priceAboveSMA20', 'priceAboveSMA50', 'priceAboveEMA12', 'priceAboveEMA26']
  },
  'Distance from MA': {
    icon: '📏',
    features: ['distFromSMA5', 'distFromSMA20', 'distFromSMA50']
  },
  'MA Crossovers': {
    icon: '✂️',
    features: ['sma5AboveSMA10', 'sma10AboveSMA20', 'sma20AboveSMA50']
  },
  'RSI': {
    icon: '💪',
    features: ['rsi', 'rsiOversold', 'rsiOverbought', 'rsiNeutral', 'deltaRSI']
  },
  'MACD': {
    icon: '📊',
    features: ['macd', 'macdSignal', 'macdHistogram', 'macdBullish', 'macdPositive', 'deltaMACDHist']
  },
  'Bollinger Bands': {
    icon: '📉',
    features: ['bbUpper', 'bbMiddle', 'bbLower', 'bbWidth', 'priceBelowLowerBB', 'priceAboveUpperBB']
  },
  'Stochastic': {
    icon: '🔄',
    features: ['stochK', 'stochD', 'stochOversold', 'stochOverbought', 'stochBullishCross', 'deltaStochK']
  },
  'ADX/DMI': {
    icon: '🎯',
    features: ['adx', 'pdi', 'mdi', 'strongTrend', 'bullishDI', 'deltaADX']
  },
  'ATR': {
    icon: '📐',
    features: ['atr', 'atrPercent']
  },
  'OBV': {
    icon: '📦',
    features: ['obv', 'obvChange', 'obvTrend']
  },
  'Williams %R': {
    icon: '🔻',
    features: ['williamsR', 'williamsROversold', 'williamsROverbought']
  },
  'CCI': {
    icon: '🌡️',
    features: ['cci', 'cciOversold', 'cciOverbought', 'deltaCCI']
  },
  'MFI': {
    icon: '💰',
    features: ['mfi', 'mfiOversold', 'mfiOverbought', 'deltaMFI']
  },
  'ROC': {
    icon: '🚀',
    features: ['roc', 'rocPositive']
  },
  'Momentum': {
    icon: '⚡',
    features: ['momentum', 'momentumPositive', 'pricePosition']
  },
  'Volume': {
    icon: '📊',
    features: ['volumeRatio', 'highVolume']
  },
  'Gaps': {
    icon: '🔲',
    features: ['gapUp', 'gapDown']
  },
  'Returns': {
    icon: '💹',
    features: ['return1d', 'return3d', 'return5d']
  }
}

export default function LiveIndicatorView() {
  const [symbol, setSymbol] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [useRealtime, setUseRealtime] = useState(true)
  const [indicatorData, setIndicatorData] = useState(null)
  const [trainedModels, setTrainedModels] = useState([])
  const [selectedModelId, setSelectedModelId] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grouped') // grouped, table, compact
  const [searchFilter, setSearchFilter] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setTargetDate(today)
  }, [])

  // Fetch trained models
  useEffect(() => {
    fetchTrainedModels()
  }, [])

  // Auto refresh
  useEffect(() => {
    let interval
    if (autoRefresh && symbol && indicatorData) {
      interval = setInterval(() => {
        handleFetchIndicators()
      }, 60000) // Refresh every 1 minute
    }
    return () => clearInterval(interval)
  }, [autoRefresh, symbol, indicatorData])

  const fetchTrainedModels = async () => {
    try {
      const response = await fetch(`${ML_API_BASE}/trained-models`)
      const data = await response.json()
      setTrainedModels(data.models || [])
      if (data.models?.length > 0) {
        setSelectedModelId(data.models[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch trained models:', err)
    }
  }

  const selectedModel = useMemo(() => {
    return trainedModels.find(m => m.id === selectedModelId)
  }, [trainedModels, selectedModelId])

  const modelFeatures = useMemo(() => {
    return selectedModel?.features || []
  }, [selectedModel])

  // Filter features based on search
  const filteredFeatures = useMemo(() => {
    if (!searchFilter.trim()) return null
    const search = searchFilter.toLowerCase()
    const result = {}
    Object.entries(FEATURE_CATEGORIES).forEach(([category, { features }]) => {
      const filtered = features.filter(f => f.toLowerCase().includes(search))
      if (filtered.length > 0) {
        result[category] = filtered
      }
    })
    return result
  }, [searchFilter])

  const handleFetchIndicators = async () => {
    if (!symbol.trim()) {
      setError('Silakan masukkan kode saham')
      return
    }

    setLoading(true)
    setError(null)
    setPrediction(null)

    try {
      const result = await stockApi.getLiveIndicators(
        symbol.toUpperCase(), 
        targetDate, 
        useRealtime
      )
      setIndicatorData(result)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePredict = async () => {
    if (!indicatorData?.data) {
      setError('Silakan ambil data indikator terlebih dahulu')
      return
    }
    if (!selectedModelId || !selectedModel) {
      setError('Silakan pilih model untuk prediksi')
      return
    }

    setPredicting(true)
    setError(null)
    setPrediction(null)

    try {
      const response = await fetch(`${ML_API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [indicatorData.data],
          features: selectedModel.features,
          model_id: selectedModelId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Prediction failed')
      }

      setPrediction({
        ...result,
        model: selectedModel,
        predictedValue: result.predictions[0],
        probabilities: result.probabilities ? result.probabilities[0] : null
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setPredicting(false)
    }
  }

  const formatValue = (value, feature) => {
    if (value === null || value === undefined) return <span className="text-gray-500">-</span>
    
    // Binary features
    if (feature.includes('Above') || feature.includes('Oversold') || feature.includes('Overbought') || 
        feature.includes('Bullish') || feature.includes('Positive') || feature.includes('strongTrend') ||
        feature.includes('highVolume') || feature.includes('gap') || feature.includes('isDoji') ||
        feature.includes('isBullish') || feature.includes('Neutral')) {
      return value === 1 ? (
        <span className="text-green-400 font-medium">✓ Yes</span>
      ) : (
        <span className="text-gray-500">✗ No</span>
      )
    }
    
    // Format numbers
    if (typeof value === 'number') {
      if (Math.abs(value) >= 1000000) {
        return <span className="text-white">{(value / 1000000).toFixed(2)}M</span>
      }
      if (Math.abs(value) >= 1000) {
        return <span className="text-white">{value.toLocaleString()}</span>
      }
      if (Number.isInteger(value)) {
        return <span className="text-white">{value}</span>
      }
      return <span className="text-white">{value.toFixed(4)}</span>
    }
    
    return <span className="text-white">{String(value)}</span>
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPredictionLabel = (value) => {
    if (value === 1 || value === 'UP' || value === '1') return 'UP'
    if (value === 0 || value === 'DOWN' || value === '0') return 'DOWN'
    return value
  }

  const isToday = targetDate === new Date().toISOString().split('T')[0]

  // Count features
  const totalFeatures = Object.values(FEATURE_CATEGORIES).reduce((sum, cat) => sum + cat.features.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">📋</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Live Indicator View</h1>
            <p className="text-gray-400">Lihat semua {totalFeatures}+ fitur indikator teknikal untuk prediksi ML</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stock Symbol */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Kode Saham</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BBCA"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 uppercase"
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {POPULAR_STOCKS.slice(0, 6).map(stock => (
                <button
                  key={stock}
                  onClick={() => setSymbol(stock)}
                  className={`px-2 py-0.5 text-xs rounded transition ${
                    symbol === stock 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {stock}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Tanggal Data</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
            {isToday && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="useRealtime"
                  checked={useRealtime}
                  onChange={(e) => setUseRealtime(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <label htmlFor="useRealtime" className="text-xs text-yellow-400">
                  🔴 Gunakan data realtime (market berjalan)
                </label>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Model Prediksi</label>
            {trainedModels.length === 0 ? (
              <div className="text-sm text-yellow-400 bg-yellow-900/20 rounded-lg p-2">
                ⚠️ Belum ada model yang di-train
              </div>
            ) : (
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {trainedModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.model_name} ({(model.metrics.accuracy * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
            )}
            {selectedModel && (
              <p className="text-xs text-gray-500 mt-1">
                {modelFeatures.length} fitur | Target: {selectedModel.target}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm text-gray-400 mb-0">Aksi</label>
            <button
              onClick={handleFetchIndicators}
              disabled={loading || !symbol.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>📊 Ambil Data</>
              )}
            </button>
            {indicatorData && trainedModels.length > 0 && (
              <button
                onClick={handlePredict}
                disabled={predicting || !selectedModelId}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {predicting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Predicting...
                  </>
                ) : (
                  <>🔮 Prediksi Besok</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Prediction Result */}
      {prediction && (
        <div className={`border rounded-xl p-6 ${
          getPredictionLabel(prediction.predictedValue) === 'UP' 
            ? 'bg-green-900/30 border-green-500/50' 
            : 'bg-red-900/30 border-red-500/50'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                🎯 Hasil Prediksi untuk Besok
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Model: {prediction.model.model_name} | Accuracy: {(prediction.model.metrics.accuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${
                getPredictionLabel(prediction.predictedValue) === 'UP' ? 'text-green-400' : 'text-red-400'
              }`}>
                {getPredictionLabel(prediction.predictedValue) === 'UP' ? '📈' : '📉'} {getPredictionLabel(prediction.predictedValue)}
              </div>
              {prediction.probabilities && (
                <div className="text-sm text-gray-400 mt-2">
                  Confidence: {(Math.max(...prediction.probabilities) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Probability bars */}
          {prediction.probabilities && prediction.probabilities.length === 2 && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-400">📉 DOWN</span>
                    <span className="text-red-400">{(prediction.probabilities[0] * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${prediction.probabilities[0] * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-400">📈 UP</span>
                    <span className="text-green-400">{(prediction.probabilities[1] * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${prediction.probabilities[1] * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400">
              💡 <strong>Strategi Beli Sore Jual Pagi:</strong> Berdasarkan indikator teknikal dari{' '}
              <span className="text-yellow-400">{formatDate(indicatorData?.data?.indicatorDate)}</span>
              {indicatorData?.data?.isFutureDate && (
                <span className="text-orange-400"> (data terbaru tersedia)</span>
              )}, 
              model memprediksi harga saham {symbol} akan{' '}
              <span className={getPredictionLabel(prediction.predictedValue) === 'UP' ? 'text-green-400' : 'text-red-400'}>
                {getPredictionLabel(prediction.predictedValue) === 'UP' ? 'NAIK' : 'TURUN'}
              </span>{' '}
              besok pagi.
            </p>
          </div>
        </div>
      )}

      {/* Data Display */}
      {indicatorData && (
        <div className="space-y-4">
          {/* Info Bar */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-gray-400 text-xs">Saham</p>
                <p className="text-white font-bold text-xl">{indicatorData.data.symbol}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Tanggal Data Indikator</p>
                <p className="text-yellow-400 font-medium">
                  {formatDate(indicatorData.data.indicatorDate)}
                  {indicatorData.data.isFutureDate && (
                    <span className="text-orange-400 text-xs ml-2">(data terakhir)</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Harga Close</p>
                <p className="text-white font-bold">Rp {indicatorData.data.prevClose?.toLocaleString()}</p>
              </div>
              {indicatorData.info?.isRealtime && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-red-400 text-sm">LIVE</span>
                </div>
              )}
              {indicatorData.data.isFutureDate && (
                <div className="flex items-center gap-2 bg-orange-500/20 px-2 py-1 rounded">
                  <span className="text-orange-400 text-xs">📅 Prediksi untuk tanggal masa depan</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Cari fitur..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              
              {/* View Mode */}
              <div className="flex bg-gray-700 rounded-lg p-1">
                {['grouped', 'table', 'compact'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-xs rounded transition ${
                      viewMode === mode 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode === 'grouped' ? '📂' : mode === 'table' ? '📋' : '📱'}
                  </button>
                ))}
              </div>

              {/* Auto Refresh */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <span className="text-gray-400">Auto refresh</span>
              </label>

              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Model Features Quick View */}
          {selectedModel && modelFeatures.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                🎯 Fitur yang Digunakan Model ({modelFeatures.length})
                <span className="text-xs text-gray-500 font-normal">- {selectedModel.model_name}</span>
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {modelFeatures.map(feature => (
                  <div key={feature} className="bg-purple-800/30 rounded px-2 py-1.5 border border-purple-600/30">
                    <p className="text-purple-300 text-xs truncate">{feature}</p>
                    <div className="text-sm font-medium">
                      {formatValue(indicatorData.data[feature], feature)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grouped View */}
          {viewMode === 'grouped' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(filteredFeatures || FEATURE_CATEGORIES).map(([category, data]) => {
                const features = filteredFeatures ? data : data.features
                const icon = FEATURE_CATEGORIES[category]?.icon || '📋'
                
                return (
                  <div key={category} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <span>{icon}</span>
                      {category}
                      <span className="text-xs text-gray-500 font-normal">({features.length})</span>
                    </h4>
                    <div className="space-y-1">
                      {features.map(feature => {
                        const isModelFeature = modelFeatures.includes(feature)
                        const value = indicatorData.data[feature]
                        
                        return (
                          <div 
                            key={feature}
                            className={`flex justify-between items-center py-1 px-2 rounded ${
                              isModelFeature ? 'bg-purple-900/30 border border-purple-600/30' : ''
                            }`}
                          >
                            <span className={`text-sm ${isModelFeature ? 'text-purple-300' : 'text-gray-400'}`}>
                              {feature} {isModelFeature && '⭐'}
                            </span>
                            <span className="text-sm">{formatValue(value, feature)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Category</th>
                      <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Feature</th>
                      <th className="text-right px-4 py-3 text-gray-400 text-sm font-medium">Value</th>
                      <th className="text-center px-4 py-3 text-gray-400 text-sm font-medium">Model</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {Object.entries(filteredFeatures || FEATURE_CATEGORIES).map(([category, data]) => {
                      const features = filteredFeatures ? data : data.features
                      const icon = FEATURE_CATEGORIES[category]?.icon || '📋'
                      
                      return features.map((feature, idx) => {
                        const isModelFeature = modelFeatures.includes(feature)
                        const value = indicatorData.data[feature]
                        
                        return (
                          <tr 
                            key={`${category}-${feature}`}
                            className={isModelFeature ? 'bg-purple-900/20' : 'hover:bg-gray-700/30'}
                          >
                            {idx === 0 && (
                              <td rowSpan={features.length} className="px-4 py-2 text-gray-400 text-sm border-r border-gray-700">
                                {icon} {category}
                              </td>
                            )}
                            <td className={`px-4 py-2 text-sm ${isModelFeature ? 'text-purple-300' : 'text-gray-300'}`}>
                              {feature}
                            </td>
                            <td className="px-4 py-2 text-right text-sm">
                              {formatValue(value, feature)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {isModelFeature && <span className="text-purple-400">⭐</span>}
                            </td>
                          </tr>
                        )
                      })
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compact View */}
          {viewMode === 'compact' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
                {Object.entries(filteredFeatures || FEATURE_CATEGORIES).flatMap(([category, data]) => {
                  const features = filteredFeatures ? data : data.features
                  return features.map(feature => {
                    const isModelFeature = modelFeatures.includes(feature)
                    const value = indicatorData.data[feature]
                    
                    return (
                      <div 
                        key={feature}
                        className={`rounded px-2 py-1 ${
                          isModelFeature 
                            ? 'bg-purple-800/30 border border-purple-600/30' 
                            : 'bg-gray-700/50'
                        }`}
                        title={`${feature}: ${value}`}
                      >
                        <p className={`text-xs truncate ${isModelFeature ? 'text-purple-300' : 'text-gray-400'}`}>
                          {feature}
                        </p>
                        <div className="text-xs font-medium truncate">
                          {formatValue(value, feature)}
                        </div>
                      </div>
                    )
                  })
                })}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">📊 Ringkasan</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard label="Total Fitur" value={totalFeatures} />
              <StatCard label="Model Features" value={modelFeatures.length} highlight />
              <StatCard 
                label="RSI" 
                value={indicatorData.data.rsi?.toFixed(1)} 
                color={indicatorData.data.rsi < 30 ? 'green' : indicatorData.data.rsi > 70 ? 'red' : 'white'}
              />
              <StatCard 
                label="MACD Histogram" 
                value={indicatorData.data.macdHistogram?.toFixed(4)} 
                color={indicatorData.data.macdHistogram > 0 ? 'green' : 'red'}
              />
              <StatCard 
                label="Stoch %K" 
                value={indicatorData.data.stochK?.toFixed(1)} 
                color={indicatorData.data.stochK < 20 ? 'green' : indicatorData.data.stochK > 80 ? 'red' : 'white'}
              />
              <StatCard 
                label="ADX" 
                value={indicatorData.data.adx?.toFixed(1)} 
                color={indicatorData.data.adx > 25 ? 'green' : 'yellow'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!indicatorData && !loading && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-12 text-center">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-xl font-semibold text-white mb-2">Lihat Data Indikator Real-time</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Masukkan kode saham dan tanggal untuk melihat semua {totalFeatures}+ indikator teknikal.
            Untuk hari ini, data akan dihitung berdasarkan harga yang sedang berjalan (sebelum market tutup).
          </p>
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg max-w-lg mx-auto">
            <p className="text-sm text-yellow-400">
              💡 <strong>Tip:</strong> Gunakan fitur ini untuk melihat indikator sebelum market tutup,
              lalu gunakan model ML yang sudah di-train untuk memprediksi pergerakan besok pagi.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component
function StatCard({ label, value, color = 'white', highlight = false }) {
  const colorClass = {
    white: 'text-white',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400'
  }[color]

  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-purple-900/30 border border-purple-600/30' : 'bg-gray-700/50'}`}>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`font-bold text-lg ${highlight ? 'text-purple-300' : colorClass}`}>
        {value ?? '-'}
      </p>
    </div>
  )
}
