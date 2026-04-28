import { useState, useMemo } from 'react'
import { FiPlus, FiX, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { STOCK_PRICES, PRICE_RANGES, getAllStockCodes, searchStocks } from '../data/stockPrices'
import { US_POPULAR_STOCKS, searchUSStocks } from '../data/usStocks'

function StockInput({ selectedStocks, setSelectedStocks, market = 'ID' }) {
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [expandedRanges, setExpandedRanges] = useState(new Set())

  const isUS = market === 'US'

  // Group stocks by price range (ID only)
  const stocksByRange = useMemo(() => {
    if (isUS) return {}
    const grouped = {}
    PRICE_RANGES.forEach(range => {
      grouped[range.id] = { ...range, stocks: [] }
    })
    Object.entries(STOCK_PRICES).forEach(([code, price]) => {
      if (price === 0 || price === null) return
      for (const range of PRICE_RANGES) {
        if (price >= range.min && price < range.max) {
          grouped[range.id].stocks.push({ code, price })
          break
        }
      }
    })
    Object.keys(grouped).forEach(rangeId => {
      grouped[rangeId].stocks.sort((a, b) => a.code.localeCompare(b.code))
    })
    return grouped
  }, [isUS])

  // Search results
  const searchResults = useMemo(() => {
    if (!inputValue || inputValue.length < 1) return []
    if (isUS) return searchUSStocks(inputValue).slice(0, 20)
    return searchStocks(inputValue).slice(0, 20)
  }, [inputValue, isUS])

  const handleAddStock = () => {
    const codes = inputValue
      .toUpperCase()
      .split(/[,\s]+/)
      .filter(code => code.length > 0)
      .map(code => code.replace('.JK', ''))

    let validCodes
    if (isUS) {
      // For US stocks, accept any ticker (can't pre-validate all tickers)
      validCodes = codes.filter(code => code.length >= 1 && code.length <= 6)
    } else {
      validCodes = codes.filter(code => STOCK_PRICES[code] !== undefined)
    }

    const newStocks = validCodes.filter(code => !selectedStocks.includes(code))
    
    if (newStocks.length > 0) {
      setSelectedStocks([...selectedStocks, ...newStocks])
      toast.success(`Added: ${newStocks.join(', ')}`)
    } else if (validCodes.length === 0 && codes.length > 0) {
      toast.error(isUS ? 'Invalid stock symbol' : 'Kode saham tidak ditemukan')
    }
    
    setInputValue('')
    setShowDropdown(false)
  }

  const handleSelectStock = (code) => {
    if (!selectedStocks.includes(code)) {
      setSelectedStocks([...selectedStocks, code])
      toast.success(`Added: ${code}`)
    }
    setInputValue('')
    setShowDropdown(false)
  }

  const handleRemoveStock = (code) => {
    setSelectedStocks(selectedStocks.filter(s => s !== code))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddStock()
  }

  const toggleRange = (rangeId) => {
    setExpandedRanges(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rangeId)) newSet.delete(rangeId)
      else newSet.add(rangeId)
      return newSet
    })
  }

  const selectAllInRange = (rangeId) => {
    const stocks = stocksByRange[rangeId]?.stocks || []
    const codes = stocks.map(s => s.code)
    const newStocks = [...new Set([...selectedStocks, ...codes])]
    setSelectedStocks(newStocks)
    toast.success(`${codes.length} saham ditambahkan`)
  }

  const formatPrice = (price) => {
    if (!price) return '-'
    return 'Rp ' + price.toLocaleString('id-ID')
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FiSearch className="text-blue-500" />
        {isUS ? 'Enter Stock Symbol' : 'Input Kode Saham'}
      </h3>
      
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowDropdown(e.target.value.length > 0)
            }}
            onFocus={() => setShowDropdown(inputValue.length > 0)}
            onKeyPress={handleKeyPress}
            placeholder={isUS ? 'AAPL, MSFT, NVDA...' : 'BBCA, BBRI, TLKM...'}
            className="input flex-1"
          />
          <button onClick={handleAddStock} className="btn-primary">
            <FiPlus className="w-5 h-5" />
          </button>
          {!isUS && (
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="btn-secondary"
              title="Pilih berdasarkan harga"
            >
              <FiChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="p-2 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-2">{isUS ? 'Search Results:' : 'Hasil Pencarian:'}</p>
                <div className="space-y-1">
                  {searchResults.map(stock => (
                    <button
                      key={stock.code}
                      onClick={() => handleSelectStock(stock.code)}
                      className={`w-full flex justify-between items-center px-3 py-2 rounded text-sm transition ${
                        selectedStocks.includes(stock.code)
                          ? 'bg-blue-600/30 text-blue-300'
                          : 'bg-gray-700/50 hover:bg-gray-700 text-white'
                      }`}
                    >
                      <span className="font-medium">{stock.code}</span>
                      <span className="text-xs text-gray-400">
                        {isUS ? stock.name : formatPrice(stock.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price range groups - ID only */}
            {!isUS && (
              <div className="p-2">
                <p className="text-xs text-gray-400 mb-2">Pilih berdasarkan harga:</p>
                {PRICE_RANGES.map(range => {
                  const rangeData = stocksByRange[range.id]
                  if (!rangeData || rangeData.stocks.length === 0) return null
                  
                  const isExpanded = expandedRanges.has(range.id)
                  const selectedCount = rangeData.stocks.filter(s => selectedStocks.includes(s.code)).length

                  return (
                    <div key={range.id} className="mb-2">
                      <button
                        onClick={() => toggleRange(range.id)}
                        className="w-full flex justify-between items-center px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                          <span>{range.label}</span>
                          <span className="text-xs text-gray-400">({rangeData.stocks.length})</span>
                          {selectedCount > 0 && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                              {selectedCount}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            selectAllInRange(range.id)
                          }}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          Pilih Semua
                        </button>
                      </button>
                      
                      {isExpanded && (
                        <div className="grid grid-cols-3 gap-1 mt-1 pl-4">
                          {rangeData.stocks.map(stock => (
                            <button
                              key={stock.code}
                              onClick={() => handleSelectStock(stock.code)}
                              className={`px-2 py-1 rounded text-xs transition ${
                                selectedStocks.includes(stock.code)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-700/50 hover:bg-gray-600 text-gray-300'
                              }`}
                            >
                              {stock.code}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="p-2 border-t border-gray-700">
              <button
                onClick={() => setShowDropdown(false)}
                className="w-full text-center text-xs text-gray-400 hover:text-white"
              >
                {isUS ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-400 mt-2">
        {isUS
          ? 'Enter any US ticker (NYSE/NASDAQ). Separate with comma or space.'
          : `Pisahkan dengan koma atau spasi. Total ${Object.keys(STOCK_PRICES).length} saham tersedia.`}
      </p>

      {/* Selected stocks */}
      {selectedStocks.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">
            {isUS ? `Selected (${selectedStocks.length}):` : `Saham dipilih (${selectedStocks.length}):`}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedStocks.map((code) => {
              const price = !isUS ? STOCK_PRICES[code] : null
              return (
                <span
                  key={code}
                  className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  title={price ? formatPrice(price) : code}
                >
                  {code}
                  {price && <span className="text-xs opacity-70">({formatPrice(price)})</span>}
                  <button
                    onClick={() => handleRemoveStock(code)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </span>
              )
            })}
          </div>
          <button
            onClick={() => setSelectedStocks([])}
            className="text-xs text-red-400 hover:text-red-300 mt-2"
          >
            {isUS ? 'Remove All' : 'Hapus Semua'}
          </button>
        </div>
      )}
    </div>
  )
}

export default StockInput
