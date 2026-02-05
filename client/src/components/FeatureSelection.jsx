import { useState, useMemo, useEffect } from 'react'
import { stockApi } from '../services/api'
import StockSelector from './StockSelector'

// ML Service base URL
const ML_API_BASE = import.meta.env.VITE_ML_API_BASE || 'http://localhost:8000'

// All available features (excluding basic info columns)
const ALL_FEATURES = {
  // ML-Friendly Features
  closePosition: { label: 'Close Position', group: 'mlfeatures', desc: '(close-low)/(high-low), 0-1 scale' },
  bodyRangeRatio: { label: 'Body/Range Ratio', group: 'mlfeatures', desc: 'abs(close-open)/(high-low)' },
  upperWickRatio: { label: 'Upper Wick Ratio', group: 'mlfeatures', desc: 'Upper wick / range' },
  lowerWickRatio: { label: 'Lower Wick Ratio', group: 'mlfeatures', desc: 'Lower wick / range' },
  distFromSMA5: { label: 'Dist from SMA5 %', group: 'mlfeatures', desc: 'Jarak dari SMA5 dalam %' },
  distFromSMA20: { label: 'Dist from SMA20 %', group: 'mlfeatures', desc: 'Jarak dari SMA20 dalam %' },
  distFromSMA50: { label: 'Dist from SMA50 %', group: 'mlfeatures', desc: 'Jarak dari SMA50 dalam %' },

  // Delta/Change Indicators
  deltaRSI: { label: 'ΔRSI', group: 'delta', desc: 'Perubahan RSI dari hari sebelumnya' },
  deltaMACDHist: { label: 'ΔMACD Hist', group: 'delta', desc: 'Perubahan MACD Histogram (slope)' },
  deltaStochK: { label: 'ΔStoch %K', group: 'delta', desc: 'Perubahan Stochastic %K' },
  deltaADX: { label: 'ΔADX', group: 'delta', desc: 'Perubahan ADX' },
  deltaCCI: { label: 'ΔCCI', group: 'delta', desc: 'Perubahan CCI' },
  deltaMFI: { label: 'ΔMFI', group: 'delta', desc: 'Perubahan MFI' },

  // SMA
  sma5: { label: 'SMA 5', group: 'sma', desc: 'Simple Moving Average 5 hari' },
  sma10: { label: 'SMA 10', group: 'sma', desc: 'Simple Moving Average 10 hari' },
  sma20: { label: 'SMA 20', group: 'sma', desc: 'Simple Moving Average 20 hari' },
  sma50: { label: 'SMA 50', group: 'sma', desc: 'Simple Moving Average 50 hari' },
  priceAboveSMA5: { label: 'Price > SMA5', group: 'sma', desc: '1 jika close > SMA5' },
  priceAboveSMA10: { label: 'Price > SMA10', group: 'sma', desc: '1 jika close > SMA10' },
  priceAboveSMA20: { label: 'Price > SMA20', group: 'sma', desc: '1 jika close > SMA20' },
  priceAboveSMA50: { label: 'Price > SMA50', group: 'sma', desc: '1 jika close > SMA50' },
  sma5AboveSMA10: { label: 'SMA5 > SMA10', group: 'sma', desc: '1 jika SMA5 > SMA10' },
  sma10AboveSMA20: { label: 'SMA10 > SMA20', group: 'sma', desc: '1 jika SMA10 > SMA20' },
  sma20AboveSMA50: { label: 'SMA20 > SMA50', group: 'sma', desc: '1 jika SMA20 > SMA50' },

  // EMA
  ema5: { label: 'EMA 5', group: 'ema', desc: 'Exponential Moving Average 5 hari' },
  ema10: { label: 'EMA 10', group: 'ema', desc: 'Exponential Moving Average 10 hari' },
  ema12: { label: 'EMA 12', group: 'ema', desc: 'Exponential Moving Average 12 hari' },
  ema26: { label: 'EMA 26', group: 'ema', desc: 'Exponential Moving Average 26 hari' },
  priceAboveEMA12: { label: 'Price > EMA12', group: 'ema', desc: '1 jika close > EMA12' },
  priceAboveEMA26: { label: 'Price > EMA26', group: 'ema', desc: '1 jika close > EMA26' },

  // RSI
  rsi: { label: 'RSI', group: 'rsi', desc: 'Relative Strength Index (14)' },
  rsiOversold: { label: 'RSI Oversold', group: 'rsi', desc: '1 jika RSI < 30' },
  rsiOverbought: { label: 'RSI Overbought', group: 'rsi', desc: '1 jika RSI > 70' },
  rsiNeutral: { label: 'RSI Neutral', group: 'rsi', desc: '1 jika 30 <= RSI <= 70' },

  // MACD
  macd: { label: 'MACD', group: 'macd', desc: 'MACD line' },
  macdSignal: { label: 'MACD Signal', group: 'macd', desc: 'Signal line' },
  macdHistogram: { label: 'MACD Histogram', group: 'macd', desc: 'Histogram (MACD - Signal)' },
  macdBullish: { label: 'MACD Bullish', group: 'macd', desc: '1 jika MACD > Signal' },
  macdPositive: { label: 'MACD Positive', group: 'macd', desc: '1 jika MACD > 0' },

  // Bollinger Bands
  bbUpper: { label: 'BB Upper', group: 'bollinger', desc: 'Bollinger Band atas' },
  bbMiddle: { label: 'BB Middle', group: 'bollinger', desc: 'Bollinger Band tengah (SMA20)' },
  bbLower: { label: 'BB Lower', group: 'bollinger', desc: 'Bollinger Band bawah' },
  bbWidth: { label: 'BB Width %', group: 'bollinger', desc: 'Lebar BB dalam persen' },
  priceBelowLowerBB: { label: 'Price < Lower BB', group: 'bollinger', desc: '1 jika close < BB bawah' },
  priceAboveUpperBB: { label: 'Price > Upper BB', group: 'bollinger', desc: '1 jika close > BB atas' },

  // Stochastic
  stochK: { label: 'Stochastic %K', group: 'stochastic', desc: 'Stochastic %K' },
  stochD: { label: 'Stochastic %D', group: 'stochastic', desc: 'Stochastic %D (signal)' },
  stochOversold: { label: 'Stoch Oversold', group: 'stochastic', desc: '1 jika %K < 20' },
  stochOverbought: { label: 'Stoch Overbought', group: 'stochastic', desc: '1 jika %K > 80' },
  stochBullishCross: { label: 'Stoch Bullish Cross', group: 'stochastic', desc: '1 jika %K > %D' },

  // ADX/DMI
  adx: { label: 'ADX', group: 'adx', desc: 'Average Directional Index' },
  pdi: { label: '+DI', group: 'adx', desc: 'Plus Directional Indicator' },
  mdi: { label: '-DI', group: 'adx', desc: 'Minus Directional Indicator' },
  strongTrend: { label: 'Strong Trend', group: 'adx', desc: '1 jika ADX > 25' },
  bullishDI: { label: 'Bullish DI', group: 'adx', desc: '1 jika +DI > -DI' },

  // Volatility
  atr: { label: 'ATR', group: 'volatility', desc: 'Average True Range (14)' },
  atrPercent: { label: 'ATR %', group: 'volatility', desc: 'ATR sebagai % dari harga' },

  // Volume
  obv: { label: 'OBV', group: 'volume', desc: 'On Balance Volume' },
  obvChange: { label: 'OBV Change', group: 'volume', desc: 'Perubahan OBV dari hari sebelumnya' },
  obvTrend: { label: 'OBV Trend', group: 'volume', desc: 'Tren OBV: 1=naik, -1=turun, 0=tetap' },
  volumeRatio: { label: 'Volume Ratio', group: 'volume', desc: 'Volume / Avg Volume (20)' },
  highVolume: { label: 'High Volume', group: 'volume', desc: '1 jika volume > 1.5x rata-rata' },

  // Williams %R
  williamsR: { label: 'Williams %R', group: 'williams', desc: 'Williams %R (14)' },
  williamsROversold: { label: 'Williams Oversold', group: 'williams', desc: '1 jika %R < -80' },
  williamsROverbought: { label: 'Williams Overbought', group: 'williams', desc: '1 jika %R > -20' },

  // CCI
  cci: { label: 'CCI', group: 'cci', desc: 'Commodity Channel Index (20)' },
  cciOversold: { label: 'CCI Oversold', group: 'cci', desc: '1 jika CCI < -100' },
  cciOverbought: { label: 'CCI Overbought', group: 'cci', desc: '1 jika CCI > 100' },

  // MFI
  mfi: { label: 'MFI', group: 'mfi', desc: 'Money Flow Index (14)' },
  mfiOversold: { label: 'MFI Oversold', group: 'mfi', desc: '1 jika MFI < 20' },
  mfiOverbought: { label: 'MFI Overbought', group: 'mfi', desc: '1 jika MFI > 80' },

  // ROC & Momentum
  roc: { label: 'ROC', group: 'momentum', desc: 'Rate of Change (12)' },
  rocPositive: { label: 'ROC Positive', group: 'momentum', desc: '1 jika ROC > 0' },
  momentum: { label: 'Momentum', group: 'momentum', desc: 'Price Momentum (10)' },
  momentumPositive: { label: 'Momentum Positive', group: 'momentum', desc: '1 jika Momentum > 0' },
  pricePosition: { label: 'Price Position', group: 'momentum', desc: 'Posisi harga dalam range 20 hari (0-100)' },

  // Candlestick
  bodySize: { label: 'Body Size', group: 'candlestick', desc: 'Ukuran body candle' },
  upperWick: { label: 'Upper Wick', group: 'candlestick', desc: 'Sumbu atas candle' },
  lowerWick: { label: 'Lower Wick', group: 'candlestick', desc: 'Sumbu bawah candle' },
  isBullishCandle: { label: 'Bullish Candle', group: 'candlestick', desc: '1 jika close > open' },
  isDoji: { label: 'Doji', group: 'candlestick', desc: '1 jika body < 10% range' },
  gapUp: { label: 'Gap Up', group: 'candlestick', desc: '1 jika open > prev close' },
  gapDown: { label: 'Gap Down', group: 'candlestick', desc: '1 jika open < prev close' },

  // Returns
  return1d: { label: 'Return 1D', group: 'returns', desc: 'Return 1 hari sebelumnya (%)' },
  return3d: { label: 'Return 3D', group: 'returns', desc: 'Return 3 hari sebelumnya (%)' },
  return5d: { label: 'Return 5D', group: 'returns', desc: 'Return 5 hari sebelumnya (%)' },

  // Price Data
  prevClose: { label: 'Prev Close', group: 'price', desc: 'Harga close H-1' },
  prevOpen: { label: 'Prev Open', group: 'price', desc: 'Harga open H-1' },
  prevHigh: { label: 'Prev High', group: 'price', desc: 'Harga high H-1' },
  prevLow: { label: 'Prev Low', group: 'price', desc: 'Harga low H-1' },
  prevVolume: { label: 'Prev Volume', group: 'price', desc: 'Volume H-1' },
}

// Group definitions
const FEATURE_GROUPS = {
  mlfeatures: { label: '🤖 ML Features', color: 'fuchsia' },
  delta: { label: '📐 Delta/Change', color: 'cyan' },
  sma: { label: '📈 SMA', color: 'green' },
  ema: { label: '📉 EMA', color: 'teal' },
  rsi: { label: '🔄 RSI', color: 'yellow' },
  macd: { label: '📶 MACD', color: 'purple' },
  bollinger: { label: '🎯 Bollinger Bands', color: 'pink' },
  stochastic: { label: '⚡ Stochastic', color: 'orange' },
  adx: { label: '💪 ADX/DMI', color: 'red' },
  volatility: { label: '📊 Volatility', color: 'indigo' },
  volume: { label: '📦 Volume', color: 'cyan' },
  williams: { label: '〰️ Williams %R', color: 'lime' },
  cci: { label: '🌊 CCI', color: 'amber' },
  mfi: { label: '💰 MFI', color: 'emerald' },
  momentum: { label: '🚀 Momentum', color: 'violet' },
  candlestick: { label: '🕯️ Candlestick', color: 'rose' },
  returns: { label: '📆 Returns', color: 'sky' },
  price: { label: '💵 Price Data', color: 'gray' },
}

const AVAILABLE_MODELS = [
  { value: 'random_forest', label: 'Random Forest', icon: '🌲' },
  { value: 'xgboost', label: 'XGBoost', icon: '🚀' },
  { value: 'lightgbm', label: 'LightGBM', icon: '💡' },
  { value: 'gradient_boosting', label: 'Gradient Boosting', icon: '📈' },
  { value: 'logistic_regression', label: 'Logistic Regression', icon: '📊' },
]

export default function FeatureSelection() {
  // Data fetching state
  const [selectedStocks, setSelectedStocks] = useState(['BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM'])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  // Threshold settings
  const [upThreshold, setUpThreshold] = useState(1.0)
  const [downThreshold, setDownThreshold] = useState(-0.5)
  const [includeNeutral, setIncludeNeutral] = useState(false)

  // Feature selection state
  const [selectedFeatures, setSelectedFeatures] = useState(new Set(Object.keys(ALL_FEATURES)))
  const [expandedGroups, setExpandedGroups] = useState(new Set(['mlfeatures', 'delta', 'rsi']))

  // Model selection
  const [selectedModel, setSelectedModel] = useState('random_forest')

  // Feature selection process state
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [selectionResults, setSelectionResults] = useState([])
  const [bestResult, setBestResult] = useState(null)
  const [currentFeatures, setCurrentFeatures] = useState([])
  const [remainingFeatures, setRemainingFeatures] = useState([])
  const [selectionLog, setSelectionLog] = useState([])

  // Saved model state
  const [modelName, setModelName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedModelId, setSavedModelId] = useState(null)

  // Get default dates
  const getDefaultDates = () => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 6)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  // Feature group helpers
  const getFeaturesByGroup = (group) => {
    return Object.entries(ALL_FEATURES)
      .filter(([_, val]) => val.group === group)
      .map(([key, _]) => key)
  }

  const isGroupFullySelected = (group) => {
    const groupFeatures = getFeaturesByGroup(group)
    return groupFeatures.every(f => selectedFeatures.has(f))
  }

  const isGroupPartiallySelected = (group) => {
    const groupFeatures = getFeaturesByGroup(group)
    const selectedCount = groupFeatures.filter(f => selectedFeatures.has(f)).length
    return selectedCount > 0 && selectedCount < groupFeatures.length
  }

  const toggleFeature = (feature) => {
    setSelectedFeatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(feature)) {
        newSet.delete(feature)
      } else {
        newSet.add(feature)
      }
      return newSet
    })
  }

  const toggleGroup = (group) => {
    const groupFeatures = getFeaturesByGroup(group)
    const allSelected = isGroupFullySelected(group)

    setSelectedFeatures(prev => {
      const newSet = new Set(prev)
      if (allSelected) {
        groupFeatures.forEach(f => newSet.delete(f))
      } else {
        groupFeatures.forEach(f => newSet.add(f))
      }
      return newSet
    })
  }

  const toggleGroupExpansion = (group) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  // Fetch regression data
  const handleFetchData = async () => {
    if (selectedStocks.length === 0) {
      setError('Silakan pilih minimal satu saham')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await stockApi.getRegressionData(
        selectedStocks,
        startDate || getDefaultDates().start,
        endDate || getDefaultDates().end,
        { upThreshold, downThreshold, includeNeutral }
      )
      setData(result)
      // Reset selection results when new data is fetched
      setSelectionResults([])
      setBestResult(null)
      setCurrentFeatures([])
      setRemainingFeatures([])
      setSelectionLog([])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  // Train model with specific features
  const trainWithFeatures = async (features) => {
    const response = await fetch(`${ML_API_BASE}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: data.data,
        features: features,
        target: 'target',
        model_type: selectedModel,
        test_size: 0.2
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || 'Training failed')
    }

    return await response.json()
  }

  // Run greedy forward feature selection
  const runFeatureSelection = async () => {
    if (!data?.data || data.data.length === 0) {
      setError('Silakan ambil data terlebih dahulu')
      return
    }

    const featuresToTest = Array.from(selectedFeatures)
    if (featuresToTest.length === 0) {
      setError('Silakan pilih minimal satu fitur')
      return
    }

    setIsRunning(true)
    setIsPaused(false)
    setError(null)
    setSelectionResults([])
    setBestResult(null)
    setCurrentFeatures([])
    setRemainingFeatures([...featuresToTest])
    setSelectionLog([])
    setCurrentStep(0)
    setTotalSteps(featuresToTest.length)

    const results = []
    let currentBest = { accuracy: 0, features: [], metrics: null }
    let selected = []
    let remaining = [...featuresToTest]

    const addLog = (message, type = 'info') => {
      setSelectionLog(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }])
    }

    addLog(`🚀 Memulai Forward Feature Selection dengan ${featuresToTest.length} fitur`, 'start')
    addLog(`📊 Model: ${AVAILABLE_MODELS.find(m => m.value === selectedModel)?.label}`, 'info')

    try {
      for (let step = 0; step < featuresToTest.length; step++) {
        if (isPaused) {
          addLog('⏸️ Proses dijeda', 'warning')
          break
        }

        setCurrentStep(step + 1)
        addLog(`\n📍 Step ${step + 1}/${featuresToTest.length}: Mencari fitur terbaik berikutnya...`, 'step')

        let bestFeatureThisRound = null
        let bestAccuracyThisRound = currentBest.accuracy
        let bestMetricsThisRound = null
        let bestModelIdThisRound = null

        // Try adding each remaining feature
        for (const feature of remaining) {
          const testFeatures = [...selected, feature]
          
          try {
            addLog(`  Testing: +${feature} (total: ${testFeatures.length})`, 'test')
            const result = await trainWithFeatures(testFeatures)
            const accuracy = result.metrics.accuracy

            if (accuracy > bestAccuracyThisRound) {
              bestAccuracyThisRound = accuracy
              bestFeatureThisRound = feature
              bestMetricsThisRound = result.metrics
              bestModelIdThisRound = result.model_id
              addLog(`    ✨ Accuracy: ${(accuracy * 100).toFixed(2)}% (NEW BEST!)`, 'success')
            } else {
              addLog(`    📊 Accuracy: ${(accuracy * 100).toFixed(2)}%`, 'info')
            }
          } catch (err) {
            addLog(`    ❌ Error: ${err.message}`, 'error')
          }
        }

        if (bestFeatureThisRound) {
          // Add the best feature
          selected.push(bestFeatureThisRound)
          remaining = remaining.filter(f => f !== bestFeatureThisRound)
          
          const stepResult = {
            step: step + 1,
            addedFeature: bestFeatureThisRound,
            features: [...selected],
            accuracy: bestAccuracyThisRound,
            metrics: bestMetricsThisRound,
            modelId: bestModelIdThisRound,
            improvement: bestAccuracyThisRound - currentBest.accuracy
          }
          
          results.push(stepResult)
          setSelectionResults([...results])
          setCurrentFeatures([...selected])
          setRemainingFeatures([...remaining])

          addLog(`\n✅ Step ${step + 1} selesai: Menambah "${bestFeatureThisRound}"`, 'success')
          addLog(`   Akurasi: ${(bestAccuracyThisRound * 100).toFixed(2)}% (+${((bestAccuracyThisRound - currentBest.accuracy) * 100).toFixed(2)}%)`, 'success')

          // Update current best if improved
          if (bestAccuracyThisRound > currentBest.accuracy) {
            currentBest = {
              accuracy: bestAccuracyThisRound,
              features: [...selected],
              metrics: bestMetricsThisRound,
              modelId: bestModelIdThisRound,
              step: step + 1
            }
            setBestResult({ ...currentBest })
          }
        } else {
          addLog(`\n⚠️ Tidak ada fitur yang meningkatkan akurasi, berhenti.`, 'warning')
          break
        }
      }

      addLog(`\n🏆 Feature Selection selesai!`, 'complete')
      addLog(`📊 Best Accuracy: ${(currentBest.accuracy * 100).toFixed(2)}%`, 'complete')
      addLog(`🎯 Best Features (${currentBest.features.length}): ${currentBest.features.join(', ')}`, 'complete')

    } catch (err) {
      setError(err.message)
      addLog(`❌ Error: ${err.message}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  // Stop/Pause feature selection
  const stopFeatureSelection = () => {
    setIsPaused(true)
    setIsRunning(false)
  }

  // Save the best model
  const saveBestModel = async () => {
    if (!bestResult || !bestResult.modelId) {
      setError('Tidak ada model terbaik untuk disimpan')
      return
    }

    if (!modelName.trim()) {
      setError('Silakan masukkan nama model')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Re-train with the best features and save
      const response = await fetch(`${ML_API_BASE}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: data.data,
          features: bestResult.features,
          target: 'target',
          model_type: selectedModel,
          test_size: 0.2,
          model_name: modelName.trim()
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Saving failed')
      }

      const result = await response.json()
      setSavedModelId(result.model_id)
      setSelectionLog(prev => [...prev, { 
        message: `💾 Model "${modelName}" berhasil disimpan dengan ID: ${result.model_id}`, 
        type: 'complete',
        time: new Date().toLocaleTimeString()
      }])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Progress percentage
  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-green-400 mb-2">🔬 Greedy Feature Selection</h2>
        <p className="text-gray-400">
          Cari kombinasi fitur terbaik secara otomatis menggunakan Forward Feature Selection.
          Fitur akan ditambahkan satu per satu, memilih yang memberikan akurasi tertinggi di setiap langkah.
        </p>
      </div>

      {/* Stock Selection - Using StockSelector (no IHSG) */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">1. Pilih Saham untuk Training</h3>
        <StockSelector
          selectedStocks={selectedStocks}
          onSelect={setSelectedStocks}
          multiple={true}
          showPrices={true}
          excludeIndex={true}
        />
      </div>

      {/* Date Range & Threshold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">2. Rentang Tanggal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">3. Threshold Target</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-green-400 mb-2">UP ≥</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={upThreshold}
                  onChange={(e) => setUpThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                />
                <span className="text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-red-400 mb-2">DOWN ≤</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={downThreshold}
                  onChange={(e) => setDownThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                />
                <span className="text-gray-400">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">4. Pilih Model ML</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {AVAILABLE_MODELS.map(model => (
            <button
              key={model.value}
              onClick={() => setSelectedModel(model.value)}
              className={`p-4 rounded-lg border transition ${
                selectedModel === model.value
                  ? 'bg-green-900/50 border-green-500 text-green-300'
                  : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <span className="text-2xl block mb-1">{model.icon}</span>
              <span className="text-sm">{model.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Selection */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">5. Pilih Fitur Kandidat ({selectedFeatures.size} terpilih)</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFeatures(new Set(Object.keys(ALL_FEATURES)))}
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition"
            >
              Pilih Semua
            </button>
            <button
              onClick={() => setSelectedFeatures(new Set())}
              className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition"
            >
              Hapus Semua
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {Object.entries(FEATURE_GROUPS).map(([groupKey, groupInfo]) => {
            const groupFeatures = getFeaturesByGroup(groupKey)
            if (groupFeatures.length === 0) return null

            const isExpanded = expandedGroups.has(groupKey)
            const isFullySelected = isGroupFullySelected(groupKey)
            const isPartiallySelected = isGroupPartiallySelected(groupKey)
            const selectedInGroup = groupFeatures.filter(f => selectedFeatures.has(f)).length

            return (
              <div key={groupKey} className="border border-gray-600 rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 cursor-pointer hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={isFullySelected}
                    ref={el => { if (el) el.indeterminate = isPartiallySelected }}
                    onChange={() => toggleGroup(groupKey)}
                    className="w-4 h-4 rounded border-gray-500 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1 flex items-center gap-2" onClick={() => toggleGroupExpansion(groupKey)}>
                    <span className="font-medium text-white">{groupInfo.label}</span>
                    <span className="text-sm text-gray-400">({selectedInGroup}/{groupFeatures.length})</span>
                  </div>
                  <button onClick={() => toggleGroupExpansion(groupKey)} className="p-1 hover:bg-gray-600 rounded">
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-gray-800/30 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {groupFeatures.map(feature => (
                      <label key={feature} className="flex items-start gap-2 p-2 rounded hover:bg-gray-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.has(feature)}
                          onChange={() => toggleFeature(feature)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-500 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white block">{ALL_FEATURES[feature].label}</span>
                          <span className="text-xs text-gray-500 block truncate">{ALL_FEATURES[feature].desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleFetchData}
          disabled={loading || selectedStocks.length === 0}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </>
          ) : (
            <>📊 Ambil Data</>
          )}
        </button>

        {data && (
          <button
            onClick={isRunning ? stopFeatureSelection : runFeatureSelection}
            disabled={loading || selectedFeatures.size === 0}
            className={`px-6 py-3 font-semibold rounded-lg transition flex items-center gap-2 ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white'
            }`}
          >
            {isRunning ? (
              <>⏹️ Stop</>
            ) : (
              <>🔬 Mulai Feature Selection</>
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Training Data Summary */}
      {data && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">📊 Data Training</h4>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <span className="text-gray-400 text-xs block">Total Records</span>
              <span className="text-xl font-bold text-white">{data.summary.totalRecords.toLocaleString()}</span>
            </div>
            <div className="bg-green-900/30 rounded-lg p-3">
              <span className="text-gray-400 text-xs block">UP (1)</span>
              <span className="text-xl font-bold text-green-400">{data.summary.targetDistribution.up.toLocaleString()}</span>
              <span className="text-xs text-green-400/70 ml-1">({data.summary.targetDistribution.upPercent}%)</span>
            </div>
            <div className="bg-red-900/30 rounded-lg p-3">
              <span className="text-gray-400 text-xs block">DOWN (0)</span>
              <span className="text-xl font-bold text-red-400">{data.summary.targetDistribution.down.toLocaleString()}</span>
              <span className="text-xs text-red-400/70 ml-1">({data.summary.targetDistribution.downPercent}%)</span>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <span className="text-gray-400 text-xs block">Saham</span>
              <span className="text-xl font-bold text-white">{data.summary.symbolsProcessed}</span>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <span className="text-gray-400 text-xs block">Fitur Kandidat</span>
              <span className="text-xl font-bold text-purple-400">{selectedFeatures.size}</span>
            </div>
          </div>

          {/* Date Range & Threshold Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <span className="text-gray-400 text-sm block mb-1">📅 Rentang Tanggal</span>
              <span className="text-white">{data.summary.dateRange.start} s/d {data.summary.dateRange.end}</span>
            </div>
            {data.summary.thresholds && (
              <div className="bg-gray-900/50 rounded-lg p-3">
                <span className="text-gray-400 text-sm block mb-1">🎯 Threshold</span>
                <span className="text-green-400">UP ≥{data.summary.thresholds.upThreshold}%</span>
                <span className="text-gray-500 mx-2">|</span>
                <span className="text-red-400">DOWN ≤{data.summary.thresholds.downThreshold}%</span>
              </div>
            )}
          </div>

          {/* Stocks Used */}
          <div className="bg-gray-900/50 rounded-lg p-3">
            <span className="text-gray-400 text-sm block mb-2">📈 Saham yang Digunakan</span>
            <div className="flex flex-wrap gap-1">
              {selectedStocks.map(stock => (
                <span key={stock} className="px-2 py-0.5 text-xs bg-blue-900/50 text-blue-300 rounded">
                  {stock}
                </span>
              ))}
            </div>
          </div>

          {/* Sample Data Preview */}
          {data.data && data.data.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">📋 Contoh Data (5 baris pertama)</span>
              </div>
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-gray-900/80 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-gray-400">Symbol</th>
                      <th className="px-2 py-1.5 text-left text-gray-400">Date</th>
                      <th className="px-2 py-1.5 text-right text-gray-400">Target</th>
                      <th className="px-2 py-1.5 text-right text-gray-400">Change %</th>
                      <th className="px-2 py-1.5 text-right text-gray-400">RSI</th>
                      <th className="px-2 py-1.5 text-right text-gray-400">MACD</th>
                      <th className="px-2 py-1.5 text-right text-gray-400">ADX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {data.data.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-700/30">
                        <td className="px-2 py-1.5 text-white font-medium">{row.symbol}</td>
                        <td className="px-2 py-1.5 text-gray-300">{row.date}</td>
                        <td className="px-2 py-1.5 text-right">
                          {row.target === 1 ? (
                            <span className="text-green-400">↑ UP</span>
                          ) : row.target === -1 ? (
                            <span className="text-yellow-400">⚖️</span>
                          ) : (
                            <span className="text-red-400">↓ DOWN</span>
                          )}
                        </td>
                        <td className={`px-2 py-1.5 text-right ${row.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {row.priceChangePercent?.toFixed(2)}%
                        </td>
                        <td className="px-2 py-1.5 text-right text-gray-300">{row.rsi?.toFixed(1)}</td>
                        <td className="px-2 py-1.5 text-right text-gray-300">{row.macdHistogram?.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right text-gray-300">{row.adx?.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {(isRunning || selectionResults.length > 0) && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">📈 Progress Feature Selection</h3>
            <span className="text-sm text-gray-400">Step {currentStep}/{totalSteps}</span>
          </div>

          {/* Progress Bar */}
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current Best */}
          {bestResult && (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-4">
              <h4 className="text-green-400 font-semibold mb-2">🏆 Best Result So Far</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Accuracy</span>
                  <p className="text-2xl font-bold text-green-400">{(bestResult.accuracy * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Features</span>
                  <p className="text-2xl font-bold text-white">{bestResult.features.length}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Precision</span>
                  <p className="text-lg font-bold text-white">{(bestResult.metrics?.precision * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">F1 Score</span>
                  <p className="text-lg font-bold text-white">{(bestResult.metrics?.f1_score * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-gray-400 text-sm">Features:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {bestResult.features.map(f => (
                    <span key={f} className="px-2 py-0.5 text-xs bg-green-800/50 text-green-300 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Chart */}
          {selectionResults.length > 0 && (
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">📊 Accuracy per Step</h4>
              <div className="flex items-end gap-1 h-32 bg-gray-900/50 rounded-lg p-4">
                {selectionResults.map((result, idx) => {
                  const height = (result.accuracy / Math.max(...selectionResults.map(r => r.accuracy))) * 100
                  const isBest = bestResult && result.accuracy === bestResult.accuracy
                  return (
                    <div
                      key={idx}
                      className="flex-1 group relative"
                      title={`Step ${result.step}: ${(result.accuracy * 100).toFixed(2)}%\nAdded: ${result.addedFeature}`}
                    >
                      <div
                        className={`w-full rounded-t transition-all ${
                          isBest ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-400'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {result.addedFeature}: {(result.accuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Results Table */}
          {selectionResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-400">Step</th>
                    <th className="px-3 py-2 text-left text-gray-400">Added Feature</th>
                    <th className="px-3 py-2 text-right text-gray-400">Accuracy</th>
                    <th className="px-3 py-2 text-right text-gray-400">Improvement</th>
                    <th className="px-3 py-2 text-right text-gray-400">Total Features</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {selectionResults.map((result, idx) => {
                    const isBest = bestResult && result.accuracy === bestResult.accuracy
                    return (
                      <tr key={idx} className={isBest ? 'bg-green-900/20' : ''}>
                        <td className="px-3 py-2 text-white">{result.step}</td>
                        <td className="px-3 py-2">
                          <span className="text-yellow-400">{result.addedFeature}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-bold ${isBest ? 'text-green-400' : 'text-white'}`}>
                            {(result.accuracy * 100).toFixed(2)}%
                          </span>
                          {isBest && <span className="ml-1">🏆</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={result.improvement > 0 ? 'text-green-400' : 'text-gray-400'}>
                            {result.improvement > 0 ? '+' : ''}{(result.improvement * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300">{result.features.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Log */}
      {selectionLog.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📜 Log</h3>
          <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs">
            {selectionLog.map((log, idx) => (
              <div
                key={idx}
                className={`py-0.5 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  log.type === 'complete' ? 'text-cyan-400' :
                  log.type === 'step' ? 'text-purple-400' :
                  log.type === 'start' ? 'text-blue-400' :
                  'text-gray-400'
                }`}
              >
                <span className="text-gray-600">[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Best Model */}
      {bestResult && !isRunning && (
        <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 border border-green-500/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">💾 Simpan Model Terbaik</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nama Model</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder={`${AVAILABLE_MODELS.find(m => m.value === selectedModel)?.label}_${bestResult.features.length}features`}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={saveBestModel}
                disabled={isSaving || !modelName.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>💾 Simpan Model</>
                )}
              </button>
            </div>
          </div>

          {savedModelId && (
            <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 text-green-300">
              ✅ Model berhasil disimpan dengan ID: <code className="bg-gray-800 px-2 py-1 rounded">{savedModelId}</code>
            </div>
          )}

          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Model Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="text-white ml-2">{AVAILABLE_MODELS.find(m => m.value === selectedModel)?.label}</span>
              </div>
              <div>
                <span className="text-gray-400">Accuracy:</span>
                <span className="text-green-400 ml-2 font-bold">{(bestResult.accuracy * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-400">Features:</span>
                <span className="text-white ml-2">{bestResult.features.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Training Data:</span>
                <span className="text-white ml-2">{data?.summary?.totalRecords?.toLocaleString()} records</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
