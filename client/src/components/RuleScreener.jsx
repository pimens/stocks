import { useState, useMemo, useEffect, useCallback } from 'react'
import { stockApi } from '../services/api'
import { STOCK_PRICES, PRICE_RANGES, getStocksByPriceRange } from '../data/stockPrices'
import { US_POPULAR_STOCKS } from '../data/usStocks'
import { FiPlus, FiTrash2, FiPlay, FiSave, FiUpload, FiDownload, FiCopy, FiCheck, FiX, FiAlertTriangle, FiInfo, FiChevronDown, FiChevronUp, FiRefreshCw, FiFilter, FiTrendingUp, FiTrendingDown, FiStar } from 'react-icons/fi'
import * as XLSX from 'xlsx'

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
  deltaRSI7: { label: 'ΔRSI 7', group: 'delta', desc: 'Perubahan RSI 7 dari hari sebelumnya' },
  deltaRSI21: { label: 'ΔRSI 21', group: 'delta', desc: 'Perubahan RSI 21 dari hari sebelumnya' },
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
  priceCrossUpEMA21High: { label: 'Price CrossUp EMA21 High', group: 'ema', desc: '1 jika harga cross di atas EMA21 High (breakout)' },

  // RSI
  rsi: { label: 'RSI', group: 'rsi', desc: 'Relative Strength Index (14)' },
  rsiOversold: { label: 'RSI Oversold', group: 'rsi', desc: '1 jika RSI < 30' },
  rsiOverbought: { label: 'RSI Overbought', group: 'rsi', desc: '1 jika RSI > 70' },
  rsiNeutral: { label: 'RSI Neutral', group: 'rsi', desc: '1 jika 30 <= RSI <= 70' },
  rsi7: { label: 'RSI 7', group: 'rsi', desc: 'Relative Strength Index (7) - short term' },
  rsi7Oversold: { label: 'RSI 7 Oversold', group: 'rsi', desc: '1 jika RSI 7 < 30' },
  rsi7Overbought: { label: 'RSI 7 Overbought', group: 'rsi', desc: '1 jika RSI 7 > 70' },
  rsi7Neutral: { label: 'RSI 7 Neutral', group: 'rsi', desc: '1 jika 30 <= RSI 7 <= 70' },
  rsi7Rising: { label: 'RSI 7 Rising', group: 'rsi', desc: '1 jika RSI 7 naik dari kemarin' },
  rsi7ExitOversold: { label: 'RSI 7 Exit Oversold', group: 'rsi', desc: '1 jika RSI 7 baru keluar dari oversold' },
  rsi7BullishZone: { label: 'RSI 7 Bullish Zone', group: 'rsi', desc: '1 jika RSI 7 antara 50-70' },
  rsi21: { label: 'RSI 21', group: 'rsi', desc: 'Relative Strength Index (21) - medium term' },
  rsi21Oversold: { label: 'RSI 21 Oversold', group: 'rsi', desc: '1 jika RSI 21 < 30' },
  rsi21Overbought: { label: 'RSI 21 Overbought', group: 'rsi', desc: '1 jika RSI 21 > 70' },
  rsi21Neutral: { label: 'RSI 21 Neutral', group: 'rsi', desc: '1 jika 30 <= RSI 21 <= 70' },
  rsi21Rising: { label: 'RSI 21 Rising', group: 'rsi', desc: '1 jika RSI 21 naik dari kemarin' },
  rsi21ExitOversold: { label: 'RSI 21 Exit Oversold', group: 'rsi', desc: '1 jika RSI 21 baru keluar dari oversold' },
  rsi21BullishZone: { label: 'RSI 21 Bullish Zone', group: 'rsi', desc: '1 jika RSI 21 antara 50-70' },

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

const BACKTEST_WIN_CRITERIA = {
  return_h1_positive: {
    label: 'Win jika Return H+1 > 0%',
    metricShort: 'Return H+1',
    metricLong: 'Return H+1 (close vs signal close)',
  },
  gapup_open_prevclose: {
    label: 'Win jika Current Open > Prev Close (Gap Up Open)',
    metricShort: 'Gap Open',
    metricLong: 'Gap Open % (current open vs prev close)',
  },
}

const normalizeHorizonDays = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
}

const getWinCriteriaDisplay = (criteria, horizonDays = 1) => {
  const base = BACKTEST_WIN_CRITERIA[criteria] || {}
  if (criteria !== 'return_h1_positive') return base

  return {
    ...base,
    label: 'Win jika Return H+1 > 0%',
    metricShort: 'Return H+1',
    metricLong: 'Return H+1 (close vs signal close)',
  }
}

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
  },
  // ============ DISTANCE & SUPPORT LEVEL PRESETS ============
  far_from_high_near_support: {
    name: '🎯 Far from High + Near Support',
    desc: '⭐ RECOMMENDED: Jauh dari ATH tapi dekat support = recovery potential',
    rules: [
      { leftFeature: 'veryFarFromHigh52w', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'nearSupport', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'recoveryPotential', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  very_far_from_high: {
    name: '📉 Very Far from 52w High (>50%)',
    desc: '⭐ RECOMMENDED: Saham sudah turun >50% dari puncak (sangat jauh)',
    rules: [
      { leftFeature: 'veryFarFromHigh52w', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 50 },
    ]
  },
  far_from_high_moderate: {
    name: '📊 Far from 52w High (30-50%)',
    desc: 'Saham sudah jauh dari puncak (moderate drop)',
    rules: [
      { leftFeature: 'farFromHigh52w', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'veryFarFromHigh52w', operator: '==', compareType: 'constant', rightValue: 0 }, // NOT very far
      { leftFeature: 'distFromHigh52w', operator: '>', compareType: 'constant', rightValue: 30 },
      { leftFeature: 'distFromHigh52w', operator: '<=', compareType: 'constant', rightValue: 50 },
    ]
  },
  near_52w_low: {
    name: '⬇️ Near 52w Low (<10%)',
    desc: 'Saham dekat dengan terendah 52 minggu (potential bottom)',
    rules: [
      { leftFeature: 'nearLow52w', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 40 },
    ]
  },
  at_support_level: {
    name: '🛡️ At Support Level (<5%)',
    desc: '⭐ RECOMMENDED: Harga sangat dekat dengan support level',
    rules: [
      { leftFeature: 'nearSupport', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'distFromSupport', operator: '<', compareType: 'constant', rightValue: 5 },
    ]
  },
  support_with_bullish: {
    name: '🎯 Support + Bullish Confirmation',
    desc: '⭐ RECOMMENDED: Di support dengan signal bullish',
    rules: [
      { leftFeature: 'nearSupport', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 40 },
      { leftFeature: 'isBullishCandle', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  support_bounce_setup: {
    name: '📈 Support Bounce Setup',
    desc: 'Setup untuk bounce dari support (PRZ zone)',
    rules: [
      { leftFeature: 'nearSupport', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'distFromSupport', operator: '<', compareType: 'constant', rightValue: 10 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 45 },
      { leftFeature: 'macdPositive', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  // ============ GOLDEN CROSS MA PRESETS ============
  ma20_golden_cross_ma50: {
    name: '✂️ MA20 Golden Cross MA50',
    desc: '⭐ RECOMMENDED: MA20 memotong MA50 ke atas (strong bullish signal)',
    rules: [
      { leftFeature: 'ma20CrossAboveMa50', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '>', compareType: 'constant', rightValue: 40 },
    ]
  },
  ma10_golden_cross_ma20: {
    name: '✂️ MA10 Golden Cross MA20',
    desc: 'MA10 memotong MA20 ke atas (medium bullish signal)',
    rules: [
      { leftFeature: 'ma10CrossAboveMa20', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'ma20AboveSMA50', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  ma5_golden_cross_ma10: {
    name: '✂️ MA5 Golden Cross MA10',
    desc: 'MA5 memotong MA10 ke atas (fast bullish signal)',
    rules: [
      { leftFeature: 'ma5CrossAboveMa10', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'sma10AboveSMA20', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'isBullishCandle', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  ma50_golden_cross_ma100: {
    name: '✂️ MA50 Golden Cross MA100',
    desc: '⭐ RECOMMENDED: MA50 memotong MA100 ke atas (long-term bullish)',
    rules: [
      { leftFeature: 'ma50CrossAboveMa100', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'adx', operator: '>', compareType: 'constant', rightValue: 20 },
      { leftFeature: 'volumeRatio', operator: '>', compareType: 'constant', rightValue: 1 },
    ]
  },
  ma_uptrend_alignment: {
    name: '📈 MA Uptrend Alignment',
    desc: '⭐ RECOMMENDED: MA5 > MA10 > MA20 > MA50 (perfect uptrend)',
    rules: [
      { leftFeature: 'sma5AboveSMA10', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'sma10AboveSMA20', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'sma20AboveSMA50', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'macdBullish', operator: '==', compareType: 'constant', rightValue: 1 },
    ]
  },
  ma_death_cross_warning: {
    name: '⚠️ MA Death Cross Warning',
    desc: 'Signal bearish: MA cepat memotong MA lambat ke bawah',
    rules: [
      { leftFeature: 'ma20CrossBelowMa50', operator: '==', compareType: 'constant', rightValue: 1 },
      { leftFeature: 'rsi', operator: '<', compareType: 'constant', rightValue: 50 },
    ]
  },
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

export default function RuleScreener({ market = 'ID' }) {
  const isUS = market === 'US'
  // Stock list
  const [stockList, setStockList] = useState('lq45') // 'lq45', 'idx30', 'sector', 'price', 'all', 'custom'
  const [customStocks, setCustomStocks] = useState('')
  const [selectedSectors, setSelectedSectors] = useState([]) // For sector filter
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]) // For price range filter (multi)
  
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

  // Backtest state
  const [backtestStartDate, setBacktestStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split('T')[0]
  })
  const [backtestEndDate, setBacktestEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [backtestLoading, setBacktestLoading] = useState(false)
  const [backtestError, setBacktestError] = useState(null)
  const [backtestResult, setBacktestResult] = useState(null)
  const [showAllBacktestTrades, setShowAllBacktestTrades] = useState(false)
  const [returnHorizonDays, setReturnHorizonDays] = useState(1)
  const [backtestWinCriteria, setBacktestWinCriteria] = useState('return_h1_positive')
  const [screenerWinCriteria, setScreenerWinCriteria] = useState('return_h1_positive')
  const [backtestHistory, setBacktestHistory] = useState([])
  const [showBacktestHistory, setShowBacktestHistory] = useState(false)
  const [expandedHistoryIds, setExpandedHistoryIds] = useState(new Set())
  const [selectedHistoryExportIds, setSelectedHistoryExportIds] = useState(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [backtestGroups, setBacktestGroups] = useState([])
  const [newBacktestGroupName, setNewBacktestGroupName] = useState('')
  const [selectedSaveGroups, setSelectedSaveGroups] = useState([])
  const [selectedHistoryGroupFilter, setSelectedHistoryGroupFilter] = useState([])

  const UNGROUPED_FILTER = '__ungrouped__'

  const normalizeGroups = useCallback((entry) => {
    if (Array.isArray(entry?.groups)) {
      return entry.groups.filter((group) => typeof group === 'string' && group.trim())
    }
    if (typeof entry?.group === 'string' && entry.group.trim()) {
      return [entry.group.trim()]
    }
    return []
  }, [])

  const getGroupLabel = useCallback((entry) => {
    const groups = normalizeGroups(entry)
    return groups.length > 0 ? groups.join(', ') : 'Tanpa Kelompok'
  }, [normalizeGroups])

  const toggleGroupSelection = (currentGroups, groupName) => {
    const next = new Set(currentGroups)
    if (next.has(groupName)) {
      next.delete(groupName)
    } else {
      next.add(groupName)
    }
    return Array.from(next).sort((a, b) => a.localeCompare(b))
  }

  // Load saved presets & history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ruleScreenerPresets')
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load presets:', e)
      }
    }
    const savedHistory = localStorage.getItem('backtestHistory')
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory)
        if (Array.isArray(parsedHistory)) {
          setBacktestHistory(parsedHistory.map((entry) => ({
            ...entry,
            groups: normalizeGroups(entry),
          })))
        }
      } catch (e) {
        console.error('Failed to load backtest history:', e)
      }
    }
    const savedGroups = localStorage.getItem('backtestGroups')
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups)
        if (Array.isArray(parsed)) {
          setBacktestGroups(parsed.filter(g => typeof g === 'string' && g.trim()))
        }
      } catch (e) {
        console.error('Failed to load backtest groups:', e)
      }
    }
  }, [normalizeGroups])

  // Get stocks based on selection
  const getSelectedStocks = useCallback(() => {
    if (isUS) {
      // US market: use custom or all US popular stocks
      if (stockList === 'custom') {
        return customStocks.split(',').map(s => s.trim().toUpperCase()).filter(s => s)
      }
      return US_POPULAR_STOCKS.map(s => s.code)
    }
    switch (stockList) {
      case 'lq45':
        return LQ45_STOCKS
      case 'idx30':
        return IDX30_STOCKS
      case 'sector':
        // Filter by selected sectors
        if (selectedSectors.length === 0) return IDX_STOCKS.map(s => s.code)
        return IDX_STOCKS.filter(s => selectedSectors.includes(s.sector)).map(s => s.code)
      case 'price': {
        // Filter by price range (multi)
        if (selectedPriceRanges.length === 0) {
          return Object.keys(STOCK_PRICES).filter(code => STOCK_PRICES[code] > 0)
        }
        const grouped = getStocksByPriceRange()
        const codesSet = new Set()
        selectedPriceRanges.forEach(r => {
          grouped[r]?.stocks?.forEach(s => codesSet.add(s.code))
        })
        return Array.from(codesSet)
      }
      case 'all':
        // All stocks from IDX_STOCKS
        return IDX_STOCKS.map(s => s.code)
      case 'custom':
        return customStocks.split(',').map(s => s.trim().toUpperCase()).filter(s => s)
      default:
        return LQ45_STOCKS
    }
  }, [stockList, customStocks, selectedSectors, selectedPriceRanges, isUS])

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

  const formatRuleValue = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-'
    if (typeof value !== 'number') return String(value)
    return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
  }

  const getRuleLabel = (rule, index) => {
    const leftLabel = ALL_FEATURES[rule.leftFeature]?.label || rule.leftFeature
    const rightLabel = rule.compareType === 'constant'
      ? formatRuleValue(parseFloat(rule.rightValue))
      : (ALL_FEATURES[rule.rightFeature]?.label || rule.rightFeature)

    return `Rule ${index + 1}: ${leftLabel} ${rule.operator} ${rightLabel}`
  }

  const getRuleSummaryText = (entryRules = [], logic = 'AND') => {
    if (!Array.isArray(entryRules) || entryRules.length === 0) return '-'

    return entryRules
      .map((rule) => {
        const leftLabel = ALL_FEATURES[rule.leftFeature]?.label || rule.leftFeature
        const rightLabel = rule.compareType === 'constant'
          ? formatRuleValue(parseFloat(rule.rightValue))
          : (ALL_FEATURES[rule.rightFeature]?.label || rule.rightFeature)

        return `${leftLabel} ${rule.operator} ${rightLabel}`
      })
      .join(` ${logic || 'AND'} `)
  }

  const formatRuleComparison = (ruleResult) => {
    const leftText = formatRuleValue(ruleResult.leftValue)
    const rightText = formatRuleValue(ruleResult.rightValue)
    return `${leftText} vs ${rightText} (${ruleResult.rule.operator})`
  }

  const runBacktest = async () => {
    const stocks = getSelectedStocks()
    const horizonDays = 1

    if (rules.length === 0) {
      setBacktestError('Tambahkan minimal satu rule sebelum backtest')
      return
    }

    if (stocks.length === 0) {
      setBacktestError('Tidak ada saham yang dipilih untuk backtest')
      return
    }

    if (!backtestStartDate || !backtestEndDate) {
      setBacktestError('Pilih tanggal mulai dan selesai backtest')
      return
    }

    if (new Date(backtestStartDate) > new Date(backtestEndDate)) {
      setBacktestError('Tanggal mulai tidak boleh lebih besar dari tanggal selesai')
      return
    }

    setBacktestLoading(true)
    setBacktestError(null)
    setBacktestResult(null)
    setShowAllBacktestTrades(false)

    try {
      const response = await stockApi.getRegressionData(stocks, backtestStartDate, backtestEndDate, {
        includeNeutral: true,
        horizonDays,
        rules: rules.map(({ id, ...rest }) => rest),
        logicOperator,
      })

      const rows = response?.data || []
      const samplesEvaluated = Number(response?.summary?.samplesEvaluated) || rows.length

      if (rows.length === 0) {
        setBacktestError(
          samplesEvaluated > 0
            ? 'Tidak ada trade yang lolos rule untuk range tanggal ini'
            : 'Tidak ada data historis untuk range tanggal ini'
        )
        return
      }

      const evaluatedRows = rows.map((row) => {
        const ruleResults = Array.isArray(row.ruleResults) && row.ruleResults.length === rules.length
          ? row.ruleResults
          : rules.map((rule) => ({
            rule,
            passed: evaluateRule(rule, row),
            leftValue: row[rule.leftFeature],
            rightValue: rule.compareType === 'constant'
              ? parseFloat(rule.rightValue)
              : row[rule.rightFeature],
          }))

        const passed = typeof row.passed === 'boolean'
          ? row.passed
          : (logicOperator === 'AND'
            ? ruleResults.every((r) => r.passed)
            : ruleResults.some((r) => r.passed))
        const passedCount = Number.isFinite(row.passedCount)
          ? row.passedCount
          : ruleResults.filter((r) => r.passed).length

        return {
          ...row,
          ruleResults,
          signalDate: row.date,
          returnPercent: Number(row.priceChangePercent) || 0,
          currentOpen: Number(row.currentOpen) || 0,
          prevClose: Number(row.prevClose) || 0,
          gapOpenPercent: Number(row.prevClose)
            ? (((Number(row.currentOpen) || 0) - Number(row.prevClose)) / Number(row.prevClose)) * 100
            : 0,
          passed,
          passedCount,
        }
      })

      const trades = evaluatedRows
        .filter((r) => r.passed)
        .sort((a, b) => {
          const d = new Date(a.date) - new Date(b.date)
          if (d !== 0) return d
          return a.symbol.localeCompare(b.symbol)
        })

      const tradesWithOutcome = trades.map((trade) => {
        const outcomePercent = backtestWinCriteria === 'gapup_open_prevclose'
          ? trade.gapOpenPercent
          : trade.returnPercent
        const outcomeDate = backtestWinCriteria === 'gapup_open_prevclose'
          ? trade.signalDate
          : (trade.futureDate || trade.signalDate)

        let isWin = false
        let isLoss = false
        let isBreakeven = false

        if (backtestWinCriteria === 'gapup_open_prevclose') {
          isWin = trade.currentOpen > trade.prevClose
          isLoss = trade.currentOpen < trade.prevClose
          isBreakeven = trade.currentOpen === trade.prevClose
        } else {
          isWin = trade.returnPercent > 0
          isLoss = trade.returnPercent < 0
          isBreakeven = trade.returnPercent === 0
        }

        return {
          ...trade,
          outcomeDate,
          outcomePercent,
          outcomePercentByWinCriteria: outcomePercent,
          status: isWin ? 'Win' : isLoss ? 'Loss' : 'Breakeven',
          winCriteriaUsed: backtestWinCriteria,
          winCriteriaLabelUsed: getWinCriteriaDisplay(backtestWinCriteria, horizonDays).label,
          returnHorizonDays: horizonDays,
          isWin,
          isLoss,
          isBreakeven,
        }
      })

      const wins = tradesWithOutcome.filter((t) => t.isWin)
      const losses = tradesWithOutcome.filter((t) => t.isLoss)
      const breakeven = tradesWithOutcome.filter((t) => t.isBreakeven)

      const grossProfit = wins.reduce((sum, t) => sum + t.outcomePercent, 0)
      const grossLossAbs = Math.abs(losses.reduce((sum, t) => sum + t.outcomePercent, 0))
      const avgWin = wins.length ? grossProfit / wins.length : 0
      const avgLossAbs = losses.length ? grossLossAbs / losses.length : 0
      const totalTrades = trades.length
      const winRate = totalTrades ? (wins.length / totalTrades) * 100 : 0
      const avgReturnPerTrade = totalTrades
        ? tradesWithOutcome.reduce((sum, t) => sum + t.outcomePercent, 0) / totalTrades
        : 0
      const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLossAbs
      const profitFactor = grossLossAbs === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLossAbs

      let equity = 1
      let peak = 1
      let maxDrawdown = 0
      tradesWithOutcome.forEach((t) => {
        equity *= (1 + t.outcomePercent / 100)
        if (equity > peak) peak = equity
        const drawdown = ((peak - equity) / peak) * 100
        if (drawdown > maxDrawdown) maxDrawdown = drawdown
      })

      const sortedByOutcome = [...tradesWithOutcome].sort((a, b) => b.outcomePercent - a.outcomePercent)
      const winCriteriaDisplay = getWinCriteriaDisplay(backtestWinCriteria, horizonDays)

      setBacktestResult({
        startDate: backtestStartDate,
        endDate: backtestEndDate,
        winCriteria: backtestWinCriteria,
        returnHorizonDays: horizonDays,
        winCriteriaLabel: winCriteriaDisplay.label,
        winCriteriaMetricShort: winCriteriaDisplay.metricShort,
        winCriteriaMetricLong: winCriteriaDisplay.metricLong,
        symbolsCount: stocks.length,
        samplesEvaluated,
        totalTrades,
        wins: wins.length,
        losses: losses.length,
        breakeven: breakeven.length,
        winRate,
        expectancy,
        avgReturnPerTrade,
        avgWin,
        avgLossAbs,
        grossProfit,
        grossLossAbs,
        profitFactor,
        maxDrawdown,
        totalReturn: (equity - 1) * 100,
        bestTrades: sortedByOutcome.slice(0, 5),
        worstTrades: sortedByOutcome.slice(-5).reverse(),
        trades: tradesWithOutcome,
      })
    } catch (err) {
      const rawError = err.response?.data?.error || err.message || 'Gagal menjalankan backtest'
      const friendlyError = /Invalid string length/i.test(rawError)
        ? 'Payload backtest terlalu besar untuk diproses. Coba kurangi jumlah saham atau pecah periode backtest menjadi beberapa bagian.'
        : rawError
      setBacktestError(friendlyError)
    } finally {
      setBacktestLoading(false)
    }
  }

  const downloadBacktestExcel = () => {
    if (!backtestResult) return

    const wb = XLSX.utils.book_new()

    // Sheet 1: Summary
    const summary = [
      ['Backtest Summary', ''],
      ['Periode', `${backtestResult.startDate} s/d ${backtestResult.endDate}`],
      ['Win Criteria', backtestResult.winCriteriaLabel || BACKTEST_WIN_CRITERIA[backtestResult.winCriteria]?.label || backtestResult.winCriteria],
      ['Horizon', 'H+1'],
      ['Symbols', backtestResult.symbolsCount],
      ['Samples Evaluated', backtestResult.samplesEvaluated],
      [],
      ['Metric', 'Value'],
      ['Total Trades', backtestResult.totalTrades],
      ['Wins', backtestResult.wins],
      ['Losses', backtestResult.losses],
      ['Breakeven', backtestResult.breakeven],
      ['Win Rate (%)', +backtestResult.winRate.toFixed(2)],
      ['Expectancy (%)', +backtestResult.expectancy.toFixed(4)],
      ['Avg Return / Trade (%)', +backtestResult.avgReturnPerTrade.toFixed(4)],
      ['Avg Win (%)', +backtestResult.avgWin.toFixed(4)],
      ['Avg Loss (%)', +backtestResult.avgLossAbs.toFixed(4)],
      ['Gross Profit (%)', +backtestResult.grossProfit.toFixed(4)],
      ['Gross Loss (%)', +backtestResult.grossLossAbs.toFixed(4)],
      ['Profit Factor', Number.isFinite(backtestResult.profitFactor) ? +backtestResult.profitFactor.toFixed(4) : 'Infinity'],
      ['Max Drawdown (%)', +backtestResult.maxDrawdown.toFixed(4)],
      ['Total Return (%)', +backtestResult.totalReturn.toFixed(4)],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summary)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    // Sheet 2: All Trades
    const ruleHeaders = rules.map((rule, index) => getRuleLabel(rule, index))
    const tradeHeaders = ['#', 'Symbol', 'Tanggal Sinyal', 'Tanggal Outcome', 'Rule Lolos', 'Outcome (%)', 'Status', 'Kriteria Win', ...ruleHeaders]
    const tradeRows = backtestResult.trades.map((t, i) => [
      i + 1,
      t.symbol,
      t.signalDate?.split('T')[0] || t.date?.split('T')[0] || '-',
      t.outcomeDate?.split('T')[0] || '-',
      `${t.passedCount}/${rules.length}`,
      +t.outcomePercent.toFixed(4),
      t.status,
      backtestResult.winCriteriaLabel || backtestResult.winCriteria,
      ...(t.ruleResults || []).map((ruleResult) => formatRuleComparison(ruleResult)),
    ])
    const wsTrades = XLSX.utils.aoa_to_sheet([tradeHeaders, ...tradeRows])
    XLSX.utils.book_append_sheet(wb, wsTrades, 'All Trades')

    // Sheet 3: Full indicator dataset for executed trades
    const allTradeKeys = new Set()
    backtestResult.trades.forEach((trade) => {
      Object.keys(trade).forEach((key) => allTradeKeys.add(key))
    })

    const preferredMetaKeys = [
      'symbol',
      'signalDate',
      'date',
      'outcomeDate',
      'outcomePercentByWinCriteria',
      'outcomePercent',
      'status',
      'isWin',
      'isLoss',
      'isBreakeven',
      'winCriteriaUsed',
      'winCriteriaLabelUsed',
      'returnHorizonDays',
      'passed',
      'passedCount',
      'futureDate',
      'futureClose',
      'priceChangePercent',
      'gapOpenPercent',
      'returnPercent',
    ]

    const orderedMetaKeys = preferredMetaKeys.filter((key) => allTradeKeys.has(key))
    const remainingKeys = [...allTradeKeys]
      .filter((key) => !orderedMetaKeys.includes(key))
      .sort((a, b) => a.localeCompare(b))
    const indicatorHeaders = [...orderedMetaKeys, ...remainingKeys]

    const normalizeCell = (value) => {
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') return Number.isFinite(value) ? value : ''
      if (typeof value === 'boolean') return value ? 1 : 0
      if (typeof value === 'object') return JSON.stringify(value)
      return value
    }

    const indicatorRows = backtestResult.trades.map((trade) => (
      indicatorHeaders.map((key) => normalizeCell(trade[key]))
    ))

    const wsIndicators = indicatorHeaders.length > 0
      ? XLSX.utils.aoa_to_sheet([
        indicatorHeaders,
        ...indicatorRows,
      ])
      : XLSX.utils.aoa_to_sheet([
        ['Info'],
        ['Tidak ada trade yang lolos rule pada periode ini.'],
      ])
    XLSX.utils.book_append_sheet(wb, wsIndicators, 'Trade Indicators')

    const filename = `backtest_${backtestResult.startDate}_${backtestResult.endDate}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const downloadTradeIndicatorsCSV = () => {
    if (!backtestResult) return

    const allTradeKeys = new Set()
    backtestResult.trades.forEach((trade) => {
      Object.keys(trade).forEach((key) => allTradeKeys.add(key))
    })

    const preferredMetaKeys = [
      'symbol',
      'signalDate',
      'date',
      'outcomeDate',
      'outcomePercentByWinCriteria',
      'outcomePercent',
      'status',
      'isWin',
      'isLoss',
      'isBreakeven',
      'winCriteriaUsed',
      'winCriteriaLabelUsed',
      'returnHorizonDays',
      'passed',
      'passedCount',
      'futureDate',
      'futureClose',
      'priceChangePercent',
      'gapOpenPercent',
      'returnPercent',
    ]

    const orderedMetaKeys = preferredMetaKeys.filter((key) => allTradeKeys.has(key))
    const remainingKeys = [...allTradeKeys]
      .filter((key) => !orderedMetaKeys.includes(key))
      .sort((a, b) => a.localeCompare(b))
    const indicatorHeaders = [...orderedMetaKeys, ...remainingKeys]

    if (indicatorHeaders.length === 0) {
      const fallback = 'Info\n"Tidak ada trade yang lolos rule pada periode ini."\n'
      const fallbackBlob = new Blob([`\uFEFF${fallback}`], { type: 'text/csv;charset=utf-8;' })
      const fallbackUrl = URL.createObjectURL(fallbackBlob)
      const fallbackLink = document.createElement('a')
      fallbackLink.href = fallbackUrl
      fallbackLink.download = `trade_indicators_${backtestResult.startDate}_${backtestResult.endDate}.csv`
      fallbackLink.click()
      URL.revokeObjectURL(fallbackUrl)
      return
    }

    const normalizeCell = (value) => {
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') return Number.isFinite(value) ? value : ''
      if (typeof value === 'boolean') return value ? 1 : 0
      if (typeof value === 'object') return JSON.stringify(value)
      return value
    }

    const indicatorRows = backtestResult.trades.map((trade) => (
      indicatorHeaders.map((key) => normalizeCell(trade[key]))
    ))

    const wsIndicators = XLSX.utils.aoa_to_sheet([
      indicatorHeaders,
      ...indicatorRows,
    ])
    const csv = XLSX.utils.sheet_to_csv(wsIndicators)
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trade_indicators_${backtestResult.startDate}_${backtestResult.endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const saveBacktestToHistory = () => {
    if (!backtestResult) return
    const entry = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      name: `Backtest ${backtestResult.startDate} ~ ${backtestResult.endDate}`,
      market: market,
      logicOperator,
      rules: rules.map(({ id, ...rest }) => rest),
      winCriteria: backtestResult.winCriteria,
      returnHorizonDays: backtestResult.returnHorizonDays,
      winCriteriaLabel: backtestResult.winCriteriaLabel || BACKTEST_WIN_CRITERIA[backtestResult.winCriteria]?.label || backtestResult.winCriteria,
      winCriteriaMetricShort: backtestResult.winCriteriaMetricShort || BACKTEST_WIN_CRITERIA[backtestResult.winCriteria]?.metricShort || backtestResult.winCriteria,
      winCriteriaMetricLong: backtestResult.winCriteriaMetricLong || BACKTEST_WIN_CRITERIA[backtestResult.winCriteria]?.metricLong || backtestResult.winCriteria,
      groups: [...selectedSaveGroups],
      group: selectedSaveGroups[0] || '',
      startDate: backtestResult.startDate,
      endDate: backtestResult.endDate,
      symbolsCount: backtestResult.symbolsCount,
      samplesEvaluated: backtestResult.samplesEvaluated,
      totalTrades: backtestResult.totalTrades,
      wins: backtestResult.wins,
      losses: backtestResult.losses,
      breakeven: backtestResult.breakeven,
      winRate: backtestResult.winRate,
      expectancy: backtestResult.expectancy,
      avgReturnPerTrade: backtestResult.avgReturnPerTrade,
      avgWin: backtestResult.avgWin,
      avgLossAbs: backtestResult.avgLossAbs,
      grossProfit: backtestResult.grossProfit,
      grossLossAbs: backtestResult.grossLossAbs,
      profitFactor: backtestResult.profitFactor,
      maxDrawdown: backtestResult.maxDrawdown,
      totalReturn: backtestResult.totalReturn,
      bestTrades: backtestResult.bestTrades,
      worstTrades: backtestResult.worstTrades,
    }
    const updated = [entry, ...backtestHistory].slice(0, 50) // max 50 history
    setBacktestHistory(updated)
    localStorage.setItem('backtestHistory', JSON.stringify(updated))
  }

  const addBacktestGroup = () => {
    const nextName = newBacktestGroupName.trim()
    if (!nextName) return
    if (backtestGroups.some(g => g.toLowerCase() === nextName.toLowerCase())) {
      return
    }
    const updated = [...backtestGroups, nextName]
    setBacktestGroups(updated)
    localStorage.setItem('backtestGroups', JSON.stringify(updated))
    setNewBacktestGroupName('')
  }

  const deleteBacktestGroup = (groupName) => {
    const updatedGroups = backtestGroups.filter(g => g !== groupName)
    setBacktestGroups(updatedGroups)
    localStorage.setItem('backtestGroups', JSON.stringify(updatedGroups))

    const updatedHistory = backtestHistory.map(entry => (
      {
        ...entry,
        groups: normalizeGroups(entry).filter((group) => group !== groupName),
        group: normalizeGroups(entry).filter((group) => group !== groupName)[0] || '',
      }
    ))
    setBacktestHistory(updatedHistory)
    localStorage.setItem('backtestHistory', JSON.stringify(updatedHistory))

    setSelectedSaveGroups((prev) => prev.filter((group) => group !== groupName))
    setSelectedHistoryGroupFilter((prev) => prev.filter((group) => group !== groupName))
  }

  const updateHistoryEntryGroups = (entryId, groupName) => {
    const updated = backtestHistory.map((entry) => {
      if (entry.id !== entryId) return entry
      const nextGroups = toggleGroupSelection(normalizeGroups(entry), groupName)
      return {
        ...entry,
        groups: nextGroups,
        group: nextGroups[0] || '',
      }
    })
    setBacktestHistory(updated)
    localStorage.setItem('backtestHistory', JSON.stringify(updated))
  }

  const toggleHistoryGroupFilter = (groupName) => {
    setSelectedHistoryGroupFilter((prev) => toggleGroupSelection(prev, groupName))
  }

  const clearHistoryGroupFilter = () => {
    setSelectedHistoryGroupFilter([])
  }

  const toggleSaveGroupSelection = (groupName) => {
    setSelectedSaveGroups((prev) => toggleGroupSelection(prev, groupName))
  }

  const clearSaveGroups = () => {
    setSelectedSaveGroups([])
  }

  const toggleHistoryFavorite = (entryId) => {
    const updated = backtestHistory.map(h => (
      h.id === entryId ? { ...h, favorite: !h.favorite } : h
    ))
    setBacktestHistory(updated)
    localStorage.setItem('backtestHistory', JSON.stringify(updated))
  }

  const deleteHistoryEntry = (entryId) => {
    const updated = backtestHistory.filter(h => h.id !== entryId)
    setBacktestHistory(updated)
    setSelectedHistoryExportIds(prev => {
      const next = new Set(prev)
      next.delete(entryId)
      return next
    })
    localStorage.setItem('backtestHistory', JSON.stringify(updated))
  }

  const visibleHistoryEntries = useMemo(() => {
    return backtestHistory.filter(entry => {
      const passFavorite = !showFavoritesOnly || entry.favorite
      const entryGroups = normalizeGroups(entry)
      const passGroup = selectedHistoryGroupFilter.length === 0
        || selectedHistoryGroupFilter.some((group) => (
          group === UNGROUPED_FILTER
            ? entryGroups.length === 0
            : entryGroups.includes(group)
        ))
      return passFavorite && passGroup
    })
  }, [backtestHistory, showFavoritesOnly, selectedHistoryGroupFilter, normalizeGroups, UNGROUPED_FILTER])

  const selectedVisibleHistoryCount = useMemo(() => (
    visibleHistoryEntries.filter(entry => selectedHistoryExportIds.has(entry.id)).length
  ), [visibleHistoryEntries, selectedHistoryExportIds])

  const toggleHistoryExportSelection = (entryId) => {
    setSelectedHistoryExportIds(prev => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  const toggleSelectAllVisibleHistory = () => {
    const visibleIds = visibleHistoryEntries.map(entry => entry.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedHistoryExportIds.has(id))

    setSelectedHistoryExportIds(prev => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleIds.forEach(id => next.delete(id))
      } else {
        visibleIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const exportSelectedHistoryExcel = () => {
    const selectedEntries = backtestHistory.filter(entry => selectedHistoryExportIds.has(entry.id))
    if (selectedEntries.length === 0) return

    const wb = XLSX.utils.book_new()

    const summaryHeaders = [
      'Nama',
      'Disimpan Pada',
      'Market',
      'Kelompok',
      'Semua Rules',
      'Logic',
      'Kriteria Win',
      'Periode Mulai',
      'Periode Selesai',
      'Jumlah Saham',
      'Samples Evaluated',
      'Total Trades',
      'Wins',
      'Losses',
      'Breakeven',
      'Win Rate (%)',
      'Expectancy (%)',
      'Avg Return / Trade (%)',
      'Avg Win (%)',
      'Avg Loss (%)',
      'Gross Profit (%)',
      'Gross Loss (%)',
      'Profit Factor',
      'Max Drawdown (%)',
      'Total Return (%)',
      'Favorit',
    ]

    const summaryRows = selectedEntries.map(entry => [
      entry.name,
      new Date(entry.savedAt).toLocaleString('id-ID'),
      entry.market || 'ID',
      getGroupLabel(entry),
      getRuleSummaryText(entry.rules, entry.logicOperator),
      entry.logicOperator || 'AND',
      entry.winCriteriaLabel || entry.winCriteria,
      entry.startDate,
      entry.endDate,
      entry.symbolsCount ?? '',
      entry.samplesEvaluated ?? '',
      entry.totalTrades ?? '',
      entry.wins ?? '',
      entry.losses ?? '',
      entry.breakeven ?? '',
      Number(entry.winRate?.toFixed?.(2) ?? entry.winRate ?? 0),
      Number(entry.expectancy?.toFixed?.(4) ?? entry.expectancy ?? 0),
      Number(entry.avgReturnPerTrade?.toFixed?.(4) ?? entry.avgReturnPerTrade ?? 0),
      Number(entry.avgWin?.toFixed?.(4) ?? entry.avgWin ?? 0),
      Number(entry.avgLossAbs?.toFixed?.(4) ?? entry.avgLossAbs ?? 0),
      Number(entry.grossProfit?.toFixed?.(4) ?? entry.grossProfit ?? 0),
      Number(entry.grossLossAbs?.toFixed?.(4) ?? entry.grossLossAbs ?? 0),
      Number.isFinite(entry.profitFactor) ? Number(entry.profitFactor.toFixed(4)) : 'Infinity',
      Number(entry.maxDrawdown?.toFixed?.(4) ?? entry.maxDrawdown ?? 0),
      Number(entry.totalReturn?.toFixed?.(4) ?? entry.totalReturn ?? 0),
      entry.favorite ? 'Ya' : 'Tidak',
    ])

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]),
      'History Summary'
    )

    const rulesRows = selectedEntries.flatMap(entry => (
      (entry.rules || []).map((rule, index) => ([
        entry.name,
        getGroupLabel(entry),
        index + 1,
        ALL_FEATURES[rule.leftFeature]?.label || rule.leftFeature,
        rule.operator,
        rule.compareType === 'constant'
          ? 'Nilai Konstan'
          : (ALL_FEATURES[rule.rightFeature]?.label || rule.rightFeature),
        rule.compareType === 'constant' ? rule.rightValue : '',
      ]))
    ))

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['Nama', 'Kelompok', 'Rule #', 'Left Feature', 'Operator', 'Pembanding', 'Nilai'],
        ...rulesRows,
      ]),
      'Rules'
    )

    const tradeSnapshotRows = selectedEntries.flatMap(entry => ([
      ...(entry.bestTrades || []).map((trade, index) => ([
        entry.name,
        'Best',
        index + 1,
        trade.symbol || '',
        (trade.signalDate || trade.date || '').split('T')[0],
        trade.outcomeDate ? String(trade.outcomeDate).split('T')[0] : '',
        Number(trade.outcomePercent?.toFixed?.(4) ?? trade.outcomePercent ?? 0),
        trade.status || '',
      ])),
      ...(entry.worstTrades || []).map((trade, index) => ([
        entry.name,
        'Worst',
        index + 1,
        trade.symbol || '',
        (trade.signalDate || trade.date || '').split('T')[0],
        trade.outcomeDate ? String(trade.outcomeDate).split('T')[0] : '',
        Number(trade.outcomePercent?.toFixed?.(4) ?? trade.outcomePercent ?? 0),
        trade.status || '',
      ])),
    ]))

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['Nama', 'Kategori', 'Rank', 'Symbol', 'Tanggal Sinyal', 'Tanggal Outcome', 'Outcome (%)', 'Status'],
        ...tradeSnapshotRows,
      ]),
      'Trade Snapshots'
    )

    const filename = `backtest_history_selected_${selectedEntries.length}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
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
      
      const horizonDays = 1

      console.log(`[RuleScreener] User selected: ${targetDate}`)
      console.log('[RuleScreener] Confirmation day: H+1')
      
      for (let i = 0; i < stocks.length; i++) {
        const symbol = stocks[i]
        setScannedCount(i + 1)
        
        try {
          const response = await stockApi.getLiveIndicators(symbol, targetDate, false, 1, market, horizonDays)
          
          console.log(`[RuleScreener] ${symbol} response:`, response)
          
          // API returns data in response.data
          if (response?.data) {
            const latestData = response.data
            
            // indicatorDate = tanggal indikator dihitung (targetDate / H)
            // actualData = harga tanggal screening (H)
            // futureData = harga konfirmasi hari berikutnya (H+1)
            const screeningDayOHLCV = {
              open: latestData.actualData?.open ?? latestData.prevOpen,
              high: latestData.actualData?.high ?? latestData.prevHigh,
              low: latestData.actualData?.low ?? latestData.prevLow,
              close: latestData.actualData?.close ?? latestData.prevClose,
            }
            const screeningGapOpenPercent = Number(latestData.prevClose)
              ? (((Number(screeningDayOHLCV.open) || 0) - Number(latestData.prevClose)) / Number(latestData.prevClose)) * 100
              : null
            
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

            // Confirmation data for next trading day (H+1)
            let nextDayData = null
            if (isPastDate && latestData.futureData) {
              const baseClose = screeningDayOHLCV.close
              nextDayData = {
                date: latestData.futureData.date || targetDate,
                close: latestData.futureData.close,
                open: latestData.futureData.open,
                high: latestData.futureData.high,
                low: latestData.futureData.low,
                change: baseClose ? ((latestData.futureData.close - baseClose) / baseClose * 100) : null
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
              screeningGapOpenPercent,
              // Tanggal harga konfirmasi (H+1)
              nextDayData,
              actuallyUp: nextDayData ? nextDayData.change > 0 : null,
              horizonDays,
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

  const displayedBacktestTrades = useMemo(() => {
    if (!backtestResult?.trades) return []
    return showAllBacktestTrades ? backtestResult.trades : backtestResult.trades.slice(0, 100)
  }, [backtestResult, showAllBacktestTrades])

  const allResultsWithCriteria = useMemo(() => {
    return allResults.map(result => {
      if (!result.nextDayData && result.screeningGapOpenPercent == null) return result
      let actuallyUp
      let outcomeDisplayPct
      const prevClose = result.ohlcv?.close || result.data?.prevClose
      if (screenerWinCriteria === 'gapup_open_prevclose') {
        if (result.nextDayData) {
          const nextOpen = result.nextDayData.open
          if (prevClose != null && nextOpen != null && prevClose > 0) {
            const gapPct = ((nextOpen - prevClose) / prevClose) * 100
            actuallyUp = gapPct > 0
            outcomeDisplayPct = gapPct
          } else {
            // fallback: not enough data
            actuallyUp = null
            outcomeDisplayPct = null
          }
        } else if (result.screeningGapOpenPercent != null) {
          const gapPct = result.screeningGapOpenPercent
          actuallyUp = gapPct > 0
          outcomeDisplayPct = gapPct
        } else {
          // fallback: not enough data
          actuallyUp = null
          outcomeDisplayPct = null
        }
      } else {
        if (result.nextDayData) {
          actuallyUp = result.nextDayData.change > 0
          outcomeDisplayPct = result.nextDayData.change
        } else {
          actuallyUp = null
          outcomeDisplayPct = null
        }
      }
      return { ...result, actuallyUp, outcomeDisplayPct }
    })
  }, [allResults, screenerWinCriteria])

  const passedWithCriteria = useMemo(() => allResultsWithCriteria.filter(r => r.passed), [allResultsWithCriteria])

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
        <div className="bg-gray-800 rounded-lg p-4 w-[95vw] max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
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
          <h3 className="text-lg font-semibold text-white mb-3">
            {isUS ? '🇺🇸 Select US Stocks' : '🇮🇩 Pilih Saham IDX'}
          </h3>
          
          {/* Main selection options */}
          <div className="flex flex-wrap gap-2 mb-3">
            {isUS ? (
              <>
                <button
                  onClick={() => setStockList('all')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    stockList !== 'custom'
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🇺🇸 Popular US ({US_POPULAR_STOCKS.length})
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
              </>
            ) : (
              <>
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
              </>
            )}
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Pilih Range Harga:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPriceRanges(['micro','penny','cheap','low','medium','mid','high','premium','elite','ultra'])}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >Pilih Semua</button>
                  <button
                    onClick={() => setSelectedPriceRanges([])}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >Reset</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'micro',   label: '🔹 < 50' },
                  { key: 'penny',   label: '💰 50–100' },
                  { key: 'cheap',   label: '💵 100–200' },
                  { key: 'low',     label: '📊 200–500' },
                  { key: 'medium',  label: '📈 500–1K' },
                  { key: 'mid',     label: '💹 1K–2K' },
                  { key: 'high',    label: '🏦 2K–5K' },
                  { key: 'premium', label: '💎 5K–10K' },
                  { key: 'elite',   label: '👑 10K–50K' },
                  { key: 'ultra',   label: '🚀 >50K' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPriceRanges(prev =>
                      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
                    )}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPriceRanges.includes(key)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >{label}</button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {selectedPriceRanges.length === 0
                  ? `Tidak ada range dipilih (semua ${Object.keys(STOCK_PRICES).filter(c => STOCK_PRICES[c] > 0).length} saham)`
                  : `${getSelectedStocks().length} saham dari ${selectedPriceRanges.length} range dipilih`}
              </div>
            </div>
          )}

          {/* Custom input */}
          {stockList === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                placeholder={isUS ? "Enter ticker symbols, comma separated (e.g. AAPL, MSFT, NVDA)" : "Masukkan kode saham, pisahkan dengan koma (contoh: BBCA, BBRI, TLKM)"}
                value={customStocks}
                onChange={(e) => setCustomStocks(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
              <div className="mt-2 text-xs text-gray-500">
                {getSelectedStocks().length} {isUS ? 'stocks' : 'saham'} akan di-scan
              </div>
            </div>
          )}

          {/* Show selected count for index-based selections */}
          {(isUS ? stockList !== 'custom' : ['lq45', 'idx30', 'all'].includes(stockList)) && (
            <div className="mt-2 text-xs text-gray-500">
              {getSelectedStocks().length} saham akan di-scan
            </div>
          )}
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-white">🔧 Rules Builder</h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
              className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Add Rule
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
            >
              <FiSave className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={exportRules}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <label className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm cursor-pointer">
              <FiUpload className="w-4 h-4" />
              Import
              <input type="file" accept=".json" onChange={importRules} className="hidden" />
            </label>
          </div>
        </div>

        {/* Rules list */}
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={rule.id} className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2 sm:mb-0">
                <span className="text-gray-400 text-xs sm:hidden">Rule {index + 1}</span>
                <div className="flex items-center gap-1 sm:hidden">
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
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[32px_minmax(0,1fr)_90px_120px_minmax(0,1fr)_88px] gap-2 items-center">
              {/* Rule number */}
              <span className="hidden sm:inline text-gray-500 text-sm w-6">{index + 1}.</span>

              {/* Left feature */}
              <button
                onClick={() => setShowFeatureSelector({ ruleId: rule.id, side: 'left' })}
                className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-left"
              >
                <span className="text-white">{ALL_FEATURES[rule.leftFeature]?.label || rule.leftFeature}</span>
              </button>

              {/* Operator */}
              <select
                value={rule.operator}
                onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white font-mono"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              {/* Compare type */}
              <select
                value={rule.compareType}
                onChange={(e) => updateRule(rule.id, 'compareType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-gray-300 text-sm"
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
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                />
              ) : (
                <button
                  onClick={() => setShowFeatureSelector({ ruleId: rule.id, side: 'right' })}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-left"
                >
                  <span className="text-white">{ALL_FEATURES[rule.rightFeature]?.label || rule.rightFeature || 'Pilih...'}</span>
                </button>
              )}

              {/* Actions */}
              <div className="hidden sm:flex items-center gap-1">
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
              </div>

              {/* Logic connector (except last) */}
              </div>

              {index < rules.length - 1 && (
                <div className="mt-2 pl-1">
                  <span className="inline-flex text-xs sm:text-sm text-blue-400 font-medium px-2 py-0.5 rounded bg-blue-500/10">
                    {logicOperator}
                  </span>
                </div>
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
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">📈 Backtest Rule Screener</h3>
            <p className="text-sm text-gray-400 mt-1">
              Jalankan rule ke data historis untuk mengukur edge: win rate, expectancy, max drawdown, profit factor.
            </p>
          </div>
          <button
            onClick={runBacktest}
            disabled={backtestLoading || rules.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              backtestLoading || rules.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {backtestLoading ? 'Menjalankan Backtest...' : 'Run Backtest'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mulai</label>
            <input
              type="date"
              value={backtestStartDate}
              onChange={(e) => setBacktestStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Selesai</label>
            <input
              type="date"
              value={backtestEndDate}
              onChange={(e) => setBacktestEndDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Horizon Konfirmasi</label>
            <input
              type="number"
              min="1"
              step="1"
              value={1}
              disabled
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 text-gray-300 cursor-not-allowed"
            />
          </div>
          <div className="flex items-end">
            <p className="text-xs text-gray-400">
              Rule selalu dievaluasi pada tanggal sinyal H, lalu konfirmasi win selalu memakai data hari berikutnya, yaitu H+1.
            </p>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm text-gray-400 mb-1">Definisi Win</label>
          <select
            value={backtestWinCriteria}
            onChange={(e) => setBacktestWinCriteria(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
          >
            {Object.entries(BACKTEST_WIN_CRITERIA).map(([value, cfg]) => (
              <option key={value} value={value}>
                {value === 'return_h1_positive' ? getWinCriteriaDisplay(value, returnHorizonDays).label : cfg.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Pilih kriteria menang untuk mengecek hari setelah sinyal: close H+1 lebih tinggi dari close H, atau open H+1 gap-up terhadap close H.
          </p>
        </div>

        {backtestError && (
          <div className="mt-3 bg-red-900/40 border border-red-500/40 rounded-lg p-3 text-red-300 text-sm">
            {backtestError}
          </div>
        )}

        {backtestResult && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400">Win Rate</div>
                <div className="text-xl font-bold text-green-400">{backtestResult.winRate.toFixed(2)}%</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400">Expectancy</div>
                <div className={`text-xl font-bold ${backtestResult.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {backtestResult.expectancy >= 0 ? '+' : ''}{backtestResult.expectancy.toFixed(3)}%
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400">Profit Factor</div>
                <div className="text-xl font-bold text-blue-400">
                  {Number.isFinite(backtestResult.profitFactor) ? backtestResult.profitFactor.toFixed(2) : '∞'}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400">Max Drawdown</div>
                <div className="text-xl font-bold text-orange-400">{backtestResult.maxDrawdown.toFixed(2)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400">Trades</div>
                <div className="text-lg font-semibold text-white">{backtestResult.totalTrades}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400">Avg Return / Trade</div>
                <div className={`text-lg font-semibold ${backtestResult.avgReturnPerTrade >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {backtestResult.avgReturnPerTrade >= 0 ? '+' : ''}{backtestResult.avgReturnPerTrade.toFixed(3)}%
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400">Total Return</div>
                <div className={`text-lg font-semibold ${backtestResult.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {backtestResult.totalReturn >= 0 ? '+' : ''}{backtestResult.totalReturn.toFixed(2)}%
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400">Data Coverage</div>
                <div className="text-lg font-semibold text-white">{backtestResult.samplesEvaluated} sampel</div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm">
              <p className="text-blue-300">
                <strong>Arti Trades {backtestResult.totalTrades}:</strong> ada {backtestResult.totalTrades} kejadian saat rule Anda <strong>lolos</strong> pada tanggal sinyal.
                Setiap kejadian lalu dicek metrik <strong>{backtestResult.winCriteriaMetricLong || BACKTEST_WIN_CRITERIA[backtestResult.winCriteria]?.metricLong || BACKTEST_WIN_CRITERIA.return_h1_positive.metricLong}</strong> untuk menentukan win/loss.
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Jadi ini bukan jumlah saham unik, tetapi jumlah event sinyal yang lolos sepanjang periode backtest.
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2">
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 text-sm min-w-[220px]">
                  <div className="text-xs text-gray-300 mb-2">Kelompok saat menyimpan</div>
                  <div className="flex flex-wrap gap-1.5">
                    {backtestGroups.length === 0 && (
                      <span className="text-xs text-gray-400">Belum ada kelompok</span>
                    )}
                    {backtestGroups.map(group => {
                      const active = selectedSaveGroups.includes(group)
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => toggleSaveGroupSelection(group)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            active
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {group}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {selectedSaveGroups.length > 0 ? `Dipilih: ${selectedSaveGroups.join(', ')}` : 'Tanpa Kelompok'}
                  </div>
                  {selectedSaveGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSaveGroups}
                      className="mt-2 text-xs text-red-300 hover:text-red-200"
                    >
                      Reset kelompok terpilih
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBacktestGroupName}
                    onChange={(e) => setNewBacktestGroupName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addBacktestGroup() }}
                    placeholder="Tambah kelompok baru"
                    className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 text-sm min-w-[180px]"
                  />
                  <button
                    onClick={addBacktestGroup}
                    className="px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm"
                  >
                    Tambah
                  </button>
                </div>
              </div>
              <button
                onClick={saveBacktestToHistory}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium"
              >
                <FiSave className="w-4 h-4" />
                Simpan ke Histori
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-green-400 mb-2">Top 5 Trade</h4>
                <div className="space-y-1">
                  {backtestResult.bestTrades.length === 0 && <div className="text-xs text-gray-400">Belum ada trade lolos rule</div>}
                  {backtestResult.bestTrades.map((t, i) => (
                    <div key={`${t.symbol}-${t.date}-${i}`} className="flex justify-between text-sm">
                      <span className="text-gray-200">{t.symbol} • {(t.signalDate || t.date)?.split('T')[0]}</span>
                      <span className="text-green-400 font-medium">
                        {t.outcomePercent >= 0 ? '+' : ''}{t.outcomePercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-red-400 mb-2">Worst 5 Trade</h4>
                <div className="space-y-1">
                  {backtestResult.worstTrades.length === 0 && <div className="text-xs text-gray-400">Belum ada trade lolos rule</div>}
                  {backtestResult.worstTrades.map((t, i) => (
                    <div key={`${t.symbol}-${t.date}-${i}`} className="flex justify-between text-sm">
                      <span className="text-gray-200">{t.symbol} • {(t.signalDate || t.date)?.split('T')[0]}</span>
                      <span className="text-red-400 font-medium">{t.outcomePercent.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h4 className="text-sm font-semibold text-white">
                  📋 Detail Trades (Sinyal -&gt; {backtestResult.winCriteriaMetricShort || BACKTEST_WIN_CRITERIA[backtestResult.winCriteria]?.metricShort || BACKTEST_WIN_CRITERIA.return_h1_positive.metricShort})
                </h4>
                <div className="flex items-center gap-2">
                  {backtestResult.trades.length > 100 && (
                    <button
                      onClick={() => setShowAllBacktestTrades((v) => !v)}
                      className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                    >
                      {showAllBacktestTrades ? 'Tampilkan 100 pertama' : `Tampilkan semua (${backtestResult.trades.length})`}
                    </button>
                  )}
                  <button
                    onClick={downloadBacktestExcel}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white font-medium"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    Download Excel
                  </button>
                  <button
                    onClick={downloadTradeIndicatorsCSV}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium"
                    title="Download khusus dataset Trade Indicators dalam format CSV"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    Download CSV (Indicators)
                  </button>
                </div>
              </div>

              {backtestResult.trades.length === 0 ? (
                <div className="text-xs text-gray-400">Belum ada trade yang lolos rule pada periode ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">Symbol</th>
                        <th className="py-2 pr-3">Tanggal Sinyal</th>
                        <th className="py-2 pr-3">Rule Lolos</th>
                        <th className="py-2 pr-3">{backtestResult.winCriteriaMetricShort || BACKTEST_WIN_CRITERIA[backtestResult.winCriteria]?.metricShort || BACKTEST_WIN_CRITERIA.return_h1_positive.metricShort}</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedBacktestTrades.map((t, i) => (
                        <tr key={`${t.symbol}-${t.date}-${i}`} className="border-b border-gray-800/70">
                          <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                          <td className="py-2 pr-3 text-white font-medium">{t.symbol}</td>
                          <td className="py-2 pr-3 text-gray-300">{(t.signalDate || t.date)?.split('T')[0] || '-'}</td>
                          <td className="py-2 pr-3 text-gray-300">{t.passedCount}/{rules.length}</td>
                          <td className={`py-2 pr-3 font-medium ${t.outcomePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {t.outcomePercent >= 0 ? '+' : ''}{t.outcomePercent.toFixed(2)}%
                          </td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              t.isWin
                                ? 'bg-green-500/20 text-green-300'
                                : t.isLoss
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {t.isWin ? 'Win' : t.isLoss ? 'Loss' : 'BE'}
                            </span>
                          </td>
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

      {/* Backtest History Panel */}
      {(backtestHistory.length > 0 || backtestGroups.length > 0) && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <button
            onClick={() => setShowBacktestHistory(v => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-purple-400">📚 Histori Backtest</span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">{backtestHistory.length} tersimpan</span>
              {backtestHistory.some(h => h.favorite) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFavoritesOnly(v => !v) }}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
                    showFavoritesOnly ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' : 'bg-gray-700 text-gray-400 hover:text-yellow-300'
                  }`}
                >
                  <FiStar className="w-3 h-3" />
                  {showFavoritesOnly ? 'Semua' : 'Favorit'}
                </button>
              )}
              {backtestGroups.length > 0 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-wrap items-center gap-1"
                  title="Filter histori berdasarkan satu atau lebih kelompok"
                >
                  <button
                    type="button"
                    onClick={clearHistoryGroupFilter}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      selectedHistoryGroupFilter.length === 0
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-200'
                    }`}
                  >
                    Semua Kelompok
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHistoryGroupFilter(UNGROUPED_FILTER)}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      selectedHistoryGroupFilter.includes(UNGROUPED_FILTER)
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-200'
                    }`}
                  >
                    Tanpa Kelompok
                  </button>
                  {backtestGroups.map(group => {
                    const active = selectedHistoryGroupFilter.includes(group)
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => toggleHistoryGroupFilter(group)}
                        className={`text-xs px-2 py-0.5 rounded border ${
                          active
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-200'
                        }`}
                      >
                        {group}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {showBacktestHistory ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {showBacktestHistory && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-4">
              <div className="bg-gray-900/40 rounded-lg border border-gray-700 p-3">
                <div className="text-xs text-gray-300 mb-2">Kelompok Backtest</div>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="text"
                    value={newBacktestGroupName}
                    onChange={(e) => setNewBacktestGroupName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addBacktestGroup() }}
                    placeholder="Contoh: Scalping, Swing, Gap Up"
                    className="flex-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-gray-100 text-sm"
                  />
                  <button
                    onClick={addBacktestGroup}
                    className="px-3 py-2 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-sm"
                  >
                    Tambah Kelompok
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">Tanpa Kelompok</span>
                  {backtestGroups.map(group => (
                    <span key={group} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {group}
                      <button
                        onClick={() => deleteBacktestGroup(group)}
                        className="text-red-300 hover:text-red-200"
                        title={`Hapus kelompok ${group}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {visibleHistoryEntries.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-900/40 rounded-lg border border-gray-700 p-3">
                  <div className="text-xs text-gray-300">
                    {selectedVisibleHistoryCount} dari {visibleHistoryEntries.length} histori terlihat dipilih untuk export.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={toggleSelectAllVisibleHistory}
                      className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                    >
                      {selectedVisibleHistoryCount === visibleHistoryEntries.length ? 'Batal Pilih Semua' : 'Pilih Semua Terlihat'}
                    </button>
                    <button
                      onClick={() => setSelectedHistoryExportIds(new Set())}
                      className="text-xs px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"
                      disabled={selectedHistoryExportIds.size === 0}
                    >
                      Reset Pilihan
                    </button>
                    <button
                      onClick={exportSelectedHistoryExcel}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={selectedHistoryExportIds.size === 0}
                    >
                      <FiDownload className="w-3 h-3" />
                      Download Excel Terpilih
                    </button>
                  </div>
                </div>
              )}

              {visibleHistoryEntries.map(entry => (
                <div key={entry.id} className="bg-gray-900/60 rounded-lg border border-gray-700">
                  <button
                    onClick={() => setExpandedHistoryIds(prev => { const next = new Set(prev); next.has(entry.id) ? next.delete(entry.id) : next.add(entry.id); return next; })}
                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-700/40 rounded-lg text-left"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="checkbox"
                          checked={selectedHistoryExportIds.has(entry.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleHistoryExportSelection(entry.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-500 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                          title="Pilih histori ini untuk export Excel"
                        />
                        {entry.favorite && (
                          <FiStar className={`w-3.5 h-3.5 shrink-0 ${
                            entry.winCriteria === 'gapup_open_prevclose'
                              ? 'text-cyan-400 fill-cyan-400'
                              : 'text-yellow-400 fill-yellow-400'
                          }`} />
                        )}
                        <span className="text-white font-medium text-sm">{entry.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">{entry.market || 'ID'}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          Kelompok: {getGroupLabel(entry)}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          entry.winCriteria === 'gapup_open_prevclose'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {entry.winCriteriaLabel || (entry.winCriteria === 'gapup_open_prevclose' ? 'Gap Open' : 'Return H+1')}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(entry.savedAt).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className={entry.winRate >= 50 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>WR {entry.winRate.toFixed(1)}%</span>
                        <span className={entry.expectancy >= 0 ? 'text-green-300' : 'text-red-300'}>Exp {entry.expectancy >= 0 ? '+' : ''}{entry.expectancy.toFixed(3)}%</span>
                        <span className="text-blue-300">PF {Number.isFinite(entry.profitFactor) ? entry.profitFactor.toFixed(2) : '∞'}</span>
                        <span className="text-orange-300">DD {entry.maxDrawdown.toFixed(1)}%</span>
                        <span className="text-gray-400">{entry.totalTrades} trades</span>
                        <span className="text-gray-400">{entry.samplesEvaluated?.toLocaleString()} sampel</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {(entry.rules || []).map((r, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-700/80 text-gray-300">
                            {ALL_FEATURES[r.leftFeature]?.label || r.leftFeature} {r.operator} {r.compareType === 'constant' ? r.rightValue : (ALL_FEATURES[r.rightFeature]?.label || r.rightFeature)}
                          </span>
                        ))}
                        {entry.rules?.length > 1 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-500">{entry.logicOperator}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-wrap justify-end gap-1 max-w-[260px]"
                        title="Pilih satu atau lebih kelompok"
                      >
                        {backtestGroups.map(group => {
                          const active = normalizeGroups(entry).includes(group)
                          return (
                            <button
                              key={group}
                              type="button"
                              onClick={() => updateHistoryEntryGroups(entry.id, group)}
                              className={`text-xs px-2 py-1 rounded border ${
                                active
                                  ? 'bg-indigo-600 border-indigo-400 text-white'
                                  : 'bg-gray-700 border-gray-600 text-gray-200'
                              }`}
                            >
                              {group}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleHistoryFavorite(entry.id)
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          entry.favorite
                            ? entry.winCriteria === 'gapup_open_prevclose'
                              ? 'text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30'
                              : 'text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30'
                            : 'text-gray-600 hover:text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                        title={entry.favorite ? 'Hapus dari favorit' : 'Tandai favorit'}
                      >
                        <FiStar className={`w-4 h-4 ${
                          entry.favorite
                            ? entry.winCriteria === 'gapup_open_prevclose' ? 'fill-cyan-400' : 'fill-yellow-400'
                            : ''
                        }`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteHistoryEntry(entry.id)
                        }}
                        className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-700/60 text-red-400"
                      >
                        Hapus
                      </button>
                      {expandedHistoryIds.has(entry.id) ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {expandedHistoryIds.has(entry.id) && (
                    <div className="px-3 pb-3 border-t border-gray-700/70 pt-3 space-y-3">
                      {/* Rules */}
                      <div>
                        <div className="text-xs text-gray-400 mb-1.5 font-semibold">Rules ({entry.logicOperator})</div>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.rules.map((r, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-200">
                              {ALL_FEATURES[r.leftFeature]?.label || r.leftFeature} {r.operator} {r.compareType === 'constant' ? r.rightValue : (ALL_FEATURES[r.rightFeature]?.label || r.rightFeature)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Config */}
                      <div className="text-xs text-gray-400">
                        Kriteria: <span className="text-gray-200">{entry.winCriteriaLabel}</span>
                        &nbsp;•&nbsp; Kelompok: <span className="text-gray-200">{getGroupLabel(entry)}</span>
                        &nbsp;•&nbsp; Periode: <span className="text-gray-200">{entry.startDate} ~ {entry.endDate}</span>
                        &nbsp;•&nbsp; Saham: <span className="text-gray-200">{entry.symbolsCount}</span>
                        &nbsp;•&nbsp; Sampel: <span className="text-gray-200">{entry.samplesEvaluated?.toLocaleString()}</span>
                      </div>
                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Win Rate', value: `${entry.winRate.toFixed(2)}%`, color: entry.winRate >= 50 ? 'text-green-400' : 'text-red-400' },
                          { label: 'Expectancy', value: `${entry.expectancy >= 0 ? '+' : ''}${entry.expectancy.toFixed(3)}%`, color: entry.expectancy >= 0 ? 'text-green-400' : 'text-red-400' },
                          { label: 'Profit Factor', value: Number.isFinite(entry.profitFactor) ? entry.profitFactor.toFixed(2) : '∞', color: 'text-blue-400' },
                          { label: 'Max Drawdown', value: `${entry.maxDrawdown.toFixed(2)}%`, color: 'text-orange-400' },
                          { label: 'Total Trades', value: entry.totalTrades, color: 'text-white' },
                          { label: 'Win/Loss/BE', value: `${entry.wins}/${entry.losses}/${entry.breakeven}`, color: 'text-gray-200' },
                          { label: 'Avg Return/Trade', value: `${entry.avgReturnPerTrade >= 0 ? '+' : ''}${entry.avgReturnPerTrade.toFixed(3)}%`, color: entry.avgReturnPerTrade >= 0 ? 'text-green-400' : 'text-red-400' },
                          { label: 'Avg Win / Avg Loss', value: `${entry.avgWin.toFixed(2)}% / ${entry.avgLossAbs.toFixed(2)}%`, color: 'text-gray-200' },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-800 rounded p-2">
                            <div className="text-xs text-gray-500">{s.label}</div>
                            <div className={`text-sm font-semibold ${s.color}`}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      {/* Best/Worst trades */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="bg-green-900/20 border border-green-500/20 rounded p-2">
                          <div className="text-xs text-green-400 font-semibold mb-1">Top 5 Trade</div>
                          {(entry.bestTrades || []).map((t, i) => (
                            <div key={i} className="flex justify-between text-xs text-gray-300">
                              <span>{t.symbol} • {(t.signalDate || t.date)?.split('T')[0]}</span>
                              <span className="text-green-400">+{t.outcomePercent.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-red-900/20 border border-red-500/20 rounded p-2">
                          <div className="text-xs text-red-400 font-semibold mb-1">Worst 5 Trade</div>
                          {(entry.worstTrades || []).map((t, i) => (
                            <div key={i} className="flex justify-between text-xs text-gray-300">
                              <span>{t.symbol} • {(t.signalDate || t.date)?.split('T')[0]}</span>
                              <span className="text-red-400">{t.outcomePercent.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Load rules back button */}
                      <button
                        onClick={() => {
                          const rulesWithIds = entry.rules.map((r, i) => ({ ...r, id: i + 1 }))
                          setRules(rulesWithIds)
                          setNextRuleId(rulesWithIds.length + 1)
                          setLogicOperator(entry.logicOperator || 'AND')
                          setBacktestWinCriteria(entry.winCriteria)
                          setBacktestStartDate(entry.startDate)
                          setBacktestEndDate(entry.endDate)
                        }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-white"
                      >
                        <FiUpload className="w-3 h-3" />
                        Load Rules dari Histori ini
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {backtestHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Hapus semua histori backtest?')) {
                      setBacktestHistory([])
                      setSelectedHistoryExportIds(new Set())
                      setSelectedHistoryGroupFilter([])
                      localStorage.removeItem('backtestHistory')
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-300 mt-1"
                >
                  Hapus Semua Histori
                </button>
              )}
              {visibleHistoryEntries.length === 0 && (
                <div className="text-xs text-gray-400">Tidak ada histori yang sesuai filter favorit/kelompok.</div>
              )}
            </div>
          )}
        </div>
      )}

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
            {allResults.some(r => r.nextDayData || r.screeningGapOpenPercent != null) && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {results.filter(r => r.actuallyUp).length}/{results.length}
                  </div>
                  <div className="text-xs text-gray-400">Lolos & Naik / Gap Up</div>
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
              {allResults.some(r => r.nextDayData || r.screeningGapOpenPercent != null) && (
                <div className="flex items-start gap-2 p-2 bg-green-900/30 rounded">
                  <span className="text-green-400 font-semibold whitespace-nowrap">📈 Tanggal Konfirmasi:</span>
                  <span className="text-gray-300">
                    <strong className="text-green-300">{allResults.find(r => r.nextDayData)?.nextDayData?.date || targetDate}</strong> — 
                    {allResults.some(r => r.nextDayData)
                      ? 'Harga besok untuk validasi apakah rule berhasil'
                      : 'Harga pada tanggal screening untuk cek gap-up realtime'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-white">
              📊 Hasil Screening
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              {allResults.some(r => r.nextDayData || r.screeningGapOpenPercent != null) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">Kriteria:</span>
                  <select
                    value={screenerWinCriteria}
                    onChange={(e) => setScreenerWinCriteria(e.target.value)}
                    className="text-xs px-2 py-1.5 bg-gray-700 rounded border border-gray-600 text-white"
                  >
                    {Object.entries(BACKTEST_WIN_CRITERIA).map(([value, cfg]) => (
                      <option key={value} value={value}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              )}
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
            {(showAllResults ? allResultsWithCriteria : passedWithCriteria).map((result) => (
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
                        📊 {isUS ? '$' : 'Rp '}{isUS 
                          ? (result.ohlcv?.close || result.data?.prevClose)?.toFixed(2)
                          : (result.ohlcv?.close || result.data?.prevClose)?.toLocaleString('id-ID')}
                      </span>
                    )}
                    {/* Confirmation / Gap preview */}
                    {(result.nextDayData && result.outcomeDisplayPct != null) || (result.nextDayData == null && result.screeningGapOpenPercent != null) ? (
                      <span className={`px-2 py-0.5 rounded text-sm ${
                        result.actuallyUp
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`} title={
                        screenerWinCriteria === 'gapup_open_prevclose'
                          ? `Gap Open vs PrevClose ke tanggal ${result.nextDayData?.date || result.screeningDate}`
                          : `Return ke tanggal ${result.nextDayData?.date || result.screeningDate}`
                      }>
                        {screenerWinCriteria === 'gapup_open_prevclose' ? '🚀' : '📈'} {' '}
                        {(result.outcomeDisplayPct ?? result.screeningGapOpenPercent) >= 0 ? '+' : ''}
                        {(result.outcomeDisplayPct ?? result.screeningGapOpenPercent)?.toFixed(2)}%
                      </span>
                    ) : null}
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
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm mt-2 pt-2 border-t border-yellow-500/20">
                        <div>
                          <div className="text-gray-400 text-xs">Open</div>
                          <div className="text-white">{isUS ? '$' : 'Rp '}{isUS ? result.ohlcv.open?.toFixed(2) : result.ohlcv.open?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">High</div>
                          <div className="text-white">{isUS ? '$' : 'Rp '}{isUS ? result.ohlcv.high?.toFixed(2) : result.ohlcv.high?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Low</div>
                          <div className="text-white">{isUS ? '$' : 'Rp '}{isUS ? result.ohlcv.low?.toFixed(2) : result.ohlcv.low?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Close (Basis)</div>
                          <div className="text-yellow-400 font-semibold">{isUS ? '$' : 'Rp '}{isUS ? result.ohlcv.close?.toFixed(2) : result.ohlcv.close?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Prev Close</div>
                          <div className="text-white">{isUS ? '$' : 'Rp '}{isUS ? result.data?.prevClose?.toFixed(2) : result.data?.prevClose?.toLocaleString('id-ID') || '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Gap Open</div>
                          <div className={`${(result.screeningGapOpenPercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'} font-semibold`}>
                            {(result.screeningGapOpenPercent ?? 0) >= 0 ? '+' : ''}{(result.screeningGapOpenPercent ?? 0).toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Indicator Date</div>
                          <div className="text-white">{result.indicatorDate || targetDate}</div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Indicator Snapshot */}
                    <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                      <h4 className="text-sm font-semibold text-white mb-2">📑 Snapshot Indikator</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {[
                          ['rsi', 'RSI'],
                          ['macdHistogram', 'MACD Hist'],
                          ['adx', 'ADX'],
                          ['volumeRatio', 'Volume Ratio'],
                          ['closePosition', 'Close Position'],
                          ['roc', 'ROC'],
                          ['stochK', 'Stoch %K'],
                          ['mfi', 'MFI'],
                        ].map(([key, label]) => (
                          <div key={key}>
                            <div className="text-gray-400 text-xs">{label}</div>
                            <div className="text-white font-medium">
                              {result.data?.[key] !== undefined && result.data?.[key] !== null
                                ? typeof result.data[key] === 'number'
                                  ? result.data[key].toFixed(2)
                                  : result.data[key]
                                : 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

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
                          Perubahan dihitung dari Close H ({isUS ? '$' : 'Rp '}{isUS ? result.ohlcv?.close?.toFixed(2) : result.ohlcv?.close?.toLocaleString('id-ID') || 'N/A'}) ke Close H+1.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div>
                            <div className="text-gray-400 text-xs">Open</div>
                            <div className="text-white">{isUS ? '$' : 'Rp '}{isUS ? result.nextDayData.open?.toFixed(2) : result.nextDayData.open?.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">High</div>
                            <div className="text-white">{isUS ? '$' : 'Rp '}{isUS ? result.nextDayData.high?.toFixed(2) : result.nextDayData.high?.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">Low</div>
                            <div className="text-white">{isUS ? '$' : 'Rp '}{isUS ? result.nextDayData.low?.toFixed(2) : result.nextDayData.low?.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">Close</div>
                            <div className="text-white">{isUS ? '$' : 'Rp '}{isUS ? result.nextDayData.close?.toFixed(2) : result.nextDayData.close?.toLocaleString('id-ID')}</div>
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
