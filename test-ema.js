const stockService = require('./server/services/stockService');
const { EMA } = require('technicalindicators');

async function test() {
  try {
    const data = await stockService.getStockData('YELO', '1y', '1d');
    const prices = data.prices;
    
    console.log('Total data points:', prices.length);
    console.log('\nLast 5 days data:');
    prices.slice(-5).forEach((p, i) => {
      console.log('Day', prices.length - 4 + i, ':', p.date, 'H:', p.high, 'L:', p.low, 'C:', p.close);
    });
    
    // Calculate EMA 21 High
    const highs = prices.map(p => p.high);
    const ema21High = EMA.calculate({ period: 21, values: highs });
    
    // Calculate EMA 21 Low
    const lows = prices.map(p => p.low);
    const ema21Low = EMA.calculate({ period: 21, values: lows });
    
    console.log('\nEMA 21 High (last 5):', ema21High.slice(-5).map(v => v.toFixed(2)));
    console.log('EMA 21 Low (last 5):', ema21Low.slice(-5).map(v => v.toFixed(2)));
    
    // Index calculations
    const lastIdx = prices.length - 1;
    const prevIdx = lastIdx - 1;
    
    console.log('\n--- Index mapping ---');
    console.log('prices lastIdx:', lastIdx, 'date:', prices[lastIdx]?.date);
    console.log('prices prevIdx:', prevIdx, 'date:', prices[prevIdx]?.date);
    console.log('ema21High array length:', ema21High.length);
    
    // The library returns array starting from period-1
    // So we need to map: prices[i] -> ema[i - (period - 1)]
    // Or use padding approach
    
    const offset = prices.length - ema21High.length;
    console.log('Offset (prices.length - ema.length):', offset);
    
    console.log('\n--- Values for different days ---');
    for (let i = -3; i <= 0; i++) {
      const priceIdx = lastIdx + i;
      const emaIdx = priceIdx - offset;
      if (emaIdx >= 0 && emaIdx < ema21High.length) {
        console.log(`Day ${priceIdx} (${prices[priceIdx]?.date?.split('T')[0]}): H=${prices[priceIdx]?.high}, L=${prices[priceIdx]?.low}, EMA21H=${ema21High[emaIdx]?.toFixed(2)}, EMA21L=${ema21Low[emaIdx]?.toFixed(2)}`);
      }
    }
    
    console.log('\n--- What app currently shows (prevIdx with padding) ---');
    // Padded array approach
    const paddedEma21High = Array(offset).fill(null).concat(ema21High);
    const paddedEma21Low = Array(offset).fill(null).concat(ema21Low);
    console.log('Padded EMA21 High at prevIdx:', paddedEma21High[prevIdx]?.toFixed(2));
    console.log('Padded EMA21 Low at prevIdx:', paddedEma21Low[prevIdx]?.toFixed(2));
    console.log('Padded EMA21 High at lastIdx:', paddedEma21High[lastIdx]?.toFixed(2));
    console.log('Padded EMA21 Low at lastIdx:', paddedEma21Low[lastIdx]?.toFixed(2));
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
