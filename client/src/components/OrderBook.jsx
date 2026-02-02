import { useState, useEffect } from 'react'
import { FiRefreshCw, FiInfo } from 'react-icons/fi'
import { stockApi } from '../services/api'

function OrderBook({ symbol }) {
  const [orderBook, setOrderBook] = useState(null)
  const [brokerSummary, setBrokerSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('orderbook')

  useEffect(() => {
    if (symbol) {
      fetchData()
    }
  }, [symbol])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [ob, broker] = await Promise.all([
        stockApi.getOrderBook(symbol),
        stockApi.getBrokerSummary(symbol)
      ])
      setOrderBook(ob)
      setBrokerSummary(broker)
    } catch (error) {
      console.error('Error fetching order book:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (!num) return '-'
    return num.toLocaleString('id-ID')
  }

  const formatVolume = (vol) => {
    if (!vol) return '-'
    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M'
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K'
    return vol.toString()
  }

  const maxBidVolume = orderBook?.bids ? Math.max(...orderBook.bids.map(b => b.volume)) : 1
  const maxAskVolume = orderBook?.asks ? Math.max(...orderBook.asks.map(a => a.volume)) : 1

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('orderbook')}
            className={`px-3 py-1 rounded-lg text-sm ${
              activeTab === 'orderbook'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveTab('broker')}
            className={`px-3 py-1 rounded-lg text-sm ${
              activeTab === 'broker'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Broker Summary
          </button>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {activeTab === 'orderbook' && orderBook && (
        <>
          {/* Order Book Table */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bid Side (Buy) */}
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2 text-center">
                BID (Beli)
              </h4>
              <div className="space-y-1">
                {orderBook.bids?.map((bid, idx) => (
                  <div key={idx} className="relative">
                    {/* Volume bar */}
                    <div
                      className="absolute inset-y-0 right-0 bg-green-600/20"
                      style={{ width: `${(bid.volume / maxBidVolume) * 100}%` }}
                    />
                    <div className="relative flex justify-between text-sm px-2 py-1">
                      <span className="text-gray-400">{formatVolume(bid.volume)}</span>
                      <span className="text-green-400 font-medium">
                        {formatNumber(bid.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700 text-center">
                <span className="text-xs text-gray-400">Total: </span>
                <span className="text-sm text-green-400 font-medium">
                  {formatVolume(orderBook.totalBidVolume)}
                </span>
              </div>
            </div>

            {/* Ask Side (Sell) */}
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2 text-center">
                ASK (Jual)
              </h4>
              <div className="space-y-1">
                {orderBook.asks?.map((ask, idx) => (
                  <div key={idx} className="relative">
                    {/* Volume bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-red-600/20"
                      style={{ width: `${(ask.volume / maxAskVolume) * 100}%` }}
                    />
                    <div className="relative flex justify-between text-sm px-2 py-1">
                      <span className="text-red-400 font-medium">
                        {formatNumber(ask.price)}
                      </span>
                      <span className="text-gray-400">{formatVolume(ask.volume)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700 text-center">
                <span className="text-xs text-gray-400">Total: </span>
                <span className="text-sm text-red-400 font-medium">
                  {formatVolume(orderBook.totalAskVolume)}
                </span>
              </div>
            </div>
          </div>

          {/* Bid/Ask Ratio */}
          {orderBook.totalBidVolume && orderBook.totalAskVolume && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Bid Pressure</span>
                <span>Ask Pressure</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
                <div
                  className="bg-green-500 transition-all"
                  style={{
                    width: `${(orderBook.totalBidVolume / (orderBook.totalBidVolume + orderBook.totalAskVolume)) * 100}%`
                  }}
                />
                <div
                  className="bg-red-500 transition-all"
                  style={{
                    width: `${(orderBook.totalAskVolume / (orderBook.totalBidVolume + orderBook.totalAskVolume)) * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-green-400">
                  {((orderBook.totalBidVolume / (orderBook.totalBidVolume + orderBook.totalAskVolume)) * 100).toFixed(1)}%
                </span>
                <span className="text-red-400">
                  {((orderBook.totalAskVolume / (orderBook.totalBidVolume + orderBook.totalAskVolume)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Info note */}
          {orderBook.note && (
            <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-200">{orderBook.note}</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'broker' && brokerSummary && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Top Buyers */}
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Top Buyer</h4>
              <div className="space-y-2">
                {brokerSummary.topBuyers?.map((buyer, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">#{idx + 1}</span>
                      <span className="font-medium text-green-400">{buyer.broker}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{formatVolume(buyer.volume)}</div>
                      <div className="text-xs text-gray-400">{buyer.frequency} transaksi</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Sellers */}
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">Top Seller</h4>
              <div className="space-y-2">
                {brokerSummary.topSellers?.map((seller, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">#{idx + 1}</span>
                      <span className="font-medium text-red-400">{seller.broker}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{formatVolume(seller.volume)}</div>
                      <div className="text-xs text-gray-400">{seller.frequency} transaksi</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Net Foreign Flow */}
          {brokerSummary.netForeignFlow !== undefined && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-400">Net Foreign Flow</div>
              <div className={`text-xl font-bold ${
                brokerSummary.netForeignFlow >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {brokerSummary.netForeignFlow >= 0 ? '+' : ''}{formatVolume(brokerSummary.netForeignFlow)} lot
              </div>
            </div>
          )}

          {/* Info note */}
          {brokerSummary.note && (
            <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-200">{brokerSummary.note}</p>
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <FiRefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  )
}

export default OrderBook
