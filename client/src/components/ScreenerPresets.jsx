import { FiTarget, FiTrendingUp, FiDollarSign, FiZap, FiShield } from 'react-icons/fi'

function ScreenerPresets({ setFilters }) {
  const presets = [
    {
      name: '🚀 Momentum Breakout',
      icon: FiZap,
      description: 'High momentum stocks with volume spike',
      filters: {
        highVolume: true,
        priceGainToday: true,
        momentumPlay: true,
        rsiOverbought: false,
        strongTrend: true
      }
    },
    {
      name: '💎 Value Opportunities',
      icon: FiDollarSign,
      description: 'Undervalued stocks with strong fundamentals',
      filters: {
        lowPE: true,
        lowPB: true,
        valuePlay: true,
        nearLows: true,
        rsiOversold: true
      }
    },
    {
      name: '📈 Bullish Setup',
      icon: FiTrendingUp,
      description: 'Multiple bullish signals alignment',
      filters: {
        bullishSetup: true,
        goldenCross: true,
        macdBullish: true,
        priceAboveSMA20: true,
        rsiNeutral: true
      }
    },
    {
      name: '🛡️ Safe Blue Chips',
      icon: FiShield,
      description: 'Large cap stocks with dividend',
      filters: {
        largeCap: true,
        highDividend: true,
        lowPE: true,
        allMAUptrend: true
      }
    },
    {
      name: '🎯 Oversold Bounce',
      icon: FiTarget,
      description: 'Oversold conditions for potential bounce',
      filters: {
        rsiOversold: true,
        priceBelowLowerBB: true,
        stochOversold: true,
        nearLows: true
      }
    },
    {
      name: '⚡ Swing Trading',
      icon: FiZap,
      description: 'Medium-term swing opportunities',
      filters: {
        rsiNeutral: true,
        macdCrossover: true,
        price500to2000: true,
        consolidation: false,
        highVolume: true
      }
    }
  ]

  const applyPreset = (preset) => {
    setFilters(preset.filters)
  }

  const clearFilters = () => {
    setFilters({})
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FiTarget className="text-orange-500" />
        Preset Strategies
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {presets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => applyPreset(preset)}
            className="text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600 hover:border-gray-500"
          >
            <div className="flex items-center gap-3 mb-2">
              <preset.icon className="w-5 h-5 text-orange-400" />
              <span className="font-medium">{preset.name}</span>
            </div>
            <p className="text-sm text-gray-400">{preset.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.keys(preset.filters).slice(0, 3).map(key => (
                <span key={key} className="text-xs bg-orange-600/20 text-orange-300 px-2 py-0.5 rounded">
                  {key}
                </span>
              ))}
              {Object.keys(preset.filters).length > 3 && (
                <span className="text-xs text-gray-500">
                  +{Object.keys(preset.filters).length - 3} more
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={clearFilters}
        className="w-full mt-4 text-sm text-gray-400 hover:text-white py-2 border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
}

export default ScreenerPresets