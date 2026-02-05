import { useState, useEffect, useMemo, useCallback } from 'react'
import { FiSearch, FiX, FiChevronDown, FiChevronUp, FiCheck, FiRefreshCw } from 'react-icons/fi'
import { STOCK_PRICES, PRICE_RANGES as STATIC_PRICE_RANGES, getStocksByPriceRange } from '../data/stockPrices'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

// Complete list of Indonesian stocks (IDX) with sector information
const IDX_STOCKS = [
  // Indices
  { code: '^JKSE', name: 'IHSG (Indeks Harga Saham Gabungan)', sector: 'Index', isIndex: true },
  
  // Banking (Big 4 + Others)
  { code: 'BBCA', name: 'Bank Central Asia', sector: 'Banking' },
  { code: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Banking' },
  { code: 'BMRI', name: 'Bank Mandiri', sector: 'Banking' },
  { code: 'BBNI', name: 'Bank Negara Indonesia', sector: 'Banking' },
  { code: 'BRIS', name: 'Bank Syariah Indonesia', sector: 'Banking' },
  { code: 'BTPN', name: 'Bank BTPN', sector: 'Banking' },
  { code: 'NISP', name: 'Bank OCBC NISP', sector: 'Banking' },
  { code: 'BDMN', name: 'Bank Danamon', sector: 'Banking' },
  { code: 'BNII', name: 'Bank Maybank Indonesia', sector: 'Banking' },
  { code: 'BNGA', name: 'Bank CIMB Niaga', sector: 'Banking' },
  { code: 'MEGA', name: 'Bank Mega', sector: 'Banking' },
  { code: 'PNBN', name: 'Bank Pan Indonesia', sector: 'Banking' },
  { code: 'BJBR', name: 'Bank BJB', sector: 'Banking' },
  { code: 'BJTM', name: 'Bank Jatim', sector: 'Banking' },
  { code: 'BBTN', name: 'Bank BTN', sector: 'Banking' },
  { code: 'BBYB', name: 'Bank Neo Commerce', sector: 'Banking' },
  { code: 'ARTO', name: 'Bank Jago', sector: 'Banking' },
  { code: 'BSIM', name: 'Bank Sinarmas', sector: 'Banking' },
  { code: 'AGRO', name: 'Bank Raya Indonesia', sector: 'Banking' },
  
  // Telco
  { code: 'TLKM', name: 'Telkom Indonesia', sector: 'Telecom' },
  { code: 'EXCL', name: 'XL Axiata', sector: 'Telecom' },
  { code: 'ISAT', name: 'Indosat Ooredoo Hutchison', sector: 'Telecom' },
  { code: 'FREN', name: 'Smartfren Telecom', sector: 'Telecom' },
  { code: 'TOWR', name: 'Sarana Menara Nusantara', sector: 'Telecom' },
  { code: 'TBIG', name: 'Tower Bersama Infrastructure', sector: 'Telecom' },
  { code: 'MTEL', name: 'Dayamitra Telekomunikasi', sector: 'Telecom' },
  
  // Consumer Goods
  { code: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer' },
  { code: 'ICBP', name: 'Indofood CBP Sukses Makmur', sector: 'Consumer' },
  { code: 'INDF', name: 'Indofood Sukses Makmur', sector: 'Consumer' },
  { code: 'MYOR', name: 'Mayora Indah', sector: 'Consumer' },
  { code: 'KLBF', name: 'Kalbe Farma', sector: 'Consumer' },
  { code: 'SIDO', name: 'Industri Jamu Sido Muncul', sector: 'Consumer' },
  { code: 'KAEF', name: 'Kimia Farma', sector: 'Consumer' },
  { code: 'PYFA', name: 'Pyridam Farma', sector: 'Consumer' },
  { code: 'ULTJ', name: 'Ultra Jaya Milk', sector: 'Consumer' },
  { code: 'MLBI', name: 'Multi Bintang Indonesia', sector: 'Consumer' },
  { code: 'GOOD', name: 'Garudafood Putra Putri Jaya', sector: 'Consumer' },
  { code: 'CEKA', name: 'Wilmar Cahaya Indonesia', sector: 'Consumer' },
  { code: 'ROTI', name: 'Nippon Indosari Corpindo', sector: 'Consumer' },
  { code: 'DLTA', name: 'Delta Djakarta', sector: 'Consumer' },
  
  // Tobacco
  { code: 'HMSP', name: 'HM Sampoerna', sector: 'Tobacco' },
  { code: 'GGRM', name: 'Gudang Garam', sector: 'Tobacco' },
  { code: 'WIIM', name: 'Wismilak Inti Makmur', sector: 'Tobacco' },
  
  // Automotive
  { code: 'ASII', name: 'Astra International', sector: 'Automotive' },
  { code: 'AUTO', name: 'Astra Otoparts', sector: 'Automotive' },
  { code: 'SMSM', name: 'Selamat Sempurna', sector: 'Automotive' },
  { code: 'GJTL', name: 'Gajah Tunggal', sector: 'Automotive' },
  { code: 'INDS', name: 'Indospring', sector: 'Automotive' },
  { code: 'BRAM', name: 'Indo Kordsa', sector: 'Automotive' },
  
  // Mining & Energy
  { code: 'ADRO', name: 'Adaro Energy Indonesia', sector: 'Mining' },
  { code: 'PTBA', name: 'Bukit Asam', sector: 'Mining' },
  { code: 'ITMG', name: 'Indo Tambangraya Megah', sector: 'Mining' },
  { code: 'ANTM', name: 'Aneka Tambang', sector: 'Mining' },
  { code: 'INCO', name: 'Vale Indonesia', sector: 'Mining' },
  { code: 'TINS', name: 'Timah', sector: 'Mining' },
  { code: 'MDKA', name: 'Merdeka Copper Gold', sector: 'Mining' },
  { code: 'MEDC', name: 'Medco Energi Internasional', sector: 'Mining' },
  { code: 'ENRG', name: 'Energi Mega Persada', sector: 'Mining' },
  { code: 'BUMI', name: 'Bumi Resources', sector: 'Mining' },
  { code: 'DSSA', name: 'Dian Swastatika Sentosa', sector: 'Mining' },
  { code: 'HRUM', name: 'Harum Energy', sector: 'Mining' },
  { code: 'BYAN', name: 'Bayan Resources', sector: 'Mining' },
  { code: 'GEMS', name: 'Golden Energy Mines', sector: 'Mining' },
  { code: 'MBAP', name: 'Mitrabara Adiperdana', sector: 'Mining' },
  { code: 'MYOH', name: 'Samindo Resources', sector: 'Mining' },
  { code: 'KKGI', name: 'Resource Alam Indonesia', sector: 'Mining' },
  { code: 'UNSP', name: 'Bakrie Sumatera Plantations', sector: 'Mining' },
  
  // Oil & Gas
  { code: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Oil & Gas' },
  { code: 'AKRA', name: 'AKR Corporindo', sector: 'Oil & Gas' },
  { code: 'ELSA', name: 'Elnusa', sector: 'Oil & Gas' },
  
  // Cement & Construction Material
  { code: 'SMGR', name: 'Semen Indonesia', sector: 'Cement' },
  { code: 'INTP', name: 'Indocement Tunggal Prakarsa', sector: 'Cement' },
  { code: 'SMCB', name: 'Solusi Bangun Indonesia', sector: 'Cement' },
  { code: 'WTON', name: 'Wijaya Karya Beton', sector: 'Cement' },
  
  // Construction & Infrastructure
  { code: 'WIKA', name: 'Wijaya Karya', sector: 'Construction' },
  { code: 'WSKT', name: 'Waskita Karya', sector: 'Construction' },
  { code: 'PTPP', name: 'PP (Persero)', sector: 'Construction' },
  { code: 'ADHI', name: 'Adhi Karya', sector: 'Construction' },
  { code: 'ACST', name: 'Acset Indonusa', sector: 'Construction' },
  { code: 'JSMR', name: 'Jasa Marga', sector: 'Infrastructure' },
  { code: 'META', name: 'Nusantara Infrastructure', sector: 'Infrastructure' },
  { code: 'CMNP', name: 'Citra Marga Nusaphala Persada', sector: 'Infrastructure' },
  
  // Heavy Equipment
  { code: 'UNTR', name: 'United Tractors', sector: 'Heavy Equipment' },
  { code: 'HEXS', name: 'Hexindo Adiperkasa', sector: 'Heavy Equipment' },
  { code: 'INTA', name: 'Intraco Penta', sector: 'Heavy Equipment' },
  
  // Retail
  { code: 'ACES', name: 'Ace Hardware Indonesia', sector: 'Retail' },
  { code: 'MAPI', name: 'Mitra Adiperkasa', sector: 'Retail' },
  { code: 'ERAA', name: 'Erajaya Swasembada', sector: 'Retail' },
  { code: 'RALS', name: 'Ramayana Lestari Sentosa', sector: 'Retail' },
  { code: 'LPPF', name: 'Matahari Department Store', sector: 'Retail' },
  { code: 'AMRT', name: 'Sumber Alfaria Trijaya', sector: 'Retail' },
  { code: 'MIDI', name: 'Midi Utama Indonesia', sector: 'Retail' },
  { code: 'HERO', name: 'Hero Supermarket', sector: 'Retail' },
  { code: 'MPPA', name: 'Matahari Putra Prima', sector: 'Retail' },
  { code: 'RANC', name: 'Supra Boga Lestari', sector: 'Retail' },
  
  // Property & Real Estate
  { code: 'BSDE', name: 'Bumi Serpong Damai', sector: 'Property' },
  { code: 'CTRA', name: 'Ciputra Development', sector: 'Property' },
  { code: 'SMRA', name: 'Summarecon Agung', sector: 'Property' },
  { code: 'PWON', name: 'Pakuwon Jati', sector: 'Property' },
  { code: 'LPKR', name: 'Lippo Karawaci', sector: 'Property' },
  { code: 'ASRI', name: 'Alam Sutera Realty', sector: 'Property' },
  { code: 'DILD', name: 'Intiland Development', sector: 'Property' },
  { code: 'APLN', name: 'Agung Podomoro Land', sector: 'Property' },
  { code: 'PPRO', name: 'PP Properti', sector: 'Property' },
  { code: 'MKPI', name: 'Metropolitan Kentjana', sector: 'Property' },
  { code: 'DUTI', name: 'Duta Pertiwi', sector: 'Property' },
  { code: 'KIJA', name: 'Kawasan Industri Jababeka', sector: 'Property' },
  { code: 'SSIA', name: 'Surya Semesta Internusa', sector: 'Property' },
  
  // Poultry & Agriculture
  { code: 'CPIN', name: 'Charoen Pokphand Indonesia', sector: 'Poultry' },
  { code: 'JPFA', name: 'Japfa Comfeed Indonesia', sector: 'Poultry' },
  { code: 'MAIN', name: 'Malindo Feedmill', sector: 'Poultry' },
  { code: 'SIPD', name: 'Sierad Produce', sector: 'Poultry' },
  
  // Plantation
  { code: 'AALI', name: 'Astra Agro Lestari', sector: 'Plantation' },
  { code: 'LSIP', name: 'PP London Sumatra Indonesia', sector: 'Plantation' },
  { code: 'SIMP', name: 'Salim Ivomas Pratama', sector: 'Plantation' },
  { code: 'SGRO', name: 'Sampoerna Agro', sector: 'Plantation' },
  { code: 'DSNG', name: 'Dharma Satya Nusantara', sector: 'Plantation' },
  { code: 'SSMS', name: 'Sawit Sumbermas Sarana', sector: 'Plantation' },
  { code: 'TBLA', name: 'Tunas Baru Lampung', sector: 'Plantation' },
  
  // Media & Entertainment
  { code: 'SCMA', name: 'Surya Citra Media', sector: 'Media' },
  { code: 'MNCN', name: 'Media Nusantara Citra', sector: 'Media' },
  { code: 'VIVA', name: 'Viva Media Baru', sector: 'Media' },
  { code: 'KPIG', name: 'MNC Land', sector: 'Media' },
  { code: 'FILM', name: 'MD Pictures', sector: 'Media' },
  
  // Technology
  { code: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'Technology' },
  { code: 'BUKA', name: 'Bukalapak.com', sector: 'Technology' },
  { code: 'EMTK', name: 'Elang Mahkota Teknologi', sector: 'Technology' },
  { code: 'MTDL', name: 'Metrodata Electronics', sector: 'Technology' },
  { code: 'DCII', name: 'DCI Indonesia', sector: 'Technology' },
  { code: 'BELI', name: 'Blibli', sector: 'Technology' },
  
  // Finance (Non-Bank)
  { code: 'ADMF', name: 'Adira Dinamika Multi Finance', sector: 'Finance' },
  { code: 'BFIN', name: 'BFI Finance Indonesia', sector: 'Finance' },
  { code: 'WOMF', name: 'Wahana Ottomitra Multiartha', sector: 'Finance' },
  { code: 'CFIN', name: 'Clipan Finance Indonesia', sector: 'Finance' },
  { code: 'VRNA', name: 'Verena Multi Finance', sector: 'Finance' },
  { code: 'TIFA', name: 'Tifa Finance', sector: 'Finance' },
  
  // Insurance
  { code: 'PNLF', name: 'Panin Financial', sector: 'Insurance' },
  { code: 'LPGI', name: 'Lippo General Insurance', sector: 'Insurance' },
  { code: 'ASRM', name: 'Asuransi Ramayana', sector: 'Insurance' },
  { code: 'AHAP', name: 'Asuransi Harta Aman Pratama', sector: 'Insurance' },
  
  // Logistics & Transportation
  { code: 'BIRD', name: 'Blue Bird', sector: 'Transportation' },
  { code: 'ASSA', name: 'Adi Sarana Armada', sector: 'Transportation' },
  { code: 'GIAA', name: 'Garuda Indonesia', sector: 'Transportation' },
  { code: 'SMDR', name: 'Samudera Indonesia', sector: 'Transportation' },
  { code: 'TMAS', name: 'Pelayaran Tempuran Emas', sector: 'Transportation' },
  { code: 'HELI', name: 'Jaya Trishindo', sector: 'Transportation' },
  { code: 'TAXI', name: 'Express Transindo Utama', sector: 'Transportation' },
  
  // Textile & Garment
  { code: 'SRIL', name: 'Sri Rejeki Isman', sector: 'Textile' },
  { code: 'PBRX', name: 'Pan Brothers', sector: 'Textile' },
  { code: 'ERTX', name: 'Eratex Djaja', sector: 'Textile' },
  { code: 'BELL', name: 'Trisula Textile Industries', sector: 'Textile' },
  
  // Paper & Packaging
  { code: 'INKP', name: 'Indah Kiat Pulp & Paper', sector: 'Paper' },
  { code: 'TKIM', name: 'Pabrik Kertas Tjiwi Kimia', sector: 'Paper' },
  { code: 'FASW', name: 'Fajar Surya Wisesa', sector: 'Paper' },
  { code: 'SPMA', name: 'Suparma', sector: 'Paper' },
  
  // Steel & Metal
  { code: 'ISSP', name: 'Steel Pipe Industry of Indonesia', sector: 'Steel' },
  { code: 'KRAS', name: 'Krakatau Steel', sector: 'Steel' },
  { code: 'NIKL', name: 'Pelat Timah Nusantara', sector: 'Steel' },
  { code: 'BTON', name: 'Betonjaya Manunggal', sector: 'Steel' },
  { code: 'LION', name: 'Lion Metal Works', sector: 'Steel' },
  
  // Chemical
  { code: 'UNIC', name: 'Unggul Indah Cahaya', sector: 'Chemical' },
  { code: 'BRPT', name: 'Barito Pacific', sector: 'Chemical' },
  { code: 'TPIA', name: 'Chandra Asri Petrochemical', sector: 'Chemical' },
  { code: 'DPNS', name: 'Duta Pertiwi Nusantara', sector: 'Chemical' },
  { code: 'EKAD', name: 'Ekadharma International', sector: 'Chemical' },
  
  // Hospital & Healthcare
  { code: 'MIKA', name: 'Mitra Keluarga Karyasehat', sector: 'Healthcare' },
  { code: 'SILO', name: 'Siloam International Hospitals', sector: 'Healthcare' },
  { code: 'HEAL', name: 'Medikaloka Hermina', sector: 'Healthcare' },
  { code: 'PRDA', name: 'Prodia Widyahusada', sector: 'Healthcare' },
  
  // Hotel & Tourism
  { code: 'PZZA', name: 'Sarimelati Kencana (Pizza Hut)', sector: 'F&B' },
  { code: 'FAST', name: 'Fast Food Indonesia (KFC)', sector: 'F&B' },
  { code: 'MAPB', name: 'MAP Boga Adiperkasa (Starbucks)', sector: 'F&B' },
  { code: 'BAYU', name: 'Bayu Buana', sector: 'Tourism' },
  { code: 'PANR', name: 'Panorama Sentrawisata', sector: 'Tourism' },
  { code: 'JIHD', name: 'Jakarta Intl Hotels & Dev', sector: 'Hotel' },
  { code: 'PDES', name: 'Destinasi Tirta Nusantara', sector: 'Tourism' },
  { code: 'SHID', name: 'Hotel Sahid Jaya International', sector: 'Hotel' },
  
  // Others Popular
  { code: 'PNGO', name: 'Pinago Utama', sector: 'Others' },
  { code: 'BWPT', name: 'Eagle High Plantations', sector: 'Plantation' },
  { code: 'TAPG', name: 'Triputra Agro Persada', sector: 'Plantation' },
  { code: 'DMAS', name: 'Puradelta Lestari', sector: 'Property' },
  { code: 'LINK', name: 'Link Net', sector: 'Telecom' },
  { code: 'BNLI', name: 'Bank Permata', sector: 'Banking' },
  { code: 'BMTR', name: 'Global Mediacom', sector: 'Media' },
  { code: 'BBKP', name: 'Bank KB Bukopin', sector: 'Banking' },
  { code: 'BTPS', name: 'Bank BTPN Syariah', sector: 'Banking' },
  { code: 'AISA', name: 'FKS Food Sejahtera', sector: 'Consumer' },
  { code: 'SMAR', name: 'Smart', sector: 'Plantation' },
  { code: 'PLIN', name: 'Plaza Indonesia Realty', sector: 'Property' },
  { code: 'BNBA', name: 'Bank Bumi Arta', sector: 'Banking' },
  { code: 'GZCO', name: 'Gozco Plantations', sector: 'Plantation' },
  { code: 'BULL', name: 'Buana Lintas Lautan', sector: 'Transportation' },
  { code: 'CBPE', name: 'Bali Towerindo Sentra', sector: 'Telecom' },
  { code: 'MPOW', name: 'Mega Power Makmur', sector: 'Others' },
  { code: 'BHAT', name: 'Bank Hana Indonesia', sector: 'Banking' },
  { code: 'SDPC', name: 'Millennium Pharmacon International', sector: 'Consumer' },
  { code: 'ULTJ', name: 'Ultrajaya Milk Industry', sector: 'Consumer' },
]

// Sector colors
const SECTOR_COLORS = {
  'Index': 'blue',
  'Banking': 'emerald',
  'Telecom': 'violet',
  'Consumer': 'orange',
  'Tobacco': 'amber',
  'Automotive': 'slate',
  'Mining': 'yellow',
  'Oil & Gas': 'red',
  'Cement': 'stone',
  'Construction': 'zinc',
  'Infrastructure': 'neutral',
  'Heavy Equipment': 'gray',
  'Retail': 'pink',
  'Property': 'cyan',
  'Poultry': 'lime',
  'Plantation': 'green',
  'Media': 'purple',
  'Technology': 'indigo',
  'Finance': 'teal',
  'Insurance': 'sky',
  'Transportation': 'fuchsia',
  'Textile': 'rose',
  'Paper': 'amber',
  'Steel': 'zinc',
  'Chemical': 'purple',
  'Healthcare': 'red',
  'F&B': 'orange',
  'Tourism': 'cyan',
  'Hotel': 'indigo',
  'Others': 'gray',
}

// Price ranges for grouping - use static data with enhanced labels
const PRICE_RANGES = [
  { id: 'index', label: '📊 Indeks', min: -Infinity, max: Infinity, isIndex: true },
  { id: 'micro', label: '🔹 Saham Gorengan (< Rp 50)', min: 0, max: 50 },
  { id: 'penny', label: '💰 Rp 50 - 100', min: 50, max: 100 },
  { id: 'cheap', label: '💵 Rp 100 - 200', min: 100, max: 200 },
  { id: 'low', label: '📊 Rp 200 - 500', min: 200, max: 500 },
  { id: 'medium', label: '📈 Rp 500 - 1.000', min: 500, max: 1000 },
  { id: 'mid', label: '💹 Rp 1.000 - 2.000', min: 1000, max: 2000 },
  { id: 'high', label: '🏦 Rp 2.000 - 5.000', min: 2000, max: 5000 },
  { id: 'premium', label: '💎 Rp 5.000 - 10.000', min: 5000, max: 10000 },
  { id: 'elite', label: '👑 Rp 10.000 - 50.000', min: 10000, max: 50000 },
  { id: 'ultra', label: '🚀 > Rp 50.000', min: 50000, max: Infinity },
]

export default function StockSelector({ 
  selectedStocks = [], 
  onSelect, 
  multiple = true,
  showPrices = true,
  maxSelect = null,
  compact = false,
  excludeIndex = false
}) {
  // Initialize stock prices from static data
  const [stockPrices, setStockPrices] = useState(() => {
    // Pre-populate with static prices
    const prices = {}
    Object.entries(STOCK_PRICES).forEach(([code, price]) => {
      prices[code] = { price, change: 0, changePercent: 0 }
    })
    return prices
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRanges, setExpandedRanges] = useState(new Set(excludeIndex ? ['micro'] : ['index']))
  const [expandedSectors, setExpandedSectors] = useState(new Set())
  const [viewMode, setViewMode] = useState('price') // 'price' or 'sector'
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Filter stocks based on excludeIndex prop
  const availableStocks = useMemo(() => {
    if (excludeIndex) {
      return IDX_STOCKS.filter(s => !s.isIndex)
    }
    return IDX_STOCKS
  }, [excludeIndex])

  // Fetch all stock prices (optional - can use static data)
  const fetchPrices = useCallback(async () => {
    if (!showPrices) return
    
    setLoading(true)
    try {
      // Get all stock codes (excluding index)
      const stockCodes = IDX_STOCKS.filter(s => !s.isIndex).map(s => s.code)
      
      // Batch fetch in chunks of 50
      const chunks = []
      for (let i = 0; i < stockCodes.length; i += 50) {
        chunks.push(stockCodes.slice(i, i + 50))
      }
      
      const allPrices = { ...stockPrices } // Start with static prices
      
      for (const chunk of chunks) {
        try {
          const response = await fetch(`${API_BASE}/stocks/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols: chunk })
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.quotes) {
              data.quotes.forEach(q => {
                allPrices[q.symbol] = {
                  price: q.price || STOCK_PRICES[q.symbol] || 0,
                  change: q.change || 0,
                  changePercent: q.changePercent || 0
                }
              })
            }
          }
        } catch (err) {
          console.error('Error fetching chunk:', err)
        }
      }
      
      setStockPrices(allPrices)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching prices:', err)
    } finally {
      setLoading(false)
    }
  }, [showPrices, stockPrices])

  // Don't auto-fetch, use static prices by default
  useEffect(() => {
    // Static prices are already loaded
    setLastUpdate(new Date())
  }, [])

  // Group stocks by price range using static prices
  const stocksByPriceRange = useMemo(() => {
    const groups = {}
    
    PRICE_RANGES.forEach(range => {
      if (excludeIndex && range.isIndex) return
      groups[range.id] = []
    })
    
    availableStocks.forEach(stock => {
      if (stock.isIndex) {
        if (!excludeIndex) groups['index'].push(stock)
        return
      }
      
      const price = stockPrices[stock.code]?.price || 0
      
      for (const range of PRICE_RANGES) {
        if (range.isIndex) continue
        if (price >= range.min && price < range.max) {
          groups[range.id].push({ ...stock, price })
          break
        }
      }
    })
    
    return groups
  }, [stockPrices, availableStocks, excludeIndex])

  // Group stocks by sector
  const stocksBySector = useMemo(() => {
    const groups = {}
    
    availableStocks.forEach(stock => {
      const sector = stock.sector || 'Others'
      if (!groups[sector]) groups[sector] = []
      groups[sector].push({
        ...stock,
        price: stockPrices[stock.code]?.price || 0
      })
    })
    
    // Sort each group by price descending
    Object.keys(groups).forEach(sector => {
      groups[sector].sort((a, b) => (b.price || 0) - (a.price || 0))
    })
    
    return groups
  }, [stockPrices, availableStocks])

  // Filtered stocks based on search
  const filteredStocks = useMemo(() => {
    if (!searchTerm) return availableStocks
    
    const term = searchTerm.toLowerCase()
    return availableStocks.filter(stock => 
      stock.code.toLowerCase().includes(term) ||
      stock.name.toLowerCase().includes(term) ||
      stock.sector.toLowerCase().includes(term)
    )
  }, [searchTerm])

  // Handle stock selection
  const handleSelect = (code) => {
    if (multiple) {
      if (selectedStocks.includes(code)) {
        onSelect(selectedStocks.filter(s => s !== code))
      } else {
        if (maxSelect && selectedStocks.length >= maxSelect) {
          return // Max reached
        }
        onSelect([...selectedStocks, code])
      }
    } else {
      onSelect(code === selectedStocks[0] ? [] : [code])
    }
  }

  // Select all in a range
  const selectAllInRange = (rangeId) => {
    const stocks = stocksByPriceRange[rangeId] || []
    const codes = stocks.map(s => s.code)
    const newSelected = [...new Set([...selectedStocks, ...codes])]
    if (maxSelect) {
      onSelect(newSelected.slice(0, maxSelect))
    } else {
      onSelect(newSelected)
    }
  }

  // Deselect all in a range
  const deselectAllInRange = (rangeId) => {
    const stocks = stocksByPriceRange[rangeId] || []
    const codes = new Set(stocks.map(s => s.code))
    onSelect(selectedStocks.filter(s => !codes.has(s)))
  }

  // Select all in a sector
  const selectAllInSector = (sector) => {
    const stocks = stocksBySector[sector] || []
    const codes = stocks.map(s => s.code)
    const newSelected = [...new Set([...selectedStocks, ...codes])]
    if (maxSelect) {
      onSelect(newSelected.slice(0, maxSelect))
    } else {
      onSelect(newSelected)
    }
  }

  // Deselect all in a sector
  const deselectAllInSector = (sector) => {
    const stocks = stocksBySector[sector] || []
    const codes = new Set(stocks.map(s => s.code))
    onSelect(selectedStocks.filter(s => !codes.has(s)))
  }

  // Toggle expand
  const toggleRange = (rangeId) => {
    setExpandedRanges(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rangeId)) {
        newSet.delete(rangeId)
      } else {
        newSet.add(rangeId)
      }
      return newSet
    })
  }

  const toggleSector = (sector) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sector)) {
        newSet.delete(sector)
      } else {
        newSet.add(sector)
      }
      return newSet
    })
  }

  // Format price
  const formatPrice = (price) => {
    if (!price) return '-'
    return 'Rp ' + price.toLocaleString('id-ID')
  }

  const formatChange = (change, changePercent) => {
    if (change === undefined) return ''
    const sign = change >= 0 ? '+' : ''
    const color = change >= 0 ? 'text-green-400' : 'text-red-400'
    return (
      <span className={color}>
        {sign}{changePercent?.toFixed(2)}%
      </span>
    )
  }

  // Compact mode for embedding in other components
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari saham... (kode/nama/sektor)"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filteredStocks.slice(0, 50).map(stock => {
            const priceData = stockPrices[stock.code]
            return (
              <button
                key={stock.code}
                onClick={() => handleSelect(stock.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition ${
                  selectedStocks.includes(stock.code)
                    ? 'bg-blue-600 text-white'
                    : stock.isIndex
                      ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {selectedStocks.includes(stock.code) && <FiCheck className="w-4 h-4" />}
                  <span className="font-medium">{stock.isIndex ? '📊 IHSG' : stock.code}</span>
                  <span className="text-xs opacity-70 truncate max-w-[150px]">{stock.name}</span>
                </div>
                {priceData && (
                  <div className="text-xs">
                    {formatPrice(priceData.price)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">📈 Pilih Saham</h3>
          <p className="text-sm text-gray-400">
            {selectedStocks.length} dipilih dari {IDX_STOCKS.length} saham
            {maxSelect && ` (max: ${maxSelect})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Update: {lastUpdate.toLocaleTimeString('id-ID')}
            </span>
          )}
          <button
            onClick={fetchPrices}
            disabled={loading}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            <FiRefreshCw className={`w-4 h-4 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & View Mode */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari saham... (kode/nama/sektor)"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('price')}
            className={`px-3 py-1 rounded text-sm transition ${
              viewMode === 'price' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            💰 Harga
          </button>
          <button
            onClick={() => setViewMode('sector')}
            className={`px-3 py-1 rounded text-sm transition ${
              viewMode === 'sector' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            🏢 Sektor
          </button>
        </div>
      </div>

      {/* Selected Stocks Preview */}
      {selectedStocks.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-gray-700/30 rounded-lg max-h-24 overflow-y-auto">
          {selectedStocks.map(code => {
            const stock = IDX_STOCKS.find(s => s.code === code)
            return (
              <span
                key={code}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  code === '^JKSE' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}
              >
                {code === '^JKSE' ? '📊 IHSG' : code}
                <button onClick={() => handleSelect(code)} className="hover:text-red-300">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )
          })}
          <button
            onClick={() => onSelect([])}
            className="px-2 py-0.5 text-xs text-red-400 hover:text-red-300"
          >
            Hapus Semua
          </button>
        </div>
      )}

      {/* Search Results */}
      {searchTerm ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-400">{filteredStocks.length} hasil ditemukan</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredStocks.map(stock => {
              const priceData = stockPrices[stock.code]
              return (
                <button
                  key={stock.code}
                  onClick={() => handleSelect(stock.code)}
                  className={`p-2 rounded-lg text-left transition ${
                    selectedStocks.includes(stock.code)
                      ? 'bg-blue-600 text-white'
                      : stock.isIndex
                        ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 border border-blue-500/50'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{stock.isIndex ? '📊 IHSG' : stock.code}</span>
                    {selectedStocks.includes(stock.code) && <FiCheck className="w-4 h-4" />}
                  </div>
                  <p className="text-xs opacity-70 truncate">{stock.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-50">{stock.sector}</span>
                    {priceData && (
                      <span className="text-xs">{formatPrice(priceData.price)}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : viewMode === 'price' ? (
        /* Price Range View */
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {PRICE_RANGES.map(range => {
            const stocks = stocksByPriceRange[range.id] || []
            if (stocks.length === 0 && !range.isIndex) return null
            
            const isExpanded = expandedRanges.has(range.id)
            const selectedInRange = stocks.filter(s => selectedStocks.includes(s.code)).length
            
            return (
              <div key={range.id} className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleRange(range.id)}
                  className={`w-full flex items-center justify-between p-3 transition ${
                    range.isIndex ? 'bg-blue-900/30 hover:bg-blue-900/40' : 'bg-gray-700/30 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    <span className="font-medium text-white">{range.label}</span>
                    <span className="text-xs text-gray-400">({stocks.length} saham)</span>
                    {selectedInRange > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                        {selectedInRange} dipilih
                      </span>
                    )}
                  </div>
                  {stocks.length > 0 && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => selectAllInRange(range.id)}
                        className="px-2 py-0.5 text-xs bg-green-600/30 text-green-400 rounded hover:bg-green-600/50"
                      >
                        Pilih Semua
                      </button>
                      <button
                        onClick={() => deselectAllInRange(range.id)}
                        className="px-2 py-0.5 text-xs bg-red-600/30 text-red-400 rounded hover:bg-red-600/50"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </button>
                
                {isExpanded && stocks.length > 0 && (
                  <div className="p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {stocks.sort((a, b) => (b.price || 0) - (a.price || 0)).map(stock => {
                      const priceData = stockPrices[stock.code]
                      return (
                        <button
                          key={stock.code}
                          onClick={() => handleSelect(stock.code)}
                          className={`p-2 rounded text-left text-sm transition ${
                            selectedStocks.includes(stock.code)
                              ? 'bg-blue-600 text-white'
                              : stock.isIndex
                                ? 'bg-blue-800/50 text-blue-200 hover:bg-blue-800/70'
                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{stock.isIndex ? '📊 IHSG' : stock.code}</span>
                            {selectedStocks.includes(stock.code) && <FiCheck className="w-3 h-3" />}
                          </div>
                          <p className="text-xs opacity-70 truncate">{stock.name}</p>
                          {priceData && (
                            <div className="flex items-center justify-between mt-1 text-xs">
                              <span>{formatPrice(priceData.price)}</span>
                              {formatChange(priceData.change, priceData.changePercent)}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Sector View */
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {Object.entries(stocksBySector).sort((a, b) => b[1].length - a[1].length).map(([sector, stocks]) => {
            const isExpanded = expandedSectors.has(sector)
            const selectedInSector = stocks.filter(s => selectedStocks.includes(s.code)).length
            const color = SECTOR_COLORS[sector] || 'gray'
            
            return (
              <div key={sector} className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSector(sector)}
                  className={`w-full flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 transition`}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    <span className={`px-2 py-0.5 bg-${color}-600/30 text-${color}-400 rounded text-sm font-medium`}>
                      {sector}
                    </span>
                    <span className="text-xs text-gray-400">({stocks.length} saham)</span>
                    {selectedInSector > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                        {selectedInSector} dipilih
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => selectAllInSector(sector)}
                      className="px-2 py-0.5 text-xs bg-green-600/30 text-green-400 rounded hover:bg-green-600/50"
                    >
                      Pilih Semua
                    </button>
                    <button
                      onClick={() => deselectAllInSector(sector)}
                      className="px-2 py-0.5 text-xs bg-red-600/30 text-red-400 rounded hover:bg-red-600/50"
                    >
                      Hapus
                    </button>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {stocks.map(stock => {
                      const priceData = stockPrices[stock.code]
                      return (
                        <button
                          key={stock.code}
                          onClick={() => handleSelect(stock.code)}
                          className={`p-2 rounded text-left text-sm transition ${
                            selectedStocks.includes(stock.code)
                              ? 'bg-blue-600 text-white'
                              : stock.isIndex
                                ? 'bg-blue-800/50 text-blue-200 hover:bg-blue-800/70'
                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{stock.isIndex ? '📊 IHSG' : stock.code}</span>
                            {selectedStocks.includes(stock.code) && <FiCheck className="w-3 h-3" />}
                          </div>
                          <p className="text-xs opacity-70 truncate">{stock.name}</p>
                          {priceData && (
                            <div className="flex items-center justify-between mt-1 text-xs">
                              <span>{formatPrice(priceData.price)}</span>
                              {formatChange(priceData.change, priceData.changePercent)}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
        <span className="text-sm text-gray-400">Quick Select:</span>
        <button
          onClick={() => {
            const top20 = availableStocks.slice(0, excludeIndex ? 20 : 21).map(s => s.code)
            onSelect(top20)
          }}
          className="px-2 py-1 text-xs bg-blue-600/30 text-blue-400 rounded hover:bg-blue-600/50"
        >
          {excludeIndex ? 'Top 20' : 'Top 20 + IHSG'}
        </button>
        <button
          onClick={() => {
            const banks = availableStocks.filter(s => s.sector === 'Banking').map(s => s.code)
            onSelect(excludeIndex ? banks : ['^JKSE', ...banks])
          }}
          className="px-2 py-1 text-xs bg-emerald-600/30 text-emerald-400 rounded hover:bg-emerald-600/50"
        >
          🏦 Banking
        </button>
        <button
          onClick={() => {
            const mining = availableStocks.filter(s => s.sector === 'Mining').map(s => s.code)
            onSelect(excludeIndex ? mining : ['^JKSE', ...mining])
          }}
          className="px-2 py-1 text-xs bg-yellow-600/30 text-yellow-400 rounded hover:bg-yellow-600/50"
        >
          ⛏️ Mining
        </button>
        <button
          onClick={() => {
            const tech = availableStocks.filter(s => s.sector === 'Technology').map(s => s.code)
            onSelect(excludeIndex ? tech : ['^JKSE', ...tech])
          }}
          className="px-2 py-1 text-xs bg-indigo-600/30 text-indigo-400 rounded hover:bg-indigo-600/50"
        >
          💻 Tech
        </button>
        <button
          onClick={() => {
            const property = availableStocks.filter(s => s.sector === 'Property').map(s => s.code)
            onSelect(excludeIndex ? property : ['^JKSE', ...property])
          }}
          className="px-2 py-1 text-xs bg-cyan-600/30 text-cyan-400 rounded hover:bg-cyan-600/50"
        >
          🏠 Property
        </button>
        <button
          onClick={() => {
            const consumer = availableStocks.filter(s => s.sector === 'Consumer').map(s => s.code)
            onSelect(excludeIndex ? consumer : ['^JKSE', ...consumer])
          }}
          className="px-2 py-1 text-xs bg-orange-600/30 text-orange-400 rounded hover:bg-orange-600/50"
        >
          🛒 Consumer
        </button>
      </div>
    </div>
  )
}

// Export the stock list for use in other components
export { IDX_STOCKS, PRICE_RANGES, SECTOR_COLORS }
