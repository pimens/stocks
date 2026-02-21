import { useState, useMemo, useEffect, useCallback } from 'react'
import { stockApi } from '../services/api'
import { STOCK_PRICES, PRICE_RANGES, getStocksByPriceRange } from '../data/stockPrices'
import { FiPlus, FiTrash2, FiPlay, FiSave, FiUpload, FiDownload, FiCopy, FiCheck, FiX, FiAlertTriangle, FiInfo, FiChevronDown, FiChevronUp, FiRefreshCw, FiFilter, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

// All available features for screening
const ALL_FEATURES = {
  // ML-Friendly Features
  closePosition: { label: 'Close Position', group: 'mlfeatures', desc: '(close-low)/(high-low), 0-1 scale' },
  bodyRangeRatio: { label: 'Body/Range Ratio', group: 'mlfeatures', desc: 'abs(close-open)/(high-low)' },
  upperWickRatio: { label: 'Upper Wick Ratio', group: 'mlfeatures', desc: 'Upper wick / range' },
  lowerWickRatio: { label: 'Lower Wick Ratio', group: 'mlfeatures', desc: 'Lower wick / range' },
  distFromSMA5: { label: 'Dist from SMA5 %', group: 'mlfeatures', desc: 'Jarak dari SMA5 dalam %' },
  distFromSMA20: { label: 'Dist from SMA20 %', group: 'mlfeatures', desc: 'Jarak dari SMA20 dalam %' },
  distFromSMA50: { label: 'Dist from SMA50 %', group: 'mlfeatures', desc: 'Jarak dari SMA50 dalam %' },

  // Delta/Change Indicators
  deltaRSI: { label: 'ΔRSI', group: 'delta', desc: 'Perubahan RSI dari hari sebelumnya' },
  deltaMACDHist: { label: 'ΔMACD Hist', group: 'delta', desc: 'Perubahan MACD Histogram (slope)' },
  deltaStochK: { label: 'ΔStoch %K', group: 'delta', desc: 'Perubahan Stochastic %K' },
  deltaADX: { label: 'ΔADX', group: 'delta', desc: 'Perubahan ADX' },
  deltaCCI: { label: 'ΔCCI', group: 'delta', desc: 'Perubahan CCI' },
  deltaMFI: { label: 'ΔMFI', group: 'delta', desc: 'Perubahan MFI' },

  // SMA
  sma5: { label: 'SMA 5', group: 'sma', desc: 'Simple Moving Average 5 hari' },
  sma10: { label: 'SMA 10', group: 'sma', desc: 'Simple Moving Average 10 hari' },
  sma20: { label: 'SMA 20', group: 'sma', desc: 'Simple Moving Average 20 hari' },
  sma50: { label: 'SMA 50', group: 'sma', desc: 'Simple Moving Average 50 hari' },
  priceAboveSMA5: { label: 'Price > SMA5', group: 'sma', desc: '1 jika close > SMA5' },
  priceAboveSMA10: { label: 'Price > SMA10', group: 'sma', desc: '1 jika close > SMA10' },
  priceAboveSMA20: { label: 'Price > SMA20', group: 'sma', desc: '1 jika close > SMA20' },
  priceAboveSMA50: { label: 'Price > SMA50', group: 'sma', desc: '1 jika close > SMA50' },
  sma5AboveSMA10: { label: 'SMA5 > SMA10', group: 'sma', desc: '1 jika SMA5 > SMA10' },
  sma10AboveSMA20: { label: 'SMA10 > SMA20', group: 'sma', desc: '1 jika SMA10 > SMA20' },
  sma20AboveSMA50: { label: 'SMA20 > SMA50', group: 'sma', desc: '1 jika SMA20 > SMA50' },

  // EMA
  ema5: { label: 'EMA 5', group: 'ema', desc: 'Exponential Moving Average 5 hari' },
  ema10: { label: 'EMA 10', group: 'ema', desc: 'Exponential Moving Average 10 hari' },
  ema12: { label: 'EMA 12', group: 'ema', desc: 'Exponential Moving Average 12 hari' },
  ema26: { label: 'EMA 26', group: 'ema', desc: 'Exponential Moving Average 26 hari' },
  priceAboveEMA12: { label: 'Price > EMA12', group: 'ema', desc: '1 jika close > EMA12' },
  priceAboveEMA26: { label: 'Price > EMA26', group: 'ema', desc: '1 jika close > EMA26' },

  // RSI
  rsi: { label: 'RSI', group: 'rsi', desc: 'Relative Strength Index (14)' },
  rsiOversold: { label: 'RSI Oversold', group: 'rsi', desc: '1 jika RSI < 30' },
  rsiOverbought: { label: 'RSI Overbought', group: 'rsi', desc: '1 jika RSI > 70' },
  rsiNeutral: { label: 'RSI Neutral', group: 'rsi', desc: '1 jika 30 <= RSI <= 70' },

  // MACD
  macd: { label: 'MACD', group: 'macd', desc: 'MACD line' },
  macdSignal: { label: 'MACD Signal', group: 'macd', desc: 'Signal line' },
  macdHistogram: { label: 'MACD Histogram', group: 'macd', desc: 'Histogram (MACD - Signal)' },
  macdBullish: { label: 'MACD Bullish', group: 'macd', desc: '1 jika MACD > Signal' },
  macdPositive: { label: 'MACD Positive', group: 'macd', desc: '1 jika MACD > 0' },
  macdGoldenCross: { label: 'MACD Golden Cross', group: 'macd', desc: '1 jika MACD cross di atas Signal (bullish)' },
  macdDeathCross: { label: 'MACD Death Cross', group: 'macd', desc: '1 jika MACD cross di bawah Signal (bearish)' },
  macdNearGoldenCross: { label: 'MACD Near Golden Cross', group: 'macd', desc: '1 jika histogram < 0 tapi naik (mendekati golden cross)' },
  macdHistogramConverging: { label: 'MACD Histogram Converging', group: 'macd', desc: '1 jika histogram mendekati 0 dari negatif' },
  macdHistogramRising: { label: 'MACD Histogram Rising', group: 'macd', desc: '1 jika histogram naik 2 hari berturut-turut' },
  macdDistanceToSignal: { label: 'MACD Dist to Signal %', group: 'macd', desc: 'Jarak MACD ke Signal dalam persen' },

  // Bollinger Bands
  bbUpper: { label: 'BB Upper', group: 'bollinger', desc: 'Bollinger Band atas' },
  bbMiddle: { label: 'BB Middle', group: 'bollinger', desc: 'Bollinger Band tengah (SMA20)' },
  bbLower: { label: 'BB Lower', group: 'bollinger', desc: 'Bollinger Band bawah' },
  bbWidth: { label: 'BB Width %', group: 'bollinger', desc: 'Lebar BB dalam persen' },
  priceBelowLowerBB: { label: 'Price < Lower BB', group: 'bollinger', desc: '1 jika close < BB bawah' },
  priceAboveUpperBB: { label: 'Price > Upper BB', group: 'bollinger', desc: '1 jika close > BB atas' },

  // Stochastic
  stochK: { label: 'Stochastic %K', group: 'stochastic', desc: 'Stochastic %K' },
  stochD: { label: 'Stochastic %D', group: 'stochastic', desc: 'Stochastic %D (signal)' },
  stochOversold: { label: 'Stoch Oversold', group: 'stochastic', desc: '1 jika %K < 20' },
  stochOverbought: { label: 'Stoch Overbought', group: 'stochastic', desc: '1 jika %K > 80' },
  stochBullishCross: { label: 'Stoch Bullish Cross', group: 'stochastic', desc: '1 jika %K > %D' },

  // ADX/DMI
  adx: { label: 'ADX', group: 'adx', desc: 'Average Directional Index' },
  pdi: { label: '+DI', group: 'adx', desc: 'Plus Directional Indicator' },
  mdi: { label: '-DI', group: 'adx', desc: 'Minus Directional Indicator' },
  strongTrend: { label: 'Strong Trend', group: 'adx', desc: '1 jika ADX > 25' },
  bullishDI: { label: 'Bullish DI', group: 'adx', desc: '1 jika +DI > -DI' },

  // Volatility
  atr: { label: 'ATR', group: 'volatility', desc: 'Average True Range (14)' },
  atrPercent: { label: 'ATR %', group: 'volatility', desc: 'ATR sebagai % dari harga' },

  // Volume
  obv: { label: 'OBV', group: 'volume', desc: 'On Balance Volume' },
  obvChange: { label: 'OBV Change', group: 'volume', desc: 'Perubahan OBV dari hari sebelumnya' },
  obvTrend: { label: 'OBV Trend', group: 'volume', desc: 'Tren OBV: 1=naik, -1=turun, 0=tetap' },
  volumeRatio: { label: 'Volume Ratio', group: 'volume', desc: 'Volume / Avg Volume (20)' },
  highVolume: { label: 'High Volume', group: 'volume', desc: '1 jika volume > 1.5x rata-rata' },

  // Williams %R
  williamsR: { label: 'Williams %R', group: 'williams', desc: 'Williams %R (14)' },
  williamsROversold: { label: 'Williams Oversold', group: 'williams', desc: '1 jika %R < -80' },
  williamsROverbought: { label: 'Williams Overbought', group: 'williams', desc: '1 jika %R > -20' },

  // CCI
  cci: { label: 'CCI', group: 'cci', desc: 'Commodity Channel Index (20)' },
  cciOversold: { label: 'CCI Oversold', group: 'cci', desc: '1 jika CCI < -100' },
  cciOverbought: { label: 'CCI Overbought', group: 'cci', desc: '1 jika CCI > 100' },

  // MFI
  mfi: { label: 'MFI', group: 'mfi', desc: 'Money Flow Index (14)' },
  mfiOversold: { label: 'MFI Oversold', group: 'mfi', desc: '1 jika MFI < 20' },
  mfiOverbought: { label: 'MFI Overbought', group: 'mfi', desc: '1 jika MFI > 80' },

  // ROC & Momentum
  roc: { label: 'ROC', group: 'momentum', desc: 'Rate of Change (12)' },
  rocPositive: { label: 'ROC Positive', group: 'momentum', desc: '1 jika ROC > 0' },
  momentum: { label: 'Momentum', group: 'momentum', desc: 'Price Momentum (10)' },
  momentumPositive: { label: 'Momentum Positive', group: 'momentum', desc: '1 jika Momentum > 0' },
  pricePosition: { label: 'Price Position', group: 'momentum', desc: 'Posisi harga dalam range 20 hari (0-100)' },

  // Candlestick
  bodySize: { label: 'Body Size', group: 'candlestick', desc: 'Ukuran body candle' },
  upperWick: { label: 'Upper Wick', group: 'candlestick', desc: 'Sumbu atas candle' },
  lowerWick: { label: 'Lower Wick', group: 'candlestick', desc: 'Sumbu bawah candle' },
  isBullishCandle: { label: 'Bullish Candle', group: 'candlestick', desc: '1 jika close > open' },
  isDoji: { label: 'Doji', group: 'candlestick', desc: '1 jika body < 10% range' },
  gapUp: { label: 'Gap Up', group: 'candlestick', desc: '1 jika open > prev close' },
  gapDown: { label: 'Gap Down', group: 'candlestick', desc: '1 jika open < prev close' },

  // Returns
  return1d: { label: 'Return 1D', group: 'returns', desc: 'Return 1 hari sebelumnya (%)' },
  return3d: { label: 'Return 3D', group: 'returns', desc: 'Return 3 hari sebelumnya (%)' },
  return5d: { label: 'Return 5D', group: 'returns', desc: 'Return 5 hari sebelumnya (%)' },

  // ============ ADVANCED BULLISH SIGNALS ============
  // RSI Advanced
  rsiRising: { label: 'RSI Rising', group: 'bullish', desc: '1 jika RSI naik dari hari sebelumnya' },
  rsiExitOversold: { label: 'RSI Exit Oversold', group: 'bullish', desc: '1 jika RSI cross di atas 30 (keluar oversold)' },
  rsiBullishZone: { label: 'RSI Bullish Zone', group: 'bullish', desc: '1 jika RSI 30-50 (zona potensi naik)' },
  
  // Stochastic Advanced
  stochGoldenCross: { label: 'Stoch Golden Cross', group: 'bullish', desc: '1 jika %K cross di atas %D' },
  stochExitOversold: { label: 'Stoch Exit Oversold', group: 'bullish', desc: '1 jika %K cross di atas 20' },
  
  // Volume Advanced
  bullishVolume: { label: 'Bullish Volume', group: 'bullish', desc: '1 jika volume tinggi + candle hijau' },
  volumeSpike: { label: 'Volume Spike', group: 'bullish', desc: '1 jika volume > 2x average' },
  
  // Bollinger Band Advanced
  nearLowerBB: { label: 'Near Lower BB', group: 'bullish', desc: '1 jika harga dekat lower BB (bounce zone)' },
  bouncingFromLowerBB: { label: 'Bouncing Lower BB', group: 'bullish', desc: '1 jika memantul dari lower BB' },
  bbSqueeze: { label: 'BB Squeeze', group: 'bullish', desc: '1 jika BB sempit (potensi breakout)' },
  
  // ADX Advanced
  adxRising: { label: 'ADX Rising', group: 'bullish', desc: '1 jika ADX naik (trend menguat)' },
  bullishDICross: { label: 'Bullish DI Cross', group: 'bullish', desc: '1 jika +DI cross di atas -DI' },
  
  // Candlestick Patterns
  hammerCandle: { label: 'Hammer Candle', group: 'bullish', desc: '1 jika pola hammer (reversal bullish)' },
  bullishEngulfing: { label: 'Bullish Engulfing', group: 'bullish', desc: '1 jika pola bullish engulfing' },
  
  // Composite Scores
  bullishScore: { label: 'Bullish Score (0-10)', group: 'bullish', desc: 'Skor komposit bullish dari multi-indikator' },
  oversoldBounce: { label: 'Oversold Bounce', group: 'bullish', desc: '1 jika oversold + candle hijau + volume' },
  momentumShift: { label: 'Momentum Shift', group: 'bullish', desc: '1 jika MACD, RSI, DI semua bullish' },

  // Price Data (for raw comparison)
  close: { label: 'Close', group: 'price', desc: 'Harga Close' },
  open: { label: 'Open', group: 'price', desc: 'Harga Open' },
  high: { label: 'High', group: 'price', desc: 'Harga High' },
  low: { label: 'Low', group: 'price', desc: 'Harga Low' },
  volume: { label: 'Volume', group: 'price', desc: 'Volume' },
}

// Group definitions
const FEATURE_GROUPS = {
  mlfeatures: { label: '🤖 ML Features', color: 'fuchsia' },
  delta: { label: '📐 Delta/Change', color: 'cyan' },
  sma: { label: '📈 SMA', color: 'green' },
  ema: { label: '📉 EMA', color: 'teal' },
  rsi: { label: '🔄 RSI', color: 'yellow' },
  macd: { label: '📶 MACD', color: 'purple' },
  bollinger: { label: '🎯 Bollinger Bands', color: 'pink' },
  stochastic: { label: '⚡ Stochastic', color: 'orange' },
  adx: { label: '💪 ADX/DMI', color: 'red' },
  volatility: { label: '📊 Volatility', color: 'indigo' },
  volume: { label: '📦 Volume', color: 'cyan' },
  williams: { label: '〰️ Williams %R', color: 'lime' },
  cci: { label: '🌊 CCI', color: 'amber' },
  mfi: { label: '💰 MFI', color: 'emerald' },
  momentum: { label: '🚀 Momentum', color: 'violet' },
  candlestick: { label: '🕯️ Candlestick', color: 'rose' },
  returns: { label: '📆 Returns', color: 'sky' },
  bullish: { label: '🔥 Bullish Signals', color: 'green' },
  price: { label: '💵 Price Data', color: 'gray' },
}

// Comparison operators
const OPERATORS = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
]

// Preset screening rules
const PRESET_RULES = {
  // ============ RECOMMENDED: BEST BULLISH DETECTION PRESETS ============
  bullish_high_confidence: {
    name: '🔥 Bullish High Confidence',
    desc: '⭐ RECOMMENDED: Multi-konfirmasi bullish, risiko rendah!',
    rules: [
      { leftFeature: 'bullishScore', operator: '>=', compareType: 'constant', rightValue: 7 },
      { leftFeature: 'macdHistogramRising', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsiRising', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'bullishVolume', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'isBullishCandle', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  early_reversal: {
    name: '🌅 Early Reversal Detection',
    desc: '⭐ RECOMMENDED: Deteksi dini reversal dari oversold',
    rules: [
      { leftFeature: 'rsiExitOversold', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'stochGoldenCross', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'deltaMACDHist', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'isBullishCandle', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  momentum_shift: {
    name: '🔄 Momentum Shift',
    desc: '⭐ RECOMMENDED: Semua indikator momentum bullish',
    rules: [
      { leftFeature: 'momentumShift', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'bullishScore', operator: '>=', compareType: 'constant', rightValue: 6 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 60 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  macd_near_golden: {
    name: '🔮 MACD Near Golden Cross',
    desc: '⭐ RECOMMENDED: Entry sebelum golden cross!',
    rules: [
      { leftFeature: 'macdNearGoldenCross', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'macdHistogramRising', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsiRising', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '>', compareType: 'constant', rightValue: 35 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 65 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 0.8 },
    ]
  },
  bounce_from_support: {
    name: '📈 Bounce from Support',
    desc: '⭐ RECOMMENDED: Memantul dari support dengan konfirmasi',
    rules: [
      { leftFeature: 'bouncingFromLowerBB', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 40 },
      { leftFeature: 'deltaRSI', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'isBullishCandle', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  di_crossover_bullish: {
    name: '💪 DI Bullish Crossover',
    desc: '⭐ RECOMMENDED: +DI cross -DI dengan trend menguat',
    rules: [
      { leftFeature: 'bullishDICross', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'adxRising', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'adx', operator: '>', compareType: 'constant', rightValue: 20 },
      { leftFeature: 'rsi', operator: '>', compareType: 'constant', rightValue: 45 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  // ============ ADDITIONAL PRESETS ============
  momentum_breakout: {
    name: '🚀 Momentum Breakout',
    desc: 'Saham dengan momentum kuat dan volume tinggi',
    rules: [
      { leftFeature: 'deltaCCI', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'roc', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'adx', operator: '>', compareType: 'constant', rightValue: 20 },
      { leftFeature: 'pdi', operator: '>', compareType: 'feature', rightFeature: 'mdi' },
      { leftFeature: 'closePosition', operator: '>', compareType: 'constant', rightValue: 0.6 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  oversold_bounce: {
    name: '📉 Oversold Bounce',
    desc: 'Saham oversold dengan tanda-tanda reversal',
    rules: [
      { leftFeature: 'oversoldBounce', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsiRising', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'deltaMACDHist', operator: '>', compareType: 'constant', rightValue: 0 },
    ]
  },
  trend_following: {
    name: '📈 Trend Following',
    desc: 'Saham dalam uptrend yang kuat',
    rules: [
      { leftFeature: 'priceAboveSMA20', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'priceAboveSMA50', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'sma20AboveSMA50', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'adx', operator: '>', compareType: 'constant', rightValue: 25 },
      { leftFeature: 'macdBullish', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  volume_breakout: {
    name: '📦 Volume Breakout',
    desc: 'Saham dengan volume explosion',
    rules: [
      { leftFeature: 'volumeSpike', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'bullishVolume', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'obvTrend', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'closePosition', operator: '>', compareType: 'constant', rightValue: 0.6 },
    ]
  },
  macd_golden_cross: {
    name: '📶 MACD Golden Cross',
    desc: 'MACD sudah golden cross',
    rules: [
      { leftFeature: 'macdGoldenCross', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '>', compareType: 'constant', rightValue: 45 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  candlestick_reversal: {
    name: '🕯️ Candlestick Reversal',
    desc: 'Pola candle reversal bullish',
    rules: [
      { leftFeature: 'hammerCandle', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 40 },
      { leftFeature: 'nearLowerBB', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  bb_squeeze_breakout: {
    name: '🎯 BB Squeeze Breakout',
    desc: 'Bollinger Band sempit siap breakout',
    rules: [
      { leftFeature: 'bbSqueeze', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'deltaMACDHist', operator: '>', compareType: 'constant', rightValue: 0 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1.5 },
      { leftFeature: 'isBullishCandle', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  gap_up_strong: {
    name: '⬆️ Gap Up Strong',
    desc: 'Gap up dengan volume dan trend support',
    rules: [
      { leftFeature: 'gapUp', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1.5 },
      { leftFeature: 'closePosition', operator: '>', compareType: 'constant', rightValue: 0.7 },
      { leftFeature: 'priceAboveSMA20', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  }
}

// Complete IDX stocks with sector info
const IDX_STOCKS = [
  // Banking
  { code: 'BBCA', name: 'Bank Central Asia', sector: 'Banking' },
  { code: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Banking' },
  { code: 'BMRI', name: 'Bank Mandiri', sector: 'Banking' },
  { code: 'BBNI', name: 'Bank Negara Indonesia', sector: 'Banking' },
  { code: 'BRIS', name: 'Bank Syariah Indonesia', sector: 'Banking' },
  { code: 'BTPN', name: 'Bank BTPN', sector: 'Banking' },
  { code: 'NISP', name: 'Bank OCBC NISP', sector: 'Banking' },
  { code: 'BDMN', name: 'Bank Danamon', sector: 'Banking' },
  { code: 'BNGA', name: 'Bank CIMB Niaga', sector: 'Banking' },
  { code: 'MEGA', name: 'Bank Mega', sector: 'Banking' },
  { code: 'PNBN', name: 'Bank Pan Indonesia', sector: 'Banking' },
  { code: 'BJBR', name: 'Bank BJB', sector: 'Banking' },
  { code: 'BJTM', name: 'Bank Jatim', sector: 'Banking' },
  { code: 'BBTN', name: 'Bank BTN', sector: 'Banking' },
  { code: 'ARTO', name: 'Bank Jago', sector: 'Banking' },
  // Telco
  { code: 'TLKM', name: 'Telkom Indonesia', sector: 'Telecom' },
  { code: 'EXCL', name: 'XL Axiata', sector: 'Telecom' },
  { code: 'ISAT', name: 'Indosat Ooredoo', sector: 'Telecom' },
  { code: 'TOWR', name: 'Sarana Menara Nusantara', sector: 'Telecom' },
  { code: 'TBIG', name: 'Tower Bersama Infrastructure', sector: 'Telecom' },
  // Consumer
  { code: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer' },
  { code: 'ICBP', name: 'Indofood CBP', sector: 'Consumer' },
  { code: 'INDF', name: 'Indofood', sector: 'Consumer' },
  { code: 'KLBF', name: 'Kalbe Farma', sector: 'Consumer' },
  { code: 'SIDO', name: 'Industri Jamu Sido Muncul', sector: 'Consumer' },
  { code: 'MYOR', name: 'Mayora Indah', sector: 'Consumer' },
  { code: 'ULTJ', name: 'Ultra Jaya Milk', sector: 'Consumer' },
  { code: 'ROTI', name: 'Nippon Indosari Corpindo', sector: 'Consumer' },
  // Tobacco
  { code: 'HMSP', name: 'HM Sampoerna', sector: 'Tobacco' },
  { code: 'GGRM', name: 'Gudang Garam', sector: 'Tobacco' },
  // Automotive
  { code: 'ASII', name: 'Astra International', sector: 'Automotive' },
  { code: 'AUTO', name: 'Astra Otoparts', sector: 'Automotive' },
  { code: 'SMSM', name: 'Selamat Sempurna', sector: 'Automotive' },
  // Mining
  { code: 'ADRO', name: 'Adaro Energy Indonesia', sector: 'Mining' },
  { code: 'PTBA', name: 'Bukit Asam', sector: 'Mining' },
  { code: 'ITMG', name: 'Indo Tambangraya Megah', sector: 'Mining' },
  { code: 'ANTM', name: 'Aneka Tambang', sector: 'Mining' },
  { code: 'INCO', name: 'Vale Indonesia', sector: 'Mining' },
  { code: 'TINS', name: 'Timah', sector: 'Mining' },
  { code: 'MDKA', name: 'Merdeka Copper Gold', sector: 'Mining' },
  { code: 'MEDC', name: 'Medco Energi', sector: 'Mining' },
  { code: 'HRUM', name: 'Harum Energy', sector: 'Mining' },
  { code: 'BYAN', name: 'Bayan Resources', sector: 'Mining' },
  // Oil & Gas
  { code: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Oil & Gas' },
  { code: 'AKRA', name: 'AKR Corporindo', sector: 'Oil & Gas' },
  // Cement
  { code: 'SMGR', name: 'Semen Indonesia', sector: 'Cement' },
  { code: 'INTP', name: 'Indocement Tunggal Prakarsa', sector: 'Cement' },
  // Construction
  { code: 'WIKA', name: 'Wijaya Karya', sector: 'Construction' },
  { code: 'WSKT', name: 'Waskita Karya', sector: 'Construction' },
  { code: 'PTPP', name: 'PP (Persero)', sector: 'Construction' },
  { code: 'ADHI', name: 'Adhi Karya', sector: 'Construction' },
  { code: 'JSMR', name: 'Jasa Marga', sector: 'Construction' },
  // Heavy Equipment
  { code: 'UNTR', name: 'United Tractors', sector: 'Heavy Equipment' },
  // Retail
  { code: 'ACES', name: 'Ace Hardware Indonesia', sector: 'Retail' },
  { code: 'MAPI', name: 'Mitra Adiperkasa', sector: 'Retail' },
  { code: 'ERAA', name: 'Erajaya Swasembada', sector: 'Retail' },
  { code: 'AMRT', name: 'Sumber Alfaria Trijaya', sector: 'Retail' },
  { code: 'LPPF', name: 'Matahari Department Store', sector: 'Retail' },
  // Property
  { code: 'BSDE', name: 'Bumi Serpong Damai', sector: 'Property' },
  { code: 'CTRA', name: 'Ciputra Development', sector: 'Property' },
  { code: 'SMRA', name: 'Summarecon Agung', sector: 'Property' },
  { code: 'PWON', name: 'Pakuwon Jati', sector: 'Property' },
  // Poultry
  { code: 'CPIN', name: 'Charoen Pokphand Indonesia', sector: 'Poultry' },
  { code: 'JPFA', name: 'Japfa Comfeed Indonesia', sector: 'Poultry' },
  // Plantation
  { code: 'AALI', name: 'Astra Agro Lestari', sector: 'Plantation' },
  { code: 'LSIP', name: 'PP London Sumatra', sector: 'Plantation' },
  // Media
  { code: 'SCMA', name: 'Surya Citra Media', sector: 'Media' },
  { code: 'MNCN', name: 'Media Nusantara Citra', sector: 'Media' },
  // Technology
  { code: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'Technology' },
  { code: 'BUKA', name: 'Bukalapak.com', sector: 'Technology' },
  { code: 'EMTK', name: 'Elang Mahkota Teknologi', sector: 'Technology' },
  { code: 'MTDL', name: 'Metrodata Electronics', sector: 'Technology' },
  // Finance
  { code: 'ADMF', name: 'Adira Dinamika Multi Finance', sector: 'Finance' },
  { code: 'BFIN', name: 'BFI Finance Indonesia', sector: 'Finance' },
  // Healthcare
  { code: 'MIKA', name: 'Mitra Keluarga Karyasehat', sector: 'Healthcare' },
  { code: 'SILO', name: 'Siloam International Hospitals', sector: 'Healthcare' },
  // Chemical
  { code: 'BRPT', name: 'Barito Pacific', sector: 'Chemical' },
  { code: 'TPIA', name: 'Chandra Asri Petrochemical', sector: 'Chemical' },
  // Paper
  { code: 'INKP', name: 'Indah Kiat Pulp & Paper', sector: 'Paper' },
  { code: 'TKIM', name: 'Pabrik Kertas Tjiwi Kimia', sector: 'Paper' },
  // Transportation
  { code: 'BIRD', name: 'Blue Bird', sector: 'Transportation' },
  { code: 'GIAA', name: 'Garuda Indonesia', sector: 'Transportation' },
  // Others
  { code: 'SRTG', name: 'Saratoga Investama Sedaya', sector: 'Investment' },
  { code: 'ESSA', name: 'Surya Esa Perkasa', sector: 'Energy' },
  { code: 'AMMN', name: 'Amman Mineral Internasional', sector: 'Mining' },
  { code: 'PGEO', name: 'Pertamina Geothermal Energy', sector: 'Energy' },
]

// Sector colors
const SECTOR_COLORS = {
  'Banking': 'emerald',
  'Telecom': 'violet',
  'Consumer': 'orange',
  'Tobacco': 'amber',
  'Automotive': 'slate',
  'Mining': 'yellow',
  'Oil & Gas': 'red',
  'Cement': 'stone',
  'Construction': 'zinc',
  'Heavy Equipment': 'gray',
  'Retail': 'pink',
  'Property': 'cyan',
  'Poultry': 'lime',
  'Plantation': 'green',
  'Media': 'purple',
  'Technology': 'indigo',
  'Finance': 'teal',
  'Healthcare': 'rose',
  'Chemical': 'fuchsia',
  'Paper': 'amber',
  'Transportation': 'sky',
  'Investment': 'blue',
  'Energy': 'orange',
}

// LQ45 stocks list
const LQ45_STOCKS = [
  'ACES', 'ADRO', 'AKRA', 'AMMN', 'AMRT', 'ANTM', 'ARTO', 'ASII', 'BBCA', 'BBNI',
  'BBRI', 'BBTN', 'BFIN', 'BMRI', 'BRPT', 'BUKA', 'CPIN', 'EMTK', 'ESSA', 'EXCL',
  'GGRM', 'HRUM', 'ICBP', 'INCO', 'INDF', 'INKP', 'INTP', 'ISAT', 'ITMG', 'KLBF',
  'MAPI', 'MDKA', 'MEDC', 'MIKA', 'PGAS', 'PGEO', 'PTBA', 'SIDO', 'SMGR', 'SRTG',
  'TBIG', 'TINS', 'TLKM', 'TOWR', 'UNTR', 'UNVR'
]

// IDX30 stocks list
const IDX30_STOCKS = [
  'ADRO', 'AMMN', 'AMRT', 'ASII', 'BBCA', 'BBNI', 'BBRI', 'BBTN', 'BMRI', 'BRPT',
  'BUKA', 'CPIN', 'EMTK', 'EXCL', 'ICBP', 'INDF', 'INKP', 'ISAT', 'ITMG', 'KLBF',
  'MDKA', 'MEDC', 'PGAS', 'SMGR', 'TBIG', 'TLKM', 'TOWR', 'UNTR', 'UNVR'
]

// Get unique sectors
const ALL_SECTORS = [...new Set(IDX_STOCKS.map(s => s.sector))].sort()

export default function RuleScreener() {
  // Stock list
  const [stockList, setStockList] = useState('lq45') // 'lq45', 'idx30', 'sector', 'price', 'all', 'custom'
  const [customStocks, setCustomStocks] = useState('')
  const [selectedSectors, setSelectedSectors] = useState([]) // For sector filter
  const [selectedPriceRange, setSelectedPriceRange] = useState('all') // For price range filter
  
  // Target date for screening
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  
  // Rules
  const [rules, setRules] = useState([
    { id: 1, leftFeature: 'deltaCCI', operator: '>', compareType: 'constant', rightValue: 0, rightFeature: '' },
    { id: 2, leftFeature: 'roc', operator: '>', compareType: 'constant', rightValue: 0, rightFeature: '' },
    { id: 3, leftFeature: 'adx', operator: '>', compareType: 'constant', rightValue: 20, rightFeature: '' },
    { id: 4, leftFeature: 'pdi', operator: '>', compareType: 'feature', rightValue: 0, rightFeature: 'mdi' },
    { id: 5, leftFeature: 'closePosition', operator: '>', compareType: 'constant', rightValue: 0.6, rightFeature: '' },
    { id: 6, leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1, rightFeature: '' },
  ])
  const [nextRuleId, setNextRuleId] = useState(7)
  
  // Logic operator (AND/OR)
  const [logicOperator, setLogicOperator] = useState('AND')
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [allResults, setAllResults] = useState([]) // All scanned results (passed & failed)
  const [scannedCount, setScannedCount] = useState(0)
  const [expandedStock, setExpandedStock] = useState(null)
  const [savedPresets, setSavedPresets] = useState([])
  const [presetName, setPresetName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showFeatureSelector, setShowFeatureSelector] = useState(null) // {ruleId, side: 'left'|'right'}
  const [featureSearch, setFeatureSearch] = useState('')
  const [showAllResults, setShowAllResults] = useState(true) // Default: show all stocks

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ruleScreenerPresets')
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load presets:', e)
      }
    }
  }, [])

  // Get stocks based on selection
  const getSelectedStocks = useCallback(() => {
    switch (stockList) {
      case 'lq45':
        return LQ45_STOCKS
      case 'idx30':
        return IDX30_STOCKS
      case 'sector':
        // Filter by selected sectors
        if (selectedSectors.length === 0) return IDX_STOCKS.map(s => s.code)
        return IDX_STOCKS.filter(s => selectedSectors.includes(s.sector)).map(s => s.code)
      case 'price':
        // Filter by price range
        if (selectedPriceRange === 'all') {
          return Object.keys(STOCK_PRICES).filter(code => STOCK_PRICES[code] > 0)
        }
        const grouped = getStocksByPriceRange()
        const rangeData = grouped[selectedPriceRange]
        return rangeData?.stocks?.map(s => s.code) || []
      case 'all':
        // All stocks from IDX_STOCKS
        return IDX_STOCKS.map(s => s.code)
      case 'custom':
        return customStocks.split(',').map(s => s.trim().toUpperCase()).filter(s => s)
      default:
        return LQ45_STOCKS
    }
  }, [stockList, customStocks, selectedSectors, selectedPriceRange])

  // Add new rule
  const addRule = () => {
    setRules([...rules, {
      id: nextRuleId,
      leftFeature: 'rsi',
      operator: '>',
      compareType: 'constant',
      rightValue: 50,
      rightFeature: ''
    }])
    setNextRuleId(nextRuleId + 1)
  }

  // Remove rule
  const removeRule = (id) => {
    setRules(rules.filter(r => r.id !== id))
  }

  // Update rule
  const updateRule = (id, field, value) => {
    setRules(rules.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value }
      }
      return r
    }))
  }

  // Duplicate rule
  const duplicateRule = (rule) => {
    setRules([...rules, { ...rule, id: nextRuleId }])
    setNextRuleId(nextRuleId + 1)
  }

  // Load preset
  const loadPreset = (preset) => {
    if (preset.rules) {
      const rulesWithIds = preset.rules.map((r, i) => ({ ...r, id: i + 1 }))
      setRules(rulesWithIds)
      setNextRuleId(rulesWithIds.length + 1)
    }
  }

  // Save current rules as preset
  const savePreset = () => {
    if (!presetName.trim()) return
    
    const newPreset = {
      id: Date.now(),
      name: presetName.trim(),
      rules: rules.map(({ id, ...rest }) => rest)
    }
    
    const updated = [...savedPresets, newPreset]
    setSavedPresets(updated)
    localStorage.setItem('ruleScreenerPresets', JSON.stringify(updated))
    setPresetName('')
    setShowSaveModal(false)
  }

  // Delete saved preset
  const deletePreset = (presetId) => {
    const updated = savedPresets.filter(p => p.id !== presetId)
    setSavedPresets(updated)
    localStorage.setItem('ruleScreenerPresets', JSON.stringify(updated))
  }

  // Export rules as JSON
  const exportRules = () => {
    const data = {
      name: 'Custom Rules',
      rules: rules.map(({ id, ...rest }) => rest),
      logicOperator
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'screening-rules.json'
    a.click()
  }

  // Import rules from JSON
  const importRules = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (data.rules && Array.isArray(data.rules)) {
          const rulesWithIds = data.rules.map((r, i) => ({ ...r, id: i + 1 }))
          setRules(rulesWithIds)
          setNextRuleId(rulesWithIds.length + 1)
          if (data.logicOperator) {
            setLogicOperator(data.logicOperator)
          }
        }
      } catch (err) {
        setError('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  // Evaluate single rule
  const evaluateRule = (rule, data) => {
    const leftValue = data[rule.leftFeature]
    
    if (leftValue === undefined || leftValue === null || isNaN(leftValue)) {
      return false
    }

    let rightValue
    if (rule.compareType === 'constant') {
      rightValue = parseFloat(rule.rightValue)
    } else {
      rightValue = data[rule.rightFeature]
      if (rightValue === undefined || rightValue === null || isNaN(rightValue)) {
        return false
      }
    }

    switch (rule.operator) {
      case '>': return leftValue > rightValue
      case '>=': return leftValue >= rightValue
      case '<': return leftValue < rightValue
      case '<=': return leftValue <= rightValue
      case '==': return Math.abs(leftValue - rightValue) < 0.0001
      case '!=': return Math.abs(leftValue - rightValue) >= 0.0001
      default: return false
    }
  }

  // Run screening
  const runScreener = async () => {
    if (rules.length === 0) {
      setError('Tambahkan minimal satu rule')
      return
    }

    const stocks = getSelectedStocks()
    if (stocks.length === 0) {
      setError('Tidak ada saham yang dipilih')
      return
    }

    if (!targetDate) {
      setError('Pilih tanggal screening')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])
    setAllResults([])
    setScannedCount(0)

    try {
      const screeningResults = []
      // Check if target date is today
      const today = new Date().toISOString().split('T')[0]
      const isToday = targetDate === today
      const isPastDate = targetDate < today
      
      // Calculate next trading date (skip weekends)
      const getNextTradingDay = (dateStr) => {
        const date = new Date(dateStr)
        date.setDate(date.getDate() + 1)
        // Skip Saturday (6) and Sunday (0)
        while (date.getDay() === 0 || date.getDay() === 6) {
          date.setDate(date.getDate() + 1)
        }
        return date.toISOString().split('T')[0]
      }
      
      // PENTING: Untuk mendapatkan indikator tanggal X, kita harus request tanggal X+1
      // karena API mengembalikan indikator H-1 untuk prediksi H
      // Jadi jika user pilih 2 Feb, kita request 3 Feb agar dapat indikator 2 Feb
      const nextDayForAPI = getNextTradingDay(targetDate)
      const confirmationDay = getNextTradingDay(nextDayForAPI) // H+2 untuk konfirmasi
      
      console.log(`[RuleScreener] User selected: ${targetDate}`)
      console.log(`[RuleScreener] API call with: ${nextDayForAPI} (to get indicators from ${targetDate})`)
      console.log(`[RuleScreener] Confirmation day: ${confirmationDay}`)
      
      for (let i = 0; i < stocks.length; i++) {
        const symbol = stocks[i]
        setScannedCount(i + 1)
        
        try {
          // Fetch indicator data
          // Request nextDayForAPI to get indicators from targetDate (H-1 logic)
          const response = await stockApi.getLiveIndicators(symbol, nextDayForAPI, false)
          
          console.log(`[RuleScreener] ${symbol} response:`, response)
          
          // API returns data in response.data
          if (response?.data) {
            const latestData = response.data
            
            // indicatorDate = tanggal indikator dihitung (should be targetDate)
            // actualData = harga hari nextDayForAPI (bukan untuk validasi, ini H)
            // prevClose, prevOpen, dll = harga targetDate (basis)
            
            // Harga tanggal yang user pilih (targetDate) ada di prevClose, prevOpen, dll
            const screeningDayOHLCV = {
              open: latestData.prevOpen,
              high: latestData.prevHigh,
              low: latestData.prevLow,
              close: latestData.prevClose,
            }
            
            // Evaluate all rules using indicator data
            const ruleResults = rules.map(rule => ({
              rule,
              passed: evaluateRule(rule, latestData),
              leftValue: latestData[rule.leftFeature],
              rightValue: rule.compareType === 'constant' 
                ? parseFloat(rule.rightValue) 
                : latestData[rule.rightFeature]
            }))

            // Check if stock passes based on logic operator
            const passed = logicOperator === 'AND'
              ? ruleResults.every(r => r.passed)
              : ruleResults.some(r => r.passed)

            // Next day data for confirmation already in actualData!
            // actualData = harga nextDayForAPI (which is targetDate + 1)
            let nextDayData = null
            if (isPastDate && latestData.actualData) {
              const baseClose = screeningDayOHLCV.close
              nextDayData = {
                date: latestData.actualData.date || nextDayForAPI,
                close: latestData.actualData.close,
                open: latestData.actualData.open,
                high: latestData.actualData.high,
                low: latestData.actualData.low,
                change: baseClose ? ((latestData.actualData.close - baseClose) / baseClose * 100) : null
              }
            }

            // Always add to results
            screeningResults.push({
              symbol,
              data: latestData,
              ohlcv: screeningDayOHLCV,
              ruleResults,
              passedCount: ruleResults.filter(r => r.passed).length,
              totalRules: rules.length,
              passed,
              // Tanggal yang dipilih user (tanggal screening/indikator)
              screeningDate: targetDate,
              // Tanggal indikator sebenarnya dari API (should match targetDate)
              indicatorDate: response.info?.indicatorDate || targetDate,
              // Tanggal harga konfirmasi (H+1)
              nextDayData,
              actuallyUp: nextDayData ? nextDayData.change > 0 : null
            })
          } else {
            // No data returned
            screeningResults.push({
              symbol,
              data: null,
              ruleResults: [],
              passedCount: 0,
              totalRules: rules.length,
              passed: false,
              error: 'No data available'
            })
          }
        } catch (err) {
          console.warn(`Failed to fetch data for ${symbol}:`, err.message)
          // Add failed fetch to results
          screeningResults.push({
            symbol,
            data: null,
            ruleResults: [],
            passedCount: 0,
            totalRules: rules.length,
            passed: false,
            error: err.message
          })
        }
      }

      // Sort: passed first (by passedCount desc), then not passed (by passedCount desc)
      screeningResults.sort((a, b) => {
        // First sort by passed status
        if (a.passed !== b.passed) return b.passed ? 1 : -1
        // Then by passed count
        return b.passedCount - a.passedCount
      })
      
      setAllResults(screeningResults)
      
      // Filter only passed stocks
      const passedStocks = screeningResults.filter(r => r.passed)
      setResults(passedStocks)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter features by search
  const filteredFeatures = useMemo(() => {
    const search = featureSearch.toLowerCase()
    const result = {}
    
    Object.entries(ALL_FEATURES).forEach(([key, feat]) => {
      if (
        key.toLowerCase().includes(search) ||
        feat.label.toLowerCase().includes(search) ||
        feat.desc.toLowerCase().includes(search)
      ) {
        const group = feat.group
        if (!result[group]) result[group] = []
        result[group].push({ key, ...feat })
      }
    })
    
    return result
  }, [featureSearch])

  // Feature selector modal
  const FeatureSelector = ({ ruleId, side, onClose }) => {
    const handleSelect = (featureKey) => {
      if (side === 'left') {
        updateRule(ruleId, 'leftFeature', featureKey)
      } else {
        updateRule(ruleId, 'rightFeature', featureKey)
      }
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg p-4 w-[600px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Pilih Feature</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Cari feature..."
            value={featureSearch}
            onChange={(e) => setFeatureSearch(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white mb-4"
            autoFocus
          />

          <div className="overflow-y-auto flex-1">
            {Object.entries(filteredFeatures).map(([groupKey, features]) => (
              <div key={groupKey} className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  {FEATURE_GROUPS[groupKey]?.label || groupKey}
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {features.map((feat) => (
                    <button
                      key={feat.key}
                      onClick={() => handleSelect(feat.key)}
                      className="text-left px-2 py-1.5 rounded hover:bg-gray-700 text-sm"
                    >
                      <div className="text-white">{feat.label}</div>
                      <div className="text-gray-500 text-xs truncate">{feat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-orange-400 mb-2">📊 Rule-Based Screener</h2>
        <p className="text-gray-400">
          Buat filter screening saham dengan rule dinamis. Support perbandingan fitur vs konstanta dan fitur vs fitur.
        </p>
      </div>

      {/* Stock Selection & Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stock Selection */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">📋 Pilih Saham</h3>
          
          {/* Main selection options */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setStockList('lq45')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                stockList === 'lq45' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📊 LQ45 ({LQ45_STOCKS.length})
            </button>
            <button
              onClick={() => setStockList('idx30')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                stockList === 'idx30' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📈 IDX30 ({IDX30_STOCKS.length})
            </button>
            <button
              onClick={() => setStockList('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                stockList === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🌐 Semua ({IDX_STOCKS.length})
            </button>
            <button
              onClick={() => setStockList('sector')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                stockList === 'sector' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🏢 Per Sektor
            </button>
            <button
              onClick={() => setStockList('price')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                stockList === 'price' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              💰 Range Harga
            </button>
            <button
              onClick={() => setStockList('custom')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                stockList === 'custom' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ✏️ Custom
            </button>
          </div>

          {/* Sector selection */}
          {stockList === 'sector' && (
            <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Pilih Sektor:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSectors(ALL_SECTORS)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Pilih Semua
                  </button>
                  <button
                    onClick={() => setSelectedSectors([])}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SECTORS.map(sector => (
                  <button
                    key={sector}
                    onClick={() => {
                      setSelectedSectors(prev => 
                        prev.includes(sector) 
                          ? prev.filter(s => s !== sector)
                          : [...prev, sector]
                      )
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedSectors.includes(sector)
                        ? `bg-${SECTOR_COLORS[sector] || 'blue'}-600 text-white`
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {sector} ({IDX_STOCKS.filter(s => s.sector === sector).length})
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {selectedSectors.length === 0 
                  ? `Tidak ada sektor dipilih (semua ${IDX_STOCKS.length} saham)`
                  : `${getSelectedStocks().length} saham dipilih dari ${selectedSectors.length} sektor`}
              </div>
            </div>
          )}

          {/* Price range selection */}
          {stockList === 'price' && (
            <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-400 block mb-2">Pilih Range Harga:</span>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              >
                <option value="all">📊 Semua Harga</option>
                <option value="micro">🔹 Saham Gorengan (&lt; Rp 50)</option>
                <option value="penny">💰 Rp 50 - 100</option>
                <option value="cheap">💵 Rp 100 - 200</option>
                <option value="low">📊 Rp 200 - 500</option>
                <option value="medium">📈 Rp 500 - 1.000</option>
                <option value="mid">💹 Rp 1.000 - 2.000</option>
                <option value="high">🏦 Rp 2.000 - 5.000</option>
                <option value="premium">💎 Rp 5.000 - 10.000</option>
                <option value="elite">👑 Rp 10.000 - 50.000</option>
                <option value="ultra">🚀 &gt; Rp 50.000</option>
              </select>
              <div className="mt-2 text-xs text-gray-500">
                {getSelectedStocks().length} saham dalam range harga ini
              </div>
            </div>
          )}

          {/* Custom input */}
          {stockList === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Masukkan kode saham, pisahkan dengan koma (contoh: BBCA, BBRI, TLKM)"
                value={customStocks}
                onChange={(e) => setCustomStocks(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
              <div className="mt-2 text-xs text-gray-500">
                {getSelectedStocks().length} saham akan di-scan
              </div>
            </div>
          )}

          {/* Show selected count for index-based selections */}
          {['lq45', 'idx30', 'all'].includes(stockList) && (
            <div className="mt-2 text-xs text-gray-500">
              {getSelectedStocks().length} saham akan di-scan
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">📅 Tanggal Screening</h3>
          <div className="space-y-3">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Hari Ini
              </button>
              <button
                onClick={() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  setTargetDate(yesterday.toISOString().split('T')[0])
                }}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
              >
                Kemarin
              </button>
              <button
                onClick={() => {
                  const lastWeek = new Date()
                  lastWeek.setDate(lastWeek.getDate() - 7)
                  setTargetDate(lastWeek.toISOString().split('T')[0])
                }}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
              >
                -7 Hari
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {targetDate === new Date().toISOString().split('T')[0] 
                ? '📡 Data realtime akan digunakan jika market sedang berjalan'
                : '📊 Data historical akan digunakan'}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Rules */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">⚡ Preset Rules</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(PRESET_RULES).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => loadPreset(preset)}
              className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <div className="font-medium text-white">{preset.name}</div>
              <div className="text-xs text-gray-400 mt-1">{preset.desc}</div>
              <div className="text-xs text-blue-400 mt-1">{preset.rules.length} rules</div>
            </button>
          ))}
        </div>

        {/* Saved presets */}
        {savedPresets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Saved Presets</h4>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((preset) => (
                <div key={preset.id} className="flex items-center gap-1 bg-gray-700 rounded px-2 py-1">
                  <button
                    onClick={() => loadPreset(preset)}
                    className="text-white hover:text-blue-400"
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="text-gray-500 hover:text-red-400 ml-1"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rules Builder */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">🔧 Rules Builder</h3>
          <div className="flex items-center gap-3">
            {/* Logic operator */}
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLogicOperator('AND')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  logicOperator === 'AND' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                AND
              </button>
              <button
                onClick={() => setLogicOperator('OR')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  logicOperator === 'OR' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                OR
              </button>
            </div>

            {/* Action buttons */}
            <button
              onClick={addRule}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Add Rule
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
            >
              <FiSave className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={exportRules}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <label className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm cursor-pointer">
              <FiUpload className="w-4 h-4" />
              Import
              <input type="file" accept=".json" onChange={importRules} className="hidden" />
            </label>
          </div>
        </div>

        {/* Rules list */}
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={rule.id} className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-3">
              {/* Rule number */}
              <span className="text-gray-500 text-sm w-6">{index + 1}.</span>

              {/* Left feature */}
              <button
                onClick={() => setShowFeatureSelector({ ruleId: rule.id, side: 'left' })}
                className="flex-1 max-w-[200px] px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-left"
              >
                <span className="text-white">{ALL_FEATURES[rule.leftFeature]?.label || rule.leftFeature}</span>
              </button>

              {/* Operator */}
              <select
                value={rule.operator}
                onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                className="px-3 py-2 bg-gray-700 rounded text-white font-mono"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              {/* Compare type */}
              <select
                value={rule.compareType}
                onChange={(e) => updateRule(rule.id, 'compareType', e.target.value)}
                className="px-3 py-2 bg-gray-700 rounded text-gray-300 text-sm"
              >
                <option value="constant">Nilai</option>
                <option value="feature">Fitur</option>
              </select>

              {/* Right value/feature */}
              {rule.compareType === 'constant' ? (
                <input
                  type="number"
                  step="any"
                  value={rule.rightValue}
                  onChange={(e) => updateRule(rule.id, 'rightValue', e.target.value)}
                  className="w-24 px-3 py-2 bg-gray-700 rounded text-white"
                />
              ) : (
                <button
                  onClick={() => setShowFeatureSelector({ ruleId: rule.id, side: 'right' })}
                  className="flex-1 max-w-[200px] px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-left"
                >
                  <span className="text-white">{ALL_FEATURES[rule.rightFeature]?.label || rule.rightFeature || 'Pilih...'}</span>
                </button>
              )}

              {/* Actions */}
              <button
                onClick={() => duplicateRule(rule)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                title="Duplicate rule"
              >
                <FiCopy className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeRule(rule.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                title="Remove rule"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>

              {/* Logic connector (except last) */}
              {index < rules.length - 1 && (
                <span className="text-blue-400 font-medium ml-2">{logicOperator}</span>
              )}
            </div>
          ))}
        </div>

        {rules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiFilter className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada rule. Klik "Add Rule" atau pilih preset.</p>
          </div>
        )}
      </div>

      {/* Run Button */}
      <div className="flex justify-center">
        <button
          onClick={runScreener}
          disabled={loading || rules.length === 0}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
            loading || rules.length === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {loading ? (
            <>
              <FiRefreshCw className="w-5 h-5 animate-spin" />
              Scanning {scannedCount}/{getSelectedStocks().length} saham...
            </>
          ) : (
            <>
              <FiPlay className="w-5 h-5" />
              Run Screener ({getSelectedStocks().length} saham)
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <FiAlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {allResults.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{allResults.length}</div>
              <div className="text-xs text-gray-400">Total Saham</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{results.length}</div>
              <div className="text-xs text-gray-400">Lolos Rules</div>
            </div>
            {allResults.some(r => r.nextDayData) && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {results.filter(r => r.actuallyUp).length}/{results.length}
                  </div>
                  <div className="text-xs text-gray-400">Lolos & Naik Besok</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {results.length > 0 ? ((results.filter(r => r.actuallyUp).length / results.length) * 100).toFixed(0) : 0}%
                  </div>
                  <div className="text-xs text-gray-400">Akurasi Rules</div>
                </div>
              </>
            )}
          </div>

          {/* Info Box explaining dates */}
          <div className="mb-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">📅 Keterangan Tanggal:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 p-2 bg-yellow-900/30 rounded">
                <span className="text-yellow-400 font-semibold whitespace-nowrap">📊 Tanggal Screening:</span>
                <span className="text-gray-300">
                  <strong className="text-yellow-300">{targetDate}</strong> — 
                  Indikator (RSI, MACD, dll) & harga close dari tanggal ini
                </span>
              </div>
              {allResults.some(r => r.nextDayData) && (
                <div className="flex items-start gap-2 p-2 bg-green-900/30 rounded">
                  <span className="text-green-400 font-semibold whitespace-nowrap">📈 Tanggal Konfirmasi:</span>
                  <span className="text-gray-300">
                    <strong className="text-green-300">{allResults.find(r => r.nextDayData)?.nextDayData?.date || '?'}</strong> — 
                    Harga besok untuk validasi apakah rule berhasil
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              📊 Hasil Screening
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAllResults}
                  onChange={(e) => setShowAllResults(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-400">Tampilkan semua</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            {(showAllResults ? allResults : results).map((result) => (
              <div 
                key={result.symbol} 
                className={`rounded-lg overflow-hidden ${
                  result.passed 
                    ? 'bg-green-900/20 border border-green-500/30' 
                    : 'bg-gray-700/50 border border-gray-600/30'
                }`}
              >
                <button
                  onClick={() => setExpandedStock(expandedStock === result.symbol ? null : result.symbol)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {result.passed ? (
                      <FiCheck className="w-5 h-5 text-green-400" />
                    ) : (
                      <FiX className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-xl font-bold text-white">{result.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-sm ${result.passed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {result.passedCount}/{result.totalRules} rules
                    </span>
                    {(result.ohlcv?.close || result.data?.prevClose) && (
                      <span className="text-yellow-400 text-sm" title={`Close tanggal ${result.date || targetDate}`}>
                        📊 Rp {(result.ohlcv?.close || result.data?.prevClose)?.toLocaleString('id-ID')}
                      </span>
                    )}
                    {/* Next day confirmation */}
                    {result.nextDayData && (
                      <span className={`px-2 py-0.5 rounded text-sm ${
                        result.nextDayData.change > 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`} title={`Perubahan ke tanggal ${result.nextDayData.date}`}>
                        📈 {result.nextDayData.change > 0 ? '+' : ''}{result.nextDayData.change?.toFixed(2)}%
                      </span>
                    )}
                    {result.error && (
                      <span className="text-red-400 text-sm">⚠️ {result.error}</span>
                    )}
                  </div>
                  {expandedStock === result.symbol ? (
                    <FiChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedStock === result.symbol && result.data && (
                  <div className="px-4 pb-4 border-t border-gray-600 mt-2 pt-4 space-y-4">
                    {/* Info Box - Data Tanggal Screening */}
                    {result.ohlcv && (
                    <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                      <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                        📊 Data Tanggal Screening ({result.screeningDate || targetDate})
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">
                        Indikator teknikal & harga dari tanggal yang Anda pilih. Close adalah <strong>basis perbandingan</strong> untuk konfirmasi.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-2 pt-2 border-t border-yellow-500/20">
                        <div>
                          <div className="text-gray-400 text-xs">Open</div>
                          <div className="text-white">Rp {result.ohlcv.open?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">High</div>
                          <div className="text-white">Rp {result.ohlcv.high?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Low</div>
                          <div className="text-white">Rp {result.ohlcv.low?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Close (Basis)</div>
                          <div className="text-yellow-400 font-semibold">Rp {result.ohlcv.close?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Next Day Confirmation Box */}
                    {result.nextDayData && (
                      <div className={`p-3 rounded-lg ${
                        result.nextDayData.change > 0 
                          ? 'bg-green-900/30 border border-green-500/30' 
                          : 'bg-red-900/30 border border-red-500/30'
                      }`}>
                        <h4 className="text-sm font-semibold text-green-400 mb-2">
                          📈 Harga Konfirmasi (H+1: {result.nextDayData.date})
                        </h4>
                        <p className="text-xs text-gray-400 mb-2">
                          Harga hari berikutnya setelah tanggal target.
                          Perubahan dihitung dari Close H ({result.ohlcv?.close?.toLocaleString('id-ID') || 'N/A'}) ke Close H+1.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div>
                            <div className="text-gray-400 text-xs">Open</div>
                            <div className="text-white">Rp {result.nextDayData.open?.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">High</div>
                            <div className="text-white">Rp {result.nextDayData.high?.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">Low</div>
                            <div className="text-white">Rp {result.nextDayData.low?.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">Close</div>
                            <div className="text-white">Rp {result.nextDayData.close?.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">Perubahan dari Basis</div>
                            <div className={result.nextDayData.change > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                              {result.nextDayData.change > 0 ? '+' : ''}{result.nextDayData.change?.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div className={`mt-3 p-2 rounded text-sm font-semibold ${
                          result.nextDayData.change > 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                        }`}>
                          {result.passed 
                            ? (result.nextDayData.change > 0 
                                ? '✅ RULE BENAR - Saham lolos screening & naik di hari berikutnya!' 
                                : '❌ RULE SALAH - Saham lolos screening tapi turun di hari berikutnya')
                            : (result.nextDayData.change > 0 
                                ? '⚠️ Saham tidak lolos tapi ternyata naik' 
                                : '✅ Saham tidak lolos dan memang turun')}
                        </div>
                      </div>
                    )}

                    {/* Rule evaluation details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">📋 Detail Rule Evaluation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.ruleResults.map((rr, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-2 rounded ${
                              rr.passed ? 'bg-green-900/30' : 'bg-red-900/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {rr.passed ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiX className="w-4 h-4 text-red-400" />}
                              <span className={`text-sm ${rr.passed ? 'text-green-400' : 'text-red-400'}`}>
                                {ALL_FEATURES[rr.rule.leftFeature]?.label} {rr.rule.operator}{' '}
                                {rr.rule.compareType === 'constant' 
                                  ? rr.rule.rightValue 
                                  : ALL_FEATURES[rr.rule.rightFeature]?.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              ({typeof rr.leftValue === 'number' ? rr.leftValue.toFixed(2) : rr.leftValue ?? 'N/A'} vs {typeof rr.rightValue === 'number' ? rr.rightValue.toFixed(2) : rr.rightValue ?? 'N/A'})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key indicators */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">📊 Key Indicators</h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                        {['rsi', 'adx', 'macdHistogram', 'volumeRatio', 'closePosition', 'roc'].map((key) => (
                          <div key={key} className="bg-gray-800 rounded p-2">
                            <div className="text-gray-500 text-xs">{ALL_FEATURES[key]?.label || key}</div>
                            <div className="text-white font-medium">
                              {result.data[key] !== undefined && result.data[key] !== null
                                ? typeof result.data[key] === 'number'
                                  ? result.data[key].toFixed(2)
                                  : result.data[key]
                                : 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Selector Modal */}
      {showFeatureSelector && (
        <FeatureSelector
          ruleId={showFeatureSelector.ruleId}
          side={showFeatureSelector.side}
          onClose={() => {
            setShowFeatureSelector(null)
            setFeatureSearch('')
          }}
        />
      )}

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">💾 Save Preset</h3>
            <input
              type="text"
              placeholder="Nama preset..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
