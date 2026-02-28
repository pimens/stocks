const {
  SMA, EMA, RSI, MACD, BollingerBands, Stochastic, ADX, ATR, OBV, VWAP
} = require('technicalindicators');

class IndicatorService {
  
  /**
   * Resample daily OHLCV data to higher timeframe
   * @param {Array} prices - Array of daily OHLCV data
   * @param {number} timeframe - Number of days to aggregate (1=daily, 3=3-day, 5=weekly, etc.)
   * @returns {Array} Resampled OHLCV data
   */
  resampleToTimeframe(prices, timeframe = 1) {
    if (timeframe <= 1) return prices;
    
    const resampled = [];
    
    for (let i = 0; i < prices.length; i += timeframe) {
      const chunk = prices.slice(i, Math.min(i + timeframe, prices.length));
      if (chunk.length === 0) continue;
      
      // Aggregate OHLCV for the timeframe period
      const aggregated = {
        date: chunk[chunk.length - 1].date, // Use last date in the period
        open: chunk[0].open, // First open
        high: Math.max(...chunk.map(p => p.high)), // Highest high
        low: Math.min(...chunk.map(p => p.low)), // Lowest low
        close: chunk[chunk.length - 1].close, // Last close
        volume: chunk.reduce((sum, p) => sum + (p.volume || 0), 0), // Sum of volumes
        // Keep original dates for reference
        startDate: chunk[0].date,
        endDate: chunk[chunk.length - 1].date,
        daysInPeriod: chunk.length
      };
      
      resampled.push(aggregated);
    }
    
    return resampled;
  }

  // Calculate Simple Moving Average
  calculateSMA(prices, period = 20) {
    const closes = prices.map(p => p.close);
    const values = SMA.calculate({ period, values: closes });
    
    // Pad with nulls for alignment
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate Exponential Moving Average
  calculateEMA(prices, period = 20) {
    const closes = prices.map(p => p.close);
    const values = EMA.calculate({ period, values: closes });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate EMA of High prices
  calculateEMAHigh(prices, period = 21) {
    const highs = prices.map(p => p.high);
    const values = EMA.calculate({ period, values: highs });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate EMA of Low prices
  calculateEMALow(prices, period = 21) {
    const lows = prices.map(p => p.low);
    const values = EMA.calculate({ period, values: lows });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate RSI (Relative Strength Index)
  calculateRSI(prices, period = 14) {
    const closes = prices.map(p => p.close);
    const values = RSI.calculate({ period, values: closes });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate MACD
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const closes = prices.map(p => p.close);
    const values = MACD.calculate({
      values: closes,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate Bollinger Bands
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const closes = prices.map(p => p.close);
    const values = BollingerBands.calculate({
      period,
      values: closes,
      stdDev
    });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate Stochastic
  calculateStochastic(prices, period = 14, signalPeriod = 3) {
    const values = Stochastic.calculate({
      high: prices.map(p => p.high),
      low: prices.map(p => p.low),
      close: prices.map(p => p.close),
      period,
      signalPeriod
    });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate ADX (Average Directional Index)
  calculateADX(prices, period = 14) {
    const values = ADX.calculate({
      high: prices.map(p => p.high),
      low: prices.map(p => p.low),
      close: prices.map(p => p.close),
      period
    });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate ATR (Average True Range)
  calculateATR(prices, period = 14) {
    const values = ATR.calculate({
      high: prices.map(p => p.high),
      low: prices.map(p => p.low),
      close: prices.map(p => p.close),
      period
    });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  // Calculate OBV (On Balance Volume) - Manual implementation for accuracy
  calculateOBV(prices) {
    if (prices.length === 0) return [];
    
    const results = [];
    let obv = 0;
    
    // First day - OBV starts at 0 or first day's volume
    results.push(0);
    
    // Calculate OBV for subsequent days
    for (let i = 1; i < prices.length; i++) {
      const currentClose = prices[i].close;
      const prevClose = prices[i - 1].close;
      const currentVolume = prices[i].volume || 0;
      
      if (currentClose > prevClose) {
        // Price up - add volume
        obv += currentVolume;
      } else if (currentClose < prevClose) {
        // Price down - subtract volume
        obv -= currentVolume;
      }
      // If price unchanged, OBV stays the same
      
      results.push(obv);
    }
    
    return results;
  }

  // Get all indicators for a stock
  calculateAllIndicators(prices) {
    const lastIndex = prices.length - 1;
    
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const rsi = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices);
    const bb = this.calculateBollingerBands(prices);
    const stoch = this.calculateStochastic(prices);
    const adx = this.calculateADX(prices);
    const atr = this.calculateATR(prices);
    const obv = this.calculateOBV(prices);

    return {
      current: {
        price: prices[lastIndex]?.close,
        sma20: sma20[lastIndex],
        sma50: sma50[lastIndex],
        ema12: ema12[lastIndex],
        ema26: ema26[lastIndex],
        rsi: rsi[lastIndex],
        macd: macd[lastIndex],
        bollingerBands: bb[lastIndex],
        stochastic: stoch[lastIndex],
        adx: adx[lastIndex],
        atr: atr[lastIndex],
        obv: obv[lastIndex]
      },
      series: {
        sma20,
        sma50,
        ema12,
        ema26,
        rsi,
        macd,
        bollingerBands: bb,
        stochastic: stoch,
        adx,
        atr,
        obv
      }
    };
  }

  // Screen stocks based on criteria
  screenStock(prices, indicators, criteria, fundamentals = {}) {
    const current = indicators.current;
    const results = {};

    // Price Action Filters
    if (criteria.priceGainToday && fundamentals.changePercent !== undefined) {
      results.priceGainToday = fundamentals.changePercent > 0;
    }
    if (criteria.priceDropToday && fundamentals.changePercent !== undefined) {
      results.priceDropToday = fundamentals.changePercent < 0;
    }
    if (criteria.highVolume && fundamentals.volume && fundamentals.avgVolume) {
      results.highVolume = fundamentals.volume > fundamentals.avgVolume;
    }
    if (criteria.nearHighs && fundamentals.price && fundamentals.fiftyTwoWeekHigh) {
      results.nearHighs = fundamentals.price > (fundamentals.fiftyTwoWeekHigh * 0.9);
    }
    if (criteria.nearLows && fundamentals.price && fundamentals.fiftyTwoWeekLow) {
      results.nearLows = fundamentals.price < (fundamentals.fiftyTwoWeekLow * 1.1);
    }

    // Fundamental Metrics
    if (criteria.lowPE && fundamentals.trailingPE) {
      results.lowPE = fundamentals.trailingPE < 15;
    }
    if (criteria.highPE && fundamentals.trailingPE) {
      results.highPE = fundamentals.trailingPE > 30;
    }
    if (criteria.lowPB && fundamentals.priceToBook) {
      results.lowPB = fundamentals.priceToBook < 2;
    }
    if (criteria.highDividend && fundamentals.dividendYield) {
      results.highDividend = (fundamentals.dividendYield * 100) > 3;
    }
    if (criteria.largeCap && fundamentals.marketCap) {
      results.largeCap = fundamentals.marketCap > 10000000000000; // > 10T
    }
    if (criteria.midCap && fundamentals.marketCap) {
      results.midCap = fundamentals.marketCap >= 1000000000000 && fundamentals.marketCap <= 10000000000000;
    }
    if (criteria.smallCap && fundamentals.marketCap) {
      results.smallCap = fundamentals.marketCap < 1000000000000; // < 1T
    }

    // Price Range Filters
    if (criteria.priceUnder500 && current.price) {
      results.priceUnder500 = current.price < 500;
    }
    if (criteria.price500to2000 && current.price) {
      results.price500to2000 = current.price >= 500 && current.price <= 2000;
    }
    if (criteria.price2000to5000 && current.price) {
      results.price2000to5000 = current.price >= 2000 && current.price <= 5000;
    }
    if (criteria.priceOver5000 && current.price) {
      results.priceOver5000 = current.price > 5000;
    }

    // RSI conditions
    if (criteria.rsiOversold && current.rsi) {
      results.rsiOversold = current.rsi < (criteria.rsiOversoldLevel || 30);
    }
    if (criteria.rsiOverbought && current.rsi) {
      results.rsiOverbought = current.rsi > (criteria.rsiOverboughtLevel || 70);
    }
    if (criteria.rsiNeutral && current.rsi) {
      results.rsiNeutral = current.rsi >= 30 && current.rsi <= 70;
    }

    // Moving Average conditions
    if (criteria.priceAboveSMA20 && current.sma20) {
      results.priceAboveSMA20 = current.price > current.sma20;
    }
    if (criteria.priceAboveSMA50 && current.sma50) {
      results.priceAboveSMA50 = current.price > current.sma50;
    }
    if (criteria.priceAboveSMA200 && fundamentals.twoHundredDayAverage) {
      results.priceAboveSMA200 = current.price > fundamentals.twoHundredDayAverage;
    }
    if (criteria.goldenCross && current.sma20 && current.sma50) {
      results.goldenCross = current.sma20 > current.sma50;
    }
    if (criteria.deathCross && current.sma20 && current.sma50) {
      results.deathCross = current.sma20 < current.sma50;
    }
    if (criteria.allMAUptrend && current.sma20 && current.sma50 && fundamentals.twoHundredDayAverage) {
      results.allMAUptrend = current.price > current.sma20 && current.sma20 > current.sma50 && current.sma50 > fundamentals.twoHundredDayAverage;
    }

    // MACD conditions
    if (criteria.macdBullish && current.macd) {
      results.macdBullish = current.macd.MACD > current.macd.signal;
    }
    if (criteria.macdBearish && current.macd) {
      results.macdBearish = current.macd.MACD < current.macd.signal;
    }
    if (criteria.macdCrossover && current.macd) {
      results.macdCrossover = Math.abs(current.macd.MACD - current.macd.signal) < 0.5 && current.macd.histogram > 0;
    }

    // Bollinger Bands conditions
    if (criteria.priceBelowLowerBB && current.bollingerBands) {
      results.priceBelowLowerBB = current.price < current.bollingerBands.lower;
    }
    if (criteria.priceAboveUpperBB && current.bollingerBands) {
      results.priceAboveUpperBB = current.price > current.bollingerBands.upper;
    }
    if (criteria.bbSqueeze && current.bollingerBands) {
      const bandWidth = (current.bollingerBands.upper - current.bollingerBands.lower) / current.bollingerBands.middle;
      results.bbSqueeze = bandWidth < 0.1; // Tight squeeze
    }

    // Stochastic conditions
    if (criteria.stochOversold && current.stochastic) {
      results.stochOversold = current.stochastic.k < 20;
    }
    if (criteria.stochOverbought && current.stochastic) {
      results.stochOverbought = current.stochastic.k > 80;
    }

    // Advanced Trend conditions
    if (criteria.strongTrend && current.adx) {
      results.strongTrend = current.adx.adx > 25;
    }
    if (criteria.breakoutPattern && current.atr && current.bollingerBands) {
      const recentATR = current.atr;
      const avgATR = indicators.series.atr.slice(-20).reduce((sum, val) => sum + (val || 0), 0) / 20;
      results.breakoutPattern = recentATR > avgATR * 1.5; // High volatility breakout
    }
    if (criteria.consolidation && current.atr) {
      const recentATR = current.atr;
      const avgATR = indicators.series.atr.slice(-20).reduce((sum, val) => sum + (val || 0), 0) / 20;
      results.consolidation = recentATR < avgATR * 0.7; // Low volatility consolidation
    }

    // Composite Signal Conditions
    if (criteria.bullishSetup) {
      const bullishCount = [
        current.rsi && current.rsi < 70,
        current.macd && current.macd.MACD > current.macd.signal,
        current.sma20 && current.sma50 && current.sma20 > current.sma50,
        current.price && current.sma20 && current.price > current.sma20,
        current.stochastic && current.stochastic.k > 20
      ].filter(Boolean).length;
      results.bullishSetup = bullishCount >= 4;
    }
    
    if (criteria.bearishSetup) {
      const bearishCount = [
        current.rsi && current.rsi > 30,
        current.macd && current.macd.MACD < current.macd.signal,
        current.sma20 && current.sma50 && current.sma20 < current.sma50,
        current.price && current.sma20 && current.price < current.sma20,
        current.stochastic && current.stochastic.k < 80
      ].filter(Boolean).length;
      results.bearishSetup = bearishCount >= 4;
    }

    if (criteria.momentumPlay && fundamentals.changePercent && fundamentals.volume && fundamentals.avgVolume) {
      results.momentumPlay = Math.abs(fundamentals.changePercent) > 2 && fundamentals.volume > fundamentals.avgVolume * 1.5;
    }

    if (criteria.valuePlay && fundamentals.trailingPE && fundamentals.priceToBook) {
      results.valuePlay = fundamentals.trailingPE < 15 && fundamentals.priceToBook < 2;
    }

    // Calculate overall score
    const conditionsMet = Object.values(results).filter(v => v === true).length;
    const totalConditions = Object.keys(results).length;
    const score = totalConditions > 0 ? (conditionsMet / totalConditions) * 100 : 0;

    return {
      results,
      conditionsMet,
      totalConditions,
      score
    };
  }

  // Calculate Williams %R
  calculateWilliamsR(prices, period = 14) {
    const results = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...slice.map(p => p.high));
      const lowestLow = Math.min(...slice.map(p => p.low));
      const close = prices[i].close;
      const wr = ((highestHigh - close) / (highestHigh - lowestLow)) * -100;
      results.push(wr);
    }
    const padded = Array(prices.length - results.length).fill(null).concat(results);
    return padded;
  }

  // Calculate CCI (Commodity Channel Index)
  calculateCCI(prices, period = 20) {
    const results = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const typicalPrices = slice.map(p => (p.high + p.low + p.close) / 3);
      const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
      const meanDeviation = typicalPrices.reduce((a, b) => a + Math.abs(b - sma), 0) / period;
      const cci = meanDeviation === 0 ? 0 : (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDeviation);
      results.push(cci);
    }
    const padded = Array(prices.length - results.length).fill(null).concat(results);
    return padded;
  }

  // Calculate MFI (Money Flow Index)
  calculateMFI(prices, period = 14) {
    const typicalPrices = prices.map(p => (p.high + p.low + p.close) / 3);
    const rawMoneyFlow = prices.map((p, i) => typicalPrices[i] * p.volume);
    
    const results = [];
    for (let i = period; i < prices.length; i++) {
      let positiveFlow = 0;
      let negativeFlow = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        if (typicalPrices[j] > typicalPrices[j - 1]) {
          positiveFlow += rawMoneyFlow[j];
        } else if (typicalPrices[j] < typicalPrices[j - 1]) {
          negativeFlow += rawMoneyFlow[j];
        }
      }
      
      const mfi = negativeFlow === 0 ? 100 : 100 - (100 / (1 + positiveFlow / negativeFlow));
      results.push(mfi);
    }
    
    const padded = Array(prices.length - results.length).fill(null).concat(results);
    return padded;
  }

  // Calculate ROC (Rate of Change)
  calculateROC(prices, period = 12) {
    const closes = prices.map(p => p.close);
    const results = [];
    for (let i = period; i < closes.length; i++) {
      const roc = ((closes[i] - closes[i - period]) / closes[i - period]) * 100;
      results.push(roc);
    }
    const padded = Array(prices.length - results.length).fill(null).concat(results);
    return padded;
  }

  // Calculate Momentum
  calculateMomentum(prices, period = 10) {
    const closes = prices.map(p => p.close);
    const results = [];
    for (let i = period; i < closes.length; i++) {
      results.push(closes[i] - closes[i - period]);
    }
    const padded = Array(prices.length - results.length).fill(null).concat(results);
    return padded;
  }

  // Calculate Parabolic SAR - Detects trend reversals
  calculateParabolicSAR(prices, initialAF = 0.02, maxAF = 0.2) {
    const results = [];
    if (prices.length < 2) return Array(prices.length).fill(null);
    
    let isUptrend = prices[1].close > prices[0].close;
    let af = initialAF;
    let extremePoint = isUptrend ? Math.max(prices[0].high, prices[1].high) : Math.min(prices[0].low, prices[1].low);
    let sar = isUptrend ? Math.min(prices[0].low, prices[1].low) : Math.max(prices[0].high, prices[1].high);
    
    results.push(sar);
    
    for (let i = 1; i < prices.length; i++) {
      const priorSAR = sar;
      sar = sar + af * (extremePoint - sar);
      
      // SAR cannot go beyond the last 2 bars
      if (isUptrend) {
        sar = Math.min(sar, prices[i - 1].low);
        if (i > 1) sar = Math.min(sar, prices[i - 2].low);
      } else {
        sar = Math.max(sar, prices[i - 1].high);
        if (i > 1) sar = Math.max(sar, prices[i - 2].high);
      }
      
      // Check for reversal
      let reversalOccurred = false;
      if (isUptrend && prices[i].low < sar) {
        isUptrend = false;
        sar = extremePoint;
        extremePoint = prices[i].low;
        af = initialAF;
        reversalOccurred = true;
      } else if (!isUptrend && prices[i].high > sar) {
        isUptrend = true;
        sar = extremePoint;
        extremePoint = prices[i].high;
        af = initialAF;
        reversalOccurred = true;
      }
      
      // Update extreme point and AF if no reversal
      if (!reversalOccurred) {
        if (isUptrend && prices[i].high > extremePoint) {
          extremePoint = prices[i].high;
          af = Math.min(af + initialAF, maxAF);
        } else if (!isUptrend && prices[i].low < extremePoint) {
          extremePoint = prices[i].low;
          af = Math.min(af + initialAF, maxAF);
        }
      }
      
      results.push(sar);
    }
    
    return results;
  }

  // Calculate Price Position in Range (0-100)
  calculatePricePosition(prices, period = 20) {
    const results = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...slice.map(p => p.high));
      const lowestLow = Math.min(...slice.map(p => p.low));
      const position = ((prices[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
      results.push(position);
    }
    const padded = Array(prices.length - results.length).fill(null).concat(results);
    return padded;
  }

  // Calculate Volume Ratio (current vs average)
  calculateVolumeRatio(prices, period = 20) {
    const results = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const avgVolume = slice.reduce((sum, p) => sum + p.volume, 0) / period;
      const ratio = avgVolume === 0 ? 1 : prices[i].volume / avgVolume;
      results.push(ratio);
    }
    const padded = Array(prices.length - results.length).fill(null).concat(results);
    return padded;
  }

  // Calculate all indicators for regression analysis
  calculateIndicatorsForRegression(prices) {
    const sma5 = this.calculateSMA(prices, 5);
    const sma10 = this.calculateSMA(prices, 10);
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const sma100 = this.calculateSMA(prices, 100);
    const sma200 = this.calculateSMA(prices, 200);
    const ema5 = this.calculateEMA(prices, 5);
    const ema10 = this.calculateEMA(prices, 10);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const ema21 = this.calculateEMA(prices, 21);
    const ema21High = this.calculateEMAHigh(prices, 21);
    const ema21Low = this.calculateEMALow(prices, 21);
    const rsi = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices);
    const bb = this.calculateBollingerBands(prices);
    const stoch = this.calculateStochastic(prices);
    const adx = this.calculateADX(prices);
    const atr = this.calculateATR(prices);
    const obv = this.calculateOBV(prices);
    const williamsR = this.calculateWilliamsR(prices);
    const cci = this.calculateCCI(prices);
    const mfi = this.calculateMFI(prices);
    const roc = this.calculateROC(prices);
    const momentum = this.calculateMomentum(prices);
    const pricePosition = this.calculatePricePosition(prices);
    const volumeRatio = this.calculateVolumeRatio(prices);
    const psar = this.calculateParabolicSAR(prices);

    return {
      sma5, sma10, sma20, sma50, sma100, sma200,
      ema5, ema10, ema12, ema26, ema21, ema21High, ema21Low,
      rsi, macd, bb, stoch, adx, atr, obv,
      williamsR, cci, mfi, roc, momentum, pricePosition, volumeRatio, psar
    };
  }

  // Generate regression dataset with indicators from H-1 and target from H
  // Options: { upThreshold: 1.0, downThreshold: -0.5, includeNeutral: false }
  generateRegressionDataset(prices, startDate, endDate, options = {}) {
    const {
      upThreshold = 1.0,      // Target = 1 if return >= +1%
      downThreshold = -0.5,   // Target = 0 if return <= -0.5%
      includeNeutral = false  // Whether to include neutral (between thresholds)
    } = options;

    // Helper function to safely format numbers
    const safeToFixed = (val, decimals = 2) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      return parseFloat(Number(val).toFixed(decimals));
    };

    const indicators = this.calculateIndicatorsForRegression(prices);
    const dataset = [];

    for (let i = 2; i < prices.length; i++) { // Start from 2 to have previous day delta
      const currentDate = new Date(prices[i].date);
      const prevDate = new Date(prices[i - 1].date);
      
      // Filter by date range
      if (startDate && currentDate < new Date(startDate)) continue;
      if (endDate && currentDate > new Date(endDate)) continue;

      const prevClose = prices[i - 1].close;
      const currentClose = prices[i].close;
      const priceChange = currentClose - prevClose;
      const priceChangePercent = ((currentClose - prevClose) / prevClose) * 100;

      // NEW TARGET LOGIC: Based on return thresholds
      let target;
      let targetLabel;
      if (priceChangePercent >= upThreshold) {
        target = 1;
        targetLabel = 'UP';
      } else if (priceChangePercent <= downThreshold) {
        target = 0;
        targetLabel = 'DOWN';
      } else {
        target = -1; // Neutral
        targetLabel = 'NEUTRAL';
        if (!includeNeutral) continue; // Skip neutral if not included
      }

      // Get indicators from previous day (H-1)
      const prevIdx = i - 1;
      const prevPrevIdx = i - 2; // For delta calculations
      
      // Skip if indicators are not available
      if (indicators.rsi[prevIdx] === null || indicators.macd[prevIdx] === null) continue;

      // === ML-FRIENDLY FEATURES ===
      const prevHigh = prices[i - 1].high;
      const prevLow = prices[i - 1].low;
      const prevOpen = prices[i - 1].open;
      const prevRange = prevHigh - prevLow;
      
      // Close Position: where close is within the day's range (0-1)
      const closePosition = prevRange > 0 ? (prevClose - prevLow) / prevRange : 0.5;
      
      // Body/Range Ratio: candle body size relative to total range
      const bodySize = Math.abs(prevClose - prevOpen);
      const bodyRangeRatio = prevRange > 0 ? bodySize / prevRange : 0;
      
      // Delta indicators (change from previous day)
      const deltaRSI = (indicators.rsi[prevIdx] !== null && indicators.rsi[prevPrevIdx] !== null)
        ? indicators.rsi[prevIdx] - indicators.rsi[prevPrevIdx] : null;
      
      const deltaMACDHist = (indicators.macd[prevIdx]?.histogram !== undefined && indicators.macd[prevPrevIdx]?.histogram !== undefined)
        ? indicators.macd[prevIdx].histogram - indicators.macd[prevPrevIdx].histogram : null;
      
      const deltaStochK = (indicators.stoch[prevIdx]?.k !== undefined && indicators.stoch[prevPrevIdx]?.k !== undefined)
        ? indicators.stoch[prevIdx].k - indicators.stoch[prevPrevIdx].k : null;
      
      const deltaADX = (indicators.adx[prevIdx]?.adx !== undefined && indicators.adx[prevPrevIdx]?.adx !== undefined)
        ? indicators.adx[prevIdx].adx - indicators.adx[prevPrevIdx].adx : null;
      
      const deltaCCI = (indicators.cci[prevIdx] !== null && indicators.cci[prevPrevIdx] !== null)
        ? indicators.cci[prevIdx] - indicators.cci[prevPrevIdx] : null;
      
      const deltaMFI = (indicators.mfi[prevIdx] !== null && indicators.mfi[prevPrevIdx] !== null)
        ? indicators.mfi[prevIdx] - indicators.mfi[prevPrevIdx] : null;

      const row = {
        date: prices[i].date,
        prevDate: prices[i - 1].date,
        target,
        targetLabel,
        priceChange: parseFloat(priceChange.toFixed(2)),
        priceChangePercent: parseFloat(priceChangePercent.toFixed(4)),
        prevClose: parseFloat(prevClose.toFixed(2)),
        currentClose: parseFloat(currentClose.toFixed(2)),
        prevOpen: parseFloat(prevOpen?.toFixed(2) || 0),
        prevHigh: parseFloat(prevHigh?.toFixed(2) || 0),
        prevLow: parseFloat(prevLow?.toFixed(2) || 0),
        prevVolume: prices[i - 1].volume || 0,
        
        // === NEW ML-FRIENDLY FEATURES ===
        closePosition: parseFloat(closePosition.toFixed(4)),        // Where close is in day's range (0-1)
        bodyRangeRatio: parseFloat(bodyRangeRatio.toFixed(4)),      // Body / Range ratio
        upperWickRatio: prevRange > 0 ? parseFloat(((prevHigh - Math.max(prevOpen, prevClose)) / prevRange).toFixed(4)) : 0,
        lowerWickRatio: prevRange > 0 ? parseFloat(((Math.min(prevOpen, prevClose) - prevLow) / prevRange).toFixed(4)) : 0,
        
        // Delta indicators (change from previous day) - MORE PREDICTIVE
        deltaRSI: deltaRSI !== null ? parseFloat(deltaRSI.toFixed(2)) : null,
        deltaMACDHist: deltaMACDHist !== null ? parseFloat(deltaMACDHist.toFixed(4)) : null,
        deltaStochK: deltaStochK !== null ? parseFloat(deltaStochK.toFixed(2)) : null,
        deltaADX: deltaADX !== null ? parseFloat(deltaADX.toFixed(2)) : null,
        deltaCCI: deltaCCI !== null ? parseFloat(deltaCCI.toFixed(2)) : null,
        deltaMFI: deltaMFI !== null ? parseFloat(deltaMFI.toFixed(2)) : null,
        
        // SMA indicators (H-1)
        sma5: indicators.sma5[prevIdx] ? parseFloat(indicators.sma5[prevIdx].toFixed(2)) : null,
        sma10: indicators.sma10[prevIdx] ? parseFloat(indicators.sma10[prevIdx].toFixed(2)) : null,
        sma20: indicators.sma20[prevIdx] ? parseFloat(indicators.sma20[prevIdx].toFixed(2)) : null,
        sma50: indicators.sma50[prevIdx] ? parseFloat(indicators.sma50[prevIdx].toFixed(2)) : null,
        
        // EMA indicators (H-1)
        ema5: indicators.ema5[prevIdx] ? parseFloat(indicators.ema5[prevIdx].toFixed(2)) : null,
        ema10: indicators.ema10[prevIdx] ? parseFloat(indicators.ema10[prevIdx].toFixed(2)) : null,
        ema12: indicators.ema12[prevIdx] ? parseFloat(indicators.ema12[prevIdx].toFixed(2)) : null,
        ema26: indicators.ema26[prevIdx] ? parseFloat(indicators.ema26[prevIdx].toFixed(2)) : null,
        ema21: indicators.ema21[prevIdx] ? parseFloat(indicators.ema21[prevIdx].toFixed(2)) : null,
        ema21High: indicators.ema21High[prevIdx] ? parseFloat(indicators.ema21High[prevIdx].toFixed(2)) : null,
        ema21Low: indicators.ema21Low[prevIdx] ? parseFloat(indicators.ema21Low[prevIdx].toFixed(2)) : null,
        
        // Price vs MA signals
        priceAboveSMA5: prevClose > (indicators.sma5[prevIdx] || 0) ? 1 : 0,
        priceAboveSMA10: prevClose > (indicators.sma10[prevIdx] || 0) ? 1 : 0,
        priceAboveSMA20: prevClose > (indicators.sma20[prevIdx] || 0) ? 1 : 0,
        priceAboveSMA50: prevClose > (indicators.sma50[prevIdx] || 0) ? 1 : 0,
        priceAboveEMA12: prevClose > (indicators.ema12[prevIdx] || 0) ? 1 : 0,
        priceAboveEMA26: prevClose > (indicators.ema26[prevIdx] || 0) ? 1 : 0,
        priceAboveEMA21: prevClose > (indicators.ema21[prevIdx] || 0) ? 1 : 0,
        priceAboveEMA21High: prevClose > (indicators.ema21High[prevIdx] || 0) ? 1 : 0,
        priceBelowEMA21Low: prevClose < (indicators.ema21Low[prevIdx] || Infinity) ? 1 : 0,
        
        // Distance from EMA 21
        distFromEMA21: indicators.ema21[prevIdx] ? parseFloat(((prevClose - indicators.ema21[prevIdx]) / indicators.ema21[prevIdx] * 100).toFixed(4)) : null,
        distFromEMA21High: indicators.ema21High[prevIdx] ? parseFloat(((prevClose - indicators.ema21High[prevIdx]) / indicators.ema21High[prevIdx] * 100).toFixed(4)) : null,
        distFromEMA21Low: indicators.ema21Low[prevIdx] ? parseFloat(((prevClose - indicators.ema21Low[prevIdx]) / indicators.ema21Low[prevIdx] * 100).toFixed(4)) : null,
        
        // EMA 21 Cross signals
        priceCrossAboveEMA21: (prevIdx >= 1 && prices[prevIdx - 1]?.close && indicators.ema21[prevIdx - 1] && indicators.ema21[prevIdx]
          ? (prices[prevIdx - 1].close <= indicators.ema21[prevIdx - 1] && prevClose > indicators.ema21[prevIdx] ? 1 : 0)
          : 0),
        priceCrossBelowEMA21: (prevIdx >= 1 && prices[prevIdx - 1]?.close && indicators.ema21[prevIdx - 1] && indicators.ema21[prevIdx]
          ? (prices[prevIdx - 1].close >= indicators.ema21[prevIdx - 1] && prevClose < indicators.ema21[prevIdx] ? 1 : 0)
          : 0),
        priceCrossUpEMA21High: (prevIdx >= 1 && prices[prevIdx - 1]?.close && indicators.ema21High[prevIdx - 1] && indicators.ema21High[prevIdx]
          ? (prices[prevIdx - 1].close <= indicators.ema21High[prevIdx - 1] && prevClose > indicators.ema21High[prevIdx] ? 1 : 0)
          : 0),
        
        // Distance from MA (normalized) - MORE USEFUL FOR ML
        distFromSMA5: indicators.sma5[prevIdx] ? parseFloat(((prevClose - indicators.sma5[prevIdx]) / indicators.sma5[prevIdx] * 100).toFixed(4)) : null,
        distFromSMA20: indicators.sma20[prevIdx] ? parseFloat(((prevClose - indicators.sma20[prevIdx]) / indicators.sma20[prevIdx] * 100).toFixed(4)) : null,
        distFromSMA50: indicators.sma50[prevIdx] ? parseFloat(((prevClose - indicators.sma50[prevIdx]) / indicators.sma50[prevIdx] * 100).toFixed(4)) : null,
        
        // SMA crossover signals
        sma5AboveSMA10: (indicators.sma5[prevIdx] || 0) > (indicators.sma10[prevIdx] || 0) ? 1 : 0,
        sma10AboveSMA20: (indicators.sma10[prevIdx] || 0) > (indicators.sma20[prevIdx] || 0) ? 1 : 0,
        sma20AboveSMA50: (indicators.sma20[prevIdx] || 0) > (indicators.sma50[prevIdx] || 0) ? 1 : 0,
        
        // RSI (H-1)
        rsi: indicators.rsi[prevIdx] ? parseFloat(indicators.rsi[prevIdx].toFixed(2)) : null,
        rsiOversold: indicators.rsi[prevIdx] && indicators.rsi[prevIdx] < 30 ? 1 : 0,
        rsiOverbought: indicators.rsi[prevIdx] && indicators.rsi[prevIdx] > 70 ? 1 : 0,
        rsiNeutral: indicators.rsi[prevIdx] && indicators.rsi[prevIdx] >= 30 && indicators.rsi[prevIdx] <= 70 ? 1 : 0,
        
        // MACD (H-1)
        macd: indicators.macd[prevIdx]?.MACD ? parseFloat(indicators.macd[prevIdx].MACD.toFixed(4)) : null,
        macdSignal: indicators.macd[prevIdx]?.signal ? parseFloat(indicators.macd[prevIdx].signal.toFixed(4)) : null,
        macdHistogram: indicators.macd[prevIdx]?.histogram ? parseFloat(indicators.macd[prevIdx].histogram.toFixed(4)) : null,
        macdBullish: indicators.macd[prevIdx] && indicators.macd[prevIdx].MACD > indicators.macd[prevIdx].signal ? 1 : 0,
        macdPositive: indicators.macd[prevIdx] && indicators.macd[prevIdx].MACD > 0 ? 1 : 0,
        macdGoldenCross: (prevIdx >= 1 && indicators.macd[prevIdx] && indicators.macd[prevIdx - 1] &&
          indicators.macd[prevIdx - 1].MACD <= indicators.macd[prevIdx - 1].signal &&
          indicators.macd[prevIdx].MACD > indicators.macd[prevIdx].signal) ? 1 : 0,
        macdDeathCross: (prevIdx >= 1 && indicators.macd[prevIdx] && indicators.macd[prevIdx - 1] &&
          indicators.macd[prevIdx - 1].MACD >= indicators.macd[prevIdx - 1].signal &&
          indicators.macd[prevIdx].MACD < indicators.macd[prevIdx].signal) ? 1 : 0,
        // MACD Near Golden Cross Detection
        // Histogram negatif tapi naik (converging ke signal line)
        macdNearGoldenCross: (prevIdx >= 1 && indicators.macd[prevIdx] && indicators.macd[prevIdx - 1] &&
          indicators.macd[prevIdx].histogram < 0 && // Masih di bawah signal
          indicators.macd[prevIdx].histogram > indicators.macd[prevIdx - 1].histogram) ? 1 : 0, // Tapi histogram naik
        // Histogram sangat dekat ke 0 (< 25% dari range)
        macdHistogramConverging: (indicators.macd[prevIdx] && indicators.macd[prevIdx].histogram < 0 &&
          Math.abs(indicators.macd[prevIdx].histogram) < Math.abs(indicators.macd[prevIdx].MACD) * 0.25) ? 1 : 0,
        // MACD Momentum: berapa hari histogram naik berturut-turut
        macdHistogramRising: (prevIdx >= 2 && indicators.macd[prevIdx] && indicators.macd[prevIdx - 1] && indicators.macd[prevIdx - 2] &&
          indicators.macd[prevIdx].histogram > indicators.macd[prevIdx - 1].histogram &&
          indicators.macd[prevIdx - 1].histogram > indicators.macd[prevIdx - 2].histogram) ? 1 : 0,
        // Jarak MACD ke Signal line (dalam %)
        macdDistanceToSignal: indicators.macd[prevIdx] && indicators.macd[prevIdx].signal !== 0 ? 
          parseFloat(((indicators.macd[prevIdx].MACD - indicators.macd[prevIdx].signal) / Math.abs(indicators.macd[prevIdx].signal) * 100).toFixed(2)) : null,
        
        // Bollinger Bands (H-1)
        bbUpper: indicators.bb[prevIdx]?.upper ? parseFloat(indicators.bb[prevIdx].upper.toFixed(2)) : null,
        bbMiddle: indicators.bb[prevIdx]?.middle ? parseFloat(indicators.bb[prevIdx].middle.toFixed(2)) : null,
        bbLower: indicators.bb[prevIdx]?.lower ? parseFloat(indicators.bb[prevIdx].lower.toFixed(2)) : null,
        bbWidth: indicators.bb[prevIdx] ? parseFloat(((indicators.bb[prevIdx].upper - indicators.bb[prevIdx].lower) / indicators.bb[prevIdx].middle * 100).toFixed(4)) : null,
        priceBelowLowerBB: indicators.bb[prevIdx] && prevClose < indicators.bb[prevIdx].lower ? 1 : 0,
        priceAboveUpperBB: indicators.bb[prevIdx] && prevClose > indicators.bb[prevIdx].upper ? 1 : 0,
        
        // Stochastic (H-1)
        stochK: indicators.stoch[prevIdx]?.k ? parseFloat(indicators.stoch[prevIdx].k.toFixed(2)) : null,
        stochD: indicators.stoch[prevIdx]?.d ? parseFloat(indicators.stoch[prevIdx].d.toFixed(2)) : null,
        stochOversold: indicators.stoch[prevIdx] && indicators.stoch[prevIdx].k < 20 ? 1 : 0,
        stochOverbought: indicators.stoch[prevIdx] && indicators.stoch[prevIdx].k > 80 ? 1 : 0,
        stochBullishCross: indicators.stoch[prevIdx] && indicators.stoch[prevIdx].k > indicators.stoch[prevIdx].d ? 1 : 0,
        
        // ADX (H-1)
        adx: indicators.adx[prevIdx]?.adx ? parseFloat(indicators.adx[prevIdx].adx.toFixed(2)) : null,
        pdi: indicators.adx[prevIdx]?.pdi ? parseFloat(indicators.adx[prevIdx].pdi.toFixed(2)) : null,
        mdi: indicators.adx[prevIdx]?.mdi ? parseFloat(indicators.adx[prevIdx].mdi.toFixed(2)) : null,
        strongTrend: indicators.adx[prevIdx] && indicators.adx[prevIdx].adx > 25 ? 1 : 0,
        bullishDI: indicators.adx[prevIdx] && indicators.adx[prevIdx].pdi > indicators.adx[prevIdx].mdi ? 1 : 0,
        
        // ATR (H-1)
        atr: indicators.atr[prevIdx] ? parseFloat(indicators.atr[prevIdx].toFixed(2)) : null,
        atrPercent: indicators.atr[prevIdx] ? parseFloat((indicators.atr[prevIdx] / prevClose * 100).toFixed(4)) : null,
        
        // OBV (H-1) - with change and trend
        obv: indicators.obv[prevIdx] || 0,
        obvChange: (prevIdx >= 1 && indicators.obv[prevIdx] !== null && indicators.obv[prevIdx - 1] !== null) 
          ? indicators.obv[prevIdx] - indicators.obv[prevIdx - 1] 
          : null,
        obvTrend: (prevIdx >= 1 && indicators.obv[prevIdx] !== null && indicators.obv[prevIdx - 1] !== null)
          ? (indicators.obv[prevIdx] > indicators.obv[prevIdx - 1] ? 1 : (indicators.obv[prevIdx] < indicators.obv[prevIdx - 1] ? -1 : 0))
          : null,
        
        // Williams %R (H-1)
        williamsR: indicators.williamsR[prevIdx] ? parseFloat(indicators.williamsR[prevIdx].toFixed(2)) : null,
        williamsROversold: indicators.williamsR[prevIdx] && indicators.williamsR[prevIdx] < -80 ? 1 : 0,
        williamsROverbought: indicators.williamsR[prevIdx] && indicators.williamsR[prevIdx] > -20 ? 1 : 0,
        
        // CCI (H-1)
        cci: indicators.cci[prevIdx] ? parseFloat(indicators.cci[prevIdx].toFixed(2)) : null,
        cciOversold: indicators.cci[prevIdx] && indicators.cci[prevIdx] < -100 ? 1 : 0,
        cciOverbought: indicators.cci[prevIdx] && indicators.cci[prevIdx] > 100 ? 1 : 0,
        
        // MFI (H-1)
        mfi: indicators.mfi[prevIdx] ? parseFloat(indicators.mfi[prevIdx].toFixed(2)) : null,
        mfiOversold: indicators.mfi[prevIdx] && indicators.mfi[prevIdx] < 20 ? 1 : 0,
        mfiOverbought: indicators.mfi[prevIdx] && indicators.mfi[prevIdx] > 80 ? 1 : 0,
        
        // ROC (H-1)
        roc: indicators.roc[prevIdx] ? parseFloat(indicators.roc[prevIdx].toFixed(4)) : null,
        rocPositive: indicators.roc[prevIdx] && indicators.roc[prevIdx] > 0 ? 1 : 0,
        
        // Momentum (H-1)
        momentum: indicators.momentum[prevIdx] ? parseFloat(indicators.momentum[prevIdx].toFixed(2)) : null,
        momentumPositive: indicators.momentum[prevIdx] && indicators.momentum[prevIdx] > 0 ? 1 : 0,
        
        // Price Position (H-1)
        pricePosition: indicators.pricePosition[prevIdx] ? parseFloat(indicators.pricePosition[prevIdx].toFixed(2)) : null,
        
        // Volume Ratio (H-1)
        volumeRatio: indicators.volumeRatio[prevIdx] ? parseFloat(indicators.volumeRatio[prevIdx].toFixed(4)) : null,
        highVolume: indicators.volumeRatio[prevIdx] && indicators.volumeRatio[prevIdx] > 1.5 ? 1 : 0,
        
        // Candlestick patterns (H-1)
        bodySize: parseFloat(Math.abs(prices[i - 1].close - prices[i - 1].open).toFixed(2)),
        upperWick: parseFloat((prices[i - 1].high - Math.max(prices[i - 1].open, prices[i - 1].close)).toFixed(2)),
        lowerWick: parseFloat((Math.min(prices[i - 1].open, prices[i - 1].close) - prices[i - 1].low).toFixed(2)),
        isBullishCandle: prices[i - 1].close > prices[i - 1].open ? 1 : 0,
        isDoji: Math.abs(prices[i - 1].close - prices[i - 1].open) < (prices[i - 1].high - prices[i - 1].low) * 0.1 ? 1 : 0,
        
        // Price gaps
        gapUp: prices[i - 1].open > prices[i - 2]?.close ? 1 : 0,
        gapDown: prices[i - 1].open < prices[i - 2]?.close ? 1 : 0,
        
        // Daily returns for past days (H-1, H-2, etc.)
        return1d: i >= 2 ? parseFloat(((prices[i - 1].close - prices[i - 2].close) / prices[i - 2].close * 100).toFixed(4)) : null,
        return3d: i >= 4 ? parseFloat(((prices[i - 1].close - prices[i - 4].close) / prices[i - 4].close * 100).toFixed(4)) : null,
        return5d: i >= 6 ? parseFloat(((prices[i - 1].close - prices[i - 6].close) / prices[i - 6].close * 100).toFixed(4)) : null,
        
        // ============ ADVANCED BULLISH DETECTION INDICATORS ============
        
        // RSI Momentum
        rsiRising: (prevIdx >= 1 && indicators.rsi[prevIdx] && indicators.rsi[prevIdx - 1] &&
          indicators.rsi[prevIdx] > indicators.rsi[prevIdx - 1]) ? 1 : 0,
        rsiExitOversold: (prevIdx >= 1 && indicators.rsi[prevIdx] && indicators.rsi[prevIdx - 1] &&
          indicators.rsi[prevIdx - 1] < 30 && indicators.rsi[prevIdx] >= 30) ? 1 : 0,
        rsiBullishZone: (indicators.rsi[prevIdx] && indicators.rsi[prevIdx] >= 30 && indicators.rsi[prevIdx] <= 50) ? 1 : 0,
        
        // Stochastic signals
        stochGoldenCross: (prevIdx >= 1 && indicators.stoch[prevIdx] && indicators.stoch[prevIdx - 1] &&
          indicators.stoch[prevIdx - 1].k <= indicators.stoch[prevIdx - 1].d &&
          indicators.stoch[prevIdx].k > indicators.stoch[prevIdx].d) ? 1 : 0,
        stochExitOversold: (prevIdx >= 1 && indicators.stoch[prevIdx] && indicators.stoch[prevIdx - 1] &&
          indicators.stoch[prevIdx - 1].k < 20 && indicators.stoch[prevIdx].k >= 20) ? 1 : 0,
        
        // Volume signals
        bullishVolume: (indicators.volumeRatio[prevIdx] && indicators.volumeRatio[prevIdx] > 1.2 && 
          prices[prevIdx].close > prices[prevIdx].open) ? 1 : 0,
        volumeSpike: indicators.volumeRatio[prevIdx] && indicators.volumeRatio[prevIdx] > 2 ? 1 : 0,
        
        // Bollinger Band signals
        nearLowerBB: (indicators.bb[prevIdx] && prevClose <= indicators.bb[prevIdx].lower * 1.02) ? 1 : 0,
        bouncingFromLowerBB: (prevIdx >= 1 && indicators.bb[prevIdx] && indicators.bb[prevIdx - 1] &&
          prices[prevIdx - 1].close <= indicators.bb[prevIdx - 1].lower &&
          prices[prevIdx].close > indicators.bb[prevIdx].lower) ? 1 : 0,
        bbSqueeze: (indicators.bb[prevIdx] && 
          ((indicators.bb[prevIdx].upper - indicators.bb[prevIdx].lower) / indicators.bb[prevIdx].middle * 100) < 5) ? 1 : 0,
        
        // ADX signals
        adxRising: (prevIdx >= 1 && indicators.adx[prevIdx] && indicators.adx[prevIdx - 1] &&
          indicators.adx[prevIdx].adx > indicators.adx[prevIdx - 1].adx) ? 1 : 0,
        bullishDICross: (prevIdx >= 1 && indicators.adx[prevIdx] && indicators.adx[prevIdx - 1] &&
          indicators.adx[prevIdx - 1].pdi <= indicators.adx[prevIdx - 1].mdi &&
          indicators.adx[prevIdx].pdi > indicators.adx[prevIdx].mdi) ? 1 : 0,
        
        // Candlestick patterns
        hammerCandle: (prices[prevIdx].high - prices[prevIdx].low > 0 &&
          (Math.min(prices[prevIdx].open, prices[prevIdx].close) - prices[prevIdx].low) > 
          (prices[prevIdx].high - prices[prevIdx].low) * 0.6 &&
          Math.abs(prices[prevIdx].close - prices[prevIdx].open) < 
          (prices[prevIdx].high - prices[prevIdx].low) * 0.3) ? 1 : 0,
        bullishEngulfing: (prevIdx >= 1 && 
          prices[prevIdx - 1].close < prices[prevIdx - 1].open &&
          prices[prevIdx].close > prices[prevIdx].open &&
          prices[prevIdx].close > prices[prevIdx - 1].open &&
          prices[prevIdx].open < prices[prevIdx - 1].close) ? 1 : 0,
        
        // Bullish score (0-10)
        bullishScore: (() => {
          let score = 0;
          if (indicators.rsi[prevIdx] < 40) score += 1;
          if (prevIdx >= 1 && indicators.rsi[prevIdx] > indicators.rsi[prevIdx - 1]) score += 1;
          if (prevIdx >= 1 && indicators.macd[prevIdx]?.histogram > indicators.macd[prevIdx - 1]?.histogram) score += 1;
          if (indicators.macd[prevIdx]?.MACD > indicators.macd[prevIdx]?.signal) score += 1;
          if (indicators.volumeRatio[prevIdx] > 1.2) score += 1;
          if (prevIdx >= 1 && indicators.obv[prevIdx] > indicators.obv[prevIdx - 1]) score += 1;
          if (indicators.adx[prevIdx]?.pdi > indicators.adx[prevIdx]?.mdi) score += 1;
          if (prices[prevIdx].close > prices[prevIdx].open) score += 1;
          if (indicators.stoch[prevIdx]?.k < 50) score += 1;
          if (prevClose > indicators.sma20[prevIdx]) score += 1;
          return score;
        })(),
        
        // Composite signals
        oversoldBounce: ((indicators.rsi[prevIdx] < 35 || indicators.stoch[prevIdx]?.k < 25) &&
          prices[prevIdx].close > prices[prevIdx].open &&
          indicators.volumeRatio[prevIdx] > 1) ? 1 : 0,
        
        momentumShift: (prevIdx >= 1 && 
          indicators.macd[prevIdx]?.histogram > indicators.macd[prevIdx - 1]?.histogram &&
          indicators.rsi[prevIdx] > indicators.rsi[prevIdx - 1] &&
          indicators.adx[prevIdx]?.pdi > indicators.adx[prevIdx]?.mdi) ? 1 : 0,
      };

      dataset.push(row);
    }

    return dataset;
  }

  // Generate trading signals
  generateSignals(indicators) {
    const signals = [];
    const current = indicators.current;

    // RSI signals
    if (current.rsi) {
      if (current.rsi < 30) {
        signals.push({ type: 'BUY', indicator: 'RSI', reason: `RSI oversold at ${current.rsi.toFixed(2)}` });
      } else if (current.rsi > 70) {
        signals.push({ type: 'SELL', indicator: 'RSI', reason: `RSI overbought at ${current.rsi.toFixed(2)}` });
      }
    }

    // MACD signals
    if (current.macd) {
      if (current.macd.MACD > current.macd.signal && current.macd.histogram > 0) {
        signals.push({ type: 'BUY', indicator: 'MACD', reason: 'MACD bullish crossover' });
      } else if (current.macd.MACD < current.macd.signal && current.macd.histogram < 0) {
        signals.push({ type: 'SELL', indicator: 'MACD', reason: 'MACD bearish crossover' });
      }
    }

    // Moving Average signals
    if (current.sma20 && current.sma50) {
      if (current.price > current.sma20 && current.sma20 > current.sma50) {
        signals.push({ type: 'BUY', indicator: 'MA', reason: 'Price above SMA20 > SMA50 (uptrend)' });
      } else if (current.price < current.sma20 && current.sma20 < current.sma50) {
        signals.push({ type: 'SELL', indicator: 'MA', reason: 'Price below SMA20 < SMA50 (downtrend)' });
      }
    }

    // Bollinger Bands signals
    if (current.bollingerBands) {
      if (current.price < current.bollingerBands.lower) {
        signals.push({ type: 'BUY', indicator: 'BB', reason: 'Price below lower Bollinger Band' });
      } else if (current.price > current.bollingerBands.upper) {
        signals.push({ type: 'SELL', indicator: 'BB', reason: 'Price above upper Bollinger Band' });
      }
    }

    // Stochastic signals
    if (current.stochastic) {
      if (current.stochastic.k < 20 && current.stochastic.d < 20) {
        signals.push({ type: 'BUY', indicator: 'Stoch', reason: 'Stochastic oversold' });
      } else if (current.stochastic.k > 80 && current.stochastic.d > 80) {
        signals.push({ type: 'SELL', indicator: 'Stoch', reason: 'Stochastic overbought' });
      }
    }

    return signals;
  }

  // Get indicator data for a specific date (H-1 data for predicting date H)
  // targetDate: the date we want to predict (H)
  // timeframe: aggregate daily data to N-day candles (1=daily, 3=3-day, 5=weekly, etc.)
  // Returns indicators from the day before (H-1)
  getIndicatorsForDate(prices, targetDate, timeframe = 1) {
    // Helper function to safely format numbers
    const safeToFixed = (val, decimals = 2) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      return parseFloat(Number(val).toFixed(decimals));
    };

    // Resample data to specified timeframe
    const resampledPrices = this.resampleToTimeframe(prices, timeframe);
    
    const indicators = this.calculateIndicatorsForRegression(resampledPrices);
    
    const targetDateStr = new Date(targetDate).toISOString().split('T')[0];
    const lastPriceDate = new Date(resampledPrices[resampledPrices.length - 1].date).toISOString().split('T')[0];
    const targetDateObj = new Date(targetDate);
    const lastPriceDateObj = new Date(resampledPrices[resampledPrices.length - 1].date);
    
    let targetIdx = -1;
    let isFutureDate = false;
    
    // Check if target date is in the future (after last available data)
    if (targetDateObj > lastPriceDateObj) {
      // For future dates, use the last available data as "today" (H)
      // and calculate indicators from H-1
      targetIdx = resampledPrices.length - 1;
      isFutureDate = true;
    } else {
      // Find the index of target date (H)
      for (let i = 0; i < resampledPrices.length; i++) {
        const priceDate = new Date(resampledPrices[i].date).toISOString().split('T')[0];
        if (priceDate === targetDateStr) {
          targetIdx = i;
          break;
        }
        // For resampled data, also check if target falls within the period
        if (resampledPrices[i].startDate && resampledPrices[i].endDate) {
          const startDate = new Date(resampledPrices[i].startDate).toISOString().split('T')[0];
          const endDate = new Date(resampledPrices[i].endDate).toISOString().split('T')[0];
          if (targetDateStr >= startDate && targetDateStr <= endDate) {
            targetIdx = i;
            break;
          }
        }
      }

      // If target date not found, find the nearest date after
      if (targetIdx === -1) {
        for (let i = 0; i < resampledPrices.length; i++) {
          const priceDate = new Date(resampledPrices[i].date);
          if (priceDate >= targetDateObj) {
            targetIdx = i;
            break;
          }
        }
      }
    }

    if (targetIdx < 2) {
      return { error: 'Not enough historical data for this date' };
    }

    // For future dates: i is the last available day, prevIdx is H-1 (used for indicators)
    // For normal dates: i is target day H, prevIdx is H-1 (used for indicators)
    const i = targetIdx;
    const prevIdx = isFutureDate ? i : i - 1;  // For future: use last day as H-1
    const prevPrevIdx = isFutureDate ? i - 1 : i - 2;
    
    const prevClose = resampledPrices[prevIdx].close;
    const prevHigh = resampledPrices[prevIdx].high;
    const prevLow = resampledPrices[prevIdx].low;
    const prevOpen = resampledPrices[prevIdx].open;
    const prevRange = prevHigh - prevLow;
    
    // Close Position
    const closePosition = prevRange > 0 ? (prevClose - prevLow) / prevRange : 0.5;
    
    // Body/Range Ratio
    const bodySize = Math.abs(prevClose - prevOpen);
    const bodyRangeRatio = prevRange > 0 ? bodySize / prevRange : 0;
    
    // Delta indicators
    const deltaRSI = (indicators.rsi[prevIdx] !== null && indicators.rsi[prevPrevIdx] !== null)
      ? indicators.rsi[prevIdx] - indicators.rsi[prevPrevIdx] : null;
    
    const deltaMACDHist = (indicators.macd[prevIdx]?.histogram !== undefined && indicators.macd[prevPrevIdx]?.histogram !== undefined)
      ? indicators.macd[prevIdx].histogram - indicators.macd[prevPrevIdx].histogram : null;
    
    const deltaStochK = (indicators.stoch[prevIdx]?.k !== undefined && indicators.stoch[prevPrevIdx]?.k !== undefined)
      ? indicators.stoch[prevIdx].k - indicators.stoch[prevPrevIdx].k : null;
    
    const deltaADX = (indicators.adx[prevIdx]?.adx !== undefined && indicators.adx[prevPrevIdx]?.adx !== undefined)
      ? indicators.adx[prevIdx].adx - indicators.adx[prevPrevIdx].adx : null;
    
    const deltaCCI = (indicators.cci[prevIdx] !== null && indicators.cci[prevPrevIdx] !== null)
      ? indicators.cci[prevIdx] - indicators.cci[prevPrevIdx] : null;
    
    const deltaMFI = (indicators.mfi[prevIdx] !== null && indicators.mfi[prevPrevIdx] !== null)
      ? indicators.mfi[prevIdx] - indicators.mfi[prevPrevIdx] : null;

    // Also get actual data for target date if available (for verification)
    const actualData = {
      date: resampledPrices[i].date,
      open: resampledPrices[i].open,
      high: resampledPrices[i].high,
      low: resampledPrices[i].low,
      close: resampledPrices[i].close,
      volume: resampledPrices[i].volume,
      priceChange: resampledPrices[i].close - prevClose,
      priceChangePercent: ((resampledPrices[i].close - prevClose) / prevClose) * 100
    };

    const row = {
      // Meta info
      symbol: null, // Will be set by caller
      targetDate: isFutureDate ? targetDate : resampledPrices[i].date,
      indicatorDate: resampledPrices[prevIdx].date,
      isFutureDate: isFutureDate,
      timeframe: timeframe, // Include timeframe in response
      
      // Actual data for verification (if available) - not available for future dates
      actualData: isFutureDate ? null : actualData,
      
      // Indicator data (H-1)
      prevClose: parseFloat(prevClose.toFixed(2)),
      prevOpen: parseFloat(prevOpen?.toFixed(2) || 0),
      prevHigh: parseFloat(prevHigh?.toFixed(2) || 0),
      prevLow: parseFloat(prevLow?.toFixed(2) || 0),
      prevVolume: prices[prevIdx].volume || 0,
      
      // ML Features
      closePosition: parseFloat(closePosition.toFixed(4)),
      bodyRangeRatio: parseFloat(bodyRangeRatio.toFixed(4)),
      upperWickRatio: prevRange > 0 ? parseFloat(((prevHigh - Math.max(prevOpen, prevClose)) / prevRange).toFixed(4)) : 0,
      lowerWickRatio: prevRange > 0 ? parseFloat(((Math.min(prevOpen, prevClose) - prevLow) / prevRange).toFixed(4)) : 0,
      
      // Delta indicators
      deltaRSI: deltaRSI !== null ? parseFloat(deltaRSI.toFixed(2)) : null,
      deltaMACDHist: deltaMACDHist !== null ? parseFloat(deltaMACDHist.toFixed(4)) : null,
      deltaStochK: deltaStochK !== null ? parseFloat(deltaStochK.toFixed(2)) : null,
      deltaADX: deltaADX !== null ? parseFloat(deltaADX.toFixed(2)) : null,
      deltaCCI: deltaCCI !== null ? parseFloat(deltaCCI.toFixed(2)) : null,
      deltaMFI: deltaMFI !== null ? parseFloat(deltaMFI.toFixed(2)) : null,
      
      // SMA indicators
      sma5: indicators.sma5[prevIdx] ? parseFloat(indicators.sma5[prevIdx].toFixed(2)) : null,
      sma10: indicators.sma10[prevIdx] ? parseFloat(indicators.sma10[prevIdx].toFixed(2)) : null,
      sma20: indicators.sma20[prevIdx] ? parseFloat(indicators.sma20[prevIdx].toFixed(2)) : null,
      sma50: indicators.sma50[prevIdx] ? parseFloat(indicators.sma50[prevIdx].toFixed(2)) : null,
      sma100: indicators.sma100[prevIdx] ? parseFloat(indicators.sma100[prevIdx].toFixed(2)) : null,
      sma200: indicators.sma200[prevIdx] ? parseFloat(indicators.sma200[prevIdx].toFixed(2)) : null,
      
      // EMA indicators
      ema5: indicators.ema5[prevIdx] ? parseFloat(indicators.ema5[prevIdx].toFixed(2)) : null,
      ema10: indicators.ema10[prevIdx] ? parseFloat(indicators.ema10[prevIdx].toFixed(2)) : null,
      ema12: indicators.ema12[prevIdx] ? parseFloat(indicators.ema12[prevIdx].toFixed(2)) : null,
      ema26: indicators.ema26[prevIdx] ? parseFloat(indicators.ema26[prevIdx].toFixed(2)) : null,
      ema21: indicators.ema21[prevIdx] ? parseFloat(indicators.ema21[prevIdx].toFixed(2)) : null,
      ema21High: indicators.ema21High[prevIdx] ? parseFloat(indicators.ema21High[prevIdx].toFixed(2)) : null,
      ema21Low: indicators.ema21Low[prevIdx] ? parseFloat(indicators.ema21Low[prevIdx].toFixed(2)) : null,
      
      // Price vs MA signals
      priceAboveSMA5: prevClose > (indicators.sma5[prevIdx] || 0) ? 1 : 0,
      priceAboveSMA10: prevClose > (indicators.sma10[prevIdx] || 0) ? 1 : 0,
      priceAboveSMA20: prevClose > (indicators.sma20[prevIdx] || 0) ? 1 : 0,
      priceAboveSMA50: prevClose > (indicators.sma50[prevIdx] || 0) ? 1 : 0,
      priceAboveEMA12: prevClose > (indicators.ema12[prevIdx] || 0) ? 1 : 0,
      priceAboveEMA26: prevClose > (indicators.ema26[prevIdx] || 0) ? 1 : 0,
      priceAboveEMA21: prevClose > (indicators.ema21[prevIdx] || 0) ? 1 : 0,
      priceAboveEMA21High: prevClose > (indicators.ema21High[prevIdx] || 0) ? 1 : 0,
      priceBelowEMA21Low: prevClose < (indicators.ema21Low[prevIdx] || Infinity) ? 1 : 0,
      
      // Distance from EMA 21
      distFromEMA21: indicators.ema21[prevIdx] ? parseFloat(((prevClose - indicators.ema21[prevIdx]) / indicators.ema21[prevIdx] * 100).toFixed(4)) : null,
      distFromEMA21High: indicators.ema21High[prevIdx] ? parseFloat(((prevClose - indicators.ema21High[prevIdx]) / indicators.ema21High[prevIdx] * 100).toFixed(4)) : null,
      distFromEMA21Low: indicators.ema21Low[prevIdx] ? parseFloat(((prevClose - indicators.ema21Low[prevIdx]) / indicators.ema21Low[prevIdx] * 100).toFixed(4)) : null,
      
      // EMA 21 Cross signals (price crossed above/below)
      priceCrossAboveEMA21: prevPrevIdx >= 0 && prices[prevPrevIdx]?.close && indicators.ema21[prevPrevIdx] && indicators.ema21[prevIdx]
        ? (prices[prevPrevIdx].close <= indicators.ema21[prevPrevIdx] && prevClose > indicators.ema21[prevIdx] ? 1 : 0)
        : 0,
      priceCrossBelowEMA21: prevPrevIdx >= 0 && prices[prevPrevIdx]?.close && indicators.ema21[prevPrevIdx] && indicators.ema21[prevIdx]
        ? (prices[prevPrevIdx].close >= indicators.ema21[prevPrevIdx] && prevClose < indicators.ema21[prevIdx] ? 1 : 0)
        : 0,
      priceCrossUpEMA21High: prevPrevIdx >= 0 && prices[prevPrevIdx]?.close && indicators.ema21High[prevPrevIdx] && indicators.ema21High[prevIdx]
        ? (prices[prevPrevIdx].close <= indicators.ema21High[prevPrevIdx] && prevClose > indicators.ema21High[prevIdx] ? 1 : 0)
        : 0,
      
      // Distance from MA
      distFromSMA5: indicators.sma5[prevIdx] ? parseFloat(((prevClose - indicators.sma5[prevIdx]) / indicators.sma5[prevIdx] * 100).toFixed(4)) : null,
      distFromSMA20: indicators.sma20[prevIdx] ? parseFloat(((prevClose - indicators.sma20[prevIdx]) / indicators.sma20[prevIdx] * 100).toFixed(4)) : null,
      distFromSMA50: indicators.sma50[prevIdx] ? parseFloat(((prevClose - indicators.sma50[prevIdx]) / indicators.sma50[prevIdx] * 100).toFixed(4)) : null,
      
      // SMA crossover signals
      sma5AboveSMA10: (indicators.sma5[prevIdx] || 0) > (indicators.sma10[prevIdx] || 0) ? 1 : 0,
      sma10AboveSMA20: (indicators.sma10[prevIdx] || 0) > (indicators.sma20[prevIdx] || 0) ? 1 : 0,
      sma20AboveSMA50: (indicators.sma20[prevIdx] || 0) > (indicators.sma50[prevIdx] || 0) ? 1 : 0,
      
      // Golden Cross MA (fast MA crossing above slow MA)
      ma5CrossAboveMa10: (prevPrevIdx >= 0 && 
        (indicators.sma5[prevPrevIdx] || 0) <= (indicators.sma10[prevPrevIdx] || 0) &&
        (indicators.sma5[prevIdx] || 0) > (indicators.sma10[prevIdx] || 0)) ? 1 : 0,
      ma10CrossAboveMa20: (prevPrevIdx >= 0 && 
        (indicators.sma10[prevPrevIdx] || 0) <= (indicators.sma20[prevPrevIdx] || 0) &&
        (indicators.sma10[prevIdx] || 0) > (indicators.sma20[prevIdx] || 0)) ? 1 : 0,
      ma20CrossAboveMa50: (prevPrevIdx >= 0 && 
        (indicators.sma20[prevPrevIdx] || 0) <= (indicators.sma50[prevPrevIdx] || 0) &&
        (indicators.sma20[prevIdx] || 0) > (indicators.sma50[prevIdx] || 0)) ? 1 : 0,
      ma50CrossAboveMa100: (prevPrevIdx >= 0 && 
        (indicators.sma50[prevPrevIdx] || 0) <= (indicators.sma100[prevPrevIdx] || 0) &&
        (indicators.sma50[prevIdx] || 0) > (indicators.sma100[prevIdx] || 0)) ? 1 : 0,
      ma100CrossAboveMa200: (prevPrevIdx >= 0 && 
        (indicators.sma100[prevPrevIdx] || 0) <= (indicators.sma200[prevPrevIdx] || 0) &&
        (indicators.sma100[prevIdx] || 0) > (indicators.sma200[prevIdx] || 0)) ? 1 : 0,
      
      // Death Cross MA (fast MA crossing below slow MA)
      ma5CrossBelowMa10: (prevPrevIdx >= 0 && 
        (indicators.sma5[prevPrevIdx] || 0) >= (indicators.sma10[prevPrevIdx] || 0) &&
        (indicators.sma5[prevIdx] || 0) < (indicators.sma10[prevIdx] || 0)) ? 1 : 0,
      ma10CrossBelowMa20: (prevPrevIdx >= 0 && 
        (indicators.sma10[prevPrevIdx] || 0) >= (indicators.sma20[prevPrevIdx] || 0) &&
        (indicators.sma10[prevIdx] || 0) < (indicators.sma20[prevIdx] || 0)) ? 1 : 0,
      ma20CrossBelowMa50: (prevPrevIdx >= 0 && 
        (indicators.sma20[prevPrevIdx] || 0) >= (indicators.sma50[prevPrevIdx] || 0) &&
        (indicators.sma20[prevIdx] || 0) < (indicators.sma50[prevIdx] || 0)) ? 1 : 0,
      ma50CrossBelowMa100: (prevPrevIdx >= 0 && 
        (indicators.sma50[prevPrevIdx] || 0) >= (indicators.sma100[prevPrevIdx] || 0) &&
        (indicators.sma50[prevIdx] || 0) < (indicators.sma100[prevIdx] || 0)) ? 1 : 0,
      ma100CrossBelowMa200: (prevPrevIdx >= 0 && 
        (indicators.sma100[prevPrevIdx] || 0) >= (indicators.sma200[prevPrevIdx] || 0) &&
        (indicators.sma100[prevIdx] || 0) < (indicators.sma200[prevIdx] || 0)) ? 1 : 0,
      
      // RSI
      rsi: indicators.rsi[prevIdx] ? parseFloat(indicators.rsi[prevIdx].toFixed(2)) : null,
      rsiOversold: indicators.rsi[prevIdx] && indicators.rsi[prevIdx] < 30 ? 1 : 0,
      rsiOverbought: indicators.rsi[prevIdx] && indicators.rsi[prevIdx] > 70 ? 1 : 0,
      rsiNeutral: indicators.rsi[prevIdx] && indicators.rsi[prevIdx] >= 30 && indicators.rsi[prevIdx] <= 70 ? 1 : 0,
      
      // MACD
      macd: indicators.macd[prevIdx]?.MACD ? parseFloat(indicators.macd[prevIdx].MACD.toFixed(4)) : null,
      macdSignal: indicators.macd[prevIdx]?.signal ? parseFloat(indicators.macd[prevIdx].signal.toFixed(4)) : null,
      macdHistogram: indicators.macd[prevIdx]?.histogram ? parseFloat(indicators.macd[prevIdx].histogram.toFixed(4)) : null,
      macdBullish: indicators.macd[prevIdx] && indicators.macd[prevIdx].MACD > indicators.macd[prevIdx].signal ? 1 : 0,
      macdPositive: indicators.macd[prevIdx] && indicators.macd[prevIdx].MACD > 0 ? 1 : 0,
      macdGoldenCross: (prevPrevIdx >= 0 && indicators.macd[prevIdx] && indicators.macd[prevPrevIdx] &&
        indicators.macd[prevPrevIdx].MACD <= indicators.macd[prevPrevIdx].signal &&
        indicators.macd[prevIdx].MACD > indicators.macd[prevIdx].signal) ? 1 : 0,
      macdDeathCross: (prevPrevIdx >= 0 && indicators.macd[prevIdx] && indicators.macd[prevPrevIdx] &&
        indicators.macd[prevPrevIdx].MACD >= indicators.macd[prevPrevIdx].signal &&
        indicators.macd[prevIdx].MACD < indicators.macd[prevIdx].signal) ? 1 : 0,
      // MACD Near Golden Cross Detection
      // Histogram negatif tapi naik (converging ke signal line)
      macdNearGoldenCross: (prevPrevIdx >= 0 && indicators.macd[prevIdx] && indicators.macd[prevPrevIdx] &&
        indicators.macd[prevIdx].histogram < 0 && // Masih di bawah signal
        indicators.macd[prevIdx].histogram > indicators.macd[prevPrevIdx].histogram) ? 1 : 0, // Tapi histogram naik
      // Histogram sangat dekat ke 0 (< 25% dari range)
      macdHistogramConverging: (indicators.macd[prevIdx] && indicators.macd[prevIdx].histogram < 0 &&
        Math.abs(indicators.macd[prevIdx].histogram) < Math.abs(indicators.macd[prevIdx].MACD) * 0.25) ? 1 : 0,
      // MACD Momentum: berapa hari histogram naik berturut-turut
      macdHistogramRising: (prevPrevIdx >= 1 && indicators.macd[prevIdx] && indicators.macd[prevPrevIdx] && indicators.macd[prevPrevIdx - 1] &&
        indicators.macd[prevIdx].histogram > indicators.macd[prevPrevIdx].histogram &&
        indicators.macd[prevPrevIdx].histogram > indicators.macd[prevPrevIdx - 1].histogram) ? 1 : 0,
      // Jarak MACD ke Signal line (dalam %)
      macdDistanceToSignal: indicators.macd[prevIdx] && indicators.macd[prevIdx].signal !== 0 ? 
        parseFloat(((indicators.macd[prevIdx].MACD - indicators.macd[prevIdx].signal) / Math.abs(indicators.macd[prevIdx].signal) * 100).toFixed(2)) : null,
      
      // Bollinger Bands
      bbUpper: indicators.bb[prevIdx]?.upper ? parseFloat(indicators.bb[prevIdx].upper.toFixed(2)) : null,
      bbMiddle: indicators.bb[prevIdx]?.middle ? parseFloat(indicators.bb[prevIdx].middle.toFixed(2)) : null,
      bbLower: indicators.bb[prevIdx]?.lower ? parseFloat(indicators.bb[prevIdx].lower.toFixed(2)) : null,
      bbWidth: indicators.bb[prevIdx] ? parseFloat(((indicators.bb[prevIdx].upper - indicators.bb[prevIdx].lower) / indicators.bb[prevIdx].middle * 100).toFixed(4)) : null,
      priceBelowLowerBB: indicators.bb[prevIdx] && prevClose < indicators.bb[prevIdx].lower ? 1 : 0,
      priceAboveUpperBB: indicators.bb[prevIdx] && prevClose > indicators.bb[prevIdx].upper ? 1 : 0,
      
      // Stochastic
      stochK: indicators.stoch[prevIdx]?.k ? parseFloat(indicators.stoch[prevIdx].k.toFixed(2)) : null,
      stochD: indicators.stoch[prevIdx]?.d ? parseFloat(indicators.stoch[prevIdx].d.toFixed(2)) : null,
      stochOversold: indicators.stoch[prevIdx] && indicators.stoch[prevIdx].k < 20 ? 1 : 0,
      stochOverbought: indicators.stoch[prevIdx] && indicators.stoch[prevIdx].k > 80 ? 1 : 0,
      stochBullishCross: indicators.stoch[prevIdx] && indicators.stoch[prevIdx].k > indicators.stoch[prevIdx].d ? 1 : 0,
      
      // ADX
      adx: indicators.adx[prevIdx]?.adx ? parseFloat(indicators.adx[prevIdx].adx.toFixed(2)) : null,
      pdi: indicators.adx[prevIdx]?.pdi ? parseFloat(indicators.adx[prevIdx].pdi.toFixed(2)) : null,
      mdi: indicators.adx[prevIdx]?.mdi ? parseFloat(indicators.adx[prevIdx].mdi.toFixed(2)) : null,
      strongTrend: indicators.adx[prevIdx] && indicators.adx[prevIdx].adx > 25 ? 1 : 0,
      bullishDI: indicators.adx[prevIdx] && indicators.adx[prevIdx].pdi > indicators.adx[prevIdx].mdi ? 1 : 0,
      
      // ATR
      atr: indicators.atr[prevIdx] ? parseFloat(indicators.atr[prevIdx].toFixed(2)) : null,
      atrPercent: indicators.atr[prevIdx] ? parseFloat((indicators.atr[prevIdx] / prevClose * 100).toFixed(4)) : null,
      
      // OBV
      obv: indicators.obv[prevIdx] || 0,
      obvChange: (prevIdx >= 1 && indicators.obv[prevIdx] !== null && indicators.obv[prevIdx - 1] !== null) 
        ? indicators.obv[prevIdx] - indicators.obv[prevIdx - 1] 
        : null,
      obvTrend: (prevIdx >= 1 && indicators.obv[prevIdx] !== null && indicators.obv[prevIdx - 1] !== null)
        ? (indicators.obv[prevIdx] > indicators.obv[prevIdx - 1] ? 1 : (indicators.obv[prevIdx] < indicators.obv[prevIdx - 1] ? -1 : 0))
        : null,
      
      // Williams %R
      williamsR: indicators.williamsR[prevIdx] ? parseFloat(indicators.williamsR[prevIdx].toFixed(2)) : null,
      williamsROversold: indicators.williamsR[prevIdx] && indicators.williamsR[prevIdx] < -80 ? 1 : 0,
      williamsROverbought: indicators.williamsR[prevIdx] && indicators.williamsR[prevIdx] > -20 ? 1 : 0,
      
      // CCI
      cci: indicators.cci[prevIdx] ? parseFloat(indicators.cci[prevIdx].toFixed(2)) : null,
      cciOversold: indicators.cci[prevIdx] && indicators.cci[prevIdx] < -100 ? 1 : 0,
      cciOverbought: indicators.cci[prevIdx] && indicators.cci[prevIdx] > 100 ? 1 : 0,
      
      // MFI
      mfi: indicators.mfi[prevIdx] ? parseFloat(indicators.mfi[prevIdx].toFixed(2)) : null,
      mfiOversold: indicators.mfi[prevIdx] && indicators.mfi[prevIdx] < 20 ? 1 : 0,
      mfiOverbought: indicators.mfi[prevIdx] && indicators.mfi[prevIdx] > 80 ? 1 : 0,
      
      // ROC
      roc: indicators.roc[prevIdx] ? parseFloat(indicators.roc[prevIdx].toFixed(4)) : null,
      rocPositive: indicators.roc[prevIdx] && indicators.roc[prevIdx] > 0 ? 1 : 0,
      
      // Momentum
      momentum: indicators.momentum[prevIdx] ? parseFloat(indicators.momentum[prevIdx].toFixed(2)) : null,
      momentumPositive: indicators.momentum[prevIdx] && indicators.momentum[prevIdx] > 0 ? 1 : 0,
      
      // Price Position
      pricePosition: indicators.pricePosition[prevIdx] ? parseFloat(indicators.pricePosition[prevIdx].toFixed(2)) : null,
      
      // Volume Ratio
      volumeRatio: indicators.volumeRatio[prevIdx] ? parseFloat(indicators.volumeRatio[prevIdx].toFixed(4)) : null,
      highVolume: indicators.volumeRatio[prevIdx] && indicators.volumeRatio[prevIdx] > 1.5 ? 1 : 0,
      
      // Candlestick patterns
      bodySize: parseFloat(Math.abs(resampledPrices[prevIdx].close - resampledPrices[prevIdx].open).toFixed(2)),
      upperWick: parseFloat((resampledPrices[prevIdx].high - Math.max(resampledPrices[prevIdx].open, resampledPrices[prevIdx].close)).toFixed(2)),
      lowerWick: parseFloat((Math.min(resampledPrices[prevIdx].open, resampledPrices[prevIdx].close) - resampledPrices[prevIdx].low).toFixed(2)),
      isBullishCandle: resampledPrices[prevIdx].close > resampledPrices[prevIdx].open ? 1 : 0,
      isDoji: Math.abs(resampledPrices[prevIdx].close - resampledPrices[prevIdx].open) < (resampledPrices[prevIdx].high - resampledPrices[prevIdx].low) * 0.1 ? 1 : 0,
      
      // Price gaps
      gapUp: resampledPrices[prevIdx].open > resampledPrices[prevPrevIdx]?.close ? 1 : 0,
      gapDown: resampledPrices[prevIdx].open < resampledPrices[prevPrevIdx]?.close ? 1 : 0,
      
      // Returns
      return1d: prevIdx >= 2 ? parseFloat(((resampledPrices[prevIdx].close - resampledPrices[prevPrevIdx].close) / resampledPrices[prevPrevIdx].close * 100).toFixed(4)) : null,
      return3d: prevIdx >= 4 ? parseFloat(((resampledPrices[prevIdx].close - resampledPrices[prevIdx - 3].close) / resampledPrices[prevIdx - 3].close * 100).toFixed(4)) : null,
      return5d: prevIdx >= 6 ? parseFloat(((resampledPrices[prevIdx].close - resampledPrices[prevIdx - 5].close) / resampledPrices[prevIdx - 5].close * 100).toFixed(4)) : null,
      
      // ============ ADVANCED BULLISH DETECTION INDICATORS ============
      
      // RSI Momentum: RSI naik dari hari sebelumnya
      rsiRising: (prevPrevIdx >= 0 && indicators.rsi[prevIdx] && indicators.rsi[prevPrevIdx] &&
        indicators.rsi[prevIdx] > indicators.rsi[prevPrevIdx]) ? 1 : 0,
      // RSI keluar dari oversold (cross di atas 30)
      rsiExitOversold: (prevPrevIdx >= 0 && indicators.rsi[prevIdx] && indicators.rsi[prevPrevIdx] &&
        indicators.rsi[prevPrevIdx] < 30 && indicators.rsi[prevIdx] >= 30) ? 1 : 0,
      // RSI dalam zona bullish awal (30-50) - potensi naik
      rsiBullishZone: (indicators.rsi[prevIdx] && indicators.rsi[prevIdx] >= 30 && indicators.rsi[prevIdx] <= 50) ? 1 : 0,
      
      // Stochastic Golden Cross (%K cross di atas %D)
      stochGoldenCross: (prevPrevIdx >= 0 && indicators.stoch[prevIdx] && indicators.stoch[prevPrevIdx] &&
        indicators.stoch[prevPrevIdx].k <= indicators.stoch[prevPrevIdx].d &&
        indicators.stoch[prevIdx].k > indicators.stoch[prevIdx].d) ? 1 : 0,
      // Stochastic keluar dari oversold
      stochExitOversold: (prevPrevIdx >= 0 && indicators.stoch[prevIdx] && indicators.stoch[prevPrevIdx] &&
        indicators.stoch[prevPrevIdx].k < 20 && indicators.stoch[prevIdx].k >= 20) ? 1 : 0,
      
      // Volume surge dengan harga naik (bullish volume)
      bullishVolume: (indicators.volumeRatio[prevIdx] && indicators.volumeRatio[prevIdx] > 1.2 && 
        resampledPrices[prevIdx].close > resampledPrices[prevIdx].open) ? 1 : 0,
      // Volume spike (>2x average)
      volumeSpike: indicators.volumeRatio[prevIdx] && indicators.volumeRatio[prevIdx] > 2 ? 1 : 0,
      
      // Price near lower Bollinger Band (potential bounce zone)
      nearLowerBB: (indicators.bb[prevIdx] && prevClose <= indicators.bb[prevIdx].lower * 1.02) ? 1 : 0,
      // Price bouncing from lower BB
      bouncingFromLowerBB: (prevPrevIdx >= 0 && indicators.bb[prevIdx] && indicators.bb[prevPrevIdx] &&
        resampledPrices[prevPrevIdx].close <= indicators.bb[prevPrevIdx].lower &&
        resampledPrices[prevIdx].close > indicators.bb[prevIdx].lower) ? 1 : 0,
      // BB Width sempit (potensi breakout)
      bbSqueeze: (indicators.bb[prevIdx] && 
        ((indicators.bb[prevIdx].upper - indicators.bb[prevIdx].lower) / indicators.bb[prevIdx].middle * 100) < 5) ? 1 : 0,
      
      // ADX Rising (trend strengthening)
      adxRising: (prevPrevIdx >= 0 && indicators.adx[prevIdx] && indicators.adx[prevPrevIdx] &&
        indicators.adx[prevIdx].adx > indicators.adx[prevPrevIdx].adx) ? 1 : 0,
      // Bullish DI Cross (+DI cross di atas -DI)
      bullishDICross: (prevPrevIdx >= 0 && indicators.adx[prevIdx] && indicators.adx[prevPrevIdx] &&
        indicators.adx[prevPrevIdx].pdi <= indicators.adx[prevPrevIdx].mdi &&
        indicators.adx[prevIdx].pdi > indicators.adx[prevIdx].mdi) ? 1 : 0,
      
      // Hammer/Bullish Reversal Candle Pattern
      hammerCandle: (resampledPrices[prevIdx].high - resampledPrices[prevIdx].low > 0 &&
        (Math.min(resampledPrices[prevIdx].open, resampledPrices[prevIdx].close) - resampledPrices[prevIdx].low) > 
        (resampledPrices[prevIdx].high - resampledPrices[prevIdx].low) * 0.6 &&
        Math.abs(resampledPrices[prevIdx].close - resampledPrices[prevIdx].open) < 
        (resampledPrices[prevIdx].high - resampledPrices[prevIdx].low) * 0.3) ? 1 : 0,
      // Bullish engulfing
      bullishEngulfing: (prevPrevIdx >= 0 && 
        resampledPrices[prevPrevIdx].close < resampledPrices[prevPrevIdx].open && // Previous bearish
        resampledPrices[prevIdx].close > resampledPrices[prevIdx].open && // Current bullish
        resampledPrices[prevIdx].close > resampledPrices[prevPrevIdx].open && // Body engulfs
        resampledPrices[prevIdx].open < resampledPrices[prevPrevIdx].close) ? 1 : 0,
      
      // Multi-indicator bullish confluence score (0-10)
      bullishScore: (() => {
        let score = 0;
        // RSI bullish signals
        if (indicators.rsi[prevIdx] < 40) score += 1; // Not overbought
        if (indicators.rsi[prevIdx] > indicators.rsi[prevPrevIdx]) score += 1; // Rising RSI
        // MACD bullish signals
        if (indicators.macd[prevIdx]?.histogram > indicators.macd[prevPrevIdx]?.histogram) score += 1; // Histogram improving
        if (indicators.macd[prevIdx]?.MACD > indicators.macd[prevIdx]?.signal) score += 1; // Bullish MACD
        // Volume confirmation
        if (indicators.volumeRatio[prevIdx] > 1.2) score += 1; // Above average volume
        if (indicators.obv[prevIdx] > indicators.obv[prevPrevIdx]) score += 1; // OBV rising
        // Trend indicators
        if (indicators.adx[prevIdx]?.pdi > indicators.adx[prevIdx]?.mdi) score += 1; // Bullish DI
        if (resampledPrices[prevIdx].close > resampledPrices[prevIdx].open) score += 1; // Bullish candle
        // Price position
        if (indicators.stoch[prevIdx]?.k < 50) score += 1; // Not overbought stoch
        if (prevClose > indicators.sma20[prevIdx]) score += 1; // Above SMA20
        return score;
      })(),
      
      // Distance & Support Level Detection
      // Calculate 52-week (250-day) high and low
      highestHigh52w: (() => {
        const period = Math.min(250, prevIdx + 1);
        if (period < 2) return null;
        const prices52w = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        return Math.max(...prices52w.map(p => p.high));
      })(),
      lowestLow52w: (() => {
        const period = Math.min(250, prevIdx + 1);
        if (period < 2) return null;
        const prices52w = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        return Math.min(...prices52w.map(p => p.low));
      })(),
      
      // % distance from 52-week high (positive = below high)
      distFromHigh52w: (() => {
        const period = Math.min(250, prevIdx + 1);
        if (period < 2) return null;
        const prices52w = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        const high52w = Math.max(...prices52w.map(p => p.high));
        if (high52w === 0) return null;
        return ((high52w - prevClose) / high52w) * 100; // % distance from 52w high
      })(),
      
      // 1 jika harga jauh dari 52-week high (>30%)
      farFromHigh52w: (() => {
        const period = Math.min(250, prevIdx + 1);
        if (period < 2) return 0;
        const prices52w = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        const high52w = Math.max(...prices52w.map(p => p.high));
        if (high52w === 0) return 0;
        const dist = ((high52w - prevClose) / high52w) * 100;
        return dist > 30 ? 1 : 0;
      })(),
      
      // 1 jika harga sangat jauh dari 52-week high (>50%)
      veryFarFromHigh52w: (() => {
        const period = Math.min(250, prevIdx + 1);
        if (period < 2) return 0;
        const prices52w = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        const high52w = Math.max(...prices52w.map(p => p.high));
        if (high52w === 0) return 0;
        const dist = ((high52w - prevClose) / high52w) * 100;
        return dist > 50 ? 1 : 0;
      })(),
      
      // % distance from 52-week low (positive = above low)
      distFromLow52w: (() => {
        const period = Math.min(250, prevIdx + 1);
        if (period < 2) return null;
        const prices52w = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        const low52w = Math.min(...prices52w.map(p => p.low));
        if (low52w === 0) return null;
        return ((prevClose - low52w) / low52w) * 100; // % distance dari 52w low
      })(),
      
      // 1 jika dekat dengan 52-week low (<10%)
      nearLow52w: (() => {
        const period = Math.min(250, prevIdx + 1);
        if (period < 2) return 0;
        const prices52w = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        const low52w = Math.min(...prices52w.map(p => p.low));
        if (low52w === 0) return 0;
        const dist = ((prevClose - low52w) / low52w) * 100;
        return dist < 10 ? 1 : 0;
      })(),
      
      // Calculate support level (lowest low dari 50 hari terakhir)
      supportLevel50d: (() => {
        const period = Math.min(50, prevIdx + 1);
        if (period < 2) return null;
        const prices50 = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        return Math.min(...prices50.map(p => p.low));
      })(),
      
      // Calculate resistance level (highest high dari 50 hari terakhir)
      resistanceLevel50d: (() => {
        const period = Math.min(50, prevIdx + 1);
        if (period < 2) return null;
        const prices50 = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        return Math.max(...prices50.map(p => p.high));
      })(),
      
      // % distance dari support level
      distFromSupport: (() => {
        const period = Math.min(50, prevIdx + 1);
        if (period < 2) return null;
        const prices50 = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        const supportLvl = Math.min(...prices50.map(p => p.low));
        if (supportLvl === 0) return null;
        return ((prevClose - supportLvl) / supportLvl) * 100;
      })(),
      
      // 1 jika dekat dengan support level (<5%)
      nearSupport: (() => {
        const period = Math.min(50, prevIdx + 1);
        if (period < 2) return 0;
        const prices50 = resampledPrices.slice(Math.max(0, prevIdx - period + 1), prevIdx + 1);
        const supportLvl = Math.min(...prices50.map(p => p.low));
        if (supportLvl === 0) return 0;
        const dist = ((prevClose - supportLvl) / supportLvl) * 100;
        return dist < 5 ? 1 : 0;
      })(),
      
      // 1 jika dekat dengan support tapi tidak terlalu jauh dari high (recovery potential)
      recoveryPotential: (() => {
        const period52w = Math.min(250, prevIdx + 1);
        const period50d = Math.min(50, prevIdx + 1);
        if (period52w < 2 || period50d < 2) return 0;
        
        const prices52w = resampledPrices.slice(Math.max(0, prevIdx - period52w + 1), prevIdx + 1);
        const prices50 = resampledPrices.slice(Math.max(0, prevIdx - period50d + 1), prevIdx + 1);
        
        const high52w = Math.max(...prices52w.map(p => p.high));
        const supportLvl = Math.min(...prices50.map(p => p.low));
        
        if (high52w === 0 || supportLvl === 0) return 0;
        
        // Dekat support (<8%) dan jauh dari high (>20%)
        const distFromSup = ((prevClose - supportLvl) / supportLvl) * 100;
        const distFromHigh = ((high52w - prevClose) / high52w) * 100;
        
        return (distFromSup < 8 && distFromHigh > 20) ? 1 : 0;
      })(),

      // Parabolic SAR Reversal Detection
      psar: safeToFixed(indicators.psar[prevIdx]),
      psarAbovePrice: indicators.psar[prevIdx] && prevClose < indicators.psar[prevIdx] ? 1 : 0,
      psarBelowPrice: indicators.psar[prevIdx] && prevClose > indicators.psar[prevIdx] ? 1 : 0,
      psarNearPrice: (() => {
        if (!indicators.psar[prevIdx]) return 0;
        const distance = Math.abs(prevClose - indicators.psar[prevIdx]);
        const percentDist = (distance / prevClose) * 100;
        return percentDist < 2 ? 1 : 0; // Jika SAR dalam 2% dari harga
      })(),
      psarBearishReversal: (() => {
        if (prevIdx < 1 || !indicators.psar[prevIdx] || !indicators.psar[prevPrevIdx]) return 0;
        // Reversal dari bullish ke bearish: SAR cross dari bawah ke atas
        const prevWasBullish = prevClose > indicators.psar[prevPrevIdx];
        const nowBearish = prevClose < indicators.psar[prevIdx];
        return (prevWasBullish && nowBearish) ? 1 : 0;
      })(),
      psarAboutToReversal: (() => {
        if (!indicators.psar[prevIdx] || prevIdx < 5) return 0;
        // Jika SAR sangat dekat (<3%) dan bergerak menuju crossing
        const distance = Math.abs(prevClose - indicators.psar[prevIdx]);
        const percentDist = (distance / prevClose) * 100;
        return percentDist < 3 ? 1 : 0; // Warning signal, akan reversal
      })(),
      psarBullishReversal: (() => {
        if (prevIdx < 1 || !indicators.psar[prevIdx] || !indicators.psar[prevPrevIdx]) return 0;
        // Reversal dari bearish ke bullish: SAR cross dari atas ke bawah harga
        const prevWasBearish = resampledPrices[prevPrevIdx].close < indicators.psar[prevPrevIdx];
        const nowBullish = prevClose > indicators.psar[prevIdx];
        return (prevWasBearish && nowBullish) ? 1 : 0;
      })(),
      psarAboutToBullishReversal: (() => {
        if (!indicators.psar[prevIdx] || prevIdx < 5) return 0;
        // SAR di atas harga dan sangat dekat (<3%), akan pindah ke bawah
        if (indicators.psar[prevIdx] <= prevClose) return 0; // SAR sudah di bawah, skip
        const distance = indicators.psar[prevIdx] - prevClose;
        const percentDist = (distance / prevClose) * 100;
        return percentDist < 3 ? 1 : 0; // Warning: SAR di atas tapi dekat, akan bullish reversal
      })(),
      
      // Composite signals
      oversoldBounce: ((indicators.rsi[prevIdx] < 35 || indicators.stoch[prevIdx]?.k < 25) &&
        resampledPrices[prevIdx].close > resampledPrices[prevIdx].open && // Bullish candle
        indicators.volumeRatio[prevIdx] > 1) ? 1 : 0,
      
      momentumShift: (indicators.macd[prevIdx]?.histogram > indicators.macd[prevPrevIdx]?.histogram &&
        indicators.rsi[prevIdx] > indicators.rsi[prevPrevIdx] &&
        indicators.adx[prevIdx]?.pdi > indicators.adx[prevIdx]?.mdi) ? 1 : 0,
    };

    return row;
  }

  // Get intraday indicators - using current day's partial data as latest candle
  getIntradayIndicators(prices) {
    if (prices.length < 60) {
      return { error: 'Not enough historical data' };
    }

    const indicators = this.calculateIndicatorsForRegression(prices);
    
    // Calculate additional indicators not in calculateIndicatorsForRegression
    const ema9 = this.calculateEMA(prices, 9);
    const ema21 = this.calculateEMA(prices, 21);
    const trix = this.calculateTRIX ? this.calculateTRIX(prices) : Array(prices.length).fill(null);
    const ichimoku = this.calculateIchimoku ? this.calculateIchimoku(prices) : Array(prices.length).fill(null);
    const psar = this.calculateParabolicSAR ? this.calculateParabolicSAR(prices) : Array(prices.length).fill(null);
    const supertrend = this.calculateSuperTrend ? this.calculateSuperTrend(prices) : Array(prices.length).fill(null);
    const vwap = this.calculateVWAP ? this.calculateVWAP(prices) : Array(prices.length).fill(null);
    
    // Use the last index (today's partial data) as the "current" day
    const i = prices.length - 1;
    const prevIdx = i - 1;
    const prevPrevIdx = i - 2;
    
    const currentPrice = prices[i];
    const prevPrice = prices[prevIdx];
    
    // Safely get current price values with fallbacks
    const currentClose = currentPrice.close || 0;
    const currentHigh = currentPrice.high || currentClose;
    const currentLow = currentPrice.low || currentClose;
    const currentOpen = currentPrice.open || currentClose;
    const currentRange = currentHigh - currentLow || 0;
    const currentVolume = currentPrice.volume || 0;
    const prevClosePrice = prevPrice?.close || currentClose;
    
    // Close Position
    const closePosition = currentRange > 0 ? (currentClose - currentLow) / currentRange : 0.5;
    
    // Body/Range Ratio
    const bodySize = Math.abs(currentClose - currentOpen) || 0;
    const bodyRangeRatio = currentRange > 0 ? bodySize / currentRange : 0;
    
    // Delta indicators (comparing current with previous day)
    const deltaRSI = (indicators.rsi[i] !== null && indicators.rsi[prevIdx] !== null)
      ? indicators.rsi[i] - indicators.rsi[prevIdx] : null;
    
    const deltaMACDHist = (indicators.macd[i]?.histogram !== undefined && indicators.macd[prevIdx]?.histogram !== undefined)
      ? indicators.macd[i].histogram - indicators.macd[prevIdx].histogram : null;
    
    const deltaStochK = (indicators.stoch[i]?.k !== undefined && indicators.stoch[prevIdx]?.k !== undefined)
      ? indicators.stoch[i].k - indicators.stoch[prevIdx].k : null;
    
    const deltaADX = (indicators.adx[i]?.adx !== undefined && indicators.adx[prevIdx]?.adx !== undefined)
      ? indicators.adx[i].adx - indicators.adx[prevIdx].adx : null;
    
    const deltaCCI = (indicators.cci[i] !== null && indicators.cci[prevIdx] !== null)
      ? indicators.cci[i] - indicators.cci[prevIdx] : null;
    
    const deltaMFI = (indicators.mfi[i] !== null && indicators.mfi[prevIdx] !== null)
      ? indicators.mfi[i] - indicators.mfi[prevIdx] : null;

    // Current change from previous close
    const priceChange = currentClose - prevClosePrice;
    const priceChangePercent = prevClosePrice > 0 ? (priceChange / prevClosePrice) * 100 : 0;

    // Helper function to safely format numbers
    const safeToFixed = (val, decimals = 2) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      return parseFloat(Number(val).toFixed(decimals));
    };

    const row = {
      // Meta info
      symbol: null, // Will be set by caller
      indicatorDate: currentPrice.date,
      isIntraday: true,
      marketStatus: 'LIVE',
      
      // Current price data (today's partial/live data)
      currentOpen: safeToFixed(currentOpen),
      currentHigh: safeToFixed(currentHigh),
      currentLow: safeToFixed(currentLow),
      currentClose: safeToFixed(currentClose),
      currentVolume: currentVolume || 0,
      prevClose: safeToFixed(prevClosePrice),
      priceChange: safeToFixed(priceChange),
      priceChangePercent: safeToFixed(priceChangePercent),
      
      // ML Features based on current partial data
      closePosition: safeToFixed(closePosition, 4),
      bodyRangeRatio: safeToFixed(bodyRangeRatio, 4),
      upperWickRatio: currentRange > 0 ? safeToFixed((currentHigh - Math.max(currentOpen, currentClose)) / currentRange, 4) : 0,
      lowerWickRatio: currentRange > 0 ? safeToFixed((Math.min(currentOpen, currentClose) - currentLow) / currentRange, 4) : 0,
      
      // Delta indicators
      deltaRSI: safeToFixed(deltaRSI),
      deltaMACDHist: safeToFixed(deltaMACDHist, 4),
      deltaStochK: safeToFixed(deltaStochK),
      deltaADX: safeToFixed(deltaADX),
      deltaCCI: safeToFixed(deltaCCI),
      deltaMFI: safeToFixed(deltaMFI),
      
      // SMA indicators (using current price in calculation)
      sma5: safeToFixed(indicators.sma5[i]),
      sma10: safeToFixed(indicators.sma10[i]),
      sma20: safeToFixed(indicators.sma20[i]),
      sma50: safeToFixed(indicators.sma50[i]),
      
      // EMA indicators
      ema9: safeToFixed(ema9[i]),
      ema12: safeToFixed(indicators.ema12[i]),
      ema21: safeToFixed(ema21[i]),
      ema26: safeToFixed(indicators.ema26[i]),
      
      // SMA Distance
      distanceFromSMA5: indicators.sma5[i] ? safeToFixed((currentClose - indicators.sma5[i]) / indicators.sma5[i] * 100, 4) : null,
      distanceFromSMA10: indicators.sma10[i] ? safeToFixed((currentClose - indicators.sma10[i]) / indicators.sma10[i] * 100, 4) : null,
      distanceFromSMA20: indicators.sma20[i] ? safeToFixed((currentClose - indicators.sma20[i]) / indicators.sma20[i] * 100, 4) : null,
      distanceFromSMA50: indicators.sma50[i] ? safeToFixed((currentClose - indicators.sma50[i]) / indicators.sma50[i] * 100, 4) : null,
      
      // Price vs SMAs (above/below)
      aboveSMA5: indicators.sma5[i] && currentClose > indicators.sma5[i] ? 1 : 0,
      aboveSMA10: indicators.sma10[i] && currentClose > indicators.sma10[i] ? 1 : 0,
      aboveSMA20: indicators.sma20[i] && currentClose > indicators.sma20[i] ? 1 : 0,
      aboveSMA50: indicators.sma50[i] && currentClose > indicators.sma50[i] ? 1 : 0,
      
      // RSI
      rsi: safeToFixed(indicators.rsi[i]),
      rsiOversold: indicators.rsi[i] && indicators.rsi[i] < 30 ? 1 : 0,
      rsiOverbought: indicators.rsi[i] && indicators.rsi[i] > 70 ? 1 : 0,
      rsiNeutral: indicators.rsi[i] && indicators.rsi[i] >= 30 && indicators.rsi[i] <= 70 ? 1 : 0,
      
      // MACD
      macd: safeToFixed(indicators.macd[i]?.MACD, 4),
      macdSignal: safeToFixed(indicators.macd[i]?.signal, 4),
      macdHistogram: safeToFixed(indicators.macd[i]?.histogram, 4),
      macdBullish: indicators.macd[i] && indicators.macd[i].histogram > 0 ? 1 : 0,
      macdGoldenCross: indicators.macd[i] && indicators.macd[prevIdx] && 
        indicators.macd[prevIdx].MACD <= indicators.macd[prevIdx].signal && 
        indicators.macd[i].MACD > indicators.macd[i].signal ? 1 : 0,
      macdDeathCross: indicators.macd[i] && indicators.macd[prevIdx] && 
        indicators.macd[prevIdx].MACD >= indicators.macd[prevIdx].signal && 
        indicators.macd[i].MACD < indicators.macd[i].signal ? 1 : 0,
      // MACD Near Golden Cross Detection
      macdNearGoldenCross: indicators.macd[i] && indicators.macd[prevIdx] &&
        indicators.macd[i].histogram < 0 && // Masih di bawah signal
        indicators.macd[i].histogram > indicators.macd[prevIdx].histogram ? 1 : 0, // Tapi histogram naik
      macdHistogramConverging: indicators.macd[i] && indicators.macd[i].histogram < 0 &&
        Math.abs(indicators.macd[i].histogram) < Math.abs(indicators.macd[i].MACD) * 0.25 ? 1 : 0,
      macdHistogramRising: (prevIdx >= 1 && indicators.macd[i] && indicators.macd[prevIdx] && indicators.macd[prevIdx - 1] &&
        indicators.macd[i].histogram > indicators.macd[prevIdx].histogram &&
        indicators.macd[prevIdx].histogram > indicators.macd[prevIdx - 1].histogram) ? 1 : 0,
      macdDistanceToSignal: indicators.macd[i] && indicators.macd[i].signal !== 0 ? 
        safeToFixed((indicators.macd[i].MACD - indicators.macd[i].signal) / Math.abs(indicators.macd[i].signal) * 100, 2) : null,
      macdCrossUp: indicators.macd[i] && indicators.macd[prevIdx] && 
        indicators.macd[prevIdx].histogram <= 0 && indicators.macd[i].histogram > 0 ? 1 : 0,
      macdCrossDown: indicators.macd[i] && indicators.macd[prevIdx] && 
        indicators.macd[prevIdx].histogram >= 0 && indicators.macd[i].histogram < 0 ? 1 : 0,
      
      // Bollinger Bands
      bbUpper: safeToFixed(indicators.bb[i]?.upper),
      bbMiddle: safeToFixed(indicators.bb[i]?.middle),
      bbLower: safeToFixed(indicators.bb[i]?.lower),
      bbWidth: indicators.bb[i]?.middle ? safeToFixed((indicators.bb[i].upper - indicators.bb[i].lower) / indicators.bb[i].middle * 100, 4) : null,
      bbPosition: indicators.bb[i] && (indicators.bb[i].upper - indicators.bb[i].lower) > 0 ? safeToFixed((currentClose - indicators.bb[i].lower) / (indicators.bb[i].upper - indicators.bb[i].lower), 4) : null,
      nearBBUpper: indicators.bb[i] && currentClose > indicators.bb[i].upper * 0.98 ? 1 : 0,
      nearBBLower: indicators.bb[i] && currentClose < indicators.bb[i].lower * 1.02 ? 1 : 0,
      
      // Stochastic
      stochK: safeToFixed(indicators.stoch[i]?.k),
      stochD: safeToFixed(indicators.stoch[i]?.d),
      stochOversold: indicators.stoch[i] && indicators.stoch[i].k < 20 ? 1 : 0,
      stochOverbought: indicators.stoch[i] && indicators.stoch[i].k > 80 ? 1 : 0,
      
      // ADX
      adx: safeToFixed(indicators.adx[i]?.adx),
      plusDI: safeToFixed(indicators.adx[i]?.pdi),
      minusDI: safeToFixed(indicators.adx[i]?.mdi),
      strongTrend: indicators.adx[i] && indicators.adx[i].adx > 25 ? 1 : 0,
      bullishDI: indicators.adx[i] && indicators.adx[i].pdi > indicators.adx[i].mdi ? 1 : 0,
      
      // ATR
      atr: safeToFixed(indicators.atr[i]),
      atrPercent: indicators.atr[i] && currentClose > 0 ? safeToFixed(indicators.atr[i] / currentClose * 100, 4) : null,
      
      // OBV
      obv: indicators.obv[i] || null,
      obvTrend: indicators.obv[i] && indicators.obv[prevIdx] && indicators.obv[i] > indicators.obv[prevIdx] ? 1 : 0,
      
      // Williams %R
      williamsR: safeToFixed(indicators.williamsR[i]),
      williamsROversold: indicators.williamsR[i] && indicators.williamsR[i] < -80 ? 1 : 0,
      williamsROverbought: indicators.williamsR[i] && indicators.williamsR[i] > -20 ? 1 : 0,
      
      // CCI
      cci: safeToFixed(indicators.cci[i]),
      cciOversold: indicators.cci[i] && indicators.cci[i] < -100 ? 1 : 0,
      cciOverbought: indicators.cci[i] && indicators.cci[i] > 100 ? 1 : 0,
      
      // MFI
      mfi: safeToFixed(indicators.mfi[i]),
      mfiOversold: indicators.mfi[i] && indicators.mfi[i] < 20 ? 1 : 0,
      mfiOverbought: indicators.mfi[i] && indicators.mfi[i] > 80 ? 1 : 0,
      
      // ROC
      roc: safeToFixed(indicators.roc[i], 4),
      
      // Momentum
      momentum: safeToFixed(indicators.momentum[i]),
      
      // TRIX
      trix: safeToFixed(trix[i], 4),
      
      // Ichimoku
      tenkanSen: safeToFixed(ichimoku[i]?.conversion),
      kijunSen: safeToFixed(ichimoku[i]?.base),
      senkouSpanA: safeToFixed(ichimoku[i]?.spanA),
      senkouSpanB: safeToFixed(ichimoku[i]?.spanB),
      aboveCloud: ichimoku[i] && currentClose > Math.max(ichimoku[i].spanA || 0, ichimoku[i].spanB || 0) ? 1 : 0,
      belowCloud: ichimoku[i] && currentClose < Math.min(ichimoku[i].spanA || Infinity, ichimoku[i].spanB || Infinity) ? 1 : 0,
      
      // Parabolic SAR
      psar: safeToFixed(psar[i]),
      psarBullish: psar[i] && currentClose > psar[i] ? 1 : 0,
      psarAbovePrice: psar[i] && currentClose < psar[i] ? 1 : 0,
      psarBelowPrice: psar[i] && currentClose > psar[i] ? 1 : 0,
      psarNearPrice: (() => {
        if (!psar[i]) return 0;
        const distance = Math.abs(currentClose - psar[i]);
        const percentDist = (distance / currentClose) * 100;
        return percentDist < 2 ? 1 : 0;
      })(),
      psarBearishReversal: (() => {
        if (prevIdx < 0 || !psar[i] || !psar[prevIdx]) return 0;
        const prevWasBullish = prevClosePrice > psar[prevIdx];
        const nowBearish = currentClose < psar[i];
        return (prevWasBullish && nowBearish) ? 1 : 0;
      })(),
      psarBullishReversal: (() => {
        if (prevIdx < 0 || !psar[i] || !psar[prevIdx]) return 0;
        const prevWasBearish = prevClosePrice < psar[prevIdx];
        const nowBullish = currentClose > psar[i];
        return (prevWasBearish && nowBullish) ? 1 : 0;
      })(),
      psarAboutToReversal: (() => {
        if (!psar[i]) return 0;
        const distance = Math.abs(currentClose - psar[i]);
        const percentDist = (distance / currentClose) * 100;
        return percentDist < 3 ? 1 : 0;
      })(),
      psarAboutToBullishReversal: (() => {
        if (!psar[i]) return 0;
        if (psar[i] <= currentClose) return 0;
        const distance = psar[i] - currentClose;
        const percentDist = (distance / currentClose) * 100;
        return percentDist < 3 ? 1 : 0;
      })(),
      
      // SuperTrend
      supertrend: safeToFixed(supertrend[i]),
      supertrendBullish: supertrend[i] && currentClose > supertrend[i] ? 1 : 0,
      
      // VWAP
      vwap: safeToFixed(vwap[i]),
      aboveVWAP: vwap[i] && currentClose > vwap[i] ? 1 : 0,
      
      // Price Position (within recent range)
      pricePosition: safeToFixed(indicators.pricePosition[i]),
      
      // Volume Ratio
      volumeRatio: safeToFixed(indicators.volumeRatio[i], 4),
      highVolume: indicators.volumeRatio[i] && indicators.volumeRatio[i] > 1.5 ? 1 : 0,
      
      // Candlestick patterns (current candle)
      bodySize: safeToFixed(bodySize),
      upperWick: safeToFixed(currentHigh - Math.max(currentOpen, currentClose)),
      lowerWick: safeToFixed(Math.min(currentOpen, currentClose) - currentLow),
      isBullishCandle: currentClose > currentOpen ? 1 : 0,
      isDoji: bodySize < currentRange * 0.1 ? 1 : 0,
      
      // Price gaps (comparing current open to previous close)
      gapUp: currentOpen > prevClosePrice ? 1 : 0,
      gapDown: currentOpen < prevClosePrice ? 1 : 0,
      gapPercent: prevClosePrice > 0 ? safeToFixed((currentOpen - prevClosePrice) / prevClosePrice * 100, 4) : 0,
      
      // Returns (based on current close)
      return1d: safeToFixed(priceChangePercent, 4),
      return3d: i >= 3 && prices[i - 3]?.close ? safeToFixed((currentClose - prices[i - 3].close) / prices[i - 3].close * 100, 4) : null,
      return5d: i >= 5 && prices[i - 5]?.close ? safeToFixed((currentClose - prices[i - 5].close) / prices[i - 5].close * 100, 4) : null,
    };

    return row;
  }
}

module.exports = new IndicatorService();
