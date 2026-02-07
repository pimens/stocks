import { useState, useMemo, useEffect, useCallback } from 'react'
import { stockApi } from '../services/api'
import { FiPlus, FiTrash2, FiPlay, FiSave, FiUpload, FiDownload, FiCopy, FiCheck, FiX, FiAlertTriangle, FiInfo, FiChevronDown, FiChevronUp, FiRefreshCw, FiFilter, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

// All available features for screening
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

  // Price Data (for raw comparison)
  close: { label: 'Close', group: 'price', desc: 'Harga Close' },
  open: { label: 'Open', group: 'price', desc: 'Harga Open' },
  high: { label: 'High', group: 'price', desc: 'Harga High' },
  low: { label: 'Low', group: 'price', desc: 'Harga Low' },
  volume: { label: 'Volume', group: 'price', desc: 'Volume' },
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

// Comparison operators
const OPERATORS = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
]

// Preset screening rules
const PRESET_RULES = {
  momentum_breakout: {
    name: '🚀 Momentum Breakout',
    desc: 'Saham dengan momentum kuat dan volume tinggi',
    rules: [
      { leftFeature: 'deltaCCI', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'roc', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'adx', operator: '>', compareType: 'constant', rightValue: 20 },
      { leftFeature: 'pdi', operator: '>', compareType: 'feature', rightFeature: 'mdi' },
      { leftFeature: 'closePosition', operator: '>', compareType: 'constant', rightValue: 0.6 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  oversold_bounce: {
    name: '📉 Oversold Bounce',
    desc: 'Saham oversold dengan tanda-tanda reversal',
    rules: [
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 30 },
      { leftFeature: 'stochK', operator: '<', compareType: 'constant', rightValue: 20 },
      { leftFeature: 'deltaRSI', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'priceBelowLowerBB', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  trend_following: {
    name: '📈 Trend Following',
    desc: 'Saham dalam uptrend yang kuat',
    rules: [
      { leftFeature: 'priceAboveSMA20', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'priceAboveSMA50', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'sma20AboveSMA50', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'adx', operator: '>', compareType: 'constant', rightValue: 25 },
      { leftFeature: 'macdBullish', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  volume_breakout: {
    name: '📦 Volume Breakout',
    desc: 'Saham dengan volume explosion',
    rules: [
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 2 },
      { leftFeature: 'highVolume', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'obvTrend', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'isBullishCandle', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  macd_crossover: {
    name: '📶 MACD Bullish',
    desc: 'MACD bullish crossover dengan konfirmasi',
    rules: [
      { leftFeature: 'macdBullish', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'macdHistogram', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'deltaMACDHist', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'rsi', operator: '>', compareType: 'constant', rightValue: 50 },
    ]
  },
  gap_up_strong: {
    name: '⬆️ Gap Up Strong',
    desc: 'Gap up dengan volume dan trend support',
    rules: [
      { leftFeature: 'gapUp', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1.5 },
      { leftFeature: 'closePosition', operator: '>', compareType: 'constant', rightValue: 0.7 },
      { leftFeature: 'priceAboveSMA20', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  }
}

// LQ45 stocks list
const LQ45_STOCKS = [
  'ACES', 'ADRO', 'AKRA', 'AMMN', 'AMRT', 'ANTM', 'ARTO', 'ASII', 'BBCA', 'BBNI',
  'BBRI', 'BBTN', 'BFIN', 'BMRI', 'BRPT', 'BUKA', 'CPIN', 'EMTK', 'ESSA', 'EXCL',
  'GGRM', 'HRUM', 'ICBP', 'INCO', 'INDF', 'INKP', 'INTP', 'ISAT', 'ITMG', 'KLBF',
  'MAPI', 'MDKA', 'MEDC', 'MIKA', 'PGAS', 'PGEO', 'PTBA', 'SIDO', 'SMGR', 'SRTG',
  'TBIG', 'TINS', 'TLKM', 'TOWR', 'UNTR', 'UNVR'
]

// IDX30 stocks list
const IDX30_STOCKS = [
  'ADRO', 'AMMN', 'AMRT', 'ASII', 'BBCA', 'BBNI', 'BBRI', 'BBTN', 'BMRI', 'BRPT',
  'BUKA', 'CPIN', 'EMTK', 'EXCL', 'ICBP', 'INDF', 'INKP', 'ISAT', 'ITMG', 'KLBF',
  'MDKA', 'MEDC', 'PGAS', 'SMGR', 'TBIG', 'TLKM', 'TOWR', 'UNTR', 'UNVR'
]

export default function RuleScreener() {
  // Stock list
  const [stockList, setStockList] = useState('lq45') // 'lq45', 'idx30', 'custom'
  const [customStocks, setCustomStocks] = useState('')
  
  // Target date for screening
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  
  // Rules
  const [rules, setRules] = useState([
    { id: 1, leftFeature: 'deltaCCI', operator: '>', compareType: 'constant', rightValue: 0, rightFeature: '' },
    { id: 2, leftFeature: 'roc', operator: '>', compareType: 'constant', rightValue: 0, rightFeature: '' },
    { id: 3, leftFeature: 'adx', operator: '>', compareType: 'constant', rightValue: 20, rightFeature: '' },
    { id: 4, leftFeature: 'pdi', operator: '>', compareType: 'feature', rightValue: 0, rightFeature: 'mdi' },
    { id: 5, leftFeature: 'closePosition', operator: '>', compareType: 'constant', rightValue: 0.6, rightFeature: '' },
    { id: 6, leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1, rightFeature: '' },
  ])
  const [nextRuleId, setNextRuleId] = useState(7)
  
  // Logic operator (AND/OR)
  const [logicOperator, setLogicOperator] = useState('AND')
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [allResults, setAllResults] = useState([]) // All scanned results (passed & failed)
  const [scannedCount, setScannedCount] = useState(0)
  const [expandedStock, setExpandedStock] = useState(null)
  const [savedPresets, setSavedPresets] = useState([])
  const [presetName, setPresetName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showFeatureSelector, setShowFeatureSelector] = useState(null) // {ruleId, side: 'left'|'right'}
  const [featureSearch, setFeatureSearch] = useState('')
  const [showAllResults, setShowAllResults] = useState(false)

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ruleScreenerPresets')
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load presets:', e)
      }
    }
  }, [])

  // Get stocks based on selection
  const getSelectedStocks = useCallback(() => {
    switch (stockList) {
      case 'lq45':
        return LQ45_STOCKS
      case 'idx30':
        return IDX30_STOCKS
      case 'custom':
        return customStocks.split(',').map(s => s.trim().toUpperCase()).filter(s => s)
      default:
        return LQ45_STOCKS
    }
  }, [stockList, customStocks])

  // Add new rule
  const addRule = () => {
    setRules([...rules, {
      id: nextRuleId,
      leftFeature: 'rsi',
      operator: '>',
      compareType: 'constant',
      rightValue: 50,
      rightFeature: ''
    }])
    setNextRuleId(nextRuleId + 1)
  }

  // Remove rule
  const removeRule = (id) => {
    setRules(rules.filter(r => r.id !== id))
  }

  // Update rule
  const updateRule = (id, field, value) => {
    setRules(rules.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value }
      }
      return r
    }))
  }

  // Duplicate rule
  const duplicateRule = (rule) => {
    setRules([...rules, { ...rule, id: nextRuleId }])
    setNextRuleId(nextRuleId + 1)
  }

  // Load preset
  const loadPreset = (preset) => {
    if (preset.rules) {
      const rulesWithIds = preset.rules.map((r, i) => ({ ...r, id: i + 1 }))
      setRules(rulesWithIds)
      setNextRuleId(rulesWithIds.length + 1)
    }
  }

  // Save current rules as preset
  const savePreset = () => {
    if (!presetName.trim()) return
    
    const newPreset = {
      id: Date.now(),
      name: presetName.trim(),
      rules: rules.map(({ id, ...rest }) => rest)
    }
    
    const updated = [...savedPresets, newPreset]
    setSavedPresets(updated)
    localStorage.setItem('ruleScreenerPresets', JSON.stringify(updated))
    setPresetName('')
    setShowSaveModal(false)
  }

  // Delete saved preset
  const deletePreset = (presetId) => {
    const updated = savedPresets.filter(p => p.id !== presetId)
    setSavedPresets(updated)
    localStorage.setItem('ruleScreenerPresets', JSON.stringify(updated))
  }

  // Export rules as JSON
  const exportRules = () => {
    const data = {
      name: 'Custom Rules',
      rules: rules.map(({ id, ...rest }) => rest),
      logicOperator
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'screening-rules.json'
    a.click()
  }

  // Import rules from JSON
  const importRules = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (data.rules && Array.isArray(data.rules)) {
          const rulesWithIds = data.rules.map((r, i) => ({ ...r, id: i + 1 }))
          setRules(rulesWithIds)
          setNextRuleId(rulesWithIds.length + 1)
          if (data.logicOperator) {
            setLogicOperator(data.logicOperator)
          }
        }
      } catch (err) {
        setError('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  // Evaluate single rule
  const evaluateRule = (rule, data) => {
    const leftValue = data[rule.leftFeature]
    
    if (leftValue === undefined || leftValue === null || isNaN(leftValue)) {
      return false
    }

    let rightValue
    if (rule.compareType === 'constant') {
      rightValue = parseFloat(rule.rightValue)
    } else {
      rightValue = data[rule.rightFeature]
      if (rightValue === undefined || rightValue === null || isNaN(rightValue)) {
        return false
      }
    }

    switch (rule.operator) {
      case '>': return leftValue > rightValue
      case '>=': return leftValue >= rightValue
      case '<': return leftValue < rightValue
      case '<=': return leftValue <= rightValue
      case '==': return Math.abs(leftValue - rightValue) < 0.0001
      case '!=': return Math.abs(leftValue - rightValue) >= 0.0001
      default: return false
    }
  }

  // Run screening
  const runScreener = async () => {
    if (rules.length === 0) {
      setError('Tambahkan minimal satu rule')
      return
    }

    const stocks = getSelectedStocks()
    if (stocks.length === 0) {
      setError('Tidak ada saham yang dipilih')
      return
    }

    if (!targetDate) {
      setError('Pilih tanggal screening')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])
    setAllResults([])
    setScannedCount(0)

    try {
      const screeningResults = []
      // Check if target date is today
      const today = new Date().toISOString().split('T')[0]
      const isToday = targetDate === today
      
      for (let i = 0; i < stocks.length; i++) {
        const symbol = stocks[i]
        setScannedCount(i + 1)
        
        try {
          // Fetch live indicator data for each stock
          // useRealtime = true if screening for today (get latest intraday data)
          const response = await stockApi.getLiveIndicators(symbol, targetDate, isToday)
          
          console.log(`[RuleScreener] ${symbol} response:`, response)
          
          // API returns data in response.data, not response.indicators
          if (response?.data) {
            const latestData = response.data
            
            // Evaluate all rules
            const ruleResults = rules.map(rule => ({
              rule,
              passed: evaluateRule(rule, latestData),
              leftValue: latestData[rule.leftFeature],
              rightValue: rule.compareType === 'constant' 
                ? parseFloat(rule.rightValue) 
                : latestData[rule.rightFeature]
            }))

            // Check if stock passes based on logic operator
            const passed = logicOperator === 'AND'
              ? ruleResults.every(r => r.passed)
              : ruleResults.some(r => r.passed)

            // Always add to results, but mark if passed
            screeningResults.push({
              symbol,
              data: latestData,
              ruleResults,
              passedCount: ruleResults.filter(r => r.passed).length,
              totalRules: rules.length,
              passed,
              date: response.info?.indicatorDate || targetDate
            })
          }
        } catch (err) {
          console.warn(`Failed to fetch data for ${symbol}:`, err.message)
          // Add failed fetch to results
          screeningResults.push({
            symbol,
            data: null,
            ruleResults: [],
            passedCount: 0,
            totalRules: rules.length,
            passed: false,
            error: err.message
          })
        }
      }

      // Sort all results by passed count
      screeningResults.sort((a, b) => b.passedCount - a.passedCount)
      setAllResults(screeningResults)
      
      // Filter only passed stocks
      const passedStocks = screeningResults.filter(r => r.passed)
      setResults(passedStocks)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter features by search
  const filteredFeatures = useMemo(() => {
    const search = featureSearch.toLowerCase()
    const result = {}
    
    Object.entries(ALL_FEATURES).forEach(([key, feat]) => {
      if (
        key.toLowerCase().includes(search) ||
        feat.label.toLowerCase().includes(search) ||
        feat.desc.toLowerCase().includes(search)
      ) {
        const group = feat.group
        if (!result[group]) result[group] = []
        result[group].push({ key, ...feat })
      }
    })
    
    return result
  }, [featureSearch])

  // Feature selector modal
  const FeatureSelector = ({ ruleId, side, onClose }) => {
    const handleSelect = (featureKey) => {
      if (side === 'left') {
        updateRule(ruleId, 'leftFeature', featureKey)
      } else {
        updateRule(ruleId, 'rightFeature', featureKey)
      }
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg p-4 w-[600px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Pilih Feature</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Cari feature..."
            value={featureSearch}
            onChange={(e) => setFeatureSearch(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white mb-4"
            autoFocus
          />

          <div className="overflow-y-auto flex-1">
            {Object.entries(filteredFeatures).map(([groupKey, features]) => (
              <div key={groupKey} className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  {FEATURE_GROUPS[groupKey]?.label || groupKey}
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {features.map((feat) => (
                    <button
                      key={feat.key}
                      onClick={() => handleSelect(feat.key)}
                      className="text-left px-2 py-1.5 rounded hover:bg-gray-700 text-sm"
                    >
                      <div className="text-white">{feat.label}</div>
                      <div className="text-gray-500 text-xs truncate">{feat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-orange-400 mb-2">📊 Rule-Based Screener</h2>
        <p className="text-gray-400">
          Buat filter screening saham dengan rule dinamis. Support perbandingan fitur vs konstanta dan fitur vs fitur.
        </p>
      </div>

      {/* Stock Selection & Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stock Selection */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">📋 Pilih Saham</h3>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="stockList"
                value="lq45"
                checked={stockList === 'lq45'}
                onChange={(e) => setStockList(e.target.value)}
                className="text-blue-500"
              />
              <span className="text-white">LQ45 ({LQ45_STOCKS.length} saham)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="stockList"
                value="idx30"
                checked={stockList === 'idx30'}
                onChange={(e) => setStockList(e.target.value)}
                className="text-blue-500"
              />
              <span className="text-white">IDX30 ({IDX30_STOCKS.length} saham)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="stockList"
                value="custom"
                checked={stockList === 'custom'}
                onChange={(e) => setStockList(e.target.value)}
                className="text-blue-500"
              />
              <span className="text-white">Custom</span>
            </label>
          </div>

          {stockList === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Masukkan kode saham, pisahkan dengan koma (contoh: BBCA, BBRI, TLKM)"
                value={customStocks}
                onChange={(e) => setCustomStocks(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">📅 Tanggal Screening</h3>
          <div className="space-y-3">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Hari Ini
              </button>
              <button
                onClick={() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  setTargetDate(yesterday.toISOString().split('T')[0])
                }}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
              >
                Kemarin
              </button>
              <button
                onClick={() => {
                  const lastWeek = new Date()
                  lastWeek.setDate(lastWeek.getDate() - 7)
                  setTargetDate(lastWeek.toISOString().split('T')[0])
                }}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
              >
                -7 Hari
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {targetDate === new Date().toISOString().split('T')[0] 
                ? '📡 Data realtime akan digunakan jika market sedang berjalan'
                : '📊 Data historical akan digunakan'}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Rules */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">⚡ Preset Rules</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(PRESET_RULES).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => loadPreset(preset)}
              className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <div className="font-medium text-white">{preset.name}</div>
              <div className="text-xs text-gray-400 mt-1">{preset.desc}</div>
              <div className="text-xs text-blue-400 mt-1">{preset.rules.length} rules</div>
            </button>
          ))}
        </div>

        {/* Saved presets */}
        {savedPresets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Saved Presets</h4>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((preset) => (
                <div key={preset.id} className="flex items-center gap-1 bg-gray-700 rounded px-2 py-1">
                  <button
                    onClick={() => loadPreset(preset)}
                    className="text-white hover:text-blue-400"
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="text-gray-500 hover:text-red-400 ml-1"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rules Builder */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">🔧 Rules Builder</h3>
          <div className="flex items-center gap-3">
            {/* Logic operator */}
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLogicOperator('AND')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  logicOperator === 'AND' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                AND
              </button>
              <button
                onClick={() => setLogicOperator('OR')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  logicOperator === 'OR' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                OR
              </button>
            </div>

            {/* Action buttons */}
            <button
              onClick={addRule}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Add Rule
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
            >
              <FiSave className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={exportRules}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <label className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm cursor-pointer">
              <FiUpload className="w-4 h-4" />
              Import
              <input type="file" accept=".json" onChange={importRules} className="hidden" />
            </label>
          </div>
        </div>

        {/* Rules list */}
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={rule.id} className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-3">
              {/* Rule number */}
              <span className="text-gray-500 text-sm w-6">{index + 1}.</span>

              {/* Left feature */}
              <button
                onClick={() => setShowFeatureSelector({ ruleId: rule.id, side: 'left' })}
                className="flex-1 max-w-[200px] px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-left"
              >
                <span className="text-white">{ALL_FEATURES[rule.leftFeature]?.label || rule.leftFeature}</span>
              </button>

              {/* Operator */}
              <select
                value={rule.operator}
                onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                className="px-3 py-2 bg-gray-700 rounded text-white font-mono"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              {/* Compare type */}
              <select
                value={rule.compareType}
                onChange={(e) => updateRule(rule.id, 'compareType', e.target.value)}
                className="px-3 py-2 bg-gray-700 rounded text-gray-300 text-sm"
              >
                <option value="constant">Nilai</option>
                <option value="feature">Fitur</option>
              </select>

              {/* Right value/feature */}
              {rule.compareType === 'constant' ? (
                <input
                  type="number"
                  step="any"
                  value={rule.rightValue}
                  onChange={(e) => updateRule(rule.id, 'rightValue', e.target.value)}
                  className="w-24 px-3 py-2 bg-gray-700 rounded text-white"
                />
              ) : (
                <button
                  onClick={() => setShowFeatureSelector({ ruleId: rule.id, side: 'right' })}
                  className="flex-1 max-w-[200px] px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-left"
                >
                  <span className="text-white">{ALL_FEATURES[rule.rightFeature]?.label || rule.rightFeature || 'Pilih...'}</span>
                </button>
              )}

              {/* Actions */}
              <button
                onClick={() => duplicateRule(rule)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                title="Duplicate rule"
              >
                <FiCopy className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeRule(rule.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                title="Remove rule"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>

              {/* Logic connector (except last) */}
              {index < rules.length - 1 && (
                <span className="text-blue-400 font-medium ml-2">{logicOperator}</span>
              )}
            </div>
          ))}
        </div>

        {rules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiFilter className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada rule. Klik "Add Rule" atau pilih preset.</p>
          </div>
        )}
      </div>

      {/* Run Button */}
      <div className="flex justify-center">
        <button
          onClick={runScreener}
          disabled={loading || rules.length === 0}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
            loading || rules.length === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {loading ? (
            <>
              <FiRefreshCw className="w-5 h-5 animate-spin" />
              Scanning {scannedCount}/{getSelectedStocks().length} saham...
            </>
          ) : (
            <>
              <FiPlay className="w-5 h-5" />
              Run Screener ({getSelectedStocks().length} saham)
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <FiAlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {(results.length > 0 || allResults.length > 0) && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              ✅ Hasil Screening: <span className="text-green-400">{results.length}</span> dari {allResults.length} saham lolos
              <span className="text-sm text-gray-400 ml-2">({targetDate})</span>
            </h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showAllResults}
                onChange={(e) => setShowAllResults(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-400">Tampilkan semua ({allResults.length})</span>
            </label>
          </div>

          {results.length === 0 && !showAllResults && (
            <div className="text-center py-8 text-gray-500">
              <FiAlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada saham yang lolos semua rule.</p>
              <p className="text-sm mt-1">Coba ubah rule atau gunakan logika OR.</p>
            </div>
          )}

          <div className="space-y-2">
            {(showAllResults ? allResults : results).map((result) => (
              <div 
                key={result.symbol} 
                className={`rounded-lg overflow-hidden ${
                  result.passed 
                    ? 'bg-green-900/20 border border-green-500/30' 
                    : 'bg-gray-700/50 border border-gray-600/30'
                }`}
              >
                <button
                  onClick={() => setExpandedStock(expandedStock === result.symbol ? null : result.symbol)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {result.passed ? (
                      <FiCheck className="w-5 h-5 text-green-400" />
                    ) : (
                      <FiX className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-xl font-bold text-white">{result.symbol}</span>
                    <span className={result.passed ? 'text-green-400' : 'text-gray-400'}>
                      {result.passedCount}/{result.totalRules} rules
                    </span>
                    {result.data?.close && (
                      <span className="text-gray-400">
                        Rp {result.data.close.toLocaleString('id-ID')}
                      </span>
                    )}
                    {result.error && (
                      <span className="text-red-400 text-sm">Error: {result.error}</span>
                    )}
                  </div>
                  {expandedStock === result.symbol ? (
                    <FiChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedStock === result.symbol && result.data && (
                  <div className="px-4 pb-4 border-t border-gray-600 mt-2 pt-4">
                    {/* Rule evaluation details */}
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">📋 Detail Rule Evaluation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      {result.ruleResults.map((rr, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-2 rounded ${
                            rr.passed ? 'bg-green-900/30' : 'bg-red-900/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {rr.passed ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiX className="w-4 h-4 text-red-400" />}
                            <span className={`text-sm ${rr.passed ? 'text-green-400' : 'text-red-400'}`}>
                              {ALL_FEATURES[rr.rule.leftFeature]?.label} {rr.rule.operator}{' '}
                              {rr.rule.compareType === 'constant' 
                                ? rr.rule.rightValue 
                                : ALL_FEATURES[rr.rule.rightFeature]?.label}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            ({typeof rr.leftValue === 'number' ? rr.leftValue.toFixed(2) : rr.leftValue} vs {typeof rr.rightValue === 'number' ? rr.rightValue.toFixed(2) : rr.rightValue})
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Key indicators */}
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">📊 Key Indicators</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                      {['rsi', 'adx', 'macdHistogram', 'volumeRatio', 'closePosition', 'roc'].map((key) => (
                        <div key={key} className="bg-gray-800 rounded p-2">
                          <div className="text-gray-500 text-xs">{ALL_FEATURES[key]?.label || key}</div>
                          <div className="text-white font-medium">
                            {result.data[key] !== undefined && result.data[key] !== null
                              ? typeof result.data[key] === 'number'
                                ? result.data[key].toFixed(2)
                                : result.data[key]
                              : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Selector Modal */}
      {showFeatureSelector && (
        <FeatureSelector
          ruleId={showFeatureSelector.ruleId}
          side={showFeatureSelector.side}
          onClose={() => {
            setShowFeatureSelector(null)
            setFeatureSearch('')
          }}
        />
      )}

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">💾 Save Preset</h3>
            <input
              type="text"
              placeholder="Nama preset..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
