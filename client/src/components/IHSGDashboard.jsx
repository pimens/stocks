import { useState, useEffect, useCallback } from 'react'
import { FiTrendingUp, FiTrendingDown, FiRefreshCw, FiClock, FiBarChart2 } from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

export default function IHSGDashboard() {
  const [ihsgData, setIhsgData] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [period, setPeriod] = useState('1mo') // 1d, 5d, 1mo, 3mo, 6mo, 1y, ytd

  const fetchIHSGData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch IHSG data (^JKSE is the Yahoo Finance symbol for IHSG)
      const response = await fetch(`${API_BASE}/stocks/quote?symbols=^JKSE`)
      const data = await response.json()
      
      if (data.quotes && data.quotes.length > 0) {
        setIhsgData(data.quotes[0])
      }
      
      // Fetch historical data
      const histResponse = await fetch(`${API_BASE}/stocks/history?symbol=^JKSE&period=${period}`)
      const histData = await histResponse.json()
      
      if (histData.history) {
        setHistoricalData(histData.history)
      }
      
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching IHSG data:', err)
      setError('Gagal mengambil data IHSG')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchIHSGData()
    
    // Auto refresh every 1 minute during market hours
    const interval = setInterval(() => {
      const now = new Date()
      const hours = now.getHours()
      const day = now.getDay()
      
      // Market hours: Mon-Fri, 9:00-16:00 WIB
      if (day >= 1 && day <= 5 && hours >= 9 && hours < 16) {
        fetchIHSGData()
      }
    }, 60000)
    
    return () => clearInterval(interval)
  }, [fetchIHSGData])

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatPercent = (num) => {
    if (num === null || num === undefined) return '-'
    const sign = num >= 0 ? '+' : ''
    return sign + num.toFixed(2) + '%'
  }

  const formatVolume = (num) => {
    if (num === null || num === undefined) return '-'
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
    return num.toLocaleString('id-ID')
  }

  const isPositive = ihsgData?.change >= 0

  // Calculate chart dimensions
  const chartWidth = 800
  const chartHeight = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 60 }

  // Generate SVG path for chart
  const generateChartPath = () => {
    if (!historicalData || historicalData.length === 0) return ''
    
    const prices = historicalData.map(d => d.close).filter(p => p != null)
    if (prices.length === 0) return ''
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom
    
    const points = historicalData.map((d, i) => {
      const x = padding.left + (i / (historicalData.length - 1)) * innerWidth
      const y = padding.top + innerHeight - ((d.close - minPrice) / priceRange) * innerHeight
      return `${x},${y}`
    }).join(' L ')
    
    return `M ${points}`
  }

  // Generate area fill path
  const generateAreaPath = () => {
    if (!historicalData || historicalData.length === 0) return ''
    
    const prices = historicalData.map(d => d.close).filter(p => p != null)
    if (prices.length === 0) return ''
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom
    
    const points = historicalData.map((d, i) => {
      const x = padding.left + (i / (historicalData.length - 1)) * innerWidth
      const y = padding.top + innerHeight - ((d.close - minPrice) / priceRange) * innerHeight
      return `${x},${y}`
    })
    
    const firstX = padding.left
    const lastX = padding.left + innerWidth
    const bottomY = padding.top + innerHeight
    
    return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`
  }

  // Get price labels for Y axis
  const getPriceLabels = () => {
    if (!historicalData || historicalData.length === 0) return []
    
    const prices = historicalData.map(d => d.close).filter(p => p != null)
    if (prices.length === 0) return []
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    const labels = []
    const step = (maxPrice - minPrice) / 4
    for (let i = 0; i <= 4; i++) {
      labels.push(minPrice + step * i)
    }
    return labels
  }

  const periods = [
    { value: '1d', label: '1D' },
    { value: '5d', label: '5D' },
    { value: '1mo', label: '1M' },
    { value: '3mo', label: '3M' },
    { value: '6mo', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: 'ytd', label: 'YTD' },
  ]

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiBarChart2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">IHSG</h2>
              <p className="text-sm text-gray-400">Indeks Harga Saham Gabungan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                Update: {lastUpdate.toLocaleTimeString('id-ID')}
              </span>
            )}
            <button
              onClick={fetchIHSGData}
              disabled={loading}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              <FiRefreshCw className={`w-5 h-5 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4 text-red-400">
            ⚠️ {error}
          </div>
        )}

        {ihsgData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Price */}
            <div className="md:col-span-2 bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Nilai Indeks</p>
                  <p className="text-4xl font-bold text-white">
                    {formatNumber(ihsgData.price || ihsgData.regularMarketPrice)}
                  </p>
                </div>
                <div className={`flex items-center gap-2 pb-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <FiTrendingUp className="w-6 h-6" /> : <FiTrendingDown className="w-6 h-6" />}
                  <div>
                    <p className="text-lg font-semibold">
                      {isPositive ? '+' : ''}{formatNumber(ihsgData.change)}
                    </p>
                    <p className="text-sm">
                      ({formatPercent(ihsgData.changePercent || ihsgData.regularMarketChangePercent)})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Open</span>
                  <span className="text-white font-medium">{formatNumber(ihsgData.open || ihsgData.regularMarketOpen)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">High</span>
                  <span className="text-green-400 font-medium">{formatNumber(ihsgData.high || ihsgData.regularMarketDayHigh)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Low</span>
                  <span className="text-red-400 font-medium">{formatNumber(ihsgData.low || ihsgData.regularMarketDayLow)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Prev Close</span>
                  <span className="text-white font-medium">{formatNumber(ihsgData.previousClose || ihsgData.regularMarketPreviousClose)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Volume</span>
                  <span className="text-white font-medium">{formatVolume(ihsgData.volume || ihsgData.regularMarketVolume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">52W Range</span>
                  <span className="text-white font-medium text-xs">
                    {formatNumber(ihsgData.fiftyTwoWeekLow)} - {formatNumber(ihsgData.fiftyTwoWeekHigh)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Card */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">📈 Grafik IHSG</h3>
          
          {/* Period Selector */}
          <div className="flex gap-1 bg-gray-700/50 rounded-lg p-1">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading && historicalData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : historicalData.length > 0 ? (
          <div className="overflow-x-auto">
            <svg width={chartWidth} height={chartHeight} className="w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {/* Grid lines */}
              {getPriceLabels().map((price, i) => {
                const y = padding.top + (chartHeight - padding.top - padding.bottom) * (1 - i / 4)
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#374151"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      fill="#9CA3AF"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {formatNumber(price)}
                    </text>
                  </g>
                )
              })}
              
              {/* Area fill */}
              <path
                d={generateAreaPath()}
                fill={isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
              />
              
              {/* Line */}
              <path
                d={generateChartPath()}
                fill="none"
                stroke={isPositive ? '#22C55E' : '#EF4444'}
                strokeWidth="2"
              />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            Tidak ada data historis
          </div>
        )}

        {/* Chart Stats */}
        {historicalData.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
            <div>
              <p className="text-xs text-gray-500">Tertinggi</p>
              <p className="text-green-400 font-semibold">
                {formatNumber(Math.max(...historicalData.map(d => d.high).filter(h => h != null)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Terendah</p>
              <p className="text-red-400 font-semibold">
                {formatNumber(Math.min(...historicalData.map(d => d.low).filter(l => l != null)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rata-rata</p>
              <p className="text-white font-semibold">
                {formatNumber(historicalData.reduce((sum, d) => sum + (d.close || 0), 0) / historicalData.length)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Data Points</p>
              <p className="text-white font-semibold">{historicalData.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Market Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ℹ️ Info Pasar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Jam Perdagangan</p>
            <p className="text-white font-medium">Senin - Jumat</p>
            <p className="text-gray-400 text-sm">09:00 - 16:00 WIB</p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Sesi 1</p>
            <p className="text-white font-medium">09:00 - 12:00 WIB</p>
            <p className="text-gray-400 text-sm">Pre-opening: 08:45 - 09:00</p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Sesi 2</p>
            <p className="text-white font-medium">13:30 - 16:00 WIB</p>
            <p className="text-gray-400 text-sm">Pre-closing: 15:50 - 16:00</p>
          </div>
        </div>

        {/* Market Status */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          {(() => {
            const now = new Date()
            const hours = now.getHours()
            const minutes = now.getMinutes()
            const day = now.getDay()
            const time = hours * 60 + minutes
            
            let status = 'closed'
            let statusText = '🔴 Pasar Tutup'
            let statusColor = 'text-red-400'
            
            if (day >= 1 && day <= 5) {
              if (time >= 525 && time < 540) { // 08:45 - 09:00
                status = 'pre-open'
                statusText = '🟡 Pre-Opening'
                statusColor = 'text-yellow-400'
              } else if (time >= 540 && time < 720) { // 09:00 - 12:00
                status = 'open'
                statusText = '🟢 Sesi 1 Berjalan'
                statusColor = 'text-green-400'
              } else if (time >= 720 && time < 810) { // 12:00 - 13:30
                status = 'break'
                statusText = '🟡 Istirahat'
                statusColor = 'text-yellow-400'
              } else if (time >= 810 && time < 950) { // 13:30 - 15:50
                status = 'open'
                statusText = '🟢 Sesi 2 Berjalan'
                statusColor = 'text-green-400'
              } else if (time >= 950 && time < 960) { // 15:50 - 16:00
                status = 'pre-close'
                statusText = '🟡 Pre-Closing'
                statusColor = 'text-yellow-400'
              }
            }
            
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Status Pasar</p>
                  <p className={`text-lg font-semibold ${statusColor}`}>{statusText}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Waktu Saat Ini</p>
                  <p className="text-white font-medium">
                    {now.toLocaleString('id-ID', { 
                      weekday: 'long', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      timeZone: 'Asia/Jakarta'
                    })} WIB
                  </p>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Historical Data Table */}
      {historicalData.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Data Historis ({period.toUpperCase()})</h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 px-3 text-gray-400">Tanggal</th>
                  <th className="text-right py-2 px-3 text-gray-400">Open</th>
                  <th className="text-right py-2 px-3 text-gray-400">High</th>
                  <th className="text-right py-2 px-3 text-gray-400">Low</th>
                  <th className="text-right py-2 px-3 text-gray-400">Close</th>
                  <th className="text-right py-2 px-3 text-gray-400">Volume</th>
                  <th className="text-right py-2 px-3 text-gray-400">Change</th>
                </tr>
              </thead>
              <tbody>
                {[...historicalData].reverse().slice(0, 30).map((row, idx, arr) => {
                  const prevClose = idx < arr.length - 1 ? arr[idx + 1].close : row.open
                  const change = ((row.close - prevClose) / prevClose) * 100
                  const isUp = change >= 0
                  
                  return (
                    <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-2 px-3 text-white">
                        {new Date(row.date).toLocaleDateString('id-ID', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-300">{formatNumber(row.open)}</td>
                      <td className="py-2 px-3 text-right text-green-400">{formatNumber(row.high)}</td>
                      <td className="py-2 px-3 text-right text-red-400">{formatNumber(row.low)}</td>
                      <td className="py-2 px-3 text-right text-white font-medium">{formatNumber(row.close)}</td>
                      <td className="py-2 px-3 text-right text-gray-400">{formatVolume(row.volume)}</td>
                      <td className={`py-2 px-3 text-right font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(change)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
