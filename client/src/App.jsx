import { useState } from 'react'
import Header from './components/Header'
import StockInput from './components/StockInput'
import PopularStocks from './components/PopularStocks'
import ScreenerFilters from './components/ScreenerFilters'
import ScreenerPresets from './components/ScreenerPresets'
import StockList from './components/StockList'
import StockDetail from './components/StockDetail'
import AIAnalysis from './components/AIAnalysis'
import RegressionData from './components/RegressionData'
import LiveIndicatorView from './components/LiveIndicatorView'
import IntradayIndicatorView from './components/IntradayIndicatorView'
import FeatureSelection from './components/FeatureSelection'
import ModelManager from './components/ModelManager'

function App() {
  const [selectedStocks, setSelectedStocks] = useState([])
  const [stockData, setStockData] = useState([])
  const [selectedStock, setSelectedStock] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('screener')
  const [filters, setFilters] = useState({})

  const handleSelectStock = (stock) => {
    setSelectedStock(stock)
    setActiveTab('detail')
  }

  return (
    <div className="min-h-screen">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'screener' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <StockInput 
                selectedStocks={selectedStocks}
                setSelectedStocks={setSelectedStocks}
              />
              <PopularStocks 
                selectedStocks={selectedStocks}
                setSelectedStocks={setSelectedStocks}
              />
              <ScreenerPresets 
                setFilters={setFilters}
              />
              <ScreenerFilters 
                filters={filters}
                setFilters={setFilters}
              />
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-3">
              <StockList 
                selectedStocks={selectedStocks}
                stockData={stockData}
                setStockData={setStockData}
                filters={filters}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSelectStock={handleSelectStock}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'detail' && selectedStock && (
          <StockDetail 
            stock={selectedStock}
            onBack={() => setActiveTab('screener')}
          />
        )}
        
        {activeTab === 'ai' && (
          <AIAnalysis 
            selectedStocks={selectedStocks}
            stockData={stockData}
          />
        )}

        {activeTab === 'regression' && (
          <RegressionData />
        )}

        {activeTab === 'live' && (
          <LiveIndicatorView />
        )}

        {activeTab === 'intraday' && (
          <IntradayIndicatorView />
        )}

        {activeTab === 'feature-selection' && (
          <FeatureSelection />
        )}

        {activeTab === 'model-manager' && (
          <ModelManager />
        )}
      </main>
      
      <footer className="text-center py-4 text-gray-500 text-sm border-t border-gray-800">
        <p>Stock Screener Indonesia &copy; 2024 | Data dari Yahoo Finance</p>
        <p className="mt-1">Disclaimer: Bukan merupakan saran investasi</p>
      </footer>
    </div>
  )
}

export default App
