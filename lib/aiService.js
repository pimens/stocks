const axios = require('axios');

class AIService {
  constructor() {
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    this.availableModels = [
      {
        id: 'google/gemma-3-27b-it',
        name: 'Gemma 3 27B (Free)',
        provider: 'Google',
        description: 'Multimodal model with 131K context',
        contextWindow: 131000,
        free: true
      },
      {
        id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash (Free)',
        provider: 'Google',
        description: 'Fast multimodal model',
        contextWindow: 1048576,
        free: true
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B (Free)',
        provider: 'Meta',
        description: 'Multilingual model optimized for dialogue',
        contextWindow: 131000,
        free: true
      },
      {
        id: 'mistralai/mistral-7b-instruct',
        name: 'Mistral 7B (Free)',
        provider: 'Mistral',
        description: 'Fast 7B model',
        contextWindow: 32000,
        free: true
      }
    ];
  }

  getAvailableModels() {
    return this.availableModels;
  }

  async analyzeStock(stockData, indicators, signals, selectedModel = 'google/gemini-2.0-flash-001') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured');
    }

    const currentIndicators = indicators.current;
    const recentPrices = stockData.prices.slice(-10);

    const prompt = `Kamu adalah seorang analis saham profesional Indonesia. Analisis data saham berikut dan berikan rekomendasi dalam Bahasa Indonesia.

**Data Saham: ${stockData.symbol}**

**Harga Terkini:**
- Harga: Rp ${currentIndicators.price?.toLocaleString('id-ID')}
- Harga Sebelumnya: Rp ${stockData.previousClose?.toLocaleString('id-ID')}
- Perubahan: ${((currentIndicators.price - stockData.previousClose) / stockData.previousClose * 100).toFixed(2)}%

**Indikator Teknikal:**
- RSI (14): ${currentIndicators.rsi?.toFixed(2) || 'N/A'}
- SMA 20: Rp ${currentIndicators.sma20?.toLocaleString('id-ID') || 'N/A'}
- SMA 50: Rp ${currentIndicators.sma50?.toLocaleString('id-ID') || 'N/A'}
- EMA 12: Rp ${currentIndicators.ema12?.toLocaleString('id-ID') || 'N/A'}
- EMA 26: Rp ${currentIndicators.ema26?.toLocaleString('id-ID') || 'N/A'}
- MACD: ${currentIndicators.macd ? `Line: ${currentIndicators.macd.MACD?.toFixed(2)}, Signal: ${currentIndicators.macd.signal?.toFixed(2)}` : 'N/A'}
- Bollinger Bands: ${currentIndicators.bollingerBands ? `Upper: ${currentIndicators.bollingerBands.upper?.toFixed(2)}, Lower: ${currentIndicators.bollingerBands.lower?.toFixed(2)}` : 'N/A'}
- Stochastic: ${currentIndicators.stochastic ? `K: ${currentIndicators.stochastic.k?.toFixed(2)}, D: ${currentIndicators.stochastic.d?.toFixed(2)}` : 'N/A'}
- ADX: ${currentIndicators.adx?.adx?.toFixed(2) || 'N/A'}

**Sinyal Trading:**
${signals.map(s => `- ${s.type}: ${s.indicator} - ${s.reason}`).join('\n') || 'Tidak ada sinyal kuat'}

**Harga 10 Hari Terakhir:**
${recentPrices.map(p => `${p.date}: Close ${p.close?.toFixed(0)}, Vol ${(p.volume/1000000).toFixed(2)}M`).join('\n')}

Berikan analisis mencakup:
1. **Ringkasan Kondisi Teknikal**
2. **Analisis Indikator**
3. **Level Support & Resistance**
4. **Rekomendasi** - BUY/SELL/HOLD
5. **Risk Management**
6. **Catatan Penting**

Format dalam Markdown.`;

    const systemPrompt = 'Kamu adalah analis saham profesional Indonesia. Berikan analisis objektif berbasis data.';

    try {
      const response = await axios.post(this.openRouterUrl, {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_URL || 'https://stock-screener.vercel.app',
          'X-Title': 'Stock Screener Indonesia'
        }
      });

      return {
        analysis: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage,
        prompt: {
          system: systemPrompt,
          user: prompt
        }
      };
    } catch (error) {
      console.error('AI Analysis Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to get AI analysis');
    }
  }

  async compareStocks(stocksData, selectedModel = 'google/gemini-2.0-flash-001') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured');
    }

    const stocksSummary = stocksData.map(s => `
**${s.symbol}:**
- Harga: Rp ${s.indicators.current.price?.toLocaleString('id-ID')}
- RSI: ${s.indicators.current.rsi?.toFixed(2) || 'N/A'}
- Trend: ${s.indicators.current.sma20 > s.indicators.current.sma50 ? 'Bullish' : 'Bearish'}
- Sinyal: ${s.signals.map(sig => sig.type).join(', ') || 'Netral'}
`).join('\n');

    const prompt = `Bandingkan saham-saham Indonesia berikut:

${stocksSummary}

Berikan:
1. Perbandingan singkat
2. Ranking berdasarkan potensi
3. Rekomendasi diversifikasi`;

    const systemPrompt = 'Kamu adalah analis saham profesional Indonesia.';

    try {
      const response = await axios.post(this.openRouterUrl, {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_URL || 'https://stock-screener.vercel.app',
          'X-Title': 'Stock Screener Indonesia'
        }
      });

      return {
        comparison: response.data.choices[0].message.content,
        model: response.data.model,
        prompt: {
          system: systemPrompt,
          user: prompt
        }
      };
    } catch (error) {
      console.error('AI Comparison Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to compare stocks');
    }
  }

  async analyzeWithIndicators(symbol, indicators, date, selectedModel = 'google/gemini-2.0-flash-001', priceHistory = []) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured');
    }

    // Format indicators for prompt
    const indicatorList = Object.entries(indicators)
      .map(([key, value]) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'boolean') return `- ${key}: ${value ? 'Ya' : 'Tidak'}`;
        if (typeof value === 'number') {
          if (Math.abs(value) > 1000) return `- ${key}: ${value.toLocaleString('id-ID')}`;
          return `- ${key}: ${value.toFixed(4)}`;
        }
        return `- ${key}: ${value}`;
      })
      .filter(Boolean)
      .join('\n');

    // Format price history for prompt
    let priceHistorySection = '';
    if (priceHistory && priceHistory.length > 0) {
      const priceLines = priceHistory.map(p => 
        `${p.date}: Open ${p.open?.toFixed(0)}, High ${p.high?.toFixed(0)}, Low ${p.low?.toFixed(0)}, Close ${p.close?.toFixed(0)}, Vol ${(p.volume/1000000).toFixed(2)}M`
      ).join('\n');
      priceHistorySection = `\n\n**📅 Harga 15 Hari Terakhir:**\n${priceLines}`;
    }

    const prompt = `Kamu adalah seorang analis saham profesional Indonesia dengan keahlian dalam analisis teknikal. Analisis data indikator teknikal berikut dan berikan insight mendalam.

**Saham: ${symbol}**
**Tanggal Data: ${date}**
**Jumlah Indikator: ${Object.keys(indicators).length}**

**Data Indikator Teknikal:**
${indicatorList}${priceHistorySection}

---

Berikan analisis yang meliputi:

1. **📊 Ringkasan Kondisi Teknikal**
   - Kondisi tren saat ini (bullish/bearish/sideways)
   - Kekuatan tren berdasarkan ADX jika tersedia

2. **💪 Analisis Momentum**
   - Kondisi RSI (oversold/overbought/netral)
   - Kondisi Stochastic
   - Momentum umum pasar

3. **📈 Analisis Moving Average**
   - Posisi harga terhadap MA
   - Golden/Death cross jika terdeteksi
   - Tren jangka pendek vs panjang

4. **📉 Level Support & Resistance**
   - Area support dari Bollinger Bands
   - Area resistance
   - Tingkat volatilitas (ATR)

5. **🔮 Prediksi Arah**
   - Kemungkinan pergerakan berikutnya
   - Level target jika naik
   - Level stop loss yang disarankan

6. **⚠️ Risk Assessment**
   - Faktor risiko yang perlu diperhatikan
   - Sinyal divergensi jika ada
   - Volume dan partisipasi pasar

7. **✅ Rekomendasi**
   - Aksi yang disarankan (Buy/Sell/Hold)
   - Tingkat keyakinan (High/Medium/Low)
   - Timing entry yang ideal

Berikan analisis yang berbasis data dan objektif. Gunakan emoji untuk memudahkan pembacaan.`;

    const systemPrompt = 'Kamu adalah analis saham profesional Indonesia yang ahli dalam analisis teknikal. Berikan analisis mendalam berdasarkan indikator teknikal yang diberikan. Gunakan bahasa Indonesia yang jelas dan mudah dipahami.';

    try {
      const response = await axios.post(this.openRouterUrl, {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_URL || 'https://stock-screener.vercel.app',
          'X-Title': 'Stock Screener Indonesia - Indicator Analysis'
        }
      });

      return {
        analysis: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage,
        date,
        indicatorCount: Object.keys(indicators).length,
        prompt: {
          system: systemPrompt,
          user: prompt
        }
      };
    } catch (error) {
      console.error('AI Indicator Analysis Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to analyze indicators');
    }
  }
}

module.exports = new AIService();
