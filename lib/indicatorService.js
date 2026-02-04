const {
  SMA, EMA, RSI, MACD, BollingerBands, Stochastic, ADX, ATR
} = require('technicalindicators');

class IndicatorService {
  calculateSMA(prices, period = 20) {
    const closes = prices.map(p => p.close);
    const values = SMA.calculate({ period, values: closes });
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  calculateEMA(prices, period = 20) {
    const closes = prices.map(p => p.close);
    const values = EMA.calculate({ period, values: closes });
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

  calculateRSI(prices, period = 14) {
    const closes = prices.map(p => p.close);
    const values = RSI.calculate({ period, values: closes });
    const padded = Array(prices.length - values.length).fill(null).concat(values);
    return padded;
  }

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

  calculateOBV(prices) {
    if (prices.length === 0) return [];
    const results = [];
    let obv = 0;
    results.push(0);
    for (let i = 1; i < prices.length; i++) {
      const currentClose = prices[i].close;
      const prevClose = prices[i - 1].close;
      const currentVolume = prices[i].volume || 0;
      if (currentClose > prevClose) {
        obv += currentVolume;
      } else if (currentClose < prevClose) {
        obv -= currentVolume;
      }
      results.push(obv);
    }
    return results;
  }

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
        sma20, sma50, ema12, ema26, rsi, macd,
        bollingerBands: bb, stochastic: stoch, adx, atr, obv
      }
    };
  }

  screenStock(prices, indicators, criteria, fundamentals = {}) {
    const current = indicators.current;
    const results = {};

    if (criteria.priceGainToday && fundamentals.changePercent !== undefined) {
      results.priceGainToday = fundamentals.changePercent > 0;
    }
    if (criteria.priceDropToday && fundamentals.changePercent !== undefined) {
      results.priceDropToday = fundamentals.changePercent < 0;
    }
    if (criteria.highVolume && fundamentals.volume && fundamentals.avgVolume) {
      results.highVolume = fundamentals.volume > fundamentals.avgVolume;
    }
    if (criteria.rsiOversold && current.rsi) {
      results.rsiOversold = current.rsi < (criteria.rsiOversoldLevel || 30);
    }
    if (criteria.rsiOverbought && current.rsi) {
      results.rsiOverbought = current.rsi > (criteria.rsiOverboughtLevel || 70);
    }
    if (criteria.priceAboveSMA20 && current.sma20) {
      results.priceAboveSMA20 = current.price > current.sma20;
    }
    if (criteria.priceAboveSMA50 && current.sma50) {
      results.priceAboveSMA50 = current.price > current.sma50;
    }
    if (criteria.goldenCross && current.sma20 && current.sma50) {
      results.goldenCross = current.sma20 > current.sma50;
    }
    if (criteria.macdBullish && current.macd) {
      results.macdBullish = current.macd.MACD > current.macd.signal;
    }
    if (criteria.macdBearish && current.macd) {
      results.macdBearish = current.macd.MACD < current.macd.signal;
    }
    if (criteria.strongTrend && current.adx) {
      results.strongTrend = current.adx.adx > 25;
    }

    const conditionsMet = Object.values(results).filter(v => v === true).length;
    const totalConditions = Object.keys(results).length;
    const score = totalConditions > 0 ? (conditionsMet / totalConditions) * 100 : 0;

    return { results, conditionsMet, totalConditions, score };
  }

  generateSignals(indicators) {
    const signals = [];
    const current = indicators.current;

    if (current.rsi) {
      if (current.rsi < 30) {
        signals.push({ type: 'BUY', indicator: 'RSI', reason: `RSI oversold at ${current.rsi.toFixed(2)}` });
      } else if (current.rsi > 70) {
        signals.push({ type: 'SELL', indicator: 'RSI', reason: `RSI overbought at ${current.rsi.toFixed(2)}` });
      }
    }

    if (current.macd) {
      if (current.macd.MACD > current.macd.signal && current.macd.histogram > 0) {
        signals.push({ type: 'BUY', indicator: 'MACD', reason: 'MACD bullish crossover' });
      } else if (current.macd.MACD < current.macd.signal && current.macd.histogram < 0) {
        signals.push({ type: 'SELL', indicator: 'MACD', reason: 'MACD bearish crossover' });
      }
    }

    if (current.sma20 && current.sma50) {
      if (current.price > current.sma20 && current.sma20 > current.sma50) {
        signals.push({ type: 'BUY', indicator: 'MA', reason: 'Price above SMA20 > SMA50 (uptrend)' });
      } else if (current.price < current.sma20 && current.sma20 < current.sma50) {
        signals.push({ type: 'SELL', indicator: 'MA', reason: 'Price below SMA20 < SMA50 (downtrend)' });
      }
    }

    if (current.bollingerBands) {
      if (current.price < current.bollingerBands.lower) {
        signals.push({ type: 'BUY', indicator: 'BB', reason: 'Price below lower Bollinger Band' });
      } else if (current.price > current.bollingerBands.upper) {
        signals.push({ type: 'SELL', indicator: 'BB', reason: 'Price above upper Bollinger Band' });
      }
    }

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
  getIndicatorsForDate(prices, targetDate) {
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
    
    // Calculate indicators
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const sma5 = this.calculateSMA(prices, 5);
    const sma10 = this.calculateSMA(prices, 10);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const rsi = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices);
    const bb = this.calculateBollingerBands(prices);
    const stoch = this.calculateStochastic(prices);
    const adx = this.calculateADX(prices);
    const atr = this.calculateATR(prices);
    const obv = this.calculateOBV(prices);
    
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
    
    // Delta RSI
    const deltaRSI = (rsi[prevIdx] !== null && rsi[prevPrevIdx] !== null)
      ? rsi[prevIdx] - rsi[prevPrevIdx] : null;
    
    // Delta MACD Hist
    const deltaMACDHist = (macd[prevIdx]?.histogram !== undefined && macd[prevPrevIdx]?.histogram !== undefined)
      ? macd[prevIdx].histogram - macd[prevPrevIdx].histogram : null;

    // Actual data for verification (if available) - not available for future dates
    const actualData = isFutureDate ? null : {
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
      symbol: null,
      targetDate: isFutureDate ? targetDate : prices[i].date,
      indicatorDate: prices[prevIdx].date,
      isFutureDate: isFutureDate,
      actualData,
      
      prevClose: parseFloat(prevClose.toFixed(2)),
      prevOpen: parseFloat(prevOpen?.toFixed(2) || 0),
      prevHigh: parseFloat(prevHigh?.toFixed(2) || 0),
      prevLow: parseFloat(prevLow?.toFixed(2) || 0),
      prevVolume: prices[prevIdx].volume || 0,
      
      closePosition: parseFloat(closePosition.toFixed(4)),
      bodyRangeRatio: parseFloat(bodyRangeRatio.toFixed(4)),
      upperWickRatio: prevRange > 0 ? parseFloat(((prevHigh - Math.max(prevOpen, prevClose)) / prevRange).toFixed(4)) : 0,
      lowerWickRatio: prevRange > 0 ? parseFloat(((Math.min(prevOpen, prevClose) - prevLow) / prevRange).toFixed(4)) : 0,
      
      deltaRSI: deltaRSI !== null ? parseFloat(deltaRSI.toFixed(2)) : null,
      deltaMACDHist: deltaMACDHist !== null ? parseFloat(deltaMACDHist.toFixed(4)) : null,
      
      sma5: sma5[prevIdx] ? parseFloat(sma5[prevIdx].toFixed(2)) : null,
      sma10: sma10[prevIdx] ? parseFloat(sma10[prevIdx].toFixed(2)) : null,
      sma20: sma20[prevIdx] ? parseFloat(sma20[prevIdx].toFixed(2)) : null,
      sma50: sma50[prevIdx] ? parseFloat(sma50[prevIdx].toFixed(2)) : null,
      
      ema12: ema12[prevIdx] ? parseFloat(ema12[prevIdx].toFixed(2)) : null,
      ema26: ema26[prevIdx] ? parseFloat(ema26[prevIdx].toFixed(2)) : null,
      
      priceAboveSMA5: prevClose > (sma5[prevIdx] || 0) ? 1 : 0,
      priceAboveSMA10: prevClose > (sma10[prevIdx] || 0) ? 1 : 0,
      priceAboveSMA20: prevClose > (sma20[prevIdx] || 0) ? 1 : 0,
      priceAboveSMA50: prevClose > (sma50[prevIdx] || 0) ? 1 : 0,
      priceAboveEMA12: prevClose > (ema12[prevIdx] || 0) ? 1 : 0,
      priceAboveEMA26: prevClose > (ema26[prevIdx] || 0) ? 1 : 0,
      
      distFromSMA5: sma5[prevIdx] ? parseFloat(((prevClose - sma5[prevIdx]) / sma5[prevIdx] * 100).toFixed(4)) : null,
      distFromSMA20: sma20[prevIdx] ? parseFloat(((prevClose - sma20[prevIdx]) / sma20[prevIdx] * 100).toFixed(4)) : null,
      distFromSMA50: sma50[prevIdx] ? parseFloat(((prevClose - sma50[prevIdx]) / sma50[prevIdx] * 100).toFixed(4)) : null,
      
      sma5AboveSMA10: (sma5[prevIdx] || 0) > (sma10[prevIdx] || 0) ? 1 : 0,
      sma10AboveSMA20: (sma10[prevIdx] || 0) > (sma20[prevIdx] || 0) ? 1 : 0,
      sma20AboveSMA50: (sma20[prevIdx] || 0) > (sma50[prevIdx] || 0) ? 1 : 0,
      
      rsi: rsi[prevIdx] ? parseFloat(rsi[prevIdx].toFixed(2)) : null,
      rsiOversold: rsi[prevIdx] && rsi[prevIdx] < 30 ? 1 : 0,
      rsiOverbought: rsi[prevIdx] && rsi[prevIdx] > 70 ? 1 : 0,
      rsiNeutral: rsi[prevIdx] && rsi[prevIdx] >= 30 && rsi[prevIdx] <= 70 ? 1 : 0,
      
      macd: macd[prevIdx]?.MACD ? parseFloat(macd[prevIdx].MACD.toFixed(4)) : null,
      macdSignal: macd[prevIdx]?.signal ? parseFloat(macd[prevIdx].signal.toFixed(4)) : null,
      macdHistogram: macd[prevIdx]?.histogram ? parseFloat(macd[prevIdx].histogram.toFixed(4)) : null,
      macdBullish: macd[prevIdx] && macd[prevIdx].MACD > macd[prevIdx].signal ? 1 : 0,
      macdPositive: macd[prevIdx] && macd[prevIdx].MACD > 0 ? 1 : 0,
      
      bbUpper: bb[prevIdx]?.upper ? parseFloat(bb[prevIdx].upper.toFixed(2)) : null,
      bbMiddle: bb[prevIdx]?.middle ? parseFloat(bb[prevIdx].middle.toFixed(2)) : null,
      bbLower: bb[prevIdx]?.lower ? parseFloat(bb[prevIdx].lower.toFixed(2)) : null,
      bbWidth: bb[prevIdx] ? parseFloat(((bb[prevIdx].upper - bb[prevIdx].lower) / bb[prevIdx].middle * 100).toFixed(4)) : null,
      priceBelowLowerBB: bb[prevIdx] && prevClose < bb[prevIdx].lower ? 1 : 0,
      priceAboveUpperBB: bb[prevIdx] && prevClose > bb[prevIdx].upper ? 1 : 0,
      
      stochK: stoch[prevIdx]?.k ? parseFloat(stoch[prevIdx].k.toFixed(2)) : null,
      stochD: stoch[prevIdx]?.d ? parseFloat(stoch[prevIdx].d.toFixed(2)) : null,
      stochOversold: stoch[prevIdx] && stoch[prevIdx].k < 20 ? 1 : 0,
      stochOverbought: stoch[prevIdx] && stoch[prevIdx].k > 80 ? 1 : 0,
      stochBullishCross: stoch[prevIdx] && stoch[prevIdx].k > stoch[prevIdx].d ? 1 : 0,
      
      adx: adx[prevIdx]?.adx ? parseFloat(adx[prevIdx].adx.toFixed(2)) : null,
      pdi: adx[prevIdx]?.pdi ? parseFloat(adx[prevIdx].pdi.toFixed(2)) : null,
      mdi: adx[prevIdx]?.mdi ? parseFloat(adx[prevIdx].mdi.toFixed(2)) : null,
      strongTrend: adx[prevIdx] && adx[prevIdx].adx > 25 ? 1 : 0,
      bullishDI: adx[prevIdx] && adx[prevIdx].pdi > adx[prevIdx].mdi ? 1 : 0,
      
      atr: atr[prevIdx] ? parseFloat(atr[prevIdx].toFixed(2)) : null,
      atrPercent: atr[prevIdx] ? parseFloat((atr[prevIdx] / prevClose * 100).toFixed(4)) : null,
      
      obv: obv[prevIdx] || 0,
      
      bodySize: parseFloat(Math.abs(prices[prevIdx].close - prices[prevIdx].open).toFixed(2)),
      upperWick: parseFloat((prices[prevIdx].high - Math.max(prices[prevIdx].open, prices[prevIdx].close)).toFixed(2)),
      lowerWick: parseFloat((Math.min(prices[prevIdx].open, prices[prevIdx].close) - prices[prevIdx].low).toFixed(2)),
      isBullishCandle: prices[prevIdx].close > prices[prevIdx].open ? 1 : 0,
      isDoji: Math.abs(prices[prevIdx].close - prices[prevIdx].open) < (prices[prevIdx].high - prices[prevIdx].low) * 0.1 ? 1 : 0,
      
      gapUp: prices[prevIdx].open > prices[prevPrevIdx]?.close ? 1 : 0,
      gapDown: prices[prevIdx].open < prices[prevPrevIdx]?.close ? 1 : 0,
      
      return1d: prevIdx >= 2 ? parseFloat(((prices[prevIdx].close - prices[prevPrevIdx].close) / prices[prevPrevIdx].close * 100).toFixed(4)) : null,
    };

    return row;
  }

  // Get intraday indicators - using current day's partial data as latest candle
  getIntradayIndicators(prices) {
    if (prices.length < 60) {
      return { error: 'Not enough historical data' };
    }
    
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
    
    // Calculate indicators
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const sma5 = this.calculateSMA(prices, 5);
    const sma10 = this.calculateSMA(prices, 10);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const ema9 = this.calculateEMA(prices, 9);
    const ema21 = this.calculateEMA(prices, 21);
    const rsi = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices);
    const bb = this.calculateBollingerBands(prices);
    const stoch = this.calculateStochastic(prices);
    const adx = this.calculateADX(prices);
    const atr = this.calculateATR(prices);
    const obv = this.calculateOBV(prices);
    
    // Close Position
    const closePosition = currentRange > 0 ? (currentClose - currentLow) / currentRange : 0.5;
    
    // Body/Range Ratio
    const bodySize = Math.abs(currentClose - currentOpen) || 0;
    const bodyRangeRatio = currentRange > 0 ? bodySize / currentRange : 0;
    
    // Delta indicators
    const deltaRSI = (rsi[i] !== null && rsi[prevIdx] !== null)
      ? rsi[i] - rsi[prevIdx] : null;
    
    const deltaMACDHist = (macd[i]?.histogram !== undefined && macd[prevIdx]?.histogram !== undefined)
      ? macd[i].histogram - macd[prevIdx].histogram : null;
    
    const deltaStochK = (stoch[i]?.k !== undefined && stoch[prevIdx]?.k !== undefined)
      ? stoch[i].k - stoch[prevIdx].k : null;

    // Current change from previous close
    const priceChange = currentClose - prevClosePrice;
    const priceChangePercent = prevClosePrice > 0 ? (priceChange / prevClosePrice) * 100 : 0;

    // Helper function to safely format numbers
    const safeToFixed = (val, decimals = 2) => {
      if (val === null || val === undefined || isNaN(val)) return null;
      return parseFloat(Number(val).toFixed(decimals));
    };

    const row = {
      symbol: null,
      indicatorDate: currentPrice.date,
      isIntraday: true,
      marketStatus: 'LIVE',
      
      // Current price data
      currentOpen: safeToFixed(currentOpen),
      currentHigh: safeToFixed(currentHigh),
      currentLow: safeToFixed(currentLow),
      currentClose: safeToFixed(currentClose),
      currentVolume: currentVolume || 0,
      prevClose: safeToFixed(prevClosePrice),
      priceChange: safeToFixed(priceChange),
      priceChangePercent: safeToFixed(priceChangePercent),
      
      // ML Features
      closePosition: safeToFixed(closePosition, 4),
      bodyRangeRatio: safeToFixed(bodyRangeRatio, 4),
      upperWickRatio: currentRange > 0 ? safeToFixed((currentHigh - Math.max(currentOpen, currentClose)) / currentRange, 4) : 0,
      lowerWickRatio: currentRange > 0 ? safeToFixed((Math.min(currentOpen, currentClose) - currentLow) / currentRange, 4) : 0,
      
      deltaRSI: safeToFixed(deltaRSI),
      deltaMACDHist: safeToFixed(deltaMACDHist, 4),
      deltaStochK: safeToFixed(deltaStochK),
      
      sma5: safeToFixed(sma5[i]),
      sma10: safeToFixed(sma10[i]),
      sma20: safeToFixed(sma20[i]),
      sma50: safeToFixed(sma50[i]),
      
      ema9: safeToFixed(ema9[i]),
      ema12: safeToFixed(ema12[i]),
      ema21: safeToFixed(ema21[i]),
      ema26: safeToFixed(ema26[i]),
      
      distanceFromSMA5: sma5[i] ? safeToFixed((currentClose - sma5[i]) / sma5[i] * 100, 4) : null,
      distanceFromSMA10: sma10[i] ? safeToFixed((currentClose - sma10[i]) / sma10[i] * 100, 4) : null,
      distanceFromSMA20: sma20[i] ? safeToFixed((currentClose - sma20[i]) / sma20[i] * 100, 4) : null,
      distanceFromSMA50: sma50[i] ? safeToFixed((currentClose - sma50[i]) / sma50[i] * 100, 4) : null,
      
      aboveSMA5: sma5[i] && currentClose > sma5[i] ? 1 : 0,
      aboveSMA10: sma10[i] && currentClose > sma10[i] ? 1 : 0,
      aboveSMA20: sma20[i] && currentClose > sma20[i] ? 1 : 0,
      aboveSMA50: sma50[i] && currentClose > sma50[i] ? 1 : 0,
      
      rsi: safeToFixed(rsi[i]),
      rsiOversold: rsi[i] && rsi[i] < 30 ? 1 : 0,
      rsiOverbought: rsi[i] && rsi[i] > 70 ? 1 : 0,
      rsiNeutral: rsi[i] && rsi[i] >= 30 && rsi[i] <= 70 ? 1 : 0,
      
      macd: safeToFixed(macd[i]?.MACD, 4),
      macdSignal: safeToFixed(macd[i]?.signal, 4),
      macdHistogram: safeToFixed(macd[i]?.histogram, 4),
      macdBullish: macd[i] && macd[i].histogram > 0 ? 1 : 0,
      macdCrossUp: macd[i] && macd[prevIdx] && macd[prevIdx].histogram <= 0 && macd[i].histogram > 0 ? 1 : 0,
      macdCrossDown: macd[i] && macd[prevIdx] && macd[prevIdx].histogram >= 0 && macd[i].histogram < 0 ? 1 : 0,
      
      bbUpper: safeToFixed(bb[i]?.upper),
      bbMiddle: safeToFixed(bb[i]?.middle),
      bbLower: safeToFixed(bb[i]?.lower),
      bbWidth: bb[i]?.middle ? safeToFixed((bb[i].upper - bb[i].lower) / bb[i].middle * 100, 4) : null,
      bbPosition: bb[i] && (bb[i].upper - bb[i].lower) > 0 ? safeToFixed((currentClose - bb[i].lower) / (bb[i].upper - bb[i].lower), 4) : null,
      nearBBUpper: bb[i] && currentClose > bb[i].upper * 0.98 ? 1 : 0,
      nearBBLower: bb[i] && currentClose < bb[i].lower * 1.02 ? 1 : 0,
      
      stochK: safeToFixed(stoch[i]?.k),
      stochD: safeToFixed(stoch[i]?.d),
      stochOversold: stoch[i] && stoch[i].k < 20 ? 1 : 0,
      stochOverbought: stoch[i] && stoch[i].k > 80 ? 1 : 0,
      
      adx: safeToFixed(adx[i]?.adx),
      plusDI: safeToFixed(adx[i]?.pdi),
      minusDI: safeToFixed(adx[i]?.mdi),
      strongTrend: adx[i] && adx[i].adx > 25 ? 1 : 0,
      bullishDI: adx[i] && adx[i].pdi > adx[i].mdi ? 1 : 0,
      
      atr: safeToFixed(atr[i]),
      atrPercent: atr[i] && currentClose > 0 ? safeToFixed(atr[i] / currentClose * 100, 4) : null,
      
      obv: obv[i] || null,
      obvTrend: obv[i] && obv[prevIdx] && obv[i] > obv[prevIdx] ? 1 : 0,
      
      bodySize: safeToFixed(bodySize),
      upperWick: safeToFixed(currentHigh - Math.max(currentOpen, currentClose)),
      lowerWick: safeToFixed(Math.min(currentOpen, currentClose) - currentLow),
      isBullishCandle: currentClose > currentOpen ? 1 : 0,
      isDoji: bodySize < currentRange * 0.1 ? 1 : 0,
      
      gapUp: currentOpen > prevClosePrice ? 1 : 0,
      gapDown: currentOpen < prevClosePrice ? 1 : 0,
      gapPercent: prevClosePrice > 0 ? safeToFixed((currentOpen - prevClosePrice) / prevClosePrice * 100, 4) : 0,
      
      return1d: safeToFixed(priceChangePercent, 4),
      return3d: i >= 3 && prices[i - 3]?.close ? safeToFixed((currentClose - prices[i - 3].close) / prices[i - 3].close * 100, 4) : null,
      return5d: i >= 5 && prices[i - 5]?.close ? safeToFixed((currentClose - prices[i - 5].close) / prices[i - 5].close * 100, 4) : null,
    };

    return row;
  }
}

module.exports = new IndicatorService();
