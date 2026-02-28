import { useState, useMemo, useEffect } from 'react'
import { stockApi } from '../services/api'
import * as XLSX from 'xlsx'
import MLPrediction from './MLPrediction'
import StockSelector from './StockSelector'

// ML Service base URL
const ML_API_BASE = import.meta.env.VITE_ML_API_BASE || 'http://localhost:8000'

// All available columns with descriptions
const ALL_COLUMNS = {
  // Basic Info
  symbol: { label: 'Symbol', group: 'basic', desc: 'Kode saham' },
  date: { label: 'Date (H)', group: 'basic', desc: 'Tanggal target (hari H)' },
  prevDate: { label: 'Prev Date (H-1)', group: 'basic', desc: 'Tanggal indikator (H-1)' },
  target: { label: 'Target', group: 'basic', desc: '1=UP, 0=DOWN, -1=Neutral' },
  targetLabel: { label: 'Target Label', group: 'basic', desc: 'Label target: UP/DOWN/NEUTRAL' },
  priceChange: { label: 'Price Change', group: 'basic', desc: 'Perubahan harga (Rp)' },
  priceChangePercent: { label: 'Price Change %', group: 'basic', desc: 'Perubahan harga (%)' },
  prevClose: { label: 'Prev Close', group: 'basic', desc: 'Harga close H-1' },
  currentClose: { label: 'Current Close', group: 'basic', desc: 'Harga close hari H' },
  prevOpen: { label: 'Prev Open', group: 'basic', desc: 'Harga open H-1' },
  prevHigh: { label: 'Prev High', group: 'basic', desc: 'Harga high H-1' },
  prevLow: { label: 'Prev Low', group: 'basic', desc: 'Harga low H-1' },
  prevVolume: { label: 'Prev Volume', group: 'basic', desc: 'Volume H-1' },

  // ML-Friendly Features (NEW!)
  closePosition: { label: 'Close Position', group: 'mlfeatures', desc: '(close-low)/(high-low), 0-1 scale' },
  bodyRangeRatio: { label: 'Body/Range Ratio', group: 'mlfeatures', desc: 'abs(close-open)/(high-low)' },
  upperWickRatio: { label: 'Upper Wick Ratio', group: 'mlfeatures', desc: 'Upper wick / range' },
  lowerWickRatio: { label: 'Lower Wick Ratio', group: 'mlfeatures', desc: 'Lower wick / range' },
  distFromSMA5: { label: 'Dist from SMA5 %', group: 'mlfeatures', desc: 'Jarak dari SMA5 dalam %' },
  distFromSMA20: { label: 'Dist from SMA20 %', group: 'mlfeatures', desc: 'Jarak dari SMA20 dalam %' },
  distFromSMA50: { label: 'Dist from SMA50 %', group: 'mlfeatures', desc: 'Jarak dari SMA50 dalam %' },

  // Delta/Change Indicators (NEW!)
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
  sma100: { label: 'SMA 100', group: 'sma', desc: 'Simple Moving Average 100 hari' },
  sma200: { label: 'SMA 200', group: 'sma', desc: 'Simple Moving Average 200 hari' },
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
  ema21: { label: 'EMA 21', group: 'ema', desc: 'Exponential Moving Average 21 hari (close)' },
  ema21High: { label: 'EMA 21 High', group: 'ema', desc: 'EMA 21 dari harga High' },
  ema21Low: { label: 'EMA 21 Low', group: 'ema', desc: 'EMA 21 dari harga Low' },
  priceAboveEMA12: { label: 'Price > EMA12', group: 'ema', desc: '1 jika close > EMA12' },
  priceAboveEMA26: { label: 'Price > EMA26', group: 'ema', desc: '1 jika close > EMA26' },
  priceAboveEMA21: { label: 'Price > EMA21', group: 'ema', desc: '1 jika close > EMA21' },
  priceAboveEMA21High: { label: 'Price > EMA21 High', group: 'ema', desc: '1 jika close > EMA21 High' },
  priceBelowEMA21Low: { label: 'Price < EMA21 Low', group: 'ema', desc: '1 jika close < EMA21 Low' },
  distFromEMA21: { label: 'Dist from EMA21 %', group: 'ema', desc: 'Jarak dari EMA21 dalam %' },
  distFromEMA21High: { label: 'Dist from EMA21 High %', group: 'ema', desc: 'Jarak dari EMA21 High dalam %' },
  distFromEMA21Low: { label: 'Dist from EMA21 Low %', group: 'ema', desc: 'Jarak dari EMA21 Low dalam %' },
  priceCrossAboveEMA21: { label: 'Price CrossUp EMA21', group: 'ema', desc: '1 jika harga cross di atas EMA21' },
  priceCrossBelowEMA21: { label: 'Price CrossDown EMA21', group: 'ema', desc: '1 jika harga cross di bawah EMA21' },
  priceCrossUpEMA21High: { label: 'Price CrossUp EMA21 High', group: 'ema', desc: '1 jika harga cross di atas EMA21 High' },

  // Golden Cross MA (Moving Average Crossovers)
  ma5CrossAboveMa10: { label: 'MA5 Golden Cross MA10', group: 'ma_cross', desc: '1 jika MA5 memotong MA10 ke atas' },
  ma10CrossAboveMa20: { label: 'MA10 Golden Cross MA20', group: 'ma_cross', desc: '1 jika MA10 memotong MA20 ke atas' },
  ma20CrossAboveMa50: { label: 'MA20 Golden Cross MA50', group: 'ma_cross', desc: '1 jika MA20 memotong MA50 ke atas' },
  ma50CrossAboveMa100: { label: 'MA50 Golden Cross MA100', group: 'ma_cross', desc: '1 jika MA50 memotong MA100 ke atas' },
  ma100CrossAboveMa200: { label: 'MA100 Golden Cross MA200', group: 'ma_cross', desc: '1 jika MA100 memotong MA200 ke atas' },

  // Death Cross MA (Bearish Crossovers)
  ma5CrossBelowMa10: { label: 'MA5 Death Cross MA10', group: 'ma_cross', desc: '1 jika MA5 memotong MA10 ke bawah' },
  ma10CrossBelowMa20: { label: 'MA10 Death Cross MA20', group: 'ma_cross', desc: '1 jika MA10 memotong MA20 ke bawah' },
  ma20CrossBelowMa50: { label: 'MA20 Death Cross MA50', group: 'ma_cross', desc: '1 jika MA20 memotong MA50 ke bawah' },
  ma50CrossBelowMa100: { label: 'MA50 Death Cross MA100', group: 'ma_cross', desc: '1 jika MA50 memotong MA100 ke bawah' },
  ma100CrossBelowMa200: { label: 'MA100 Death Cross MA200', group: 'ma_cross', desc: '1 jika MA100 memotong MA200 ke bawah' },

  // RSI
  rsi: { label: 'RSI', group: 'rsi', desc: 'Relative Strength Index (14)' },
  rsiOversold: { label: 'RSI Oversold', group: 'rsi', desc: '1 jika RSI < 30' },
  rsiOverbought: { label: 'RSI Overbought', group: 'rsi', desc: '1 jika RSI > 70' },
  rsiNeutral: { label: 'RSI Neutral', group: 'rsi', desc: '1 jika 30 <= RSI <= 70' },
  rsiRising: { label: 'RSI Rising', group: 'rsi', desc: '1 jika RSI naik dari hari sebelumnya' },
  rsiExitOversold: { label: 'RSI Exit Oversold', group: 'rsi', desc: '1 jika RSI cross di atas 30' },
  rsiBullishZone: { label: 'RSI Bullish Zone', group: 'rsi', desc: '1 jika RSI 30-50 (zona potensi naik)' },

  // MACD
  macd: { label: 'MACD', group: 'macd', desc: 'MACD line' },
  macdSignal: { label: 'MACD Signal', group: 'macd', desc: 'Signal line' },
  macdHistogram: { label: 'MACD Histogram', group: 'macd', desc: 'Histogram (MACD - Signal)' },
  macdBullish: { label: 'MACD Bullish', group: 'macd', desc: '1 jika MACD > Signal' },
  macdPositive: { label: 'MACD Positive', group: 'macd', desc: '1 jika MACD > 0' },
  macdGoldenCross: { label: 'MACD Golden Cross', group: 'macd', desc: '1 jika MACD cross di atas Signal' },
  macdDeathCross: { label: 'MACD Death Cross', group: 'macd', desc: '1 jika MACD cross di bawah Signal' },
  macdNearGoldenCross: { label: 'MACD Near Golden Cross', group: 'macd', desc: '1 jika histogram < 0 tapi naik' },
  macdHistogramConverging: { label: 'MACD Histogram Converging', group: 'macd', desc: '1 jika histogram mendekati 0' },
  macdHistogramRising: { label: 'MACD Histogram Rising', group: 'macd', desc: '1 jika histogram naik 2 hari' },
  macdDistanceToSignal: { label: 'MACD Dist to Signal %', group: 'macd', desc: 'Jarak MACD ke Signal dalam %' },

  // Bollinger Bands
  bbUpper: { label: 'BB Upper', group: 'bollinger', desc: 'Bollinger Band atas' },
  bbMiddle: { label: 'BB Middle', group: 'bollinger', desc: 'Bollinger Band tengah (SMA20)' },
  bbLower: { label: 'BB Lower', group: 'bollinger', desc: 'Bollinger Band bawah' },
  bbWidth: { label: 'BB Width %', group: 'bollinger', desc: 'Lebar BB dalam persen' },
  priceBelowLowerBB: { label: 'Price < Lower BB', group: 'bollinger', desc: '1 jika close < BB bawah' },
  priceAboveUpperBB: { label: 'Price > Upper BB', group: 'bollinger', desc: '1 jika close > BB atas' },
  nearLowerBB: { label: 'Near Lower BB', group: 'bollinger', desc: '1 jika harga dekat lower BB' },
  bouncingFromLowerBB: { label: 'Bouncing Lower BB', group: 'bollinger', desc: '1 jika memantul dari lower BB' },
  bbSqueeze: { label: 'BB Squeeze', group: 'bollinger', desc: '1 jika BB sempit (potensi breakout)' },

  // Stochastic
  stochK: { label: 'Stochastic %K', group: 'stochastic', desc: 'Stochastic %K' },
  stochD: { label: 'Stochastic %D', group: 'stochastic', desc: 'Stochastic %D (signal)' },
  stochOversold: { label: 'Stoch Oversold', group: 'stochastic', desc: '1 jika %K < 20' },
  stochOverbought: { label: 'Stoch Overbought', group: 'stochastic', desc: '1 jika %K > 80' },
  stochBullishCross: { label: 'Stoch Bullish Cross', group: 'stochastic', desc: '1 jika %K > %D' },
  stochGoldenCross: { label: 'Stoch Golden Cross', group: 'stochastic', desc: '1 jika %K cross di atas %D' },
  stochExitOversold: { label: 'Stoch Exit Oversold', group: 'stochastic', desc: '1 jika %K cross di atas 20' },

  // ADX/DMI
  adx: { label: 'ADX', group: 'adx', desc: 'Average Directional Index' },
  pdi: { label: '+DI', group: 'adx', desc: 'Plus Directional Indicator' },
  mdi: { label: '-DI', group: 'adx', desc: 'Minus Directional Indicator' },
  strongTrend: { label: 'Strong Trend', group: 'adx', desc: '1 jika ADX > 25' },
  bullishDI: { label: 'Bullish DI', group: 'adx', desc: '1 jika +DI > -DI' },
  adxRising: { label: 'ADX Rising', group: 'adx', desc: '1 jika ADX naik (trend menguat)' },
  bullishDICross: { label: 'Bullish DI Cross', group: 'adx', desc: '1 jika +DI cross di atas -DI' },

  // Volatility
  atr: { label: 'ATR', group: 'volatility', desc: 'Average True Range (14)' },
  atrPercent: { label: 'ATR %', group: 'volatility', desc: 'ATR sebagai % dari harga' },

  // Volume
  obv: { label: 'OBV', group: 'volume', desc: 'On Balance Volume' },
  obvChange: { label: 'OBV Change', group: 'volume', desc: 'Perubahan OBV dari hari sebelumnya' },
  obvTrend: { label: 'OBV Trend', group: 'volume', desc: 'Tren OBV: 1=naik, -1=turun, 0=tetap' },
  volumeRatio: { label: 'Volume Ratio', group: 'volume', desc: 'Volume / Avg Volume (20)' },
  highVolume: { label: 'High Volume', group: 'volume', desc: '1 jika volume > 1.5x rata-rata' },
  bullishVolume: { label: 'Bullish Volume', group: 'volume', desc: '1 jika volume tinggi + candle hijau' },
  volumeSpike: { label: 'Volume Spike', group: 'volume', desc: '1 jika volume > 2x average' },

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
  hammerCandle: { label: 'Hammer Candle', group: 'candlestick', desc: '1 jika pola hammer (reversal)' },
  bullishEngulfing: { label: 'Bullish Engulfing', group: 'candlestick', desc: '1 jika pola bullish engulfing' },

  // Returns
  return1d: { label: 'Return 1D', group: 'returns', desc: 'Return 1 hari sebelumnya (%)' },
  return3d: { label: 'Return 3D', group: 'returns', desc: 'Return 3 hari sebelumnya (%)' },
  return5d: { label: 'Return 5D', group: 'returns', desc: 'Return 5 hari sebelumnya (%)' },

  // Distance & Support Level Detection
  distFromHigh52w: { label: 'Distance from 52w High (%)', group: 'support', desc: 'Jarak dari 52-week high dalam %' },
  farFromHigh52w: { label: 'Far from 52w High (>30%)', group: 'support', desc: '1 jika jauh dari 52w high' },
  veryFarFromHigh52w: { label: 'Very Far from 52w High (>50%)', group: 'support', desc: '1 jika sangat jauh dari 52w high' },
  distFromLow52w: { label: 'Distance from 52w Low (%)', group: 'support', desc: 'Jarak dari 52-week low dalam %' },
  nearLow52w: { label: 'Near 52w Low (<10%)', group: 'support', desc: '1 jika dekat dengan 52w low' },
  supportLevel50d: { label: 'Support Level (50d)', group: 'support', desc: 'Level support 50 hari terakhir' },
  resistanceLevel50d: { label: 'Resistance Level (50d)', group: 'support', desc: 'Level resistance 50 hari terakhir' },
  distFromSupport: { label: 'Distance from Support (%)', group: 'support', desc: 'Jarak dari support level dalam %' },
  nearSupport: { label: 'Near Support (<5%)', group: 'support', desc: '1 jika sangat dekat dengan support' },
  recoveryPotential: { label: 'Recovery Potential', group: 'support', desc: '1 jika dekat support tapi jauh dari high' },

  // Parabolic SAR Reversal Detection
  psar: { label: 'Parabolic SAR Value', group: 'reversal', desc: 'Nilai Parabolic SAR (stop & reverse)' },
  psarAbovePrice: { label: 'SAR > Price', group: 'reversal', desc: '1 jika SAR di atas harga (downtrend)' },
  psarBelowPrice: { label: 'SAR < Price', group: 'reversal', desc: '1 jika SAR di bawah harga (uptrend)' },
  psarNearPrice: { label: 'SAR Dekat Harga', group: 'reversal', desc: '1 jika SAR dalam 2% dari harga' },
  psarBearishReversal: { label: 'SAR Bearish Reversal', group: 'reversal', desc: '1 jika SAR baru saja cross (bullish→bearish)' },
  psarBullishReversal: { label: 'SAR Bullish Reversal', group: 'reversal', desc: '1 jika SAR baru saja cross dari atas ke bawah harga (bearish→bullish)' },
  psarAboutToReversal: { label: 'SAR Akan Reversal', group: 'reversal', desc: '1 jika SAR sangat dekat (<3%), akan terjadi crossing' },
  psarAboutToBullishReversal: { label: 'SAR Akan Bullish Reversal', group: 'reversal', desc: '1 jika SAR di atas harga & dekat (<3%), akan pindah ke bawah' },

  // Composite Scores & Bullish Signals
  bullishScore: { label: 'Bullish Score (0-10)', group: 'bullish', desc: 'Skor komposit bullish dari multi-indikator' },
  oversoldBounce: { label: 'Oversold Bounce', group: 'bullish', desc: '1 jika oversold + candle hijau + volume' },
  momentumShift: { label: 'Momentum Shift', group: 'bullish', desc: '1 jika MACD, RSI, DI semua bullish' },
}

// Group definitions
const COLUMN_GROUPS = {
  basic: { label: '📊 Basic Info', color: 'blue' },
  mlfeatures: { label: '🤖 ML Features', color: 'fuchsia' },
  delta: { label: '📐 Delta/Change', color: 'cyan' },
  sma: { label: '📈 SMA', color: 'green' },
  ema: { label: '📉 EMA', color: 'teal' },
  ma_cross: { label: '✂️ MA Golden/Death Cross', color: 'amber' },
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
  support: { label: '🎯 Support & Distance', color: 'cyan' },
  reversal: { label: '⚡ Parabolic SAR Reversal', color: 'red' },
}

// Stock selection now uses StockSelector component with full IDX stocks

export default function RegressionData() {
  const [selectedStocks, setSelectedStocks] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  
  // Threshold settings for ML target
  const [upThreshold, setUpThreshold] = useState(1.0)      // +1% for UP
  const [downThreshold, setDownThreshold] = useState(-0.5) // -0.5% for DOWN
  const [includeNeutral, setIncludeNeutral] = useState(false)
  
  // Trained models for feature presets
  const [trainedModels, setTrainedModels] = useState([])
  const [selectedPresetModel, setSelectedPresetModel] = useState('')
  
  // Individual column selection
  const [selectedColumns, setSelectedColumns] = useState(() => {
    // Default: select basic, mlfeatures, delta, rsi, macd, adx columns
    const defaults = ['basic', 'mlfeatures', 'delta', 'rsi', 'macd', 'adx']
    const cols = new Set()
    Object.entries(ALL_COLUMNS).forEach(([key, val]) => {
      if (defaults.includes(val.group)) cols.add(key)
    })
    return cols
  })
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterSymbol, setFilterSymbol] = useState('')
  const [filterTarget, setFilterTarget] = useState('all')
  const [expandedGroups, setExpandedGroups] = useState(new Set(['basic', 'mlfeatures', 'delta']))

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
    }
  }

  // Handle preset model selection - auto-select features
  const handlePresetModelChange = (modelId) => {
    setSelectedPresetModel(modelId)
    
    if (!modelId) return
    
    const model = trainedModels.find(m => m.id === modelId)
    if (model && model.features) {
      // Create a new set with the model's features
      const modelFeatures = new Set(model.features)
      
      // Also include basic columns that are always needed
      const basicColumns = ['symbol', 'date', 'prevDate', 'target', 'targetLabel', 'priceChange', 'priceChangePercent']
      basicColumns.forEach(col => modelFeatures.add(col))
      
      setSelectedColumns(modelFeatures)
      
      // Expand groups that have selected features
      const groupsToExpand = new Set()
      model.features.forEach(feature => {
        const colInfo = ALL_COLUMNS[feature]
        if (colInfo) {
          groupsToExpand.add(colInfo.group)
        }
      })
      groupsToExpand.add('basic')
      setExpandedGroups(groupsToExpand)
    }
  }

  // Get columns by group
  const getColumnsByGroup = (group) => {
    return Object.entries(ALL_COLUMNS)
      .filter(([_, val]) => val.group === group)
      .map(([key, _]) => key)
  }

  // Check if all columns in a group are selected
  const isGroupFullySelected = (group) => {
    const groupCols = getColumnsByGroup(group)
    return groupCols.every(col => selectedColumns.has(col))
  }

  // Check if some columns in a group are selected
  const isGroupPartiallySelected = (group) => {
    const groupCols = getColumnsByGroup(group)
    const selectedCount = groupCols.filter(col => selectedColumns.has(col)).length
    return selectedCount > 0 && selectedCount < groupCols.length
  }

  // Toggle a single column
  const toggleColumn = (column) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(column)) {
        newSet.delete(column)
      } else {
        newSet.add(column)
      }
      return newSet
    })
  }

  // Toggle all columns in a group
  const toggleGroup = (group) => {
    const groupCols = getColumnsByGroup(group)
    const allSelected = isGroupFullySelected(group)
    
    setSelectedColumns(prev => {
      const newSet = new Set(prev)
      if (allSelected) {
        groupCols.forEach(col => newSet.delete(col))
      } else {
        groupCols.forEach(col => newSet.add(col))
      }
      return newSet
    })
  }

  // Toggle group expansion
  const toggleGroupExpansion = (group) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  // Select all columns
  const selectAllColumns = () => {
    setSelectedColumns(new Set(Object.keys(ALL_COLUMNS)))
  }

  // Deselect all columns
  const deselectAllColumns = () => {
    setSelectedColumns(new Set())
  }

  // Get default dates (last 3 months)
  const getDefaultDates = () => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 3)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const handleFetchData = async () => {
    if (selectedStocks.length === 0) {
      setError('Silakan pilih minimal satu saham')
      return
    }

    if (selectedColumns.size === 0) {
      setError('Silakan pilih minimal satu kolom')
      return
    }

    if (!startDate || !endDate) {
      const defaults = getDefaultDates()
      if (!startDate) setStartDate(defaults.start)
      if (!endDate) setEndDate(defaults.end)
    }

    setLoading(true)
    setError(null)

    try {
      const result = await stockApi.getRegressionData(
        selectedStocks,
        startDate || getDefaultDates().start,
        endDate || getDefaultDates().end,
        { upThreshold, downThreshold, includeNeutral }
      )
      setData(result)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get visible columns array
  const displayColumns = useMemo(() => {
    return Array.from(selectedColumns)
  }, [selectedColumns])

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data?.data) return []
    
    let filtered = [...data.data]
    
    if (filterSymbol) {
      filtered = filtered.filter(row => row.symbol.includes(filterSymbol.toUpperCase()))
    }
    
    if (filterTarget !== 'all') {
      if (filterTarget === 'up') {
        filtered = filtered.filter(row => row.target === 1)
      } else if (filterTarget === 'down') {
        filtered = filtered.filter(row => row.target === 0)
      } else if (filterTarget === 'neutral') {
        filtered = filtered.filter(row => row.target === -1)
      }
    }
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal === null) return 1
        if (bVal === null) return -1
        
        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal)
        }
        
        return sortConfig.direction === 'asc' 
          ? aVal - bVal 
          : bVal - aVal
      })
    }
    
    return filtered
  }, [data, filterSymbol, filterTarget, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const exportToExcel = () => {
    if (!data?.data || data.data.length === 0) return

    const filteredData = data.data.map(row => {
      const newRow = {}
      displayColumns.forEach(col => {
        newRow[col] = row[col]
      })
      return newRow
    })

    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Regression Data')
    
    const summaryData = [
      ['Summary Statistics'],
      ['Total Records', data.summary.totalRecords],
      ['Symbols Processed', data.summary.symbolsProcessed],
      ['Date Range', `${data.summary.dateRange.start} to ${data.summary.dateRange.end}`],
      ['Columns Selected', displayColumns.length],
      [''],
      ['Threshold Settings'],
      ['Up Threshold', `≥${data.summary.thresholds?.upThreshold || upThreshold}%`],
      ['Down Threshold', `≤${data.summary.thresholds?.downThreshold || downThreshold}%`],
      ['Include Neutral', data.summary.thresholds?.includeNeutral ? 'Yes' : 'No'],
      [''],
      ['Target Distribution'],
      ['UP (1)', data.summary.targetDistribution.up],
      ['DOWN (0)', data.summary.targetDistribution.down],
      ['NEUTRAL (-1)', data.summary.targetDistribution.neutral || 0],
      ['UP Percentage', `${data.summary.targetDistribution.upPercent}%`],
      ['DOWN Percentage', `${data.summary.targetDistribution.downPercent}%`],
      [''],
      ['Selected Columns'],
      ...displayColumns.map(col => [col, ALL_COLUMNS[col]?.desc || ''])
    ]
    
    if (data.summary.errors) {
      summaryData.push([''], ['Errors'])
      data.summary.errors.forEach(err => {
        summaryData.push([err.symbol, err.error])
      })
    }
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
    
    const filename = `regression_data_${selectedStocks.slice(0, 3).join('_')}${selectedStocks.length > 3 ? '_etc' : ''}_${startDate}_${endDate}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '-'
    
    if (typeof value === 'number') {
      if (key.includes('Percent') || key.includes('percent') || key === 'roc' || key.includes('return')) {
        return `${value.toFixed(2)}%`
      }
      if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M'
      }
      if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(2) + 'K'
      }
      if (!Number.isInteger(value)) {
        return value.toFixed(2)
      }
    }
    
    return value
  }

  const getTargetBadge = (target, label) => {
    if (target === 1) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-900/50 text-green-400">↑ UP</span>
    }
    if (target === -1) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-900/50 text-yellow-400">⚖️ NEUTRAL</span>
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900/50 text-red-400">↓ DOWN</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-purple-400 mb-2">📊 Data Regresi - Prediksi Saham</h2>
        <p className="text-gray-400">
          Dapatkan data historis dengan indikator teknikal untuk membangun model regresi prediksi saham naik/turun.
          Indikator dihitung dari hari sebelumnya (H-1), target dari hari H.
        </p>
      </div>

      {/* Stock Selection - Using StockSelector (no IHSG) */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">1. Pilih Saham</h3>
        <StockSelector
          selectedStocks={selectedStocks}
          onSelect={setSelectedStocks}
          multiple={true}
          showPrices={true}
          excludeIndex={true}
        />
      </div>

      {/* Date Range */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">2. Rentang Tanggal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Jika tidak diisi, akan menggunakan 3 bulan terakhir
        </p>
      </div>

      {/* Threshold Settings for ML Target */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">2.5. Konfigurasi Target ML</h3>
        <p className="text-sm text-gray-400 mb-4">
          Tentukan threshold untuk klasifikasi UP/DOWN. Data dengan return di antara keduanya akan dikategorikan sebagai NEUTRAL.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              UP Threshold (≥)
              <span className="text-green-400 ml-1">↑</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={upThreshold}
                onChange={(e) => setUpThreshold(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <span className="text-gray-400">%</span>
            </div>
            <p className="text-xs text-green-400/70 mt-1">Return ≥ {upThreshold}% = UP</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              DOWN Threshold (≤)
              <span className="text-red-400 ml-1">↓</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={downThreshold}
                onChange={(e) => setDownThreshold(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              />
              <span className="text-gray-400">%</span>
            </div>
            <p className="text-xs text-red-400/70 mt-1">Return ≤ {downThreshold}% = DOWN</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Sertakan NEUTRAL
              <span className="text-yellow-400 ml-1">⚖️</span>
            </label>
            <div className="flex items-center gap-3 mt-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNeutral}
                  onChange={(e) => setIncludeNeutral(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-500 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800"
                />
                <span className="ml-2 text-white">{includeNeutral ? 'Ya' : 'Tidak'}</span>
              </label>
            </div>
            <p className="text-xs text-yellow-400/70 mt-1">
              {includeNeutral ? 'Data neutral akan disertakan' : 'Data neutral akan dibuang'}
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-600">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-purple-400">💡 Tips ML:</span> Untuk trading, disarankan:
          </p>
          <ul className="text-xs text-gray-400 mt-1 space-y-1">
            <li>• <span className="text-green-400">UP ≥ +1%</span> → Cukup signifikan untuk profit setelah fee</li>
            <li>• <span className="text-red-400">DOWN ≤ -0.5%</span> → Lebih sensitif untuk cut loss</li>
            <li>• <span className="text-yellow-400">NEUTRAL</span> → Buang karena tidak tradeable</li>
          </ul>
        </div>
      </div>

      {/* Column Selection with Checkboxes */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">3. Pilih Kolom/Fitur ({selectedColumns.size} terpilih)</h3>
          <div className="flex gap-2">
            <button
              onClick={selectAllColumns}
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition"
            >
              Pilih Semua
            </button>
            <button
              onClick={deselectAllColumns}
              className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition"
            >
              Hapus Semua
            </button>
          </div>
        </div>

        {/* Model Preset Selector */}
        {trainedModels.length > 0 && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-purple-400 text-lg">🤖</span>
              <label className="text-sm font-medium text-purple-300">
                Gunakan Fitur dari Model yang Sudah Dilatih
              </label>
            </div>
            <select
              value={selectedPresetModel}
              onChange={(e) => handlePresetModelChange(e.target.value)}
              className="w-full bg-gray-700 border border-purple-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">-- Pilih Model untuk Preset Fitur --</option>
              {trainedModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.model_name || model.model_type} - {model.features?.length || 0} fitur 
                  (Acc: {(model.metrics?.accuracy * 100).toFixed(1)}%) 
                  - {new Date(model.trained_at).toLocaleDateString('id-ID')}
                </option>
              ))}
            </select>
            {selectedPresetModel && (
              <div className="mt-2 text-xs text-gray-400">
                <span className="text-green-400">✓</span> Fitur dari model "{trainedModels.find(m => m.id === selectedPresetModel)?.model_name}" telah dipilih otomatis
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              💡 Pilih model untuk menggunakan fitur yang sama dengan model tersebut
            </p>
          </div>
        )}

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {Object.entries(COLUMN_GROUPS).map(([groupKey, groupInfo]) => {
            const groupCols = getColumnsByGroup(groupKey)
            const isExpanded = expandedGroups.has(groupKey)
            const isFullySelected = isGroupFullySelected(groupKey)
            const isPartiallySelected = isGroupPartiallySelected(groupKey)
            const selectedInGroup = groupCols.filter(col => selectedColumns.has(col)).length
            
            return (
              <div key={groupKey} className="border border-gray-600 rounded-lg overflow-hidden">
                {/* Group Header */}
                <div 
                  className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 cursor-pointer hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={isFullySelected}
                    ref={el => {
                      if (el) el.indeterminate = isPartiallySelected
                    }}
                    onChange={() => toggleGroup(groupKey)}
                    className="w-4 h-4 rounded border-gray-500 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800 cursor-pointer"
                  />
                  <div 
                    className="flex-1 flex items-center gap-2"
                    onClick={() => toggleGroupExpansion(groupKey)}
                  >
                    <span className="font-medium text-white">{groupInfo.label}</span>
                    <span className="text-sm text-gray-400">
                      ({selectedInGroup}/{groupCols.length})
                    </span>
                  </div>
                  <button
                    onClick={() => toggleGroupExpansion(groupKey)}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Individual Columns */}
                {isExpanded && (
                  <div className="p-4 bg-gray-800/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {groupCols.map(col => (
                      <label 
                        key={col} 
                        className="flex items-start gap-2 p-2 rounded hover:bg-gray-700/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.has(col)}
                          onChange={() => toggleColumn(col)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-500 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white block">{ALL_COLUMNS[col].label}</span>
                          <span className="text-xs text-gray-500 block truncate">{ALL_COLUMNS[col].desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Fetch Button */}
      <div className="flex justify-center">
        <button
          onClick={handleFetchData}
          disabled={loading || selectedStocks.length === 0 || selectedColumns.size === 0}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Memproses...
            </span>
          ) : (
            '📊 Tampilkan Data'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">📈 Ringkasan Data</h3>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-white">{data.summary.totalRecords.toLocaleString()}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Saham Diproses</p>
                <p className="text-2xl font-bold text-white">{data.summary.symbolsProcessed}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Kolom Terpilih</p>
                <p className="text-2xl font-bold text-white">{selectedColumns.size}</p>
              </div>
              <div className="bg-green-900/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Target UP (1)</p>
                <p className="text-2xl font-bold text-green-400">
                  {data.summary.targetDistribution.up.toLocaleString()}
                  <span className="text-sm ml-1">({data.summary.targetDistribution.upPercent}%)</span>
                </p>
              </div>
              <div className="bg-red-900/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Target DOWN (0)</p>
                <p className="text-2xl font-bold text-red-400">
                  {data.summary.targetDistribution.down.toLocaleString()}
                  <span className="text-sm ml-1">({data.summary.targetDistribution.downPercent}%)</span>
                </p>
              </div>
              <div className="bg-yellow-900/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">NEUTRAL (-1)</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {(data.summary.targetDistribution.neutral || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Threshold Info */}
            {data.summary.thresholds && (
              <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-purple-400 text-sm font-semibold mb-1">🎯 Threshold yang digunakan:</p>
                <p className="text-purple-300 text-xs">
                  UP: ≥{data.summary.thresholds.upThreshold}% | 
                  DOWN: ≤{data.summary.thresholds.downThreshold}% | 
                  Include Neutral: {data.summary.thresholds.includeNeutral ? 'Ya' : 'Tidak'}
                </p>
              </div>
            )}

            {data.summary.errors && data.summary.errors.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ Beberapa saham gagal diproses:</p>
                {data.summary.errors.map((err, i) => (
                  <p key={i} className="text-yellow-300 text-xs">{err.symbol}: {err.error}</p>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Filter Symbol</label>
                <input
                  type="text"
                  value={filterSymbol}
                  onChange={(e) => setFilterSymbol(e.target.value)}
                  placeholder="Cari..."
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Filter Target</label>
                <select
                  value={filterTarget}
                  onChange={(e) => setFilterTarget(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Semua</option>
                  <option value="up">UP (1)</option>
                  <option value="down">DOWN (0)</option>
                  <option value="neutral">NEUTRAL (-1)</option>
                </select>
              </div>
              <div className="ml-auto text-sm text-gray-400">
                Menampilkan {processedData.length.toLocaleString()} dari {data.data.length.toLocaleString()} records
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/80 sticky top-0">
                  <tr>
                    {displayColumns.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 whitespace-nowrap"
                        title={ALL_COLUMNS[col]?.desc}
                      >
                        <span className="flex items-center gap-1">
                          {ALL_COLUMNS[col]?.label || col}
                          {sortConfig.key === col && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {processedData.slice(0, 500).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/30">
                      {displayColumns.map(col => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap">
                          {col === 'target' ? (
                            getTargetBadge(row[col])
                          ) : col === 'priceChange' ? (
                            <span className={row[col] >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {formatValue(row[col], col)}
                            </span>
                          ) : col === 'priceChangePercent' ? (
                            <span className={row[col] >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {row[col] >= 0 ? '+' : ''}{formatValue(row[col], col)}
                            </span>
                          ) : (
                            <span className="text-gray-300">{formatValue(row[col], col)}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processedData.length > 500 && (
              <div className="p-3 bg-gray-900/50 text-center text-gray-400 text-sm">
                Menampilkan 500 dari {processedData.length.toLocaleString()} records. Export ke Excel untuk melihat semua data.
              </div>
            )}
          </div>

          {/* ML Prediction Section */}
          <MLPrediction 
            regressionData={data} 
            selectedColumns={selectedColumns}
          />
        </div>
      )}
    </div>
  )
}
