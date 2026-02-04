import { useState, useEffect, useMemo } from 'react'

// ML Service base URL
const ML_API_BASE = import.meta.env.VITE_ML_API_BASE || 'http://localhost:8000'

export default function MLPrediction({ regressionData, selectedColumns }) {
  // State for available models
  const [availableModels, setAvailableModels] = useState([])
  const [trainedModels, setTrainedModels] = useState([])
  
  // Training configuration
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState(new Set())
  const [targetColumn, setTargetColumn] = useState('target')
  const [testSize, setTestSize] = useState(0.2)
  const [enableCV, setEnableCV] = useState(true)
  const [cvFolds, setCvFolds] = useState(5)
  
  // Comparison mode
  const [compareMode, setCompareMode] = useState(false)
  const [modelsToCompare, setModelsToCompare] = useState(new Set())
  
  // Results
  const [trainingResult, setTrainingResult] = useState(null)
  const [comparisonResult, setComparisonResult] = useState(null)
  const [predictionResult, setPredictionResult] = useState(null)
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('train') // train, compare, predict, history
  
  // Get available columns from regression data
  const availableColumns = useMemo(() => {
    if (!regressionData?.data || regressionData.data.length === 0) return []
    return Object.keys(regressionData.data[0])
  }, [regressionData])
  
  // Get numeric columns only (for features)
  const numericColumns = useMemo(() => {
    if (!regressionData?.data || regressionData.data.length === 0) return []
    const firstRow = regressionData.data[0]
    return Object.keys(firstRow).filter(key => {
      const value = firstRow[key]
      return typeof value === 'number' && key !== 'target'
    })
  }, [regressionData])
  
  // Get potential target columns
  const targetColumns = useMemo(() => {
    return ['target', 'targetLabel', 'priceChange', 'priceChangePercent']
      .filter(col => availableColumns.includes(col))
  }, [availableColumns])
  
  // Fetch available models on mount
  useEffect(() => {
    fetchAvailableModels()
    fetchTrainedModels()
  }, [])
  
  // Auto-select features from selectedColumns prop
  useEffect(() => {
    if (selectedColumns && selectedColumns.size > 0) {
      const numericFeatures = Array.from(selectedColumns).filter(col => 
        numericColumns.includes(col) && col !== targetColumn
      )
      setSelectedFeatures(new Set(numericFeatures))
    }
  }, [selectedColumns, numericColumns, targetColumn])
  
  const fetchAvailableModels = async () => {
    try {
      const response = await fetch(`${ML_API_BASE}/models`)
      const data = await response.json()
      setAvailableModels(data.models || [])
      if (data.models?.length > 0) {
        setSelectedModel(data.models[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch models:', err)
      setError('Gagal terhubung ke ML Service. Pastikan service berjalan di port 8000.')
    }
  }
  
  const fetchTrainedModels = async () => {
    try {
      const response = await fetch(`${ML_API_BASE}/trained-models`)
      const data = await response.json()
      setTrainedModels(data.models || [])
    } catch (err) {
      console.error('Failed to fetch trained models:', err)
    }
  }
  
  const toggleFeature = (feature) => {
    setSelectedFeatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(feature)) {
        newSet.delete(feature)
      } else {
        newSet.add(feature)
      }
      return newSet
    })
  }
  
  const selectAllFeatures = () => {
    setSelectedFeatures(new Set(numericColumns.filter(col => col !== targetColumn)))
  }
  
  const deselectAllFeatures = () => {
    setSelectedFeatures(new Set())
  }
  
  const toggleModelToCompare = (modelId) => {
    setModelsToCompare(prev => {
      const newSet = new Set(prev)
      if (newSet.has(modelId)) {
        newSet.delete(modelId)
      } else {
        newSet.add(modelId)
      }
      return newSet
    })
  }
  
  const handleTrain = async () => {
    if (!regressionData?.data || regressionData.data.length === 0) {
      setError('Tidak ada data untuk training. Silakan generate data regresi terlebih dahulu.')
      return
    }
    
    if (selectedFeatures.size === 0) {
      setError('Silakan pilih minimal satu fitur untuk training.')
      return
    }
    
    if (!targetColumn) {
      setError('Silakan pilih target column.')
      return
    }
    
    setLoading(true)
    setError(null)
    setTrainingResult(null)
    
    try {
      const response = await fetch(`${ML_API_BASE}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: regressionData.data,
          features: Array.from(selectedFeatures),
          target: targetColumn,
          model_type: selectedModel,
          test_size: testSize,
          cross_validation: enableCV,
          cv_folds: cvFolds
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.detail || 'Training failed')
      }
      
      setTrainingResult(result)
      fetchTrainedModels()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCompare = async () => {
    if (!regressionData?.data || regressionData.data.length === 0) {
      setError('Tidak ada data untuk comparison. Silakan generate data regresi terlebih dahulu.')
      return
    }
    
    if (selectedFeatures.size === 0) {
      setError('Silakan pilih minimal satu fitur untuk comparison.')
      return
    }
    
    if (modelsToCompare.size < 2) {
      setError('Silakan pilih minimal 2 model untuk dibandingkan.')
      return
    }
    
    setLoading(true)
    setError(null)
    setComparisonResult(null)
    
    try {
      const response = await fetch(`${ML_API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: regressionData.data,
          features: Array.from(selectedFeatures),
          target: targetColumn,
          models: Array.from(modelsToCompare),
          test_size: testSize
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.detail || 'Comparison failed')
      }
      
      setComparisonResult(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePredict = async (modelId) => {
    if (!regressionData?.data || regressionData.data.length === 0) {
      setError('Tidak ada data untuk prediksi.')
      return
    }
    
    const model = trainedModels.find(m => m.id === modelId)
    if (!model) {
      setError('Model tidak ditemukan.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${ML_API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: regressionData.data,
          features: model.features,
          model_id: modelId
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.detail || 'Prediction failed')
      }
      
      setPredictionResult({
        ...result,
        model_id: modelId
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteModel = async (modelId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus model ini?')) return
    
    try {
      const response = await fetch(`${ML_API_BASE}/models/${modelId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchTrainedModels()
        if (trainingResult?.model_id === modelId) {
          setTrainingResult(null)
        }
      }
    } catch (err) {
      setError(err.message)
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
  
  // Group features by category
  const featureGroups = useMemo(() => {
    const groups = {
      'ML Features': [],
      'Delta/Change': [],
      'SMA': [],
      'EMA': [],
      'RSI': [],
      'MACD': [],
      'Bollinger': [],
      'Stochastic': [],
      'ADX': [],
      'Volume': [],
      'Momentum': [],
      'Other': []
    }
    
    numericColumns.forEach(col => {
      if (col === targetColumn) return
      
      if (col.includes('dist') || col.includes('Ratio') || col.includes('Position')) {
        groups['ML Features'].push(col)
      } else if (col.includes('delta') || col.includes('Delta')) {
        groups['Delta/Change'].push(col)
      } else if (col.toLowerCase().includes('sma')) {
        groups['SMA'].push(col)
      } else if (col.toLowerCase().includes('ema')) {
        groups['EMA'].push(col)
      } else if (col.toLowerCase().includes('rsi')) {
        groups['RSI'].push(col)
      } else if (col.toLowerCase().includes('macd')) {
        groups['MACD'].push(col)
      } else if (col.toLowerCase().includes('bb') || col.toLowerCase().includes('bollinger')) {
        groups['Bollinger'].push(col)
      } else if (col.toLowerCase().includes('stoch')) {
        groups['Stochastic'].push(col)
      } else if (col.toLowerCase().includes('adx') || col.toLowerCase().includes('di')) {
        groups['ADX'].push(col)
      } else if (col.toLowerCase().includes('volume') || col.toLowerCase().includes('obv')) {
        groups['Volume'].push(col)
      } else if (col.toLowerCase().includes('momentum') || col.toLowerCase().includes('roc')) {
        groups['Momentum'].push(col)
      } else {
        groups['Other'].push(col)
      }
    })
    
    // Filter out empty groups
    return Object.entries(groups).filter(([_, cols]) => cols.length > 0)
  }, [numericColumns, targetColumn])

  if (!regressionData?.data || regressionData.data.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">🤖 Machine Learning</h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400">
            Silakan generate data regresi terlebih dahulu untuk menggunakan fitur Machine Learning.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">🤖 Machine Learning</h2>
        <div className="text-sm text-gray-400">
          {regressionData.data.length.toLocaleString()} samples | {numericColumns.length} features
        </div>
      </div>
      
      {/* Connection Status */}
      {availableModels.length === 0 && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">
            ⚠️ Tidak dapat terhubung ke ML Service. Pastikan service berjalan dengan:
          </p>
          <code className="block mt-2 bg-gray-900 p-2 rounded text-green-400 text-sm">
            cd ml_service && pip install -r requirements.txt && python main.py
          </code>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'train', label: '🎯 Training', icon: '🎯' },
          { id: 'compare', label: '⚖️ Compare Models', icon: '⚖️' },
          { id: 'predict', label: '🔮 Predict', icon: '🔮' },
          { id: 'history', label: '📜 History', icon: '📜' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === tab.id 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Error Display */}
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
      
      {/* Training Tab */}
      {activeTab === 'train' && (
        <div className="space-y-6">
          {/* Model Selection */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">📦 Pilih Model</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {availableModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-3 rounded-lg border transition text-left ${
                    selectedModel === model.id
                      ? 'border-purple-500 bg-purple-600/20'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-white text-sm">{model.name}</div>
                  <div className="text-xs text-gray-400 mt-1 truncate" title={model.description}>
                    {model.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Target Selection */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">🎯 Target Column</h3>
            <div className="flex flex-wrap gap-3">
              {targetColumns.map(col => (
                <button
                  key={col}
                  onClick={() => setTargetColumn(col)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    targetColumn === col
                      ? 'border-green-500 bg-green-600/20 text-green-400'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Target adalah kolom yang akan diprediksi oleh model
            </p>
          </div>
          
          {/* Feature Selection */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">📊 Pilih Features ({selectedFeatures.size} dipilih)</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllFeatures}
                  className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded text-sm hover:bg-blue-600/50"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={deselectAllFeatures}
                  className="px-3 py-1 bg-gray-600/30 text-gray-400 rounded text-sm hover:bg-gray-600/50"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {featureGroups.map(([groupName, features]) => (
                <div key={groupName} className="border border-gray-600 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-300">{groupName}</span>
                    <span className="text-xs text-gray-500">
                      {features.filter(f => selectedFeatures.has(f)).length}/{features.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {features.map(feature => (
                      <button
                        key={feature}
                        onClick={() => toggleFeature(feature)}
                        className={`px-2 py-1 rounded text-xs transition ${
                          selectedFeatures.has(feature)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Training Parameters */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">⚙️ Parameter Training</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Test Size</label>
                <input
                  type="number"
                  value={testSize}
                  onChange={(e) => setTestSize(parseFloat(e.target.value))}
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cross Validation</label>
                <select
                  value={enableCV ? 'yes' : 'no'}
                  onChange={(e) => setEnableCV(e.target.value === 'yes')}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="yes">Ya</option>
                  <option value="no">Tidak</option>
                </select>
              </div>
              {enableCV && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CV Folds</label>
                  <input
                    type="number"
                    value={cvFolds}
                    onChange={(e) => setCvFolds(parseInt(e.target.value))}
                    min="2"
                    max="10"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Train Button */}
          <button
            onClick={handleTrain}
            disabled={loading || selectedFeatures.size === 0 || !selectedModel}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Training...
              </span>
            ) : (
              '🚀 Train Model'
            )}
          </button>
          
          {/* Training Results */}
          {trainingResult && (
            <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">📊 Hasil Training</h3>
                <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded text-sm">
                  {trainingResult.model_name}
                </span>
              </div>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Accuracy</p>
                  <p className={`text-2xl font-bold ${getAccuracyColor(trainingResult.metrics.accuracy)}`}>
                    {formatPercent(trainingResult.metrics.accuracy)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Precision</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatPercent(trainingResult.metrics.precision)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Recall</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {formatPercent(trainingResult.metrics.recall)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">F1 Score</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {formatPercent(trainingResult.metrics.f1_score)}
                  </p>
                </div>
              </div>
              
              {/* CV Scores */}
              {trainingResult.metrics.cv_mean && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Cross Validation</p>
                  <p className="text-white">
                    Mean: <span className="text-green-400 font-bold">{formatPercent(trainingResult.metrics.cv_mean)}</span>
                    {' '}± <span className="text-gray-400">{formatPercent(trainingResult.metrics.cv_std)}</span>
                  </p>
                </div>
              )}
              
              {/* Feature Importance */}
              {trainingResult.feature_importance && trainingResult.feature_importance.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">📈 Feature Importance (Top 10)</h4>
                  <div className="space-y-2">
                    {trainingResult.feature_importance.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-gray-400 w-32 truncate text-sm">{item.feature}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                            style={{ 
                              width: `${(item.importance / trainingResult.feature_importance[0].importance) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-white text-sm w-16 text-right">
                          {(item.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Confusion Matrix */}
              {trainingResult.metrics.confusion_matrix && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">🔢 Confusion Matrix</h4>
                  <div className="overflow-x-auto">
                    <table className="text-center">
                      <tbody>
                        {trainingResult.metrics.confusion_matrix.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td 
                                key={j} 
                                className={`px-4 py-2 border border-gray-600 ${
                                  i === j ? 'bg-green-600/30 text-green-400' : 'bg-gray-700/30 text-gray-300'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Model Info */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">
                  Model ID: <span className="text-white">{trainingResult.model_id}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Data: {trainingResult.data_info?.train_samples} train / {trainingResult.data_info?.test_samples} test samples
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">⚖️ Pilih Model untuk Dibandingkan</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {availableModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => toggleModelToCompare(model.id)}
                  className={`p-3 rounded-lg border transition text-left ${
                    modelsToCompare.has(model.id)
                      ? 'border-green-500 bg-green-600/20'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={modelsToCompare.has(model.id)}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <span className="font-medium text-white text-sm">{model.name}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-3">
              {modelsToCompare.size} model dipilih
            </p>
          </div>
          
          {/* Feature Selection (same as training) */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">📊 Features ({selectedFeatures.size} dipilih)</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllFeatures}
                  className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded text-sm hover:bg-blue-600/50"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={deselectAllFeatures}
                  className="px-3 py-1 bg-gray-600/30 text-gray-400 rounded text-sm hover:bg-gray-600/50"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
              {numericColumns.filter(col => col !== targetColumn).map(feature => (
                <button
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  className={`px-2 py-1 rounded text-xs transition ${
                    selectedFeatures.has(feature)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleCompare}
            disabled={loading || selectedFeatures.size === 0 || modelsToCompare.size < 2}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Comparing...' : `⚖️ Compare ${modelsToCompare.size} Models`}
          </button>
          
          {/* Comparison Results */}
          {comparisonResult && (
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Hasil Perbandingan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 px-3 text-gray-400">Rank</th>
                      <th className="text-left py-2 px-3 text-gray-400">Model</th>
                      <th className="text-right py-2 px-3 text-gray-400">Accuracy</th>
                      <th className="text-right py-2 px-3 text-gray-400">Precision</th>
                      <th className="text-right py-2 px-3 text-gray-400">Recall</th>
                      <th className="text-right py-2 px-3 text-gray-400">F1 Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResult.results.map((result, idx) => (
                      <tr key={idx} className={`border-b border-gray-700 ${idx === 0 ? 'bg-green-900/20' : ''}`}>
                        <td className="py-2 px-3">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="py-2 px-3 text-white font-medium">{result.model_name}</td>
                        <td className={`py-2 px-3 text-right ${getAccuracyColor(result.accuracy)}`}>
                          {result.error ? '-' : formatPercent(result.accuracy)}
                        </td>
                        <td className="py-2 px-3 text-right text-blue-400">
                          {result.error ? '-' : formatPercent(result.precision)}
                        </td>
                        <td className="py-2 px-3 text-right text-yellow-400">
                          {result.error ? '-' : formatPercent(result.recall)}
                        </td>
                        <td className="py-2 px-3 text-right text-purple-400">
                          {result.error ? '-' : formatPercent(result.f1_score)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Predict Tab */}
      {activeTab === 'predict' && (
        <div className="space-y-6">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">🔮 Trained Models</h3>
            {trainedModels.length === 0 ? (
              <p className="text-gray-400">Belum ada model yang di-training. Silakan training model terlebih dahulu.</p>
            ) : (
              <div className="space-y-3">
                {trainedModels.map(model => (
                  <div key={model.id} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{model.model_name}</p>
                        <p className="text-sm text-gray-400">
                          Accuracy: <span className={getAccuracyColor(model.metrics.accuracy)}>
                            {formatPercent(model.metrics.accuracy)}
                          </span>
                          {' | '}Features: {model.features.length}
                          {' | '}Target: {model.target}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{model.trained_at}</p>
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
                  <p className="text-2xl font-bold text-white">{predictionResult.predictions.length}</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Predicted UP</p>
                  <p className="text-2xl font-bold text-green-400">
                    {predictionResult.predictions.filter(p => p === 1 || p === 'UP').length}
                  </p>
                </div>
                <div className="bg-red-900/30 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Predicted DOWN</p>
                  <p className="text-2xl font-bold text-red-400">
                    {predictionResult.predictions.filter(p => p === 0 || p === 'DOWN').length}
                  </p>
                </div>
              </div>
              
              {/* Prediction Distribution */}
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
            </div>
          )}
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">📜 Training History</h3>
            {trainedModels.length === 0 ? (
              <p className="text-gray-400">Belum ada history training.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 px-3 text-gray-400">Model</th>
                      <th className="text-left py-2 px-3 text-gray-400">Type</th>
                      <th className="text-left py-2 px-3 text-gray-400">Target</th>
                      <th className="text-right py-2 px-3 text-gray-400">Features</th>
                      <th className="text-right py-2 px-3 text-gray-400">Accuracy</th>
                      <th className="text-left py-2 px-3 text-gray-400">Trained At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainedModels.map(model => (
                      <tr key={model.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                        <td className="py-2 px-3 text-white">{model.model_name}</td>
                        <td className="py-2 px-3 text-gray-400">{model.model_type}</td>
                        <td className="py-2 px-3 text-gray-400">{model.target}</td>
                        <td className="py-2 px-3 text-right text-gray-400">{model.features.length}</td>
                        <td className={`py-2 px-3 text-right ${getAccuracyColor(model.metrics.accuracy)}`}>
                          {formatPercent(model.metrics.accuracy)}
                        </td>
                        <td className="py-2 px-3 text-gray-500 text-xs">{model.trained_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
