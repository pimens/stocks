import { useState } from 'react'
import { FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi'

function ScreenerFilters({ filters, setFilters }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const filterOptions = [
    {
      category: 'Price Action',
      items: [
        { key: 'priceGainToday', label: 'Harga Naik Hari Ini', type: 'boolean' },
        { key: 'priceDropToday', label: 'Harga Turun Hari Ini', type: 'boolean' },
        { key: 'highVolume', label: 'Volume Tinggi (>Avg)', type: 'boolean' },
        { key: 'nearHighs', label: 'Dekat 52W High (>90%)', type: 'boolean' },
        { key: 'nearLows', label: 'Dekat 52W Low (<10%)', type: 'boolean' },
      ]
    },
    {
      category: 'Fundamental Metrics',
      items: [
        { key: 'lowPE', label: 'P/E Rendah (<15)', type: 'boolean' },
        { key: 'highPE', label: 'P/E Tinggi (>30)', type: 'boolean' },
        { key: 'lowPB', label: 'P/B Rendah (<2)', type: 'boolean' },
        { key: 'highDividend', label: 'Dividen Tinggi (>3%)', type: 'boolean' },
        { key: 'largeCap', label: 'Large Cap (>10T)', type: 'boolean' },
        { key: 'midCap', label: 'Mid Cap (1T-10T)', type: 'boolean' },
        { key: 'smallCap', label: 'Small Cap (<1T)', type: 'boolean' },
      ]
    },
    {
      category: 'Price Range Filters',
      items: [
        { key: 'priceUnder500', label: 'Harga < Rp 500', type: 'boolean' },
        { key: 'price500to2000', label: 'Harga Rp 500-2000', type: 'boolean' },
        { key: 'price2000to5000', label: 'Harga Rp 2000-5000', type: 'boolean' },
        { key: 'priceOver5000', label: 'Harga > Rp 5000', type: 'boolean' },
      ]
    },
    {
      category: 'RSI',
      items: [
        { key: 'rsiOversold', label: 'RSI Oversold (<30)', type: 'boolean' },
        { key: 'rsiOverbought', label: 'RSI Overbought (>70)', type: 'boolean' },
        { key: 'rsiNeutral', label: 'RSI Netral (30-70)', type: 'boolean' },
      ]
    },
    {
      category: 'Moving Average',
      items: [
        { key: 'priceAboveSMA20', label: 'Harga > SMA 20', type: 'boolean' },
        { key: 'priceAboveSMA50', label: 'Harga > SMA 50', type: 'boolean' },
        { key: 'priceAboveSMA200', label: 'Harga > SMA 200', type: 'boolean' },
        { key: 'goldenCross', label: 'Golden Cross (SMA20 > SMA50)', type: 'boolean' },
        { key: 'deathCross', label: 'Death Cross (SMA20 < SMA50)', type: 'boolean' },
        { key: 'allMAUptrend', label: 'All MA Uptrend', type: 'boolean' },
      ]
    },
    {
      category: 'MACD',
      items: [
        { key: 'macdBullish', label: 'MACD Bullish', type: 'boolean' },
        { key: 'macdBearish', label: 'MACD Bearish', type: 'boolean' },
        { key: 'macdCrossover', label: 'MACD Fresh Crossover', type: 'boolean' },
      ]
    },
    {
      category: 'Bollinger Bands',
      items: [
        { key: 'priceBelowLowerBB', label: 'Harga < Lower BB', type: 'boolean' },
        { key: 'priceAboveUpperBB', label: 'Harga > Upper BB', type: 'boolean' },
        { key: 'bbSqueeze', label: 'BB Squeeze (Low Volatility)', type: 'boolean' },
      ]
    },
    {
      category: 'Stochastic',
      items: [
        { key: 'stochOversold', label: 'Stochastic Oversold', type: 'boolean' },
        { key: 'stochOverbought', label: 'Stochastic Overbought', type: 'boolean' },
      ]
    },
    {
      category: 'Advanced Trend',
      items: [
        { key: 'strongTrend', label: 'Strong Trend (ADX > 25)', type: 'boolean' },
        { key: 'breakoutPattern', label: 'Breakout Pattern', type: 'boolean' },
        { key: 'consolidation', label: 'Consolidation (Low ATR)', type: 'boolean' },
      ]
    },
    {
      category: 'Composite Signals',
      items: [
        { key: 'bullishSetup', label: '🟢 Bullish Setup (Multi-Signal)', type: 'boolean' },
        { key: 'bearishSetup', label: '🔴 Bearish Setup (Multi-Signal)', type: 'boolean' },
        { key: 'momentumPlay', label: '⚡ Momentum Play', type: 'boolean' },
        { key: 'valuePlay', label: '💎 Value Play', type: 'boolean' },
      ]
    }
  ]

  const toggleFilter = (key) => {
    setFilters({
      ...filters,
      [key]: !filters[key]
    })
  }

  const clearFilters = () => {
    setFilters({})
  }

  const activeFiltersCount = Object.values(filters).filter(v => v === true).length

  return (
    <div className="card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-lg font-semibold"
      >
        <span className="flex items-center gap-2">
          <FiFilter className="text-green-500" />
          Filter Screener
          {activeFiltersCount > 0 && (
            <span className="bg-green-600 text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </span>
        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
          {filterOptions.map((group) => (
            <div key={group.category}>
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                {group.category}
              </h4>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters[item.key] || false}
                      onChange={() => toggleFilter(item.key)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="w-full text-sm text-red-400 hover:text-red-300 mt-4"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ScreenerFilters
