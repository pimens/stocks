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
