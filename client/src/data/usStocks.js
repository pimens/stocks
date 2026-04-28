// Popular US stocks by sector
export const US_POPULAR_STOCKS = [
  // Technology
  { code: 'AAPL', name: 'Apple Inc.', sector: 'tech' },
  { code: 'MSFT', name: 'Microsoft Corporation', sector: 'tech' },
  { code: 'NVDA', name: 'NVIDIA Corporation', sector: 'tech' },
  { code: 'GOOGL', name: 'Alphabet Inc.', sector: 'tech' },
  { code: 'META', name: 'Meta Platforms Inc.', sector: 'tech' },
  { code: 'AMZN', name: 'Amazon.com Inc.', sector: 'tech' },
  { code: 'TSLA', name: 'Tesla Inc.', sector: 'tech' },
  { code: 'AMD', name: 'Advanced Micro Devices', sector: 'tech' },
  { code: 'INTC', name: 'Intel Corporation', sector: 'tech' },
  { code: 'ORCL', name: 'Oracle Corporation', sector: 'tech' },
  { code: 'CRM', name: 'Salesforce Inc.', sector: 'tech' },
  { code: 'ADBE', name: 'Adobe Inc.', sector: 'tech' },
  { code: 'NFLX', name: 'Netflix Inc.', sector: 'tech' },
  { code: 'SNOW', name: 'Snowflake Inc.', sector: 'tech' },
  { code: 'PLTR', name: 'Palantir Technologies', sector: 'tech' },
  // Finance
  { code: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'finance' },
  { code: 'BAC', name: 'Bank of America Corp.', sector: 'finance' },
  { code: 'GS', name: 'Goldman Sachs Group', sector: 'finance' },
  { code: 'MS', name: 'Morgan Stanley', sector: 'finance' },
  { code: 'V', name: 'Visa Inc.', sector: 'finance' },
  { code: 'MA', name: 'Mastercard Inc.', sector: 'finance' },
  { code: 'WFC', name: 'Wells Fargo & Company', sector: 'finance' },
  { code: 'BRK-B', name: 'Berkshire Hathaway B', sector: 'finance' },
  { code: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'finance' },
  // Healthcare
  { code: 'JNJ', name: 'Johnson & Johnson', sector: 'healthcare' },
  { code: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'healthcare' },
  { code: 'PFE', name: 'Pfizer Inc.', sector: 'healthcare' },
  { code: 'ABBV', name: 'AbbVie Inc.', sector: 'healthcare' },
  { code: 'MRK', name: 'Merck & Co. Inc.', sector: 'healthcare' },
  { code: 'LLY', name: 'Eli Lilly and Company', sector: 'healthcare' },
  // Energy
  { code: 'XOM', name: 'Exxon Mobil Corporation', sector: 'energy' },
  { code: 'CVX', name: 'Chevron Corporation', sector: 'energy' },
  { code: 'COP', name: 'ConocoPhillips', sector: 'energy' },
  // Consumer
  { code: 'WMT', name: 'Walmart Inc.', sector: 'consumer' },
  { code: 'KO', name: 'Coca-Cola Company', sector: 'consumer' },
  { code: 'PG', name: 'Procter & Gamble Co.', sector: 'consumer' },
  { code: 'MCD', name: "McDonald's Corporation", sector: 'consumer' },
  { code: 'COST', name: 'Costco Wholesale Corp.', sector: 'consumer' },
  { code: 'NKE', name: 'Nike Inc.', sector: 'consumer' },
  // Industrial
  { code: 'BA', name: 'Boeing Company', sector: 'industrial' },
  { code: 'CAT', name: 'Caterpillar Inc.', sector: 'industrial' },
  { code: 'GE', name: 'GE Aerospace', sector: 'industrial' },
  { code: 'MMM', name: '3M Company', sector: 'industrial' },
  // ETF / Index
  { code: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'etf' },
  { code: 'QQQ', name: 'Invesco QQQ Trust (NASDAQ)', sector: 'etf' },
  { code: 'DIA', name: 'SPDR Dow Jones ETF', sector: 'etf' },
  { code: 'IWM', name: 'iShares Russell 2000 ETF', sector: 'etf' },
  { code: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'etf' },
  // Semiconductor
  { code: 'TSM', name: 'Taiwan Semiconductor', sector: 'tech' },
  { code: 'AVGO', name: 'Broadcom Inc.', sector: 'tech' },
  { code: 'QCOM', name: 'Qualcomm Inc.', sector: 'tech' },
  { code: 'MU', name: 'Micron Technology', sector: 'tech' },
]

export const US_SECTORS = {
  all: '📊 All',
  tech: '💻 Technology',
  finance: '🏦 Finance',
  healthcare: '🏥 Healthcare',
  energy: '⛽ Energy',
  consumer: '🛒 Consumer',
  industrial: '🏭 Industrial',
  etf: '📈 ETF/Index',
}

export function searchUSStocks(query) {
  const q = query.toUpperCase()
  return US_POPULAR_STOCKS.filter(
    s => s.code.includes(q) || s.name.toUpperCase().includes(q)
  )
}

export function getAllUSCodes() {
  return US_POPULAR_STOCKS.map(s => s.code)
}
