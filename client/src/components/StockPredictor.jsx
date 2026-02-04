import { useState, useEffect } from 'react'
import { stockApi } from '../services/api'

const ML_API_BASE = import.meta.env.VITE_ML_API_BASE || 'http://localhost:8000'

const POPULAR_STOCKS = [
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'UNVR', 'HMSP', 'GGRM', 'ICBP',
  'INDF', 'KLBF', 'PGAS', 'SMGR', 'UNTR', 'WIKA', 'PTBA', 'ANTM', 'INCO', 'EXCL'
]

export default function StockPredictor({ trainedModels = [] }) {
  const [symbol, setSymbol] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')
  const [indicatorData, setIndicatorData] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [error, setError] = useState(null)
  
  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setTargetDate(today)
  }, [])
  
  // Auto-select first trained model
  useEffect(() => {
    if (trainedModels.length > 0 && !selectedModelId) {
      setSelectedModelId(trainedModels[0].id)
    }
  }, [trainedModels])
  
  const handleFetchIndicators = async () => {
    if (!symbol.trim()) {
      setError('Silakan masukkan kode saham')
      return
    }
    if (!targetDate) {
      setError('Silakan pilih tanggal prediksi')
      return
    }
    
    setLoading(true)
    setError(null)
    setIndicatorData(null)
    setPrediction(null)
    
    try {
      const result = await stockApi.getPredictData(symbol.toUpperCase(), targetDate)
      setIndicatorData(result)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePredict = async () => {
    if (!indicatorData?.data) {
      setError('Silakan ambil data indikator terlebih dahulu')
      return
    }
    if (!selectedModelId) {
      setError('Silakan pilih model untuk prediksi')
      return
    }
    
    const model = trainedModels.find(m => m.id === selectedModelId)
    if (!model) {
      setError('Model tidak ditemukan')
      return
    }
    
    setPredicting(true)
    setError(null)
    setPrediction(null)
    
    try {
      const response = await fetch(`${ML_API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [indicatorData.data],
          features: model.features,
          model_id: selectedModelId
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.detail || 'Prediction failed')
      }
      
      setPrediction({
        ...result,
        model: model,
        predictedValue: result.predictions[0],
        probabilities: result.probabilities ? result.probabilities[0] : null
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setPredicting(false)
    }
  }
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  
  const getPredictionLabel = (value) => {
    if (value === 1 || value === 'UP' || value === '1') return 'UP'
    if (value === 0 || value === 'DOWN' || value === '0') return 'DOWN'
    return value
  }
  
  const getPredictionColor = (value) => {
    const label = getPredictionLabel(value)
    if (label === 'UP') return 'text-green-400'
    if (label === 'DOWN') return 'text-red-400'
    return 'text-yellow-400'
  }
  
  const getPredictionBg = (value) => {
    const label = getPredictionLabel(value)
    if (label === 'UP') return 'bg-green-900/30 border-green-500/50'
    if (label === 'DOWN') return 'bg-red-900/30 border-red-500/50'
    return 'bg-yellow-900/30 border-yellow-500/50'
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔮</span>
        <div>
          <h2 className="text-xl font-bold text-white">Single Stock Prediction</h2>
          <p className="text-sm text-gray-400">Prediksi naik/turun saham untuk tanggal tertentu</p>
        </div>
      </div>
      
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stock Input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Kode Saham</label>
          <div className="relative">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BBCA"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 uppercase"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {POPULAR_STOCKS.slice(0, 8).map(stock => (
              <button
                key={stock}
                onClick={() => setSymbol(stock)}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  symbol === stock 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {stock}
              </button>
            ))}
          </div>
        </div>
        
        {/* Date Input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Tanggal Prediksi (H)
            <span className="text-purple-400 ml-1">*</span>
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tanggal yang ingin diprediksi
          </p>
        </div>
        
        {/* Model Selection */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Model ML</label>
          {trainedModels.length === 0 ? (
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 text-yellow-400 text-sm">
              ⚠️ Belum ada model yang di-train
            </div>
          ) : (
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              {trainedModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.model_name} ({(model.metrics.accuracy * 100).toFixed(1)}%)
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* Fetch Button */}
      <div className="flex gap-3">
        <button
          onClick={handleFetchIndicators}
          disabled={loading || !symbol.trim() || !targetDate}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </>
          ) : (
            <>📊 Ambil Data Indikator</>
          )}
        </button>
        
        {indicatorData && trainedModels.length > 0 && (
          <button
            onClick={handlePredict}
            disabled={predicting || !selectedModelId}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition flex items-center gap-2"
          >
            {predicting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Predicting...
              </>
            ) : (
              <>🔮 Prediksi!</>
            )}
          </button>
        )}
      </div>
      
      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          ⚠️ {error}
        </div>
      )}
      
      {/* Indicator Data Display */}
      {indicatorData && (
        <div className="space-y-4">
          {/* Info Box */}
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">📋 Informasi Data</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Saham</p>
                <p className="text-white font-bold text-lg">{indicatorData.data.symbol}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tanggal Prediksi (H)</p>
                <p className="text-white font-medium">{formatDate(indicatorData.data.targetDate)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tanggal Indikator (H-1)</p>
                <p className="text-yellow-400 font-medium">{formatDate(indicatorData.data.indicatorDate)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Harga Close (H-1)</p>
                <p className="text-white font-bold">Rp {indicatorData.data.prevClose?.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
              ℹ️ Model akan menggunakan data indikator dari <span className="text-yellow-400 font-medium">{formatDate(indicatorData.data.indicatorDate)}</span> untuk memprediksi pergerakan harga pada <span className="text-white font-medium">{formatDate(indicatorData.data.targetDate)}</span>
            </div>
          </div>
          
          {/* Actual Data (if available - for verification) */}
          {indicatorData.data.actualData && (
            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">📈 Data Aktual (H) - Untuk Verifikasi</h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-gray-800/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Open</p>
                  <p className="text-white font-medium">Rp {indicatorData.data.actualData.open?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <p className="text-gray-400 text-xs">High</p>
                  <p className="text-green-400 font-medium">Rp {indicatorData.data.actualData.high?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Low</p>
                  <p className="text-red-400 font-medium">Rp {indicatorData.data.actualData.low?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Close</p>
                  <p className="text-white font-medium">Rp {indicatorData.data.actualData.close?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Change</p>
                  <p className={`font-medium ${indicatorData.data.actualData.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicatorData.data.actualData.priceChange >= 0 ? '+' : ''}{indicatorData.data.actualData.priceChange?.toFixed(0)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <p className="text-gray-400 text-xs">Change %</p>
                  <p className={`font-bold ${indicatorData.data.actualData.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicatorData.data.actualData.priceChangePercent >= 0 ? '+' : ''}{indicatorData.data.actualData.priceChangePercent?.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Key Indicators */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">📊 Indikator Teknikal (H-1)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <IndicatorCard label="RSI" value={indicatorData.data.rsi} suffix="" />
              <IndicatorCard label="MACD" value={indicatorData.data.macd} suffix="" decimals={4} />
              <IndicatorCard label="MACD Hist" value={indicatorData.data.macdHistogram} suffix="" decimals={4} />
              <IndicatorCard label="Stoch %K" value={indicatorData.data.stochK} suffix="" />
              <IndicatorCard label="ADX" value={indicatorData.data.adx} suffix="" />
              <IndicatorCard label="ATR %" value={indicatorData.data.atrPercent} suffix="%" />
              <IndicatorCard label="BB Width" value={indicatorData.data.bbWidth} suffix="%" />
              <IndicatorCard label="MFI" value={indicatorData.data.mfi} suffix="" />
              <IndicatorCard label="CCI" value={indicatorData.data.cci} suffix="" />
              <IndicatorCard label="Williams %R" value={indicatorData.data.williamsR} suffix="" />
              <IndicatorCard label="ROC" value={indicatorData.data.roc} suffix="%" decimals={2} />
              <IndicatorCard label="Vol Ratio" value={indicatorData.data.volumeRatio} suffix="x" />
            </div>
          </div>
          
          {/* Prediction Result */}
          {prediction && (
            <div className={`border rounded-lg p-6 ${getPredictionBg(prediction.predictedValue)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">🎯 Hasil Prediksi</h3>
                  <p className="text-sm text-gray-400">
                    Model: {prediction.model.model_name} | Accuracy: {(prediction.model.metrics.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getPredictionColor(prediction.predictedValue)}`}>
                    {getPredictionLabel(prediction.predictedValue) === 'UP' ? '📈' : '📉'} {getPredictionLabel(prediction.predictedValue)}
                  </div>
                  {prediction.probabilities && (
                    <div className="text-sm text-gray-400 mt-2">
                      Confidence: {(Math.max(...prediction.probabilities) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
              
              {/* Probability breakdown */}
              {prediction.probabilities && prediction.probabilities.length === 2 && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">Probabilitas:</p>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-400">DOWN (0)</span>
                        <span className="text-red-400">{(prediction.probabilities[0] * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${prediction.probabilities[0] * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-400">UP (1)</span>
                        <span className="text-green-400">{(prediction.probabilities[1] * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${prediction.probabilities[1] * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Verification with actual data */}
              {indicatorData.data.actualData && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">Verifikasi dengan Data Aktual:</p>
                  {(() => {
                    const actualChange = indicatorData.data.actualData.priceChangePercent
                    const actualDirection = actualChange >= 1 ? 'UP' : actualChange <= -0.5 ? 'DOWN' : 'NEUTRAL'
                    const predictedDirection = getPredictionLabel(prediction.predictedValue)
                    const isCorrect = actualDirection === predictedDirection
                    
                    return (
                      <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                          <div>
                            <p className="text-white">
                              Prediksi: <span className={getPredictionColor(prediction.predictedValue)}>{predictedDirection}</span>
                              {' | '}
                              Aktual: <span className={actualChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {actualDirection} ({actualChange >= 0 ? '+' : ''}{actualChange.toFixed(2)}%)
                              </span>
                            </p>
                            <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {isCorrect ? 'Prediksi BENAR!' : 'Prediksi SALAH'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper component for indicator cards
function IndicatorCard({ label, value, suffix = '', decimals = 2 }) {
  const displayValue = value !== null && value !== undefined 
    ? (typeof value === 'number' ? value.toFixed(decimals) : value)
    : '-'
  
  return (
    <div className="bg-gray-800/50 rounded p-2">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white font-medium">{displayValue}{suffix}</p>
    </div>
  )
}
