const axios = require('axios');

class AIService {
  constructor() {
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Available free models from OpenRouter
    this.availableModels = [
      {
        id: 'google/gemma-3-27b-it',
        name: 'Gemma 3 27B (Free)',
        provider: 'Google',
        description: 'Multimodal model with 131K context, supports vision-language input',
        contextWindow: 131000,
        free: true
      },
      {
        id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash Experimental (Free)',
        provider: 'Google',
        description: 'Faster TTFT, enhanced multimodal understanding and coding',
        contextWindow: 1048576,
        free: true,
        deprecated: '2026-02-06'
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct (Free)',
        provider: 'Meta',
        description: 'Multilingual model optimized for dialogue, 8 languages supported',
        contextWindow: 131000,
        free: true
      },
      {
        id: 'meta-llama/llama-3.2-3b-instruct',
        name: 'Llama 3.2 3B Instruct (Free)',
        provider: 'Meta',
        description: 'Lightweight 3B model, good for efficiency',
        contextWindow: 131000,
        free: true
      },
      {
        id: 'qwen/qwen-2.5-vl-7b-instruct',
        name: 'Qwen2.5-VL 7B Instruct (Free)',
        provider: 'Qwen',
        description: 'Multimodal with vision capabilities, supports 20min+ videos',
        contextWindow: 33000,
        free: true
      },
      {
        id: 'nousresearch/hermes-3-405b-instruct',
        name: 'Hermes 3 405B Instruct (Free)',
        provider: 'Nous Research',
        description: 'Advanced agentic capabilities, powerful function calling',
        contextWindow: 131000,
        free: true
      },
      {
        id: 'meta-llama/llama-3.1-405b-instruct',
        name: 'Llama 3.1 405B Instruct (Free)',
        provider: 'Meta',
        description: 'Highly capable 400B model with 128k context',
        contextWindow: 131000,
        free: true
      },
      {
        id: 'mistralai/mistral-7b-instruct',
        name: 'Mistral 7B Instruct (Free)',
        provider: 'Mistral',
        description: 'Industry-standard 7.3B model optimized for speed',
        contextWindow: 32000,
        free: true
      }
    ];
  }

  // Get available models
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
- MACD: ${currentIndicators.macd ? `Line: ${currentIndicators.macd.MACD?.toFixed(2)}, Signal: ${currentIndicators.macd.signal?.toFixed(2)}, Histogram: ${currentIndicators.macd.histogram?.toFixed(2)}` : 'N/A'}
- Bollinger Bands: ${currentIndicators.bollingerBands ? `Upper: ${currentIndicators.bollingerBands.upper?.toFixed(2)}, Middle: ${currentIndicators.bollingerBands.middle?.toFixed(2)}, Lower: ${currentIndicators.bollingerBands.lower?.toFixed(2)}` : 'N/A'}
- Stochastic: ${currentIndicators.stochastic ? `K: ${currentIndicators.stochastic.k?.toFixed(2)}, D: ${currentIndicators.stochastic.d?.toFixed(2)}` : 'N/A'}
- ADX: ${currentIndicators.adx?.adx?.toFixed(2) || 'N/A'}

**Sinyal Trading yang Terdeteksi:**
${signals.map(s => `- ${s.type}: ${s.indicator} - ${s.reason}`).join('\n') || 'Tidak ada sinyal kuat'}

**Harga 10 Hari Terakhir:**
${recentPrices.map(p => `${p.date}: Open ${p.open?.toFixed(0)}, High ${p.high?.toFixed(0)}, Low ${p.low?.toFixed(0)}, Close ${p.close?.toFixed(0)}, Vol ${(p.volume/1000000).toFixed(2)}M`).join('\n')}

Berikan analisis yang mencakup:
1. **Ringkasan Kondisi Teknikal** - Trend, momentum, dan kekuatan sinyal
2. **Analisis Indikator** - Interpretasi dari setiap indikator utama
3. **Level Support & Resistance** - Estimasi berdasarkan data
4. **Rekomendasi** - BUY/SELL/HOLD dengan alasan
5. **Risk Management** - Saran stop loss dan target harga
6. **Catatan Penting** - Faktor risiko yang perlu diperhatikan

Format jawaban dalam Markdown yang rapi.`;

    try {
      const response = await axios.post(this.openRouterUrl, {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah analis saham profesional yang berpengalaman di pasar saham Indonesia (IDX). Berikan analisis yang objektif, berbasis data, dan mudah dipahami. Selalu ingatkan bahwa analisis ini bukan ajakan untuk membeli/menjual dan investor harus melakukan riset sendiri.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Stock Screener Indonesia'
        }
      });

      return {
        analysis: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage
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

    const prompt = `Bandingkan saham-saham Indonesia berikut dan berikan rekomendasi mana yang paling menarik untuk investasi:

${stocksSummary}

Berikan:
1. Perbandingan singkat antar saham
2. Ranking berdasarkan potensi (dengan alasan)
3. Rekomendasi alokasi jika ingin diversifikasi`;

    try {
      const response = await axios.post(this.openRouterUrl, {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah analis saham profesional Indonesia. Berikan perbandingan yang objektif dan berbasis data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Stock Screener Indonesia'
        }
      });

      return {
        comparison: response.data.choices[0].message.content,
        model: response.data.model
      };
    } catch (error) {
      console.error('AI Comparison Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to compare stocks');
    }
  }
}

module.exports = new AIService();
