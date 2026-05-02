import { useEffect, useState } from 'react'
import { FiTrendingUp, FiBarChart2, FiCpu, FiDatabase, FiActivity, FiZap, FiTarget, FiPackage, FiFilter, FiMenu, FiX } from 'react-icons/fi'

function Header({ activeTab, setActiveTab, market, setMarket }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'screener', label: 'Screener', icon: FiBarChart2 },
    { id: 'detail', label: 'Detail', icon: FiTrendingUp },
    { id: 'ai', label: 'AI', icon: FiCpu },
    { id: 'indicator-analysis', label: '90+ Indikator', icon: FiActivity },
    { id: 'regression', label: 'ML Train', icon: FiDatabase },
    { id: 'feature-selection', label: 'Feature Select', icon: FiTarget },
    { id: 'model-manager', label: 'Models', icon: FiPackage },
    { id: 'live', label: 'Live Predict', icon: FiActivity },
    { id: 'intraday', label: 'Realtime', icon: FiZap },
    { id: 'rule-screener', label: 'Rule Screen', icon: FiFilter },
  ]

  useEffect(() => {
    if (!mobileMenuOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [mobileMenuOpen])

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
  }

  const handleMarketChange = (nextMarket) => {
    setMarket(nextMarket)
  }

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Market Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">Stock Screener</h1>
              <p className="hidden sm:block text-xs text-gray-400">{market === 'US' ? 'US Market (NYSE/NASDAQ)' : 'Indonesia (IDX)'}</p>
            </div>
            {/* Market Toggle */}
            <div className="hidden md:flex items-center bg-gray-700 rounded-lg p-1 ml-2">
              <button
                onClick={() => handleMarketChange('ID')}
                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                  market === 'ID'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇮🇩 IDX
              </button>
              <button
                onClick={() => handleMarketChange('US')}
                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                  market === 'US'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇺🇸 US
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden text-xs px-2 py-1 rounded bg-gray-700 text-gray-200">
              {market === 'US' ? '🇺🇸 US' : '🇮🇩 IDX'}
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-200 hover:bg-gray-700 hover:text-white"
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[88vw] max-w-sm bg-gray-800 border-l border-gray-700 shadow-2xl transform transition-transform duration-200 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi mobile"
        >
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-700">
            <div>
              <div className="text-white font-semibold">Menu</div>
              <div className="text-xs text-gray-400">Pilih halaman & market</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-200 hover:bg-gray-700 hover:text-white"
              aria-label="Tutup menu navigasi"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Market</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMarketChange('ID')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  market === 'ID' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                🇮🇩 IDX
              </button>
              <button
                onClick={() => handleMarketChange('US')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  market === 'US' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                🇺🇸 US
              </button>
            </div>
          </div>

          <nav className="p-2 overflow-y-auto h-[calc(100%-8.5rem)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </header>
  )
}

export default Header
