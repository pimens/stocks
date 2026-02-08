import { useState, useEffect } from 'react'
import { FiArrowLeft, FiRefreshCw, FiCpu } from 'react-icons/fi'
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

function StockDetail({ stock, onBack }) {
  const [fullData, setFullData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [timeRange, setTimeRange] = useState('3mo')
  const [showIndicator, setShowIndicator] = useState('price')
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001')

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
    </div>
  )
}

export default StockDetail
