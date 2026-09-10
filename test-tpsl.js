// Test simulasi TP/SL di generateRegressionDataset (varian lib & server)
const libSvc = require('./lib/indicatorService');
const serverSvc = require('./server/services/indicatorService');

function buildPrices() {
  const prices = [];
  for (let i = 0; i < 90; i++) {
    const close = 100 + 0.5 * Math.sin(i * 0.7);
    const open = i === 0 ? close : prices[i - 1].close;
    prices.push({
      date: new Date(Date.UTC(2024, 0, 1 + i)).toISOString(),
      open,
      high: Math.max(open, close) + 0.4,
      low: Math.min(open, close) - 0.4,
      close,
      volume: 1000000,
    });
  }
  return prices;
}

const overrideDay = (prices, idx, o) => { prices[idx] = { ...prices[idx], ...o }; };
const approx = (a, b, eps = 1e-4) => Math.abs(a - b) < eps;
let failures = 0;
function check(name, cond, extra = '') {
  if (cond) console.log(`  PASS ${name}${extra ? ' | ' + extra : ''}`);
  else { failures++; console.error(`  FAIL ${name}${extra ? ' | ' + extra : ''}`); }
}
function rowForSignalDay(dataset, prices, signalIdx) {
  const row = dataset.find((r) => r.date === prices[signalIdx].date);
  if (!row) throw new Error(`Row signal day ${signalIdx} tidak ditemukan`);
  return row;
}

function runScenarioSet(indicatorService, label) {
  console.log(`\n=== ${label} ===`);
  const prices = buildPrices();
  const [e70, e71, e72, e73, e74] = [70, 71, 72, 73, 74].map((i) => prices[i].close);

  // S1: TP first (day 71)
  overrideDay(prices, 71, { open: e70 * 1.01, high: e70 * 1.06, low: e70 * 0.99, close: e70 * 1.02 });
  // S2: SL first (day 72)
  overrideDay(prices, 72, { open: e71 * 0.99, high: e71 * 1.02, low: e71 * 0.94, close: e71 * 0.96 });
  // S3: TP & SL hari sama (day 73) -> konservatif SL
  overrideDay(prices, 73, { open: e72 * 1.00, high: e72 * 1.06, low: e72 * 0.94, close: e72 * 0.98 });
  // S4: time exit (days 74-77, horizon 4, exit di close day 77)
  for (let d = 74; d <= 77; d++) {
    overrideDay(prices, d, { open: e73 * 1.005, high: e73 * 1.04, low: e73 * 0.96, close: d === 77 ? e73 * 1.03 : e73 * 1.01 });
  }
  // S5: gap up melewati TP (day 75) -> tetap TP +5% flat
  overrideDay(prices, 75, { open: e74 * 1.08, high: e74 * 1.085, low: e74 * 1.055, close: e74 * 1.06 });

  const options = { includeNeutral: true, horizonDays: 4, upThreshold: 100, downThreshold: -100, tpPercent: 5, slPercent: 5 };
  const dataset = indicatorService.generateRegressionDataset(prices, '2023-12-01', '2024-12-31', options);

  { // S1
    const r = rowForSignalDay(dataset, prices, 70);
    check('S1 entry = currentClose', approx(r.entryPrice, r.currentClose), `entry=${r.entryPrice}`);
    check('S1 status TP', r.tpslStatus === 'TP', r.tpslStatus);
    check('S1 percent +5', approx(r.tpslPercent, 5), String(r.tpslPercent));
    check('S1 daysHeld 1', r.tpslDaysHeld === 1, String(r.tpslDaysHeld));
    check('S1 exitPrice = TP', approx(r.tpslExitPrice, r.entryPrice * 1.05), String(r.tpslExitPrice));
    check('S1 exitDate = day71', r.tpslExitDate === prices[71].date, r.tpslExitDate);
  }
  { // S2
    const r = rowForSignalDay(dataset, prices, 71);
    check('S2 status SL', r.tpslStatus === 'SL', r.tpslStatus);
    check('S2 percent -5', approx(r.tpslPercent, -5), String(r.tpslPercent));
    check('S2 daysHeld 1', r.tpslDaysHeld === 1, String(r.tpslDaysHeld));
    check('S2 exitPrice = SL', approx(r.tpslExitPrice, r.entryPrice * 0.95), String(r.tpslExitPrice));
  }
  { // S3
    const r = rowForSignalDay(dataset, prices, 72);
    check('S3 status SL (konservatif)', r.tpslStatus === 'SL', r.tpslStatus);
    check('S3 percent -5', approx(r.tpslPercent, -5), String(r.tpslPercent));
  }
  { // S4
    const r = rowForSignalDay(dataset, prices, 73);
    check('S4 status TIME_EXIT', r.tpslStatus === 'TIME_EXIT', r.tpslStatus);
    check('S4 percent = return close H+4', approx(r.tpslPercent, 3), String(r.tpslPercent));
    check('S4 daysHeld 4', r.tpslDaysHeld === 4, String(r.tpslDaysHeld));
    check('S4 exitPrice = close H+4', approx(r.tpslExitPrice, e73 * 1.03), String(r.tpslExitPrice));
    check('S4 exitDate = day77', r.tpslExitDate === prices[77].date, r.tpslExitDate);
  }
  { // S5
    const r = rowForSignalDay(dataset, prices, 74);
    check('S5 status TP (gap up)', r.tpslStatus === 'TP', r.tpslStatus);
    check('S5 percent +5 flat', approx(r.tpslPercent, 5), String(r.tpslPercent));
    check('S5 exitPrice = TP (bukan open gap)', approx(r.tpslExitPrice, r.entryPrice * 1.05), String(r.tpslExitPrice));
  }

  // S6: TP/SL kustom 2%/3%
  const prices6 = buildPrices();
  const e75 = prices6[75].close;
  overrideDay(prices6, 76, { open: e75 * 1.005, high: e75 * 1.03, low: e75 * 0.98, close: e75 * 1.02 });
  const dataset6 = indicatorService.generateRegressionDataset(
    prices6, '2023-12-01', '2024-12-31',
    { includeNeutral: true, horizonDays: 4, upThreshold: 100, downThreshold: -100, tpPercent: 2, slPercent: 3 }
  );
  {
    const r = rowForSignalDay(dataset6, prices6, 75);
    check('S6 status TP (tp=2)', r.tpslStatus === 'TP', r.tpslStatus);
    check('S6 percent +2', approx(r.tpslPercent, 2), String(r.tpslPercent));
    check('S6 exitPrice = entry*1.02', approx(r.tpslExitPrice, r.entryPrice * 1.02), String(r.tpslExitPrice));
  }
}

runScenarioSet(libSvc, 'lib/indicatorService.js (Vercel api/)');
runScenarioSet(serverSvc, 'server/services/indicatorService.js (Express)');

console.log(failures === 0 ? '\nSEMUA TEST LULUS' : `\n${failures} TEST GAGAL`);
process.exit(failures === 0 ? 0 : 1);
