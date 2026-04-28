import { useState } from 'react'
import { FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi'

function ScreenerFilters({ filters, setFilters, market = 'ID' }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isUS = market === 'US'

  const filterOptions = [
    {
      category: 'Price Action',
      items: [
        { key: 'priceGainToday', label: isUS ? 'Price Up Today' : 'Harga Naik Hari Ini', type: 'boolean' },
        { key: 'priceDropToday', label: isUS ? 'Price Down Today' : 'Harga Turun Hari Ini', type: 'boolean' },
        { key: 'highVolume', label: isUS ? 'High Volume (>Avg)' : 'Volume Tinggi (>Avg)', type: 'boolean' },
        { key: 'nearHighs', label: isUS ? 'Near 52W High (>90%)' : 'Dekat 52W High (>90%)', type: 'boolean' },
        { key: 'nearLows', label: isUS ? 'Near 52W Low (<10%)' : 'Dekat 52W Low (<10%)', type: 'boolean' },
      ]
    },
    {
      category: 'Fundamental Metrics',
      items: [
        { key: 'lowPE', label: isUS ? 'Low P/E (<15)' : 'P/E Rendah (<15)', type: 'boolean' },
        { key: 'highPE', label: isUS ? 'High P/E (>30)' : 'P/E Tinggi (>30)', type: 'boolean' },
        { key: 'lowPB', label: isUS ? 'Low P/B (<2)' : 'P/B Rendah (<2)', type: 'boolean' },
        { key: 'highDividend', label: isUS ? 'High Dividend (>3%)' : 'Dividen Tinggi (>3%)', type: 'boolean' },
        { key: 'largeCap', label: isUS ? 'Large Cap (>$100B)' : 'Large Cap (>10T)', type: 'boolean' },
        { key: 'midCap', label: isUS ? 'Mid Cap ($10B-$100B)' : 'Mid Cap (1T-10T)', type: 'boolean' },
        { key: 'smallCap', label: isUS ? 'Small Cap (<$10B)' : 'Small Cap (<1T)', type: 'boolean' },
      ]
    },
    {
      category: isUS ? 'Price Range' : 'Price Range Filters',
      items: isUS ? [
        { key: 'priceUnder50', label: 'Price < $50', type: 'boolean' },
        { key: 'price50to200', label: 'Price $50-$200', type: 'boolean' },
        { key: 'price200to500', label: 'Price $200-$500', type: 'boolean' },
        { key: 'priceOver500', label: 'Price > $500', type: 'boolean' },
      ] : [
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
          {isUS ? 'Screener Filters' : 'Filter Screener'}
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
              {isUS ? 'Reset Filters' : 'Reset Filter'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ScreenerFilters
