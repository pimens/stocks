import { useState, useEffect } from 'react'
import { FiStar, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { stockApi } from '../services/api'

function PopularStocks({ selectedStocks, setSelectedStocks }) {
  const [stocks, setStocks] = useState([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadPopularStocks()
  }, [])

  const loadPopularStocks = async () => {
    try {
      const data = await stockApi.getPopularStocks()
      setStocks(data)
    } catch (error) {
      console.error('Error loading popular stocks:', error)
    }
  }

  const categories = {
    all: 'Semua',
    banking: 'Perbankan',
    consumer: 'Konsumer',
    mining: 'Pertambangan',
    telco: 'Telekomunikasi'
  }

  const categoryStocks = {
    banking: ['BBCA', 'BBRI', 'BMRI', 'BBNI', 'BRIS'],
    consumer: ['UNVR', 'ICBP', 'INDF', 'KLBF', 'HMSP', 'GGRM'],
    mining: ['ADRO', 'ITMG', 'PTBA', 'ANTM', 'INCO', 'MEDC'],
    telco: ['TLKM', 'EXCL', 'ISAT']
  }

  const filteredStocks = selectedCategory === 'all' 
    ? stocks 
    : stocks.filter(s => categoryStocks[selectedCategory]?.includes(s.code))

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
          <div className="flex flex-wrap gap-2 mt-4">
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
                <div className="font-medium">{stock.code}</div>
                <div className="text-xs text-gray-400 truncate">{stock.name}</div>
              </button>
            ))}
          </div>

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
