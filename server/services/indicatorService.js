const {
  SMA, EMA, RSI, MACD, BollingerBands, Stochastic, ADX, ATR, OBV, VWAP
} = require('technicalindicators');

class IndicatorService {
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

    return {
      sma5, sma10, sma20, sma50,
      ema5, ema10, ema12, ema26, ema21, ema21High, ema21Low,
      rsi, macd, bb, stoch, adx, atr, obv,
      williamsR, cci, mfi, roc, momentum, pricePosition, volumeRatio
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
        
        // Price vs MA signals
        priceAboveSMA5: prevClose > (indicators.sma5[prevIdx] || 0) ? 1 : 0,
        priceAboveSMA10: prevClose > (indicators.sma10[prevIdx] || 0) ? 1 : 0,
        priceAboveSMA20: prevClose > (indicators.sma20[prevIdx] || 0) ? 1 : 0,
        priceAboveSMA50: prevClose > (indicators.sma50[prevIdx] || 0) ? 1 : 0,
        priceAboveEMA12: prevClose > (indicators.ema12[prevIdx] || 0) ? 1 : 0,
        priceAboveEMA26: prevClose > (indicators.ema26[prevIdx] || 0) ? 1 : 0,
        
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
  // Returns indicators from the day before (H-1)
  getIndicatorsForDate(prices, targetDate) {
    const indicators = this.calculateIndicatorsForRegression(prices);
    
    const targetDateStr = new Date(targetDate).toISOString().split('T')[0];
    const lastPriceDate = new Date(prices[prices.length - 1].date).toISOString().split('T')[0];
    const targetDateObj = new Date(targetDate);
    const lastPriceDateObj = new Date(prices[prices.length - 1].date);
    
    let targetIdx = -1;
    let isFutureDate = false;
    
    // Check if target date is in the future (after last available data)
    if (targetDateObj > lastPriceDateObj) {
      // For future dates, use the last available data as "today" (H)
      // and calculate indicators from H-1
      targetIdx = prices.length - 1;
      isFutureDate = true;
    } else {
      // Find the index of target date (H)
      for (let i = 0; i < prices.length; i++) {
        const priceDate = new Date(prices[i].date).toISOString().split('T')[0];
        if (priceDate === targetDateStr) {
          targetIdx = i;
          break;
        }
      }

      // If target date not found, find the nearest date after
      if (targetIdx === -1) {
        for (let i = 0; i < prices.length; i++) {
          const priceDate = new Date(prices[i].date);
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
    
    const prevClose = prices[prevIdx].close;
    const prevHigh = prices[prevIdx].high;
    const prevLow = prices[prevIdx].low;
    const prevOpen = prices[prevIdx].open;
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
      date: prices[i].date,
      open: prices[i].open,
      high: prices[i].high,
      low: prices[i].low,
      close: prices[i].close,
      volume: prices[i].volume,
      priceChange: prices[i].close - prevClose,
      priceChangePercent: ((prices[i].close - prevClose) / prevClose) * 100
    };

    const row = {
      // Meta info
      symbol: null, // Will be set by caller
      targetDate: isFutureDate ? targetDate : prices[i].date,
      indicatorDate: prices[prevIdx].date,
      isFutureDate: isFutureDate,
      
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
      
      // Distance from MA
      distFromSMA5: indicators.sma5[prevIdx] ? parseFloat(((prevClose - indicators.sma5[prevIdx]) / indicators.sma5[prevIdx] * 100).toFixed(4)) : null,
      distFromSMA20: indicators.sma20[prevIdx] ? parseFloat(((prevClose - indicators.sma20[prevIdx]) / indicators.sma20[prevIdx] * 100).toFixed(4)) : null,
      distFromSMA50: indicators.sma50[prevIdx] ? parseFloat(((prevClose - indicators.sma50[prevIdx]) / indicators.sma50[prevIdx] * 100).toFixed(4)) : null,
      
      // SMA crossover signals
      sma5AboveSMA10: (indicators.sma5[prevIdx] || 0) > (indicators.sma10[prevIdx] || 0) ? 1 : 0,
      sma10AboveSMA20: (indicators.sma10[prevIdx] || 0) > (indicators.sma20[prevIdx] || 0) ? 1 : 0,
      sma20AboveSMA50: (indicators.sma20[prevIdx] || 0) > (indicators.sma50[prevIdx] || 0) ? 1 : 0,
      
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
      bodySize: parseFloat(Math.abs(prices[prevIdx].close - prices[prevIdx].open).toFixed(2)),
      upperWick: parseFloat((prices[prevIdx].high - Math.max(prices[prevIdx].open, prices[prevIdx].close)).toFixed(2)),
      lowerWick: parseFloat((Math.min(prices[prevIdx].open, prices[prevIdx].close) - prices[prevIdx].low).toFixed(2)),
      isBullishCandle: prices[prevIdx].close > prices[prevIdx].open ? 1 : 0,
      isDoji: Math.abs(prices[prevIdx].close - prices[prevIdx].open) < (prices[prevIdx].high - prices[prevIdx].low) * 0.1 ? 1 : 0,
      
      // Price gaps
      gapUp: prices[prevIdx].open > prices[prevPrevIdx]?.close ? 1 : 0,
      gapDown: prices[prevIdx].open < prices[prevPrevIdx]?.close ? 1 : 0,
      
      // Returns
      return1d: prevIdx >= 2 ? parseFloat(((prices[prevIdx].close - prices[prevPrevIdx].close) / prices[prevPrevIdx].close * 100).toFixed(4)) : null,
      return3d: prevIdx >= 4 ? parseFloat(((prices[prevIdx].close - prices[prevIdx - 3].close) / prices[prevIdx - 3].close * 100).toFixed(4)) : null,
      return5d: prevIdx >= 6 ? parseFloat(((prices[prevIdx].close - prices[prevIdx - 5].close) / prices[prevIdx - 5].close * 100).toFixed(4)) : null,
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
