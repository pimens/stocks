# Stock Screener Indonesia 🇮🇩

Aplikasi screener saham Indonesia dengan analisis teknikal dan AI.

## ✨ Fitur

- **Stock Screener**: Filter saham berdasarkan berbagai indikator teknikal
- **Technical Indicators**: RSI, MACD, SMA, EMA, Bollinger Bands, Stochastic, ADX, ATR, OBV
- **Grafik Interaktif**: Chart harga dengan overlay indikator
- **AI Analysis**: Analisis saham menggunakan OpenRouter AI
- **Perbandingan Saham**: Bandingkan beberapa saham sekaligus dengan AI
- **Real-time Data**: Data dari Yahoo Finance (gratis, tanpa API key)

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Technical Indicators library
- Yahoo Finance API (free)
- OpenRouter AI integration

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Chart.js
- React Toastify

## 📦 Instalasi

### 1. Clone & Install Dependencies

```bash
# Install all dependencies (root + client)
npm run install-all
```

### 2. Konfigurasi Environment

Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan masukkan API key OpenRouter Anda:

```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
PORT=3001
```

> **Cara mendapatkan API Key OpenRouter:**
> 1. Daftar di [openrouter.ai](https://openrouter.ai)
> 2. Pergi ke Settings > API Keys
> 3. Generate API key baru

### 3. Jalankan Aplikasi

```bash
# Jalankan backend dan frontend secara bersamaan
npm run dev
```

Atau jalankan terpisah:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd client && npm run dev
```

### 4. Buka Browser

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📖 Cara Penggunaan

### 1. Screener Saham

1. Pilih saham dari daftar populer atau ketik kode saham manual (contoh: BBCA, BBRI, TLKM)
2. Pilih filter indikator yang diinginkan (RSI, MACD, dll)
3. Klik "Analisa Sekarang" untuk melihat hasil screening

### 2. Detail Saham

1. Klik ikon mata (👁️) pada saham di hasil screener
2. Lihat grafik harga, RSI, dan semua indikator teknikal
3. Gunakan tombol timeframe untuk melihat periode berbeda

### 3. Analisis AI

1. Pergi ke tab "AI Analysis"
2. Pilih saham yang ingin dianalisis
3. Klik "Analisis" untuk mendapatkan interpretasi AI
4. Atau bandingkan beberapa saham sekaligus

## 📊 Indikator yang Tersedia

| Indikator | Deskripsi |
|-----------|-----------|
| RSI (14) | Relative Strength Index - mengukur momentum |
| SMA 20/50 | Simple Moving Average |
| EMA 12/26 | Exponential Moving Average |
| MACD | Moving Average Convergence Divergence |
| Bollinger Bands | Band volatilitas dengan 2 standar deviasi |
| Stochastic | Indikator momentum K% dan D% |
| ADX | Average Directional Index - kekuatan trend |
| ATR | Average True Range - volatilitas |
| OBV | On Balance Volume |

## 🔧 Filter Screening

- **RSI Oversold**: RSI < 30 (potensi reversal naik)
- **RSI Overbought**: RSI > 70 (potensi reversal turun)
- **Golden Cross**: SMA 20 > SMA 50 (bullish)
- **Death Cross**: SMA 20 < SMA 50 (bearish)
- **MACD Bullish/Bearish**: MACD line vs signal line
- **Bollinger Squeeze**: Harga di batas band
- **Strong Trend**: ADX > 25

## 📡 API Endpoints

```
GET  /api/stocks/popular         # Daftar saham populer
GET  /api/stocks/data/:symbol    # Data saham + indikator
POST /api/stocks/quotes          # Quotes multiple saham
POST /api/stocks/screen          # Screening dengan filter
POST /api/stocks/batch           # Batch data multiple saham

GET  /api/ai/analyze/:symbol     # Analisis AI single saham
POST /api/ai/compare             # Bandingkan multiple saham
```

## ⚠️ Disclaimer

Aplikasi ini hanya untuk tujuan edukasi dan bukan merupakan saran investasi. Selalu lakukan riset sendiri sebelum berinvestasi. Data yang ditampilkan mungkin memiliki keterlambatan.

## 📝 Lisensi

MIT License

## 🚀 Pengembangan Selanjutnya

- [ ] Portfolio tracking
- [ ] Watchlist & alerts
- [ ] Fundamental analysis
- [ ] Backtesting strategies
- [ ] Export data ke Excel
- [ ] Push notifications
- [ ] Dark/Light mode toggle
