import { useState, useMemo } from 'react'
import { FiStar, FiChevronDown, FiChevronUp, FiDollarSign } from 'react-icons/fi'
import { STOCK_PRICES, PRICE_RANGES, getStocksByPriceRange } from '../data/stockPrices'

// Popular stocks data with sectors
const POPULAR_STOCKS_DATA = [
  // Banking
  { code: 'BBCA', name: 'Bank Central Asia', sector: 'banking' },
  { code: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'banking' },
  { code: 'BMRI', name: 'Bank Mandiri', sector: 'banking' },
  { code: 'BBNI', name: 'Bank Negara Indonesia', sector: 'banking' },
  { code: 'BRIS', name: 'Bank Syariah Indonesia', sector: 'banking' },
  { code: 'BBTN', name: 'Bank BTN', sector: 'banking' },
  { code: 'BNGA', name: 'Bank CIMB Niaga', sector: 'banking' },
  { code: 'BDMN', name: 'Bank Danamon', sector: 'banking' },
  // Consumer
  { code: 'UNVR', name: 'Unilever Indonesia', sector: 'consumer' },
  { code: 'ICBP', name: 'Indofood CBP', sector: 'consumer' },
  { code: 'INDF', name: 'Indofood', sector: 'consumer' },
  { code: 'KLBF', name: 'Kalbe Farma', sector: 'consumer' },
  { code: 'HMSP', name: 'HM Sampoerna', sector: 'consumer' },
  { code: 'GGRM', name: 'Gudang Garam', sector: 'consumer' },
  { code: 'MYOR', name: 'Mayora Indah', sector: 'consumer' },
  // Mining
  { code: 'ADRO', name: 'Adaro Energy', sector: 'mining' },
  { code: 'ITMG', name: 'Indo Tambangraya', sector: 'mining' },
  { code: 'PTBA', name: 'Bukit Asam', sector: 'mining' },
  { code: 'ANTM', name: 'Aneka Tambang', sector: 'mining' },
  { code: 'INCO', name: 'Vale Indonesia', sector: 'mining' },
  { code: 'MEDC', name: 'Medco Energi', sector: 'mining' },
  { code: 'MDKA', name: 'Merdeka Copper Gold', sector: 'mining' },
  // Telco
  { code: 'TLKM', name: 'Telkom Indonesia', sector: 'telco' },
  { code: 'EXCL', name: 'XL Axiata', sector: 'telco' },
  { code: 'ISAT', name: 'Indosat Ooredoo', sector: 'telco' },
  // Automotive
  { code: 'ASII', name: 'Astra International', sector: 'automotive' },
  { code: 'AUTO', name: 'Astra Otoparts', sector: 'automotive' },
  // Technology
  { code: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'tech' },
  { code: 'BUKA', name: 'Bukalapak', sector: 'tech' },
  { code: 'EMTK', name: 'Elang Mahkota Teknologi', sector: 'tech' },
  // Property
  { code: 'BSDE', name: 'Bumi Serpong Damai', sector: 'property' },
  { code: 'CTRA', name: 'Ciputra Development', sector: 'property' },
  { code: 'SMRA', name: 'Summarecon Agung', sector: 'property' },
]

function PopularStocks({ selectedStocks, setSelectedStocks }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')

  // Get stocks with prices
  const stocksWithPrices = useMemo(() => {
    return POPULAR_STOCKS_DATA.map(stock => ({
      ...stock,
      price: STOCK_PRICES[stock.code] || 0
    })).sort((a, b) => b.price - a.price)
  }, [])

  const categories = {
    all: '📊 Semua',
    banking: '🏦 Perbankan',
    consumer: '🛒 Konsumer',
    mining: '⛏️ Pertambangan',
    telco: '📱 Telekomunikasi',
    automotive: '🚗 Otomotif',
    tech: '💻 Teknologi',
    property: '🏠 Properti'
  }

  const priceCategories = {
    all: '💰 Semua Harga',
    cheap: '🔹 < Rp 500',
    mid: '📊 Rp 500-2.000',
    high: '💎 Rp 2.000-5.000',
    premium: '👑 > Rp 5.000'
  }

  const filteredStocks = useMemo(() => {
    let filtered = stocksWithPrices

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.sector === selectedCategory)
    }

    // Filter by price range
    if (selectedPriceRange !== 'all') {
      switch (selectedPriceRange) {
        case 'cheap':
          filtered = filtered.filter(s => s.price < 500)
          break
        case 'mid':
          filtered = filtered.filter(s => s.price >= 500 && s.price < 2000)
          break
        case 'high':
          filtered = filtered.filter(s => s.price >= 2000 && s.price < 5000)
          break
        case 'premium':
          filtered = filtered.filter(s => s.price >= 5000)
          break
      }
    }

    return filtered
  }, [stocksWithPrices, selectedCategory, selectedPriceRange])

  const toggleStock = (code) => {
    if (selectedStocks.includes(code)) {
      setSelectedStocks(selectedStocks.filter(s => s !== code))
    } else {
      setSelectedStocks([...selectedStocks, code])
    }
  }

  const selectAll = () => {
    const codes = filteredStocks.map(s => s.code)
    const newStocks = [...new Set([...selectedStocks, ...codes])]
    setSelectedStocks(newStocks)
  }

  const formatPrice = (price) => {
    if (!price) return '-'
    return 'Rp ' + price.toLocaleString('id-ID')
  }

  const getPriceColor = (price) => {
    if (price >= 5000) return 'text-purple-400'
    if (price >= 2000) return 'text-blue-400'
    if (price >= 500) return 'text-green-400'
    return 'text-yellow-400'
  }

  return (
    <div className="card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-lg font-semibold"
      >
        <span className="flex items-center gap-2">
          <FiStar className="text-yellow-500" />
          Saham Populer
        </span>
        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {isExpanded && (
        <>
          {/* Category filter */}
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Filter Sektor:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categories).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    selectedCategory === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Price filter */}
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Filter Harga:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(priceCategories).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPriceRange(key)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    selectedPriceRange === key
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stocks grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 max-h-64 overflow-y-auto">
            {filteredStocks.map((stock) => (
              <button
                key={stock.code}
                onClick={() => toggleStock(stock.code)}
                className={`text-left p-2 rounded-lg text-sm transition-colors ${
                  selectedStocks.includes(stock.code)
                    ? 'bg-blue-600/30 border border-blue-500'
                    : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stock.code}</span>
                  <span className={`text-xs ${getPriceColor(stock.price)}`}>
                    {formatPrice(stock.price)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 truncate">{stock.name}</div>
              </button>
            ))}
          </div>

          {filteredStocks.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              Tidak ada saham yang cocok dengan filter
            </p>
          )}

          <button
            onClick={selectAll}
            className="w-full mt-3 text-sm text-blue-400 hover:text-blue-300"
          >
            Pilih Semua ({filteredStocks.length})
          </button>
        </>
      )}
    </div>
  )
}

export default PopularStocks
