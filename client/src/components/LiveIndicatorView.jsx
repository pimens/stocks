import { useState, useEffect, useMemo } from 'react'
import { stockApi } from '../services/api'
import StockSelector, { IDX_STOCKS } from './StockSelector'

const ML_API_BASE = import.meta.env.VITE_ML_API_BASE || 'http://localhost:8000'

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
    features: ['macd', 'macdSignal', 'macdHistogram', 'macdBullish', 'macdPositive', 'macdGoldenCross', 'macdDeathCross', 'macdNearGoldenCross', 'macdHistogramConverging', 'macdHistogramRising', 'macdDistanceToSignal', 'deltaMACDHist']
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
  const [selectedModelIds, setSelectedModelIds] = useState([]) // Changed to array for multiple selection
  const [predictions, setPredictions] = useState([]) // Changed to array for multiple predictions
  const [votingResult, setVotingResult] = useState(null) // Voting result
  const [loading, setLoading] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [predictingStatus, setPredictingStatus] = useState('') // Show progress
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
      // Auto-select first model if available
      if (data.models?.length > 0) {
        setSelectedModelIds([data.models[0].id])
      }
    } catch (err) {
      console.error('Failed to fetch trained models:', err)
    }
  }

  // Get selected models
  const selectedModels = useMemo(() => {
    return trainedModels.filter(m => selectedModelIds.includes(m.id))
  }, [trainedModels, selectedModelIds])

  // Get all unique features from selected models
  const allModelFeatures = useMemo(() => {
    const features = new Set()
    selectedModels.forEach(model => {
      model.features?.forEach(f => features.add(f))
    })
    return Array.from(features)
  }, [selectedModels])

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
    setPredictions([])
    setVotingResult(null)

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
    if (selectedModelIds.length === 0) {
      setError('Silakan pilih minimal satu model untuk prediksi')
      return
    }

    setPredicting(true)
    setError(null)
    setPredictions([])
    setVotingResult(null)
    setPredictingStatus('Memulai prediksi...')

    try {
      const allPredictions = []
      const errors = []
      
      // Run prediction for each selected model
      let idx = 0
      for (const modelId of selectedModelIds) {
        idx++
        const model = trainedModels.find(m => m.id === modelId)
        if (!model) {
          console.warn(`Model not found: ${modelId}`)
          continue
        }

        setPredictingStatus(`Prediksi ${idx}/${selectedModelIds.length}: ${model.model_name}...`)

        try {
          console.log(`Predicting with ${model.model_name}, features:`, model.features)
          console.log('Indicator data sample:', Object.fromEntries(
            model.features.map(f => [f, indicatorData.data[f]])
          ))
          
          const response = await fetch(`${ML_API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: [indicatorData.data],
              features: model.features,
              model_id: modelId
            })
          })

          const result = await response.json()
          console.log(`Prediction from ${model.model_name}:`, result)

          if (!response.ok) {
            errors.push(`${model.model_name}: ${result.detail || result.error || 'Unknown error'}`)
            continue
          }

          if (result.predictions?.length > 0) {
            const predValue = result.predictions[0]
            const label = getPredictionLabel(predValue)
            console.log(`Model ${model.model_name}: value=${predValue}, label=${label}`)
            
            allPredictions.push({
              modelId,
              model,
              predictedValue: predValue,
              probabilities: result.probabilities?.[0] || null,
              label: label
            })
          } else {
            errors.push(`${model.model_name}: No predictions returned`)
          }
        } catch (err) {
          console.error(`Prediction error for ${model.model_name}:`, err)
          errors.push(`${model.model_name}: ${err.message}`)
        }
      }

      setPredictingStatus('Menghitung voting...')
      console.log('All predictions:', allPredictions)
      console.log('Errors:', errors)

      if (allPredictions.length === 0) {
        setError(`Tidak ada prediksi yang berhasil. ${errors.length > 0 ? 'Errors: ' + errors.join('; ') : 'Pastikan ML service berjalan di port 8000.'}`)
        setPredictingStatus('')
        return
      }

      setPredictions(allPredictions)

      // Show warning if some predictions failed
      if (errors.length > 0 && allPredictions.length > 0) {
        console.warn(`${errors.length} model(s) failed:`, errors)
      }

      // Calculate voting result
      if (allPredictions.length > 0) {
        const upVotes = allPredictions.filter(p => p.label === 'UP').length
        const downVotes = allPredictions.filter(p => p.label === 'DOWN').length
        const totalVotes = allPredictions.length
        
        // Weighted voting by accuracy
        let weightedUpScore = 0
        let weightedDownScore = 0
        let totalWeight = 0
        
        allPredictions.forEach(p => {
          const weight = p.model.metrics?.accuracy || 0.5
          totalWeight += weight
          if (p.label === 'UP') {
            weightedUpScore += weight
          } else if (p.label === 'DOWN') {
            weightedDownScore += weight
          }
        })

        // Average confidence
        const avgConfidence = allPredictions.reduce((sum, p) => {
          if (p.probabilities) {
            return sum + Math.max(...p.probabilities)
          }
          return sum + 0.5
        }, 0) / allPredictions.length

        setVotingResult({
          totalModels: totalVotes,
          upVotes,
          downVotes,
          upPercent: ((upVotes / totalVotes) * 100).toFixed(1),
          downPercent: ((downVotes / totalVotes) * 100).toFixed(1),
          weightedUpScore: (weightedUpScore / totalWeight * 100).toFixed(1),
          weightedDownScore: (weightedDownScore / totalWeight * 100).toFixed(1),
          consensus: upVotes > downVotes ? 'UP' : downVotes > upVotes ? 'DOWN' : 'TIE',
          weightedConsensus: weightedUpScore > weightedDownScore ? 'UP' : weightedDownScore > weightedUpScore ? 'DOWN' : 'TIE',
          avgConfidence: (avgConfidence * 100).toFixed(1),
          unanimous: upVotes === totalVotes || downVotes === totalVotes
        })
        setPredictingStatus('Selesai!')
        console.log('Voting result set successfully')
      }
    } catch (err) {
      console.error('Prediction error:', err)
      setError(err.message)
    } finally {
      setPredicting(false)
      setTimeout(() => setPredictingStatus(''), 2000) // Clear status after 2s
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
    // Handle null/undefined
    if (value === null || value === undefined) return 'UNKNOWN'
    
    // Convert to string for comparison
    const strValue = String(value).toUpperCase()
    
    // Check for UP variants
    if (value === 1 || strValue === 'UP' || strValue === '1' || strValue === 'TRUE') return 'UP'
    
    // Check for DOWN variants  
    if (value === 0 || strValue === 'DOWN' || strValue === '0' || strValue === 'FALSE') return 'DOWN'
    
    // Check for NEUTRAL
    if (value === -1 || strValue === 'NEUTRAL' || strValue === '-1') return 'NEUTRAL'
    
    // Return raw value if not recognized
    return strValue || 'UNKNOWN'
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
              placeholder="BBCA atau ^JKSE"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 uppercase"
            />
            <StockSelector
              selectedStocks={symbol ? [symbol] : []}
              onSelect={(stocks) => setSymbol(stocks[0] || '')}
              multiple={false}
              showPrices={false}
              compact={true}
            />
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

          {/* Model Selection - Multi Select */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Model Prediksi ({selectedModelIds.length} dipilih)</label>
            {trainedModels.length === 0 ? (
              <div className="text-sm text-yellow-400 bg-yellow-900/20 rounded-lg p-2">
                ⚠️ Belum ada model yang di-train
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-32 overflow-y-auto bg-gray-800 border border-gray-600 rounded-lg p-2 space-y-1">
                  {trainedModels.map(model => (
                    <label 
                      key={model.id} 
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition ${
                        selectedModelIds.includes(model.id) 
                          ? 'bg-purple-900/50 border border-purple-500/50' 
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedModelIds.includes(model.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModelIds([...selectedModelIds, model.id])
                          } else {
                            setSelectedModelIds(selectedModelIds.filter(id => id !== model.id))
                          }
                        }}
                        className="rounded bg-gray-700 border-gray-600 text-purple-600"
                      />
                      <span className="text-white text-sm flex-1 truncate">{model.model_name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        model.metrics.accuracy >= 0.6 ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {(model.metrics.accuracy * 100).toFixed(0)}%
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedModelIds(trainedModels.map(m => m.id))}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                  >
                    Pilih Semua
                  </button>
                  <button
                    onClick={() => setSelectedModelIds([])}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>
            )}
            {selectedModels.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {allModelFeatures.length} fitur unik dari {selectedModels.length} model
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
                disabled={predicting || selectedModelIds.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {predicting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {predictingStatus || 'Predicting...'}
                  </>
                ) : (
                  <>🔮 Prediksi ({selectedModelIds.length} model)</>
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

      {/* Predicting Status */}
      {predicting && predictingStatus && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 text-blue-400 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {predictingStatus}
        </div>
      )}

      {/* Voting Result - Multi Model Prediction */}
      {votingResult && predictions.length > 0 && (
        <div className={`border rounded-xl p-6 ${
          votingResult.weightedConsensus === 'UP' 
            ? 'bg-green-900/30 border-green-500/50' 
            : votingResult.weightedConsensus === 'DOWN'
              ? 'bg-red-900/30 border-red-500/50'
              : 'bg-yellow-900/30 border-yellow-500/50'
        }`}>
          {/* Voting Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                🗳️ Hasil Voting {votingResult.totalModels} Model
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {votingResult.unanimous ? '🎯 Semua model sepakat!' : 'Berdasarkan weighted voting (bobot = accuracy)'}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${
                votingResult.weightedConsensus === 'UP' 
                  ? 'text-green-400' 
                  : votingResult.weightedConsensus === 'DOWN'
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }`}>
                {votingResult.weightedConsensus === 'UP' ? '📈' : 
                 votingResult.weightedConsensus === 'DOWN' ? '📉' : '⚖️'} {votingResult.weightedConsensus}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Avg Confidence: {votingResult.avgConfidence}%
              </div>
            </div>
          </div>

          {/* Voting Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-900/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{votingResult.upVotes}</div>
              <div className="text-sm text-gray-400">Vote UP ({votingResult.upPercent}%)</div>
              <div className="text-xs text-green-400/70">Weighted: {votingResult.weightedUpScore}%</div>
            </div>
            <div className="bg-red-900/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{votingResult.downVotes}</div>
              <div className="text-sm text-gray-400">Vote DOWN ({votingResult.downPercent}%)</div>
              <div className="text-xs text-red-400/70">Weighted: {votingResult.weightedDownScore}%</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white">{votingResult.totalModels}</div>
              <div className="text-sm text-gray-400">Total Model</div>
            </div>
            <div className={`rounded-lg p-4 text-center ${
              votingResult.unanimous ? 'bg-purple-900/30' : 'bg-gray-800/50'
            }`}>
              <div className={`text-3xl font-bold ${votingResult.unanimous ? 'text-purple-400' : 'text-white'}`}>
                {votingResult.unanimous ? '✓' : '~'}
              </div>
              <div className="text-sm text-gray-400">{votingResult.unanimous ? 'Unanimous' : 'Split Vote'}</div>
            </div>
          </div>

          {/* Voting Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-400">📈 UP ({votingResult.weightedUpScore}%)</span>
              <span className="text-red-400">DOWN ({votingResult.weightedDownScore}%) 📉</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
                style={{ width: `${votingResult.weightedUpScore}%` }}
              />
              <div 
                className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all"
                style={{ width: `${votingResult.weightedDownScore}%` }}
              />
            </div>
          </div>

          {/* Individual Model Predictions */}
          <div className="border-t border-gray-600 pt-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              📊 Detail Prediksi per Model
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {predictions.map((pred, idx) => (
                <div 
                  key={pred.modelId}
                  className={`rounded-lg p-3 border ${
                    pred.label === 'UP' 
                      ? 'bg-green-900/20 border-green-500/30' 
                      : pred.label === 'DOWN'
                        ? 'bg-red-900/20 border-red-500/30'
                        : 'bg-yellow-900/20 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm truncate flex-1">
                      {pred.model.model_name}
                    </span>
                    <span className={`text-lg font-bold ${
                      pred.label === 'UP' ? 'text-green-400' : pred.label === 'DOWN' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {pred.label === 'UP' ? '📈' : pred.label === 'DOWN' ? '📉' : '⚖️'} {pred.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Accuracy: {(pred.model.metrics.accuracy * 100).toFixed(1)}%</span>
                    {pred.probabilities && (
                      <span>Confidence: {(Math.max(...pred.probabilities) * 100).toFixed(1)}%</span>
                    )}
                  </div>
                  {pred.probabilities && (
                    <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-red-500"
                        style={{ width: `${pred.probabilities[0] * 100}%` }}
                      />
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${pred.probabilities[1] * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Recommendation */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400">
              💡 <strong>Rekomendasi:</strong> Berdasarkan voting {votingResult.totalModels} model dengan weighted score,{' '}
              {votingResult.unanimous ? (
                <span className="text-purple-400">semua model sepakat </span>
              ) : (
                <span>{votingResult.upVotes > votingResult.downVotes ? 'mayoritas' : 'mayoritas'} model ({Math.max(votingResult.upVotes, votingResult.downVotes)}/{votingResult.totalModels}) memprediksi </span>
              )}
              harga saham {symbol} akan{' '}
              <span className={
                votingResult.weightedConsensus === 'UP' 
                  ? 'text-green-400' 
                  : votingResult.weightedConsensus === 'DOWN'
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }>
                {votingResult.weightedConsensus === 'UP' ? 'NAIK' : 
                 votingResult.weightedConsensus === 'DOWN' ? 'TURUN' : 'TIDAK JELAS'}
              </span>{' '}
              besok.
              {votingResult.unanimous && ' (High confidence - all models agree!)'}
            </p>
          </div>

          {/* Verification with actual data - for past dates */}
          {indicatorData?.data?.actualData && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>📋</span> Verifikasi dengan Data Aktual
                <span className="text-xs text-gray-500 font-normal">(Tanggal sudah lewat)</span>
              </h4>
              {(() => {
                const actualChange = indicatorData.data.actualData.priceChangePercent
                const actualClose = indicatorData.data.actualData.close
                const prevClose = indicatorData.data.prevClose
                
                const actualDirection = actualChange > 0 ? 'UP' : actualChange < 0 ? 'DOWN' : 'NEUTRAL'
                const predictedDirection = votingResult.weightedConsensus
                
                const isCorrect = (predictedDirection === 'UP' && actualChange > 0) || 
                                 (predictedDirection === 'DOWN' && actualChange < 0)
                const isNeutral = actualChange === 0

                // Count correct models
                const correctModels = predictions.filter(p => 
                  (p.label === 'UP' && actualChange > 0) || (p.label === 'DOWN' && actualChange < 0)
                ).length
                
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-800/50 rounded p-3">
                        <p className="text-gray-400 text-xs">Harga H-1</p>
                        <p className="text-white font-medium">Rp {prevClose?.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded p-3">
                        <p className="text-gray-400 text-xs">Harga Aktual (H)</p>
                        <p className="text-white font-medium">Rp {actualClose?.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded p-3">
                        <p className="text-gray-400 text-xs">Perubahan</p>
                        <p className={`font-bold ${actualChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {actualChange >= 0 ? '+' : ''}{actualChange.toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded p-3">
                        <p className="text-gray-400 text-xs">Model Benar</p>
                        <p className="text-white font-bold">{correctModels}/{predictions.length}</p>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${
                      isNeutral 
                        ? 'bg-yellow-900/30 border-yellow-500/50' 
                        : isCorrect 
                          ? 'bg-green-900/30 border-green-500/50' 
                          : 'bg-red-900/30 border-red-500/50'
                    }`}>
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">
                          {isNeutral ? '🤷' : isCorrect ? '✅' : '❌'}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Voting:</span>
                              <span className={`font-bold text-lg ${
                                predictedDirection === 'UP' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {predictedDirection === 'UP' ? '📈' : '📉'} {predictedDirection}
                              </span>
                            </div>
                            <span className="text-gray-500">vs</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Aktual:</span>
                              <span className={`font-bold text-lg ${actualChange > 0 ? 'text-green-400' : actualChange < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {actualDirection === 'UP' ? '📈' : actualDirection === 'DOWN' ? '📉' : '➡️'} {actualDirection}
                              </span>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${
                            isNeutral ? 'text-yellow-400' : isCorrect ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {isNeutral 
                              ? '⚠️ Harga tidak berubah (FLAT)' 
                              : isCorrect 
                                ? `🎉 Voting BENAR! (${correctModels}/${predictions.length} model benar)` 
                                : `😞 Voting SALAH (${correctModels}/${predictions.length} model benar)`}
                          </p>
                        </div>
                        {!isNeutral && (
                          <div className={`text-6xl font-black ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {isCorrect ? '👍' : '👎'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
          
          {/* Info for future dates */}
          {!indicatorData?.data?.actualData && indicatorData?.data?.isFutureDate && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-500/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔮</span>
                  <div>
                    <p className="text-blue-300 font-medium">Prediksi untuk tanggal yang akan datang</p>
                    <p className="text-sm text-gray-400">
                      Verifikasi akan tersedia setelah tanggal {formatDate(indicatorData?.data?.targetDate)} berlalu
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
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

          {/* Actual Data Card - Show when date is in the past */}
          {indicatorData.data.actualData && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span>📈</span> Data Aktual Hari H
                <span className="text-xs text-gray-500 font-normal">({formatDate(indicatorData.data.targetDate)})</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Open</p>
                  <p className="text-white font-medium">Rp {indicatorData.data.actualData.open?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs">High</p>
                  <p className="text-green-400 font-medium">Rp {indicatorData.data.actualData.high?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Low</p>
                  <p className="text-red-400 font-medium">Rp {indicatorData.data.actualData.low?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Close</p>
                  <p className="text-white font-bold">Rp {indicatorData.data.actualData.close?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Change</p>
                  <p className={`font-bold ${indicatorData.data.actualData.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicatorData.data.actualData.priceChange >= 0 ? '+' : ''}{indicatorData.data.actualData.priceChange?.toFixed(0)}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Change %</p>
                  <p className={`font-bold text-lg ${indicatorData.data.actualData.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicatorData.data.actualData.priceChangePercent >= 0 ? '+' : ''}{indicatorData.data.actualData.priceChangePercent?.toFixed(2)}%
                  </p>
                </div>
                <div className={`rounded p-3 ${
                  indicatorData.data.actualData.priceChangePercent > 0 
                    ? 'bg-green-900/30 border border-green-500/30' 
                    : indicatorData.data.actualData.priceChangePercent < 0 
                      ? 'bg-red-900/30 border border-red-500/30' 
                      : 'bg-yellow-900/30 border border-yellow-500/30'
                }`}>
                  <p className="text-gray-400 text-xs">Arah</p>
                  <p className={`font-bold text-lg ${
                    indicatorData.data.actualData.priceChangePercent > 0 
                      ? 'text-green-400' 
                      : indicatorData.data.actualData.priceChangePercent < 0 
                        ? 'text-red-400' 
                        : 'text-yellow-400'
                  }`}>
                    {indicatorData.data.actualData.priceChangePercent > 0 
                      ? '📈 UP' 
                      : indicatorData.data.actualData.priceChangePercent < 0 
                        ? '📉 DOWN' 
                        : '➡️ FLAT'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                💡 Data aktual tersedia karena tanggal yang dipilih sudah lewat. Gunakan untuk verifikasi prediksi model.
              </p>
            </div>
          )}

          {/* Model Features Quick View - Multi Model */}
          {selectedModels.length > 0 && allModelFeatures.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                🎯 Fitur yang Digunakan ({allModelFeatures.length} fitur unik)
                <span className="text-xs text-gray-500 font-normal">
                  - {selectedModels.length} model: {selectedModels.map(m => m.model_name).join(', ')}
                </span>
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {allModelFeatures.map(feature => {
                  // Count how many models use this feature
                  const modelCount = selectedModels.filter(m => m.features?.includes(feature)).length
                  return (
                    <div 
                      key={feature} 
                      className={`rounded px-2 py-1.5 border ${
                        modelCount === selectedModels.length 
                          ? 'bg-purple-800/50 border-purple-500/50' 
                          : 'bg-purple-800/30 border-purple-600/30'
                      }`}
                    >
                      <p className="text-purple-300 text-xs truncate" title={feature}>
                        {feature} {modelCount < selectedModels.length && <span className="text-gray-500">({modelCount})</span>}
                      </p>
                      <div className="text-sm font-medium">
                        {formatValue(indicatorData.data[feature], feature)}
                      </div>
                    </div>
                  )
                })}
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
                        const isModelFeature = allModelFeatures.includes(feature)
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
                        const isModelFeature = allModelFeatures.includes(feature)
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
                    const isModelFeature = allModelFeatures.includes(feature)
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
              <StatCard label="Model Features" value={allModelFeatures.length} highlight />
              <StatCard 
                label="RSI" 
                value={indicatorData.data.rsi != null ? indicatorData.data.rsi.toFixed(1) : '-'} 
                color={indicatorData.data.rsi != null ? (indicatorData.data.rsi < 30 ? 'green' : indicatorData.data.rsi > 70 ? 'red' : 'white') : 'white'}
              />
              <StatCard 
                label="MACD Histogram" 
                value={indicatorData.data.macdHistogram != null ? indicatorData.data.macdHistogram.toFixed(4) : '-'} 
                color={indicatorData.data.macdHistogram != null ? (indicatorData.data.macdHistogram > 0 ? 'green' : 'red') : 'white'}
              />
              <StatCard 
                label="Stoch %K" 
                value={indicatorData.data.stochK != null ? indicatorData.data.stochK.toFixed(1) : '-'} 
                color={indicatorData.data.stochK != null ? (indicatorData.data.stochK < 20 ? 'green' : indicatorData.data.stochK > 80 ? 'red' : 'white') : 'white'}
              />
              <StatCard 
                label="ADX" 
                value={indicatorData.data.adx != null ? indicatorData.data.adx.toFixed(1) : '-'} 
                color={indicatorData.data.adx != null ? (indicatorData.data.adx > 25 ? 'green' : 'yellow') : 'white'}
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
