import { useState, useEffect, useMemo } from 'react'
import { FiArrowLeft, FiRefreshCw, FiCpu, FiActivity, FiX, FiCheck, FiCalendar } from 'react-icons/fi'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { stockApi, aiApi } from '../services/api'
import { toast } from 'react-toastify'
import ReactMarkdown from 'react-markdown'
import OrderBook from './OrderBook'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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

function StockDetail({ stock, onBack }) {
  const [fullData, setFullData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [timeRange, setTimeRange] = useState('3mo')
  const [showIndicator, setShowIndicator] = useState('price')
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001')
  
  // Indicator Analysis State
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [indicatorDate, setIndicatorDate] = useState(new Date().toISOString().split('T')[0])
  const [useRealtime, setUseRealtime] = useState(true)
  const [selectedIndicators, setSelectedIndicators] = useState(new Set(ALL_INDICATORS))
  const [indicatorData, setIndicatorData] = useState(null)
  const [loadingIndicators, setLoadingIndicators] = useState(false)
  const [indicatorAIAnalysis, setIndicatorAIAnalysis] = useState(null)
  const [analyzingIndicators, setAnalyzingIndicators] = useState(false)
  const [indicatorSearch, setIndicatorSearch] = useState('')

  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return indicatorDate === today
  }, [indicatorDate])

  useEffect(() => {
    fetchFullData()
  }, [stock.symbol, timeRange])

  const fetchFullData = async () => {
    setIsLoading(true)
    try {
      const data = await stockApi.getStockData(stock.symbol, timeRange)
      setFullData(data)
    } catch (error) {
      console.error('Error fetching full data:', error)
      toast.error('Gagal mengambil data lengkap')
    } finally {
      setIsLoading(false)
    }
  }

  const getAIAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const result = await aiApi.analyzeStock(stock.symbol, selectedModel)
      setAiAnalysis(result.aiAnalysis)
      toast.success('Analisis AI berhasil!')
    } catch (error) {
      console.error('Error getting AI analysis:', error)
      toast.error(error.response?.data?.error || 'Gagal mendapatkan analisis AI')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Fetch 90+ indicators for specific date
  const fetchIndicators = async () => {
    setLoadingIndicators(true)
    setIndicatorData(null)
    setIndicatorAIAnalysis(null)
    try {
      const result = await stockApi.getLiveIndicators(
        stock.symbol,
        indicatorDate,
        isToday && useRealtime
      )
      setIndicatorData(result)
      toast.success(`Berhasil mengambil ${Object.keys(result.data || {}).length} indikator`)
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

  // Analyze selected indicators with AI
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

      // Call AI API with custom prompt
      const result = await aiApi.analyzeWithIndicators(
        stock.symbol, 
        selectedData, 
        indicatorDate,
        selectedModel
      )
      setIndicatorAIAnalysis(result.aiAnalysis)
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

  const chartData = fullData ? {
    labels: fullData.prices.map(p => p.date),
    datasets: [
      {
        label: 'Harga',
        data: fullData.prices.map(p => p.close),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2
      },
      ...(showIndicator === 'sma' ? [
        {
          label: 'SMA 20',
          data: fullData.indicators.series.sma20,
          borderColor: '#10b981',
          borderWidth: 1.5,
          pointRadius: 0
        },
        {
          label: 'SMA 50',
          data: fullData.indicators.series.sma50,
          borderColor: '#f59e0b',
          borderWidth: 1.5,
          pointRadius: 0
        }
      ] : []),
      ...(showIndicator === 'bb' && fullData.indicators.series.bollingerBands ? [
        {
          label: 'Upper BB',
          data: fullData.indicators.series.bollingerBands.map(b => b?.upper),
          borderColor: '#ef4444',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5]
        },
        {
          label: 'Lower BB',
          data: fullData.indicators.series.bollingerBands.map(b => b?.lower),
          borderColor: '#22c55e',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5]
        }
      ] : [])
    ]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#9ca3af'
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 10
        }
      },
      y: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    }
  }

  const rsiChartData = fullData ? {
    labels: fullData.prices.map(p => p.date),
    datasets: [
      {
        label: 'RSI',
        data: fullData.indicators.series.rsi,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 0
      }
    ]
  } : null

  const rsiOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100
      }
    },
    plugins: {
      ...chartOptions.plugins,
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            yMin: 30,
            yMax: 30,
            borderColor: '#22c55e',
            borderWidth: 1,
            borderDash: [5, 5]
          },
          line2: {
            type: 'line',
            yMin: 70,
            yMax: 70,
            borderColor: '#ef4444',
            borderWidth: 1,
            borderDash: [5, 5]
          }
        }
      }
    }
  }

  const indicators = fullData?.indicators?.current || stock.indicators?.current

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{stock.symbol}</h1>
              <p className="text-gray-400">Bursa Efek Indonesia (IDX)</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              Rp {indicators?.price?.toLocaleString('id-ID') || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Time Range & Indicator Selector */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {['1mo', '3mo', '6mo', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range.replace('mo', ' Bulan').replace('y', ' Tahun')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { key: 'price', label: 'Harga' },
            { key: 'sma', label: '+ SMA' },
            { key: 'bb', label: '+ Bollinger' }
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setShowIndicator(opt.key)}
              className={`px-3 py-1 rounded-lg text-sm ${
                showIndicator === opt.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Grafik Harga</h3>
        <div className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <FiRefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : null}
        </div>
      </div>

      {/* RSI Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">RSI (14)</h3>
        <div className="h-48">
          {rsiChartData && <Line data={rsiChartData} options={rsiOptions} />}
        </div>
      </div>

      {/* Order Book & Broker Summary */}
      <OrderBook symbol={stock.symbol} />

      {/* Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-sm text-gray-400">RSI (14)</div>
          <div className={`text-2xl font-bold ${
            indicators?.rsi < 30 ? 'text-green-400' :
            indicators?.rsi > 70 ? 'text-red-400' : 'text-white'
          }`}>
            {indicators?.rsi?.toFixed(2) || '-'}
          </div>
          <div className="text-xs text-gray-500">
            {indicators?.rsi < 30 ? 'Oversold' :
             indicators?.rsi > 70 ? 'Overbought' : 'Normal'}
          </div>
        </div>
        
        <div className="card text-center">
          <div className="text-sm text-gray-400">SMA 20</div>
          <div className="text-2xl font-bold">
            {indicators?.sma20?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '-'}
          </div>
          <div className="text-xs text-gray-500">
            {indicators?.price > indicators?.sma20 ? '↑ Above' : '↓ Below'}
          </div>
        </div>
        
        <div className="card text-center">
          <div className="text-sm text-gray-400">SMA 50</div>
          <div className="text-2xl font-bold">
            {indicators?.sma50?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '-'}
          </div>
          <div className="text-xs text-gray-500">
            {indicators?.price > indicators?.sma50 ? '↑ Above' : '↓ Below'}
          </div>
        </div>
        
        <div className="card text-center">
          <div className="text-sm text-gray-400">MACD</div>
          <div className={`text-2xl font-bold ${
            indicators?.macd?.histogram > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {indicators?.macd?.histogram?.toFixed(2) || '-'}
          </div>
          <div className="text-xs text-gray-500">
            {indicators?.macd?.histogram > 0 ? 'Bullish' : 'Bearish'}
          </div>
        </div>

        <div className="card text-center">
          <div className="text-sm text-gray-400">Stochastic K</div>
          <div className={`text-2xl font-bold ${
            indicators?.stochastic?.k < 20 ? 'text-green-400' :
            indicators?.stochastic?.k > 80 ? 'text-red-400' : 'text-white'
          }`}>
            {indicators?.stochastic?.k?.toFixed(2) || '-'}
          </div>
        </div>

        <div className="card text-center">
          <div className="text-sm text-gray-400">ADX</div>
          <div className="text-2xl font-bold">
            {indicators?.adx?.adx?.toFixed(2) || '-'}
          </div>
          <div className="text-xs text-gray-500">
            {indicators?.adx?.adx > 25 ? 'Strong Trend' : 'Weak Trend'}
          </div>
        </div>

        <div className="card text-center">
          <div className="text-sm text-gray-400">ATR</div>
          <div className="text-2xl font-bold">
            {indicators?.atr?.toFixed(2) || '-'}
          </div>
          <div className="text-xs text-gray-500">Volatility</div>
        </div>

        <div className="card text-center">
          <div className="text-sm text-gray-400">Bollinger %B</div>
          <div className="text-2xl font-bold">
            {indicators?.bollingerBands ? 
              ((indicators.price - indicators.bollingerBands.lower) / 
               (indicators.bollingerBands.upper - indicators.bollingerBands.lower) * 100).toFixed(1) + '%'
              : '-'}
          </div>
        </div>
      </div>

      {/* Signals */}
      {stock.signals && stock.signals.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Sinyal Trading</h3>
          <div className="space-y-2">
            {stock.signals.map((signal, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  signal.type === 'BUY' ? 'bg-green-600/20' : 'bg-red-600/20'
                }`}
              >
                <span className={signal.type === 'BUY' ? 'badge-buy' : 'badge-sell'}>
                  {signal.type}
                </span>
                <span className="font-medium">{signal.indicator}</span>
                <span className="text-gray-400">{signal.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiCpu className="text-purple-500" />
            Analisis AI (OpenRouter)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowIndicatorModal(true)}
              className="btn-secondary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              <FiActivity className="w-4 h-4" />
              Analisis 90+ Indikator
            </button>
            <button
              onClick={getAIAnalysis}
              disabled={isAnalyzing}
              className="btn-primary flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <FiCpu className="w-4 h-4" />
                  Minta Analisis AI
                </>
              )}
            </button>
          </div>
        </div>

        {aiAnalysis ? (
          <div className="prose max-w-none">
            <ReactMarkdown>{aiAnalysis.analysis}</ReactMarkdown>
            <div className="mt-4 text-xs text-gray-500">
              Model: {aiAnalysis.model} | Tokens: {aiAnalysis.usage?.total_tokens}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FiCpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Klik tombol di atas untuk mendapatkan analisis AI</p>
            <p className="text-sm mt-2">Pastikan API key OpenRouter sudah dikonfigurasi</p>
          </div>
        )}
      </div>

      {/* 90+ Indicators Modal */}
      {showIndicatorModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowIndicatorModal(false)}>
          <div className="bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-900/50 to-purple-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FiActivity className="text-blue-400" />
                  Analisis 90+ Indikator Teknikal - {stock.symbol}
                </h2>
                <p className="text-sm text-gray-400">Pilih tanggal dan indikator untuk dianalisis AI</p>
              </div>
              <button onClick={() => setShowIndicatorModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Date Selection */}
            <div className="p-4 border-b border-gray-700 bg-gray-900/50">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-blue-400" />
                  <label className="text-sm text-gray-400">Tanggal:</label>
                  <input
                    type="date"
                    value={indicatorDate}
                    onChange={(e) => setIndicatorDate(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                
                {isToday && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useRealtime}
                      onChange={(e) => setUseRealtime(e.target.checked)}
                      className="rounded bg-gray-700 border-gray-600 text-blue-600"
                    />
                    <span className="text-yellow-400">🔴 Data Realtime (Market Berjalan)</span>
                  </label>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setIndicatorDate(new Date().toISOString().split('T')[0])}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg"
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date()
                      d.setDate(d.getDate() - 1)
                      setIndicatorDate(d.toISOString().split('T')[0])
                    }}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg"
                  >
                    Kemarin
                  </button>
                </div>

                <button
                  onClick={fetchIndicators}
                  disabled={loadingIndicators}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
                >
                  {loadingIndicators ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      Mengambil...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="w-4 h-4" />
                      Ambil Data
                    </>
                  )}
                </button>
              </div>

              {indicatorData?.info && (
                <div className="mt-3 text-xs text-gray-400 flex items-center gap-4">
                  <span>📅 Data tanggal: <strong className="text-yellow-400">{indicatorData.info.indicatorDate}</strong></span>
                  {indicatorData.info.isRealtime && <span className="text-green-400">🔴 Realtime</span>}
                  {indicatorData.info.isFutureDate && <span className="text-orange-400">⚠️ Data terakhir tersedia</span>}
                </div>
              )}
            </div>

            {/* Main Content - 2 columns */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left: Indicator Selection */}
              <div className="w-1/2 border-r border-gray-700 flex flex-col">
                <div className="p-3 border-b border-gray-700 bg-gray-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">
                      Pilih Indikator ({selectedIndicators.size}/{ALL_INDICATORS.length})
                    </span>
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
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {Object.entries(filteredCategories).map(([category, data]) => {
                    const allSelected = data.indicators.every(ind => selectedIndicators.has(ind))
                    const someSelected = data.indicators.some(ind => selectedIndicators.has(ind))
                    
                    return (
                      <div key={category} className="bg-gray-900/50 rounded-lg p-2">
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 rounded p-1"
                          onClick={() => toggleCategory(category)}
                        >
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                            onChange={() => toggleCategory(category)}
                            className="rounded bg-gray-700 border-gray-600 text-blue-600"
                          />
                          <span className="text-lg">{data.icon}</span>
                          <span className="font-semibold text-white text-sm">{category}</span>
                          <span className="text-xs text-gray-500">({data.indicators.length})</span>
                        </div>
                        <div className="ml-6 mt-1 grid grid-cols-2 gap-1">
                          {data.indicators.map(ind => (
                            <label 
                              key={ind}
                              className={`flex items-center gap-1.5 text-xs p-1 rounded cursor-pointer hover:bg-gray-700/50 ${
                                selectedIndicators.has(ind) ? 'text-white' : 'text-gray-500'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIndicators.has(ind)}
                                onChange={() => toggleIndicator(ind)}
                                className="rounded bg-gray-700 border-gray-600 text-blue-600 w-3 h-3"
                              />
                              <span className="truncate">{ind}</span>
                              {indicatorData?.data && indicatorData.data[ind] !== undefined && (
                                <span className="text-blue-400 ml-auto">
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

              {/* Right: Data & Analysis */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 border-b border-gray-700 bg-gray-900/30 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Data & Analisis AI
                  </span>
                  <button
                    onClick={analyzeIndicatorsWithAI}
                    disabled={analyzingIndicators || !indicatorData?.data || selectedIndicators.size === 0}
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg flex items-center gap-2 text-sm"
                  >
                    {analyzingIndicators ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                        Menganalisis...
                      </>
                    ) : (
                      <>
                        <FiCpu className="w-4 h-4" />
                        Analisis dengan AI ({selectedIndicators.size} indikator)
                      </>
                    )}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {!indicatorData?.data ? (
                    <div className="text-center py-12 text-gray-400">
                      <FiActivity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Klik "Ambil Data" untuk mengambil nilai indikator</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selected Indicators Preview */}
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                          📊 Indikator Terpilih ({selectedIndicators.size})
                        </h4>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {Array.from(selectedIndicators).slice(0, 20).map(ind => (
                            <div key={ind} className="flex justify-between text-xs bg-gray-800/50 rounded px-2 py-1">
                              <span className="text-gray-400 truncate">{ind}</span>
                              <span className="text-white font-medium ml-2">
                                {formatIndicatorValue(ind, indicatorData.data[ind])}
                              </span>
                            </div>
                          ))}
                          {selectedIndicators.size > 20 && (
                            <div className="col-span-2 text-center text-xs text-gray-500">
                              ... dan {selectedIndicators.size - 20} indikator lainnya
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Analysis Result */}
                      {indicatorAIAnalysis ? (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                            <FiCpu /> Analisis AI
                          </h4>
                          <div className="prose prose-sm prose-invert max-w-none text-sm">
                            <ReactMarkdown>{indicatorAIAnalysis.analysis}</ReactMarkdown>
                          </div>
                          <div className="mt-3 text-xs text-gray-500 border-t border-gray-700 pt-2">
                            Model: {indicatorAIAnalysis.model} | Tokens: {indicatorAIAnalysis.usage?.total_tokens}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center text-gray-400">
                          <FiCpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Pilih indikator dan klik "Analisis dengan AI"</p>
                          <p className="text-xs mt-1">AI akan menganalisis {selectedIndicators.size} indikator yang dipilih</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockDetail
