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

  // Calculate OBV (On Balance Volume)
  calculateOBV(prices) {
    const values = OBV.calculate({
      close: prices.map(p => p.close),
      volume: prices.map(p => p.volume)
    });
    
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
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
      ema5, ema10, ema12, ema26,
      rsi, macd, bb, stoch, adx, atr, obv,
      williamsR, cci, mfi, roc, momentum, pricePosition, volumeRatio
    };
  }

  // Generate regression dataset with indicators from H-1 and target from H
  generateRegressionDataset(prices, startDate, endDate) {
    const indicators = this.calculateIndicatorsForRegression(prices);
    const dataset = [];

    for (let i = 1; i < prices.length; i++) {
      const currentDate = new Date(prices[i].date);
      const prevDate = new Date(prices[i - 1].date);
      
      // Filter by date range
      if (startDate && currentDate < new Date(startDate)) continue;
      if (endDate && currentDate > new Date(endDate)) continue;

      const prevClose = prices[i - 1].close;
      const currentClose = prices[i].close;
      
      // Target: 1 if price went up, 0 if down
      const target = currentClose > prevClose ? 1 : 0;
      const priceChange = currentClose - prevClose;
      const priceChangePercent = ((currentClose - prevClose) / prevClose) * 100;

      // Get indicators from previous day (H-1)
      const prevIdx = i - 1;
      
      // Skip if indicators are not available
      if (indicators.rsi[prevIdx] === null || indicators.macd[prevIdx] === null) continue;

      const row = {
        date: prices[i].date,
        prevDate: prices[i - 1].date,
        target,
        priceChange: parseFloat(priceChange.toFixed(2)),
        priceChangePercent: parseFloat(priceChangePercent.toFixed(4)),
        prevClose: parseFloat(prevClose.toFixed(2)),
        currentClose: parseFloat(currentClose.toFixed(2)),
        prevOpen: parseFloat(prices[i - 1].open?.toFixed(2) || 0),
        prevHigh: parseFloat(prices[i - 1].high?.toFixed(2) || 0),
        prevLow: parseFloat(prices[i - 1].low?.toFixed(2) || 0),
        prevVolume: prices[i - 1].volume || 0,
        
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
        
        // OBV (H-1)
        obv: indicators.obv[prevIdx] || null,
        
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
}

module.exports = new IndicatorService();
