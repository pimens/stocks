import { useState } from 'react'
import { FiPlus, FiX, FiSearch } from 'react-icons/fi'
import { toast } from 'react-toastify'

function StockInput({ selectedStocks, setSelectedStocks }) {
  const [inputValue, setInputValue] = useState('')

  const handleAddStock = () => {
    const codes = inputValue
      .toUpperCase()
      .split(/[,\s]+/)
      .filter(code => code.length > 0)
      .map(code => code.replace('.JK', ''))

    const newStocks = codes.filter(code => !selectedStocks.includes(code))
    
    if (newStocks.length > 0) {
      setSelectedStocks([...selectedStocks, ...newStocks])
      toast.success(`Ditambahkan: ${newStocks.join(', ')}`)
    }
    
    setInputValue('')
  }

  const handleRemoveStock = (code) => {
    setSelectedStocks(selectedStocks.filter(s => s !== code))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddStock()
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FiSearch className="text-blue-500" />
        Input Kode Saham
      </h3>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="BBCA, BBRI, TLKM..."
          className="input flex-1"
        />
        <button onClick={handleAddStock} className="btn-primary">
          <FiPlus className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-xs text-gray-400 mt-2">
        Pisahkan dengan koma atau spasi
      </p>

      {/* Selected stocks */}
      {selectedStocks.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">
            Saham dipilih ({selectedStocks.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedStocks.map((code) => (
              <span
                key={code}
                className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {code}
                <button
                  onClick={() => handleRemoveStock(code)}
                  className="hover:text-red-400 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={() => setSelectedStocks([])}
            className="text-xs text-red-400 hover:text-red-300 mt-2"
          >
            Hapus Semua
          </button>
        </div>
      )}
    </div>
  )
}

export default StockInput
