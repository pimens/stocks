import { useState, useEffect, useMemo } from 'react'
import { FiActivity, FiRefreshCw, FiCalendar, FiCpu, FiSave, FiTrash2, FiFolder, FiCheck, FiX, FiSearch, FiPlus, FiEdit2, FiCode, FiChevronDown, FiChevronUp, FiCopy } from 'react-icons/fi'
import { stockApi, aiApi } from '../services/api'
import { toast } from 'react-toastify'
import ReactMarkdown from 'react-markdown'

// All 90+ indicators grouped by category
const INDICATOR_CATEGORIES = {
  'Harga & Volume': {
    icon: '💵',
    indicators: ['prevClose', 'prevOpen', 'prevHigh', 'prevLow', 'prevVolume', 'volumeRatio', 'highVolume']
  },
  'Candlestick Pattern': {
    icon: '🕯️',
    indicators: ['closePosition', 'bodyRangeRatio', 'upperWickRatio', 'lowerWickRatio', 'bodySize', 'upperWick', 'lowerWick', 'isBullishCandle', 'isDoji']
  },
  'Moving Average': {
    icon: '📈',
    indicators: ['sma5', 'sma10', 'sma20', 'sma50', 'ema5', 'ema10', 'ema12', 'ema26']
  },
  'Price vs MA': {
    icon: '⚖️',
    indicators: ['priceAboveSMA5', 'priceAboveSMA10', 'priceAboveSMA20', 'priceAboveSMA50', 'priceAboveEMA12', 'priceAboveEMA26']
  },
  'Distance from MA': {
    icon: '📏',
    indicators: ['distFromSMA5', 'distFromSMA20', 'distFromSMA50']
  },
  'MA Crossover': {
    icon: '✂️',
    indicators: ['sma5AboveSMA10', 'sma10AboveSMA20', 'sma20AboveSMA50']
  },
  'RSI': {
    icon: '💪',
    indicators: ['rsi', 'rsiOversold', 'rsiOverbought', 'rsiNeutral', 'deltaRSI']
  },
  'MACD': {
    icon: '📊',
    indicators: ['macd', 'macdSignal', 'macdHistogram', 'macdBullish', 'macdPositive', 'deltaMACDHist']
  },
  'Bollinger Bands': {
    icon: '📉',
    indicators: ['bbUpper', 'bbMiddle', 'bbLower', 'bbWidth', 'priceBelowLowerBB', 'priceAboveUpperBB']
  },
  'Stochastic': {
    icon: '🔄',
    indicators: ['stochK', 'stochD', 'stochOversold', 'stochOverbought', 'stochBullishCross', 'deltaStochK']
  },
  'ADX/DMI': {
    icon: '🎯',
    indicators: ['adx', 'pdi', 'mdi', 'strongTrend', 'bullishDI', 'deltaADX']
  },
  'ATR': {
    icon: '📐',
    indicators: ['atr', 'atrPercent']
  },
  'OBV': {
    icon: '📦',
    indicators: ['obv', 'obvChange', 'obvTrend']
  },
  'Williams %R': {
    icon: '🔻',
    indicators: ['williamsR', 'williamsROversold', 'williamsROverbought']
  },
  'CCI': {
    icon: '🌡️',
    indicators: ['cci', 'cciOversold', 'cciOverbought', 'deltaCCI']
  },
  'MFI': {
    icon: '💰',
    indicators: ['mfi', 'mfiOversold', 'mfiOverbought', 'deltaMFI']
  },
  'ROC': {
    icon: '🚀',
    indicators: ['roc', 'rocPositive']
  },
  'Momentum': {
    icon: '⚡',
    indicators: ['momentum', 'momentumPositive', 'pricePosition']
  },
  'Gap': {
    icon: '🔲',
    indicators: ['gapUp', 'gapDown']
  },
  'Returns': {
    icon: '💹',
    indicators: ['return1d', 'return3d', 'return5d']
  }
}

// Get all indicator names flattened
const ALL_INDICATORS = Object.values(INDICATOR_CATEGORIES).flatMap(cat => cat.indicators)

// Preset storage key
const PRESETS_STORAGE_KEY = 'indicator-analysis-presets'

// Default presets
const DEFAULT_PRESETS = [
  {
    id: 'momentum',
    name: '🚀 Momentum Trading',
    description: 'Indikator untuk strategi momentum',
    indicators: ['rsi', 'macd', 'macdHistogram', 'macdBullish', 'stochK', 'stochD', 'momentum', 'roc', 'rocPositive', 'adx', 'strongTrend']
  },
  {
    id: 'trend-following',
    name: '📈 Trend Following',
    description: 'MA, crossover, dan trend indicators',
    indicators: ['sma5', 'sma10', 'sma20', 'sma50', 'ema12', 'ema26', 'priceAboveSMA20', 'priceAboveSMA50', 'sma5AboveSMA10', 'sma10AboveSMA20', 'adx', 'pdi', 'mdi', 'bullishDI']
  },
  {
    id: 'oversold-hunter',
    name: '🎯 Oversold Hunter',
    description: 'Cari saham oversold untuk reversal',
    indicators: ['rsi', 'rsiOversold', 'stochK', 'stochOversold', 'williamsR', 'williamsROversold', 'cci', 'cciOversold', 'mfi', 'mfiOversold', 'priceBelowLowerBB']
  },
  {
    id: 'volatility',
    name: '⚡ Volatility Analysis',
    description: 'Analisis volatilitas dan range',
    indicators: ['atr', 'atrPercent', 'bbWidth', 'bbUpper', 'bbLower', 'bodyRangeRatio', 'bodySize', 'highVolume', 'volumeRatio']
  },
  {
    id: 'candlestick',
    name: '🕯️ Candlestick Analysis',
    description: 'Pola candlestick lengkap',
    indicators: ['closePosition', 'bodyRangeRatio', 'upperWickRatio', 'lowerWickRatio', 'bodySize', 'upperWick', 'lowerWick', 'isBullishCandle', 'isDoji', 'gapUp', 'gapDown']
  },
  {
    id: 'all-indicators',
    name: '📊 Semua Indikator',
    description: 'Analisis lengkap 90+ indikator',
    indicators: ALL_INDICATORS
  }
]

function IndicatorAnalysis() {
  // Stock input
  const [stockSymbol, setStockSymbol] = useState('')
  const [stockSearch, setStockSearch] = useState('')
  
  // Date & realtime
  const [indicatorDate, setIndicatorDate] = useState(new Date().toISOString().split('T')[0])
  const [useRealtime, setUseRealtime] = useState(true)
  
  // Indicators
  const [selectedIndicators, setSelectedIndicators] = useState(new Set(ALL_INDICATORS))
  const [indicatorData, setIndicatorData] = useState(null)
  const [loadingIndicators, setLoadingIndicators] = useState(false)
  const [indicatorSearch, setIndicatorSearch] = useState('')
  
  // AI Analysis
  const [indicatorAIAnalysis, setIndicatorAIAnalysis] = useState(null)
  const [analyzingIndicators, setAnalyzingIndicators] = useState(false)
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001')
  const [showPrompt, setShowPrompt] = useState(false)
  
  // Presets
  const [presets, setPresets] = useState([])
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDescription, setNewPresetDescription] = useState('')
  const [editingPreset, setEditingPreset] = useState(null)
  
  // History
  const [analysisHistory, setAnalysisHistory] = useState([])

  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return indicatorDate === today
  }, [indicatorDate])

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets)
        setPresets([...DEFAULT_PRESETS, ...parsed])
      } catch {
        setPresets(DEFAULT_PRESETS)
      }
    } else {
      setPresets(DEFAULT_PRESETS)
    }
  }, [])

  // Save custom presets to localStorage
  const savePresetsToStorage = (customPresets) => {
    const toSave = customPresets.filter(p => !DEFAULT_PRESETS.find(d => d.id === p.id))
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(toSave))
  }

  // Fetch indicators
  const fetchIndicators = async () => {
    if (!stockSymbol.trim()) {
      toast.error('Masukkan kode saham terlebih dahulu')
      return
    }
    
    setLoadingIndicators(true)
    setIndicatorData(null)
    setIndicatorAIAnalysis(null)
    try {
      const result = await stockApi.getLiveIndicators(
        stockSymbol.toUpperCase(),
        indicatorDate,
        isToday && useRealtime
      )
      setIndicatorData(result)
      toast.success(`Berhasil mengambil ${Object.keys(result.data || {}).length} indikator untuk ${stockSymbol.toUpperCase()}`)
    } catch (error) {
      console.error('Error fetching indicators:', error)
      toast.error(error.response?.data?.error || 'Gagal mengambil data indikator')
    } finally {
      setLoadingIndicators(false)
    }
  }

  // Toggle indicator selection
  const toggleIndicator = (indicator) => {
    const newSet = new Set(selectedIndicators)
    if (newSet.has(indicator)) {
      newSet.delete(indicator)
    } else {
      newSet.add(indicator)
    }
    setSelectedIndicators(newSet)
  }

  // Toggle all indicators in a category
  const toggleCategory = (category) => {
    const indicators = INDICATOR_CATEGORIES[category].indicators
    const allSelected = indicators.every(ind => selectedIndicators.has(ind))
    const newSet = new Set(selectedIndicators)
    
    if (allSelected) {
      indicators.forEach(ind => newSet.delete(ind))
    } else {
      indicators.forEach(ind => newSet.add(ind))
    }
    setSelectedIndicators(newSet)
  }

  // Select/Deselect all
  const selectAll = () => setSelectedIndicators(new Set(ALL_INDICATORS))
  const deselectAll = () => setSelectedIndicators(new Set())

  // Load preset
  const loadPreset = (preset) => {
    setSelectedIndicators(new Set(preset.indicators))
    toast.success(`Preset "${preset.name}" dimuat (${preset.indicators.length} indikator)`)
  }

  // Save new preset
  const saveNewPreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Nama preset harus diisi')
      return
    }
    if (selectedIndicators.size === 0) {
      toast.error('Pilih minimal 1 indikator')
      return
    }

    const newPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || `${selectedIndicators.size} indikator`,
      indicators: Array.from(selectedIndicators),
      isCustom: true,
      createdAt: new Date().toISOString()
    }

    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    savePresetsToStorage(updatedPresets)
    
    setNewPresetName('')
    setNewPresetDescription('')
    setShowSavePreset(false)
    toast.success(`Preset "${newPreset.name}" berhasil disimpan!`)
  }

  // Update existing preset
  const updatePreset = (preset) => {
    if (selectedIndicators.size === 0) {
      toast.error('Pilih minimal 1 indikator')
      return
    }

    const updatedPresets = presets.map(p => {
      if (p.id === preset.id) {
        return {
          ...p,
          indicators: Array.from(selectedIndicators),
          description: `${selectedIndicators.size} indikator`,
          updatedAt: new Date().toISOString()
        }
      }
      return p
    })

    setPresets(updatedPresets)
    savePresetsToStorage(updatedPresets)
    setEditingPreset(null)
    toast.success(`Preset "${preset.name}" berhasil diupdate!`)
  }

  // Delete preset
  const deletePreset = (presetId) => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset?.isCustom) {
      toast.error('Preset default tidak bisa dihapus')
      return
    }

    const updatedPresets = presets.filter(p => p.id !== presetId)
    setPresets(updatedPresets)
    savePresetsToStorage(updatedPresets)
    toast.success('Preset berhasil dihapus')
  }

  // Analyze with AI
  const analyzeIndicatorsWithAI = async () => {
    if (!indicatorData?.data) {
      toast.error('Ambil data indikator terlebih dahulu')
      return
    }
    if (selectedIndicators.size === 0) {
      toast.error('Pilih minimal 1 indikator')
      return
    }

    setAnalyzingIndicators(true)
    try {
      // Build indicator data object with only selected indicators
      const selectedData = {}
      selectedIndicators.forEach(ind => {
        if (indicatorData.data[ind] !== undefined) {
          selectedData[ind] = indicatorData.data[ind]
        }
      })

      // Include price data for context
      if (indicatorData.data.prevClose) selectedData.prevClose = indicatorData.data.prevClose
      if (indicatorData.data.prevOpen) selectedData.prevOpen = indicatorData.data.prevOpen
      if (indicatorData.data.prevHigh) selectedData.prevHigh = indicatorData.data.prevHigh
      if (indicatorData.data.prevLow) selectedData.prevLow = indicatorData.data.prevLow

      const result = await aiApi.analyzeWithIndicators(
        stockSymbol.toUpperCase(), 
        selectedData, 
        indicatorDate,
        selectedModel
      )
      setIndicatorAIAnalysis(result.aiAnalysis)
      
      // Add to history
      const historyItem = {
        id: Date.now(),
        symbol: stockSymbol.toUpperCase(),
        date: indicatorDate,
        indicatorCount: selectedIndicators.size,
        timestamp: new Date().toISOString()
      }
      setAnalysisHistory(prev => [historyItem, ...prev.slice(0, 9)])
      
      toast.success('Analisis AI berhasil!')
    } catch (error) {
      console.error('Error analyzing indicators:', error)
      toast.error(error.response?.data?.error || 'Gagal menganalisis dengan AI')
    } finally {
      setAnalyzingIndicators(false)
    }
  }

  // Format indicator value for display
  const formatIndicatorValue = (key, value) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? '✅ Ya' : '❌ Tidak'
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toLocaleString('id-ID')
      if (Math.abs(value) > 1000) return value.toLocaleString('id-ID', { maximumFractionDigits: 0 })
      return value.toFixed(4)
    }
    return String(value)
  }

  // Filter indicators by search
  const filteredCategories = useMemo(() => {
    if (!indicatorSearch.trim()) return INDICATOR_CATEGORIES
    
    const search = indicatorSearch.toLowerCase()
    const result = {}
    
    Object.entries(INDICATOR_CATEGORIES).forEach(([cat, data]) => {
      const filtered = data.indicators.filter(ind => 
        ind.toLowerCase().includes(search) || cat.toLowerCase().includes(search)
      )
      if (filtered.length > 0) {
        result[cat] = { ...data, indicators: filtered }
      }
    })
    
    return result
  }, [indicatorSearch])

  // AI Models
const aiModels = [
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
    { id: 'google/gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
    { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528 (free)' },
    { id: 'arcee-ai/trinity-large-preview:free', name: 'Arcee Trinity Large (free)' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'TNG DeepSeek R1T2 Chimera (free)' },
    { id: 'stepfun/step-3.5-flash:free', name: 'StepFun Step 3.5 Flash (free)' },
    { id: 'z-ai/glm-4.5-air:free', name: 'Z.AI GLM 4.5 Air (free)' },
    { id: 'qwen/qwen3-coder-480b-a35b:free', name: 'Qwen3 Coder 480B (free)' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (free)' },
    { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3 27B (free)' },
    { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B (free)' },
    { id: 'qwen/qwen3-4b:free', name: 'Qwen3 4B (free)' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (free)' },
    { id: 'google/gemma-3-12b-it:free', name: 'Google Gemma 3 12B (free)' },
    { id: 'google/gemma-3-4b-it:free', name: 'Google Gemma 3 4B (free)' },
]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiActivity className="text-blue-400" />
              Analisis 90+ Indikator Teknikal
            </h1>
            <p className="text-gray-400 mt-1">Pilih saham, tanggal, dan indikator untuk dianalisis dengan AI</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Indikator</div>
            <div className="text-3xl font-bold text-blue-400">{ALL_INDICATORS.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Input & Presets */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stock Input */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FiSearch className="text-blue-400" />
              Pilih Saham
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Kode saham (contoh: BBCA)"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && fetchIndicators()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
              
              {/* Date Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-blue-400" />
                  <label className="text-sm text-gray-400">Tanggal:</label>
                </div>
                <input
                  type="date"
                  value={indicatorDate}
                  onChange={(e) => setIndicatorDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setIndicatorDate(new Date().toISOString().split('T')[0])}
                    className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs rounded"
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date()
                      d.setDate(d.getDate() - 1)
                      setIndicatorDate(d.toISOString().split('T')[0])
                    }}
                    className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs rounded"
                  >
                    Kemarin
                  </button>
                </div>
              </div>

              {isToday && (
                <label className="flex items-center gap-2 text-sm bg-yellow-900/30 p-2 rounded-lg border border-yellow-500/30">
                  <input
                    type="checkbox"
                    checked={useRealtime}
                    onChange={(e) => setUseRealtime(e.target.checked)}
                    className="rounded bg-gray-700 border-gray-600 text-blue-600"
                  />
                  <span className="text-yellow-400">🔴 Data Realtime</span>
                </label>
              )}

              <button
                onClick={fetchIndicators}
                disabled={loadingIndicators || !stockSymbol.trim()}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                {loadingIndicators ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    Mengambil Data...
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="w-4 h-4" />
                    Ambil Indikator
                  </>
                )}
              </button>

              {indicatorData?.info && (
                <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded">
                  <div>📅 Data: <strong className="text-yellow-400">{indicatorData.info.indicatorDate}</strong></div>
                  {indicatorData.info.isRealtime && <div className="text-green-400">🔴 Realtime</div>}
                </div>
              )}
            </div>
          </div>

          {/* Presets */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiFolder className="text-yellow-400" />
                Preset Indikator
              </h3>
              <button
                onClick={() => setShowSavePreset(true)}
                className="p-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded"
                title="Simpan Preset Baru"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Save New Preset Form */}
            {showSavePreset && (
              <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-green-500/30">
                <h4 className="text-sm font-semibold text-green-400 mb-2">💾 Simpan Preset Baru</h4>
                <input
                  type="text"
                  placeholder="Nama preset"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm mb-2"
                />
                <input
                  type="text"
                  placeholder="Deskripsi (opsional)"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm mb-2"
                />
                <div className="text-xs text-gray-400 mb-2">
                  Akan menyimpan {selectedIndicators.size} indikator yang dipilih
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveNewPreset}
                    className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center justify-center gap-1"
                  >
                    <FiSave className="w-3 h-3" /> Simpan
                  </button>
                  <button
                    onClick={() => setShowSavePreset(false)}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Preset List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    preset.isCustom 
                      ? 'bg-purple-900/20 border-purple-500/30 hover:bg-purple-900/30' 
                      : 'bg-gray-900/50 border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1" onClick={() => loadPreset(preset)}>
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-500">{preset.description}</div>
                      <div className="text-xs text-blue-400">{preset.indicators.length} indikator</div>
                    </div>
                    <div className="flex gap-1">
                      {preset.isCustom && (
                        <>
                          <button
                            onClick={() => setEditingPreset(preset)}
                            className="p-1 hover:bg-gray-600 rounded text-gray-400"
                            title="Update dengan pilihan saat ini"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className="p-1 hover:bg-red-600/20 rounded text-red-400"
                            title="Hapus preset"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingPreset?.id === preset.id && (
                    <div className="mt-2 p-2 bg-purple-900/30 rounded border border-purple-500/50">
                      <div className="text-xs text-purple-300 mb-2">
                        Update preset dengan {selectedIndicators.size} indikator yang dipilih?
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updatePreset(preset)}
                          className="flex-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => setEditingPreset(null)}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FiCpu className="text-purple-400" />
              Model AI
            </h3>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {aiModels.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>

          {/* Analysis History */}
          {analysisHistory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">📜 Riwayat Analisis</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {analysisHistory.map((item) => (
                  <div
                    key={item.id}
                    className="text-xs bg-gray-900/50 p-2 rounded cursor-pointer hover:bg-gray-700/50"
                    onClick={() => {
                      setStockSymbol(item.symbol)
                      setIndicatorDate(item.date)
                    }}
                  >
                    <div className="font-medium text-white">{item.symbol}</div>
                    <div className="text-gray-500">{item.date} • {item.indicatorCount} indikator</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center - Indicator Selection */}
        <div className="lg:col-span-2">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📊 Pilih Indikator ({selectedIndicators.size}/{ALL_INDICATORS.length})
              </h3>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs px-2 py-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded">
                  Pilih Semua
                </button>
                <button onClick={deselectAll} className="text-xs px-2 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded">
                  Hapus Semua
                </button>
              </div>
            </div>
            
            <input
              type="text"
              placeholder="Cari indikator..."
              value={indicatorSearch}
              onChange={(e) => setIndicatorSearch(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm mb-3"
            />

            <div className="flex-1 overflow-y-auto space-y-3">
              {Object.entries(filteredCategories).map(([category, data]) => {
                const allSelected = data.indicators.every(ind => selectedIndicators.has(ind))
                const someSelected = data.indicators.some(ind => selectedIndicators.has(ind))
                
                return (
                  <div key={category} className="bg-gray-900/50 rounded-lg p-3">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 rounded p-1 -m-1"
                      onClick={() => toggleCategory(category)}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                        onChange={() => toggleCategory(category)}
                        className="rounded bg-gray-700 border-gray-600 text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xl">{data.icon}</span>
                      <span className="font-semibold text-white">{category}</span>
                      <span className="text-xs text-gray-500">({data.indicators.length})</span>
                    </div>
                    <div className="ml-6 mt-2 grid grid-cols-2 md:grid-cols-3 gap-1">
                      {data.indicators.map(ind => (
                        <label 
                          key={ind}
                          className={`flex items-center gap-2 text-sm p-1.5 rounded cursor-pointer hover:bg-gray-700/50 ${
                            selectedIndicators.has(ind) ? 'text-white bg-blue-900/20' : 'text-gray-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIndicators.has(ind)}
                            onChange={() => toggleIndicator(ind)}
                            className="rounded bg-gray-700 border-gray-600 text-blue-600 w-3.5 h-3.5"
                          />
                          <span className="truncate flex-1">{ind}</span>
                          {indicatorData?.data && indicatorData.data[ind] !== undefined && (
                            <span className="text-blue-400 text-xs font-medium">
                              {formatIndicatorValue(ind, indicatorData.data[ind])}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right - Data & AI Analysis */}
        <div className="lg:col-span-1 space-y-4">
          {/* Selected Indicators Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FiCheck className="text-green-400" />
              Indikator Terpilih
            </h3>
            
            {selectedIndicators.size === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                Belum ada indikator dipilih
              </div>
            ) : (
              <div className="space-y-3">
                {indicatorData?.data ? (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {Array.from(selectedIndicators).slice(0, 15).map(ind => (
                      <div key={ind} className="flex justify-between text-xs bg-gray-900/50 rounded px-2 py-1.5">
                        <span className="text-gray-400 truncate">{ind}</span>
                        <span className="text-white font-medium ml-2">
                          {formatIndicatorValue(ind, indicatorData.data[ind])}
                        </span>
                      </div>
                    ))}
                    {selectedIndicators.size > 15 && (
                      <div className="text-center text-xs text-gray-500 py-1">
                        ... dan {selectedIndicators.size - 15} lainnya
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    Klik "Ambil Indikator" untuk melihat nilai
                  </div>
                )}

                {/* Quick preset save */}
                <button
                  onClick={() => setShowSavePreset(true)}
                  className="w-full px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <FiSave className="w-4 h-4" />
                  Simpan sebagai Preset
                </button>
              </div>
            )}
          </div>

          {/* AI Analysis Button & Result */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FiCpu className="text-purple-400" />
              Analisis AI
            </h3>

            <button
              onClick={analyzeIndicatorsWithAI}
              disabled={analyzingIndicators || !indicatorData?.data || selectedIndicators.size === 0}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg flex items-center justify-center gap-2 font-medium"
            >
              {analyzingIndicators ? (
                <>
                  <FiRefreshCw className="w-5 h-5 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <FiCpu className="w-5 h-5" />
                  Analisis {selectedIndicators.size} Indikator
                </>
              )}
            </button>

            {!indicatorData?.data && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Ambil data indikator terlebih dahulu
              </p>
            )}
          </div>

          {/* AI Analysis Result */}
          {indicatorAIAnalysis && (
            <div className="card bg-purple-900/20 border-purple-500/30">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-400">
                <FiCpu />
                Hasil Analisis AI
              </h3>
              <div className="prose prose-sm prose-invert max-w-none text-sm max-h-96 overflow-y-auto">
                <ReactMarkdown>{indicatorAIAnalysis.analysis}</ReactMarkdown>
              </div>
              <div className="mt-3 text-xs text-gray-500 border-t border-gray-700 pt-2">
                Model: {indicatorAIAnalysis.model} | Tokens: {indicatorAIAnalysis.usage?.total_tokens}
              </div>
              
              {/* Prompt Display Toggle */}
              {indicatorAIAnalysis.prompt && (
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <button
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                  >
                    <FiCode className="w-4 h-4" />
                    <span>Lihat Prompt yang Dikirim</span>
                    {showPrompt ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {showPrompt && (
                    <div className="mt-3 space-y-3">
                      <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-purple-400">📋 System Prompt:</div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(indicatorAIAnalysis.prompt.system)
                              toast.success('System prompt copied!')
                            }}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                            title="Copy to clipboard"
                          >
                            <FiCopy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">{indicatorAIAnalysis.prompt.system}</pre>
                      </div>
                      <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-green-400">👤 User Prompt:</div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(indicatorAIAnalysis.prompt.user)
                              toast.success('User prompt copied!')
                            }}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                            title="Copy to clipboard"
                          >
                            <FiCopy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-64 overflow-y-auto">{indicatorAIAnalysis.prompt.user}</pre>
                      </div>
                      <button
                        onClick={() => {
                          const fullPrompt = `System Prompt:\n${indicatorAIAnalysis.prompt.system}\n\nUser Prompt:\n${indicatorAIAnalysis.prompt.user}`
                          navigator.clipboard.writeText(fullPrompt)
                          toast.success('Full prompt copied!')
                        }}
                        className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm flex items-center justify-center gap-2"
                      >
                        <FiCopy className="w-4 h-4" />
                        Copy Full Prompt
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IndicatorAnalysis
