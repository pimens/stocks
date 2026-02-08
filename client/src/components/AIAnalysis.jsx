import { useState, useEffect } from 'react'
import { FiCpu, FiRefreshCw, FiTrendingUp, FiSettings, FiCode, FiChevronDown, FiChevronUp, FiCopy } from 'react-icons/fi'
import { aiApi } from '../services/api'
import { toast } from 'react-toastify'
import ReactMarkdown from 'react-markdown'

function AIAnalysis({ selectedStocks, stockData }) {
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [comparisonResult, setComparisonResult] = useState(null)
  const [availableModels, setAvailableModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showAnalysisPrompt, setShowAnalysisPrompt] = useState(false)
  const [showComparisonPrompt, setShowComparisonPrompt] = useState(false)

  useEffect(() => {
    loadAvailableModels()
  }, [])

  const loadAvailableModels = async () => {
    try {
      const models = await aiApi.getModels()
      setAvailableModels(models)
    } catch (error) {
      console.error('Error loading models:', error)
    }
  }

  const analyzeStock = async (symbol) => {
    if (!symbol) {
      toast.warning('Pilih saham untuk dianalisis')
      return
    }

    setIsLoading(true)
    setSelectedSymbol(symbol)
    try {
      const result = await aiApi.analyzeStock(symbol, selectedModel)
      setAnalysis(result)
      toast.success('Analisis berhasil!')
    } catch (error) {
      console.error('Error analyzing stock:', error)
      toast.error(error.response?.data?.error || 'Gagal menganalisis saham')
    } finally {
      setIsLoading(false)
    }
  }

  const compareStocks = async () => {
    if (selectedStocks.length < 2) {
      toast.warning('Pilih minimal 2 saham untuk dibandingkan')
      return
    }

    setIsLoading(true)
    try {
      const result = await aiApi.compareStocks(selectedStocks.slice(0, 5), selectedModel) // Max 5 stocks
      setComparisonResult(result)
      toast.success('Perbandingan berhasil!')
    } catch (error) {
      console.error('Error comparing stocks:', error)
      toast.error(error.response?.data?.error || 'Gagal membandingkan saham')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedModelData = availableModels.find(m => m.id === selectedModel)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <FiCpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Analysis</h1>
              <p className="text-gray-400">Analisis saham menggunakan AI (OpenRouter)</p>
            </div>
          </div>
          
          {/* Model Selector Toggle */}
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <FiSettings className="w-4 h-4" />
            <span className="text-sm">Model: {selectedModelData?.name?.split(' ')[0] || 'Gemini'}</span>
          </button>
        </div>
        
        {/* Model Selector Dropdown */}
        {showModelSelector && (
          <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Pilih AI Model:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id)
                    setShowModelSelector(false)
                    toast.success(`Model switched to ${model.name}`)
                  }}
                  className={`text-left p-3 rounded-lg transition-colors ${
                    selectedModel === model.id
                      ? 'bg-purple-600/30 border border-purple-500'
                      : 'bg-gray-600/50 hover:bg-gray-600 border border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{model.provider}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{model.description}</div>
                  {model.deprecated && (
                    <div className="text-xs text-yellow-400 mt-1">⚠️ Deprecated: {model.deprecated}</div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{(model.contextWindow / 1000).toFixed(0)}K context</span>
                    {model.free && <span className="text-green-400">FREE</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Stock Analysis */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Analisis Saham Individual</h3>
          
          <div className="flex gap-2 mb-4">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="input flex-1"
            >
              <option value="">Pilih Saham...</option>
              {selectedStocks.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <button
              onClick={() => analyzeStock(selectedSymbol)}
              disabled={isLoading || !selectedSymbol}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading && selectedSymbol ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FiCpu className="w-4 h-4" />
              )}
              Analisis
            </button>
          </div>

          {/* Quick buttons for stocks from data */}
          {stockData.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Quick Select:</p>
              <div className="flex flex-wrap gap-2">
                {stockData.slice(0, 6).map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => analyzeStock(stock.symbol)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    {stock.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedStocks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>Pilih saham terlebih dahulu di tab Screener</p>
            </div>
          )}
        </div>

        {/* Stock Comparison */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Bandingkan Saham</h3>
          
          <p className="text-sm text-gray-400 mb-4">
            Bandingkan hingga 5 saham sekaligus dengan AI untuk mendapatkan rekomendasi terbaik.
          </p>

          {selectedStocks.length >= 2 ? (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedStocks.slice(0, 5).map(code => (
                  <span key={code} className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-sm">
                    {code}
                  </span>
                ))}
                {selectedStocks.length > 5 && (
                  <span className="text-gray-400 text-sm">
                    +{selectedStocks.length - 5} lainnya
                  </span>
                )}
              </div>
              <button
                onClick={compareStocks}
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading && !selectedSymbol ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiTrendingUp className="w-4 h-4" />
                )}
                Bandingkan Saham
              </button>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Pilih minimal 2 saham untuk membandingkan</p>
              <p className="text-sm mt-2">Saat ini: {selectedStocks.length} saham dipilih</p>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Result */}
      {analysis && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiCpu className="text-purple-500" />
            Hasil Analisis: {analysis.symbol}
          </h3>
          <div className="prose max-w-none">
            <ReactMarkdown>{analysis.aiAnalysis.analysis}</ReactMarkdown>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
            Model: {analysis.aiAnalysis.model} | 
            Tokens: {analysis.aiAnalysis.usage?.total_tokens}
          </div>
          
          {/* Prompt Display Toggle */}
          {analysis.aiAnalysis.prompt && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <button
                onClick={() => setShowAnalysisPrompt(!showAnalysisPrompt)}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <FiCode className="w-4 h-4" />
                <span>Lihat Prompt yang Dikirim</span>
                {showAnalysisPrompt ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
              
              {showAnalysisPrompt && (
                <div className="mt-3 space-y-3">
                  <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-purple-400">📋 System Prompt:</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(analysis.aiAnalysis.prompt.system)
                          toast.success('System prompt copied!')
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Copy to clipboard"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">{analysis.aiAnalysis.prompt.system}</pre>
                  </div>
                  <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-green-400">👤 User Prompt:</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(analysis.aiAnalysis.prompt.user)
                          toast.success('User prompt copied!')
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Copy to clipboard"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">{analysis.aiAnalysis.prompt.user}</pre>
                  </div>
                  <button
                    onClick={() => {
                      const fullPrompt = `System Prompt:\n${analysis.aiAnalysis.prompt.system}\n\nUser Prompt:\n${analysis.aiAnalysis.prompt.user}`
                      navigator.clipboard.writeText(fullPrompt)
                      toast.success('Full prompt copied!')
                    }}
                    className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <FiCopy className="w-4 h-4" />
                    Copy Full Prompt
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comparison Result */}
      {comparisonResult && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-green-500" />
            Perbandingan Saham
          </h3>
          <div className="prose max-w-none">
            <ReactMarkdown>{comparisonResult.comparison.comparison}</ReactMarkdown>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
            Model: {comparisonResult.comparison.model}
          </div>
          
          {/* Comparison Prompt Display Toggle */}
          {comparisonResult.comparison.prompt && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <button
                onClick={() => setShowComparisonPrompt(!showComparisonPrompt)}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <FiCode className="w-4 h-4" />
                <span>Lihat Prompt yang Dikirim</span>
                {showComparisonPrompt ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
              
              {showComparisonPrompt && (
                <div className="mt-3 space-y-3">
                  <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-purple-400">📋 System Prompt:</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(comparisonResult.comparison.prompt.system)
                          toast.success('System prompt copied!')
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Copy to clipboard"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">{comparisonResult.comparison.prompt.system}</pre>
                  </div>
                  <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-green-400">👤 User Prompt:</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(comparisonResult.comparison.prompt.user)
                          toast.success('User prompt copied!')
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Copy to clipboard"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">{comparisonResult.comparison.prompt.user}</pre>
                  </div>
                  <button
                    onClick={() => {
                      const fullPrompt = `System Prompt:\n${comparisonResult.comparison.prompt.system}\n\nUser Prompt:\n${comparisonResult.comparison.prompt.user}`
                      navigator.clipboard.writeText(fullPrompt)
                      toast.success('Full prompt copied!')
                    }}
                    className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <FiCopy className="w-4 h-4" />
                    Copy Full Prompt
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="card bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30">
        <h4 className="font-semibold mb-2">ℹ️ Tentang AI Analysis</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Analisis menggunakan model AI dari OpenRouter (Gemini 2.0 Flash)</li>
          <li>• Data teknikal dikirim ke AI untuk interpretasi yang lebih mendalam</li>
          <li>• Hasil analisis bukan merupakan saran investasi</li>
          <li>• Pastikan API key OpenRouter sudah dikonfigurasi di file .env</li>
        </ul>
      </div>
    </div>
  )
}

export default AIAnalysis
