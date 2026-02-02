import { useState, useMemo } from 'react'
import { stockApi } from '../services/api'
import * as XLSX from 'xlsx'

// Column groups for better organization
const COLUMN_GROUPS = {
  basic: {
    label: 'Basic Info',
    columns: ['symbol', 'date', 'prevDate', 'target', 'priceChange', 'priceChangePercent', 'prevClose', 'currentClose', 'prevOpen', 'prevHigh', 'prevLow', 'prevVolume']
  },
  sma: {
    label: 'SMA Indicators',
    columns: ['sma5', 'sma10', 'sma20', 'sma50', 'priceAboveSMA5', 'priceAboveSMA10', 'priceAboveSMA20', 'priceAboveSMA50', 'sma5AboveSMA10', 'sma10AboveSMA20', 'sma20AboveSMA50']
  },
  ema: {
    label: 'EMA Indicators',
    columns: ['ema5', 'ema10', 'ema12', 'ema26', 'priceAboveEMA12', 'priceAboveEMA26']
  },
  rsi: {
    label: 'RSI Indicators',
    columns: ['rsi', 'rsiOversold', 'rsiOverbought', 'rsiNeutral']
  },
  macd: {
    label: 'MACD Indicators',
    columns: ['macd', 'macdSignal', 'macdHistogram', 'macdBullish', 'macdPositive']
  },
  bollinger: {
    label: 'Bollinger Bands',
    columns: ['bbUpper', 'bbMiddle', 'bbLower', 'bbWidth', 'priceBelowLowerBB', 'priceAboveUpperBB']
  },
  stochastic: {
    label: 'Stochastic',
    columns: ['stochK', 'stochD', 'stochOversold', 'stochOverbought', 'stochBullishCross']
  },
  adx: {
    label: 'ADX/DMI',
    columns: ['adx', 'pdi', 'mdi', 'strongTrend', 'bullishDI']
  },
  volatility: {
    label: 'Volatility',
    columns: ['atr', 'atrPercent']
  },
  volume: {
    label: 'Volume Indicators',
    columns: ['obv', 'volumeRatio', 'highVolume']
  },
  oscillators: {
    label: 'Other Oscillators',
    columns: ['williamsR', 'williamsROversold', 'williamsROverbought', 'cci', 'cciOversold', 'cciOverbought', 'mfi', 'mfiOversold', 'mfiOverbought']
  },
  momentum: {
    label: 'Momentum',
    columns: ['roc', 'rocPositive', 'momentum', 'momentumPositive', 'pricePosition']
  },
  candlestick: {
    label: 'Candlestick Patterns',
    columns: ['bodySize', 'upperWick', 'lowerWick', 'isBullishCandle', 'isDoji', 'gapUp', 'gapDown']
  },
  returns: {
    label: 'Historical Returns',
    columns: ['return1d', 'return3d', 'return5d']
  }
}

const POPULAR_STOCKS = [
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'UNVR', 'HMSP', 'GGRM', 'ICBP',
  'INDF', 'KLBF', 'PGAS', 'SMGR', 'UNTR', 'WIKA', 'PTBA', 'ANTM', 'INCO', 'EXCL',
  'ISAT', 'ADRO', 'ITMG', 'MEDC', 'CPIN', 'JPFA', 'BRIS', 'ACES', 'ERAA', 'MAPI'
]

export default function RegressionData() {
  const [selectedStocks, setSelectedStocks] = useState([])
  const [customStock, setCustomStock] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [visibleColumns, setVisibleColumns] = useState(['basic', 'rsi', 'macd', 'adx'])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterSymbol, setFilterSymbol] = useState('')
  const [filterTarget, setFilterTarget] = useState('all')

  // Get default dates (last 3 months)
  const getDefaultDates = () => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 3)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const handleAddStock = (stock) => {
    const stockCode = stock.toUpperCase().trim()
    if (stockCode && !selectedStocks.includes(stockCode)) {
      setSelectedStocks([...selectedStocks, stockCode])
    }
    setCustomStock('')
  }

  const handleRemoveStock = (stock) => {
    setSelectedStocks(selectedStocks.filter(s => s !== stock))
  }

  const handleSelectAll = () => {
    setSelectedStocks([...new Set([...selectedStocks, ...POPULAR_STOCKS])])
  }

  const handleClearAll = () => {
    setSelectedStocks([])
  }

  const toggleColumnGroup = (group) => {
    if (visibleColumns.includes(group)) {
      setVisibleColumns(visibleColumns.filter(g => g !== group))
    } else {
      setVisibleColumns([...visibleColumns, group])
    }
  }

  const handleFetchData = async () => {
    if (selectedStocks.length === 0) {
      setError('Silakan pilih minimal satu saham')
      return
    }

    if (!startDate || !endDate) {
      const defaults = getDefaultDates()
      if (!startDate) setStartDate(defaults.start)
      if (!endDate) setEndDate(defaults.end)
    }

    setLoading(true)
    setError(null)

    try {
      const result = await stockApi.getRegressionData(
        selectedStocks,
        startDate || getDefaultDates().start,
        endDate || getDefaultDates().end
      )
      setData(result)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get visible columns based on selected groups
  const displayColumns = useMemo(() => {
    const cols = []
    visibleColumns.forEach(group => {
      if (COLUMN_GROUPS[group]) {
        cols.push(...COLUMN_GROUPS[group].columns)
      }
    })
    return cols
  }, [visibleColumns])

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data?.data) return []
    
    let filtered = [...data.data]
    
    // Filter by symbol
    if (filterSymbol) {
      filtered = filtered.filter(row => row.symbol.includes(filterSymbol.toUpperCase()))
    }
    
    // Filter by target
    if (filterTarget !== 'all') {
      const targetValue = filterTarget === 'up' ? 1 : 0
      filtered = filtered.filter(row => row.target === targetValue)
    }
    
    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal === null) return 1
        if (bVal === null) return -1
        
        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal)
        }
        
        return sortConfig.direction === 'asc' 
          ? aVal - bVal 
          : bVal - aVal
      })
    }
    
    return filtered
  }, [data, filterSymbol, filterTarget, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const exportToExcel = () => {
    if (!data?.data || data.data.length === 0) return

    // Create worksheet from all data
    const ws = XLSX.utils.json_to_sheet(data.data)
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Regression Data')
    
    // Add summary sheet
    const summaryData = [
      ['Summary Statistics'],
      ['Total Records', data.summary.totalRecords],
      ['Symbols Processed', data.summary.symbolsProcessed],
      ['Date Range', `${data.summary.dateRange.start} to ${data.summary.dateRange.end}`],
      [''],
      ['Target Distribution'],
      ['Up (1)', data.summary.targetDistribution.up],
      ['Down (0)', data.summary.targetDistribution.down],
      ['Up Percentage', `${data.summary.targetDistribution.upPercent}%`],
    ]
    
    if (data.summary.errors) {
      summaryData.push([''], ['Errors'])
      data.summary.errors.forEach(err => {
        summaryData.push([err.symbol, err.error])
      })
    }
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
    
    // Generate filename with date
    const filename = `regression_data_${selectedStocks.join('_')}_${startDate}_${endDate}.xlsx`
    
    // Download
    XLSX.writeFile(wb, filename)
  }

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '-'
    
    // Format numbers
    if (typeof value === 'number') {
      // Percentage values
      if (key.includes('Percent') || key.includes('percent')) {
        return `${value.toFixed(2)}%`
      }
      // Large numbers
      if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M'
      }
      if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(2) + 'K'
      }
      // Decimal values
      if (!Number.isInteger(value)) {
        return value.toFixed(2)
      }
    }
    
    return value
  }

  const getTargetBadge = (target) => {
    if (target === 1) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-900/50 text-green-400">↑ NAIK</span>
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900/50 text-red-400">↓ TURUN</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-purple-400 mb-2">📊 Data Regresi - Prediksi Saham</h2>
        <p className="text-gray-400">
          Dapatkan data historis dengan indikator teknikal untuk membangun model regresi prediksi saham naik/turun.
          Indikator dihitung dari hari sebelumnya (H-1), target dari hari H.
        </p>
      </div>

      {/* Stock Selection */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">1. Pilih Saham</h3>
        
        {/* Custom input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={customStock}
            onChange={(e) => setCustomStock(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddStock(customStock)}
            placeholder="Masukkan kode saham (contoh: BBCA)"
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleAddStock(customStock)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Tambah
          </button>
        </div>

        {/* Quick select buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Pilih Semua Populer
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition"
          >
            Hapus Semua
          </button>
        </div>

        {/* Popular stocks grid */}
        <div className="flex flex-wrap gap-2 mb-4">
          {POPULAR_STOCKS.map(stock => (
            <button
              key={stock}
              onClick={() => selectedStocks.includes(stock) ? handleRemoveStock(stock) : handleAddStock(stock)}
              className={`px-3 py-1 text-sm rounded transition ${
                selectedStocks.includes(stock)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {stock}
            </button>
          ))}
        </div>

        {/* Selected stocks */}
        {selectedStocks.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Saham terpilih ({selectedStocks.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedStocks.map(stock => (
                <span
                  key={stock}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm"
                >
                  {stock}
                  <button
                    onClick={() => handleRemoveStock(stock)}
                    className="hover:text-red-400 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">2. Rentang Tanggal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Jika tidak diisi, akan menggunakan 3 bulan terakhir
        </p>
      </div>

      {/* Column Selection */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">3. Pilih Kolom Indikator</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COLUMN_GROUPS).map(([key, group]) => (
            <button
              key={key}
              onClick={() => toggleColumnGroup(key)}
              className={`px-3 py-2 text-sm rounded-lg transition ${
                visibleColumns.includes(key)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {group.label} ({group.columns.length})
            </button>
          ))}
        </div>
      </div>

      {/* Fetch Button */}
      <div className="flex justify-center">
        <button
          onClick={handleFetchData}
          disabled={loading || selectedStocks.length === 0}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Memproses...
            </span>
          ) : (
            '📊 Tampilkan Data'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">📈 Ringkasan Data</h3>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-white">{data.summary.totalRecords.toLocaleString()}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Saham Diproses</p>
                <p className="text-2xl font-bold text-white">{data.summary.symbolsProcessed}</p>
              </div>
              <div className="bg-green-900/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Target Naik (1)</p>
                <p className="text-2xl font-bold text-green-400">
                  {data.summary.targetDistribution.up.toLocaleString()}
                  <span className="text-sm ml-1">({data.summary.targetDistribution.upPercent}%)</span>
                </p>
              </div>
              <div className="bg-red-900/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Target Turun (0)</p>
                <p className="text-2xl font-bold text-red-400">
                  {data.summary.targetDistribution.down.toLocaleString()}
                  <span className="text-sm ml-1">({(100 - parseFloat(data.summary.targetDistribution.upPercent)).toFixed(2)}%)</span>
                </p>
              </div>
            </div>

            {data.summary.errors && data.summary.errors.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ Beberapa saham gagal diproses:</p>
                {data.summary.errors.map((err, i) => (
                  <p key={i} className="text-yellow-300 text-xs">{err.symbol}: {err.error}</p>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Filter Symbol</label>
                <input
                  type="text"
                  value={filterSymbol}
                  onChange={(e) => setFilterSymbol(e.target.value)}
                  placeholder="Cari..."
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Filter Target</label>
                <select
                  value={filterTarget}
                  onChange={(e) => setFilterTarget(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Semua</option>
                  <option value="up">Naik (1)</option>
                  <option value="down">Turun (0)</option>
                </select>
              </div>
              <div className="ml-auto text-sm text-gray-400">
                Menampilkan {processedData.length.toLocaleString()} dari {data.data.length.toLocaleString()} records
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/80 sticky top-0">
                  <tr>
                    {displayColumns.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          {col}
                          {sortConfig.key === col && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {processedData.slice(0, 500).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/30">
                      {displayColumns.map(col => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap">
                          {col === 'target' ? (
                            getTargetBadge(row[col])
                          ) : col === 'priceChange' ? (
                            <span className={row[col] >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {formatValue(row[col], col)}
                            </span>
                          ) : col === 'priceChangePercent' ? (
                            <span className={row[col] >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {row[col] >= 0 ? '+' : ''}{formatValue(row[col], col)}
                            </span>
                          ) : (
                            <span className="text-gray-300">{formatValue(row[col], col)}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processedData.length > 500 && (
              <div className="p-3 bg-gray-900/50 text-center text-gray-400 text-sm">
                Menampilkan 500 dari {processedData.length.toLocaleString()} records. Export ke Excel untuk melihat semua data.
              </div>
            )}
          </div>

          {/* Column Legend */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📚 Penjelasan Kolom</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Target & Harga</h4>
                <ul className="space-y-1 text-gray-400">
                  <li><code className="text-yellow-400">target</code>: 1=Naik, 0=Turun (hari H)</li>
                  <li><code className="text-yellow-400">prevClose</code>: Harga close H-1</li>
                  <li><code className="text-yellow-400">currentClose</code>: Harga close hari H</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Moving Averages</h4>
                <ul className="space-y-1 text-gray-400">
                  <li><code className="text-yellow-400">sma5/10/20/50</code>: Simple MA</li>
                  <li><code className="text-yellow-400">ema5/10/12/26</code>: Exponential MA</li>
                  <li><code className="text-yellow-400">priceAboveSMA*</code>: Signal binary</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Oscillators</h4>
                <ul className="space-y-1 text-gray-400">
                  <li><code className="text-yellow-400">rsi</code>: Relative Strength Index</li>
                  <li><code className="text-yellow-400">stochK/D</code>: Stochastic</li>
                  <li><code className="text-yellow-400">williamsR</code>: Williams %R</li>
                  <li><code className="text-yellow-400">cci</code>: Commodity Channel Index</li>
                  <li><code className="text-yellow-400">mfi</code>: Money Flow Index</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">MACD</h4>
                <ul className="space-y-1 text-gray-400">
                  <li><code className="text-yellow-400">macd</code>: MACD line</li>
                  <li><code className="text-yellow-400">macdSignal</code>: Signal line</li>
                  <li><code className="text-yellow-400">macdHistogram</code>: Histogram</li>
                  <li><code className="text-yellow-400">macdBullish</code>: MACD &gt; Signal</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Volatility & Volume</h4>
                <ul className="space-y-1 text-gray-400">
                  <li><code className="text-yellow-400">atr</code>: Average True Range</li>
                  <li><code className="text-yellow-400">bbWidth</code>: Bollinger Band Width</li>
                  <li><code className="text-yellow-400">obv</code>: On Balance Volume</li>
                  <li><code className="text-yellow-400">volumeRatio</code>: Vol vs Avg</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Trend & Momentum</h4>
                <ul className="space-y-1 text-gray-400">
                  <li><code className="text-yellow-400">adx</code>: Trend strength</li>
                  <li><code className="text-yellow-400">pdi/mdi</code>: +DI/-DI</li>
                  <li><code className="text-yellow-400">roc</code>: Rate of Change</li>
                  <li><code className="text-yellow-400">momentum</code>: Price momentum</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
