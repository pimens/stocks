import { useState, useEffect } from 'react'
import { FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMinus, FiEye } from 'react-icons/fi'
import { stockApi } from '../services/api'
import { toast } from 'react-toastify'

function StockList({ selectedStocks, stockData, setStockData, filters, isLoading, setIsLoading, onSelectStock }) {
  
  const fetchStockData = async () => {
    if (selectedStocks.length === 0) {
      toast.warning('Pilih saham terlebih dahulu')
      return
    }

    setIsLoading(true)
    try {
      // Check if there are active filters
      const hasFilters = Object.values(filters).some(v => v === true)
      
      let data
      if (hasFilters) {
        data = await stockApi.screenStocks(selectedStocks, filters)
      } else {
        data = await stockApi.getBatchData(selectedStocks)
      }
      
      setStockData(data)
      toast.success(`Data ${data.length} saham berhasil dimuat`)
    } catch (error) {
      console.error('Error fetching stock data:', error)
      toast.error('Gagal mengambil data saham')
    } finally {
      setIsLoading(false)
    }
  }

  const getSignalBadge = (signals) => {
    if (!signals || signals.length === 0) {
      return <span className="badge-hold">HOLD</span>
    }
    
    const buySignals = signals.filter(s => s.type === 'BUY').length
    const sellSignals = signals.filter(s => s.type === 'SELL').length
    
    if (buySignals > sellSignals) {
      return <span className="badge-buy">BUY ({buySignals})</span>
    } else if (sellSignals > buySignals) {
      return <span className="badge-sell">SELL ({sellSignals})</span>
    }
    return <span className="badge-hold">NETRAL</span>
  }

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '-'
    return num.toLocaleString('id-ID')
  }

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '-'
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Hasil Screener</h2>
        <button
          onClick={fetchStockData}
          disabled={isLoading || selectedStocks.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Memuat...' : 'Analisa Sekarang'}
        </button>
      </div>

      {/* Info */}
      {selectedStocks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FiTrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Pilih saham terlebih dahulu dari daftar di samping</p>
          <p className="text-sm mt-2">atau ketik kode saham secara manual</p>
        </div>
      )}

      {selectedStocks.length > 0 && stockData.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-400">
          <p>Klik "Analisa Sekarang" untuk memulai screening</p>
          <p className="text-sm mt-2">{selectedStocks.length} saham dipilih</p>
        </div>
      )}

      {/* Results Table */}
      {stockData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-2">Kode</th>
                <th className="text-right py-3 px-2">Harga</th>
                <th className="text-right py-3 px-2">RSI</th>
                <th className="text-right py-3 px-2">MACD</th>
                <th className="text-center py-3 px-2">Sinyal</th>
                <th className="text-center py-3 px-2">Score</th>
                <th className="text-center py-3 px-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((stock) => (
                <tr 
                  key={stock.symbol} 
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="font-medium">{stock.symbol}</div>
                    {stock.error && (
                      <div className="text-xs text-red-400">{stock.error}</div>
                    )}
                  </td>
                  <td className="text-right py-3 px-2">
                    {stock.indicators?.current?.price ? (
                      <div>
                        <div className="font-medium">
                          Rp {formatNumber(stock.indicators.current.price)}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="text-right py-3 px-2">
                    {stock.indicators?.current?.rsi ? (
                      <span className={`font-medium ${
                        stock.indicators.current.rsi < 30 ? 'text-green-400' :
                        stock.indicators.current.rsi > 70 ? 'text-red-400' : 'text-gray-300'
                      }`}>
                        {stock.indicators.current.rsi.toFixed(1)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="text-right py-3 px-2">
                    {stock.indicators?.current?.macd ? (
                      <span className={`font-medium ${
                        stock.indicators.current.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stock.indicators.current.macd.histogram > 0 ? (
                          <FiTrendingUp className="inline w-4 h-4" />
                        ) : (
                          <FiTrendingDown className="inline w-4 h-4" />
                        )}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="text-center py-3 px-2">
                    {getSignalBadge(stock.signals)}
                  </td>
                  <td className="text-center py-3 px-2">
                    {stock.screening?.score !== undefined ? (
                      <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                        stock.screening.score >= 70 ? 'bg-green-600/30 text-green-400' :
                        stock.screening.score >= 40 ? 'bg-yellow-600/30 text-yellow-400' :
                        'bg-gray-600/30 text-gray-400'
                      }`}>
                        {stock.screening.score.toFixed(0)}%
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-2">
                    <button
                      onClick={() => onSelectStock(stock)}
                      className="p-2 hover:bg-blue-600/30 rounded-lg transition-colors text-blue-400"
                      title="Lihat Detail"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {stockData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {stockData.filter(s => s.signals?.some(sig => sig.type === 'BUY')).length}
            </div>
            <div className="text-xs text-gray-400">Sinyal Buy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {stockData.filter(s => !s.signals || s.signals.length === 0).length}
            </div>
            <div className="text-xs text-gray-400">Netral</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {stockData.filter(s => s.signals?.some(sig => sig.type === 'SELL')).length}
            </div>
            <div className="text-xs text-gray-400">Sinyal Sell</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockList
