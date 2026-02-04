import { FiTrendingUp, FiBarChart2, FiCpu, FiDatabase, FiActivity } from 'react-icons/fi'

function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'screener', label: 'Screener', icon: FiBarChart2 },
    { id: 'detail', label: 'Detail', icon: FiTrendingUp },
    { id: 'ai', label: 'AI Analysis', icon: FiCpu },
    { id: 'regression', label: 'ML Training', icon: FiDatabase },
    { id: 'live', label: 'Live Predict', icon: FiActivity },
  ]

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Stock Screener</h1>
              <p className="text-xs text-gray-400">Indonesia (IDX)</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
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
    </header>
  )
}

export default Header
