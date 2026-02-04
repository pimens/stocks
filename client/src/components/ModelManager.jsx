import { useState, useEffect } from 'react'

// ML Service base URL
const ML_API_BASE = import.meta.env.VITE_ML_API_BASE || 'http://localhost:8000'

export default function ModelManager() {
  const [trainedModels, setTrainedModels] = useState([])
  const [selectedModels, setSelectedModels] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [predictionResult, setPredictionResult] = useState(null)

  // Fetch trained models on mount
  useEffect(() => {
    fetchTrainedModels()
  }, [])

  const fetchTrainedModels = async () => {
    try {
      const response = await fetch(`${ML_API_BASE}/trained-models`)
      const data = await response.json()
      setTrainedModels(data.models || [])
    } catch (err) {
      console.error('Failed to fetch trained models:', err)
      setError('Gagal mengambil daftar model')
    }
  }

  // Toggle model selection
  const toggleModelSelection = (modelId) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(modelId)) {
        newSet.delete(modelId)
      } else {
        newSet.add(modelId)
      }
      return newSet
    })
  }

  // Select all models
  const selectAllModels = () => {
    setSelectedModels(new Set(trainedModels.map(m => m.id)))
  }

  // Deselect all models
  const deselectAllModels = () => {
    setSelectedModels(new Set())
  }

  // Delete single model
  const handleDeleteModel = async (modelId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus model ini?')) return

    try {
      const response = await fetch(`${ML_API_BASE}/models/${modelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTrainedModels()
        setSelectedModels(prev => {
          const newSet = new Set(prev)
          newSet.delete(modelId)
          return newSet
        })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete selected models
  const handleDeleteSelectedModels = async () => {
    if (selectedModels.size === 0) return

    const count = selectedModels.size
    if (!confirm(`Apakah Anda yakin ingin menghapus ${count} model yang dipilih?`)) return

    setLoading(true)
    try {
      const deletePromises = Array.from(selectedModels).map(modelId =>
        fetch(`${ML_API_BASE}/models/${modelId}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)
      setSelectedModels(new Set())
      fetchTrainedModels()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Predict using model
  const handlePredict = async (modelId) => {
    setLoading(true)
    setPredictionResult(null)
    
    try {
      const response = await fetch(`${ML_API_BASE}/predict/${modelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Prediction failed')
      
      setPredictionResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '-'
    return (value * 100).toFixed(2) + '%'
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 0.8) return 'text-green-400'
    if (accuracy >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">📦 Model Manager</h2>
        <button
          onClick={fetchTrainedModels}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-700/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">🔮 Trained Models</h3>
            <span className="text-sm text-gray-400">
              Total: {trainedModels.length} model
            </span>
          </div>
          
          {trainedModels.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {selectedModels.size} dipilih
              </span>
              <button
                onClick={selectAllModels}
                className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded text-sm hover:bg-blue-600/50"
              >
                Pilih Semua
              </button>
              <button
                onClick={deselectAllModels}
                className="px-3 py-1 bg-gray-600/30 text-gray-400 rounded text-sm hover:bg-gray-600/50"
              >
                Batal Pilih
              </button>
              {selectedModels.size > 0 && (
                <button
                  onClick={handleDeleteSelectedModels}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-1"
                >
                  {loading ? 'Menghapus...' : `🗑️ Hapus (${selectedModels.size})`}
                </button>
              )}
            </div>
          )}
        </div>

        {trainedModels.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">📭 Belum ada model yang di-training</p>
            <p className="text-gray-500 text-sm mt-2">
              Silakan training model terlebih dahulu di halaman Machine Learning
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainedModels.map(model => (
              <div
                key={model.id}
                className={`bg-gray-800/50 rounded-lg p-4 border-2 transition ${
                  selectedModels.has(model.id)
                    ? 'border-red-500/50'
                    : 'border-transparent hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedModels.has(model.id)}
                      onChange={() => toggleModelSelection(model.id)}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-red-500 focus:ring-red-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-white font-medium">{model.model_name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                        <span>
                          Accuracy: <span className={getAccuracyColor(model.metrics?.accuracy)}>
                            {formatPercent(model.metrics?.accuracy)}
                          </span>
                        </span>
                        <span>Features: {model.features?.length || 0}</span>
                        <span>Target: {model.target}</span>
                        <span>Type: {model.model_type}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{model.trained_at}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePredict(model.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                      Predict
                    </button>
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Model Details Expandable */}
                {model.features && model.features.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                      📊 Lihat {model.features.length} Features
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {model.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </details>
                )}

                {/* Metrics Details */}
                {model.metrics && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                      📈 Lihat Metrics
                    </summary>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-gray-700/30 rounded p-2">
                        <p className="text-xs text-gray-500">Accuracy</p>
                        <p className={`font-bold ${getAccuracyColor(model.metrics.accuracy)}`}>
                          {formatPercent(model.metrics.accuracy)}
                        </p>
                      </div>
                      <div className="bg-gray-700/30 rounded p-2">
                        <p className="text-xs text-gray-500">Precision</p>
                        <p className="font-bold text-blue-400">
                          {formatPercent(model.metrics.precision)}
                        </p>
                      </div>
                      <div className="bg-gray-700/30 rounded p-2">
                        <p className="text-xs text-gray-500">Recall</p>
                        <p className="font-bold text-yellow-400">
                          {formatPercent(model.metrics.recall)}
                        </p>
                      </div>
                      <div className="bg-gray-700/30 rounded p-2">
                        <p className="text-xs text-gray-500">F1 Score</p>
                        <p className="font-bold text-purple-400">
                          {formatPercent(model.metrics.f1_score)}
                        </p>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prediction Results */}
      {predictionResult && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Hasil Prediksi</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Predictions</p>
              <p className="text-2xl font-bold text-white">{predictionResult.predictions?.length || 0}</p>
            </div>
            <div className="bg-green-900/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Predicted UP</p>
              <p className="text-2xl font-bold text-green-400">
                {predictionResult.predictions?.filter(p => p === 1 || p === 'UP').length || 0}
              </p>
            </div>
            <div className="bg-red-900/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Predicted DOWN</p>
              <p className="text-2xl font-bold text-red-400">
                {predictionResult.predictions?.filter(p => p === 0 || p === 'DOWN').length || 0}
              </p>
            </div>
          </div>

          {/* Prediction Distribution */}
          {predictionResult.predictions && predictionResult.predictions.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Distribution</h4>
              {(() => {
                const counts = {}
                predictionResult.predictions.forEach(p => {
                  counts[p] = (counts[p] || 0) + 1
                })
                return (
                  <div className="space-y-2">
                    {Object.entries(counts).map(([label, count]) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-gray-400 w-20">{label}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              label == 1 || label === 'UP' ? 'bg-green-500' :
                              label == 0 || label === 'DOWN' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${(count / predictionResult.predictions.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-white w-24 text-right">
                          {count} ({((count / predictionResult.predictions.length) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          <button
            onClick={() => setPredictionResult(null)}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
          >
            ✕ Tutup Hasil
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {trainedModels.length > 0 && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Models</p>
              <p className="text-2xl font-bold text-white">{trainedModels.length}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Best Accuracy</p>
              <p className="text-2xl font-bold text-green-400">
                {formatPercent(Math.max(...trainedModels.map(m => m.metrics?.accuracy || 0)))}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Avg Accuracy</p>
              <p className="text-2xl font-bold text-yellow-400">
                {formatPercent(
                  trainedModels.reduce((sum, m) => sum + (m.metrics?.accuracy || 0), 0) / trainedModels.length
                )}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Model Types</p>
              <p className="text-2xl font-bold text-purple-400">
                {new Set(trainedModels.map(m => m.model_type)).size}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
