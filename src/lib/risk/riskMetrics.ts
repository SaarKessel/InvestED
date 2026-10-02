/**
 * Risk metrics computed from real daily closes. Pure and deterministic: no model, no network.
 * A metric needs enough data; with too little it is null and the reason is stated, never estimated.
 */
export interface Close { date: string; close: number }
export interface Drawdown { value: number; peakDate: string; troughDate: string }
export interface RiskMetrics {
  /** daily closes used */
  days: number;
  from: string | null;
  to: string | null;
  /** change from first to last close in the window, as a fraction */
  periodReturn: number | null;
  /** annualised standard deviation of daily returns, as a fraction */
  volatility: number | null;
  /** worst peak-to-trough fall in the window, a negative fraction */
  maxDrawdown: Drawdown | null;
  /** slope against the benchmark's daily returns */
  beta: number | null;
  betaDays: number;
  /** why a metric is null */
  missing: { volatility?: "too_few_days"; drawdown?: "too_few_days"; beta?: "no_benchmark" | "too_few_overlap" | "flat_benchmark" };
}

export const MIN_DAYS = 30;
export const MIN_BETA_OVERLAP = 60;
export const TRADING_DAYS = 252;

export function cleanCloses(rows: { date: string; close: number }[]): Close[] {
  const byDate = new Map<string, number>();
  for (const r of rows) if (r && typeof r.date === "string" && Number.isFinite(r.close) && r.close > 0) byDate.set(r.date.slice(0, 10), r.close);
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, close]) => ({ date, close }));
}

const returnsOf = (c: Close[]): { date: string; r: number }[] => c.slice(1).map((x, i) => ({ date: x.date, r: x.close / c[i].close - 1 }));
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const sampleVar = (a: number[]) => { const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); };

export function maxDrawdown(c: Close[]): Drawdown | null {
  if (c.length < 2) return null;
  let peak = c[0], worst: Drawdown = { value: 0, peakDate: c[0].date, troughDate: c[0].date };
  for (const x of c) {
    if (x.close > peak.close) peak = x;
    const dd = x.close / peak.close - 1;
    if (dd < worst.value) worst = { value: dd, peakDate: peak.date, troughDate: x.date };
  }
  return worst;
}

export function computeRisk(asset: Close[], benchmark?: Close[]): RiskMetrics {
  const missing: RiskMetrics["missing"] = {};
  const rs = returnsOf(asset);
  const enough = asset.length >= MIN_DAYS;
  const volatility = enough ? Math.sqrt(sampleVar(rs.map((x) => x.r))) * Math.sqrt(TRADING_DAYS) : null;
  if (!enough) { missing.volatility = "too_few_days"; missing.drawdown = "too_few_days"; }
  const dd = enough ? maxDrawdown(asset) : null;

  let beta: number | null = null, betaDays = 0;
  if (!benchmark || benchmark.length < 2) missing.beta = "no_benchmark";
  else {
    const b = new Map(returnsOf(benchmark).map((x) => [x.date, x.r]));
    const pairs = rs.filter((x) => b.has(x.date)).map((x) => [x.r, b.get(x.date)!] as const);
    betaDays = pairs.length;
    if (pairs.length < MIN_BETA_OVERLAP) missing.beta = "too_few_overlap";
    else {
      const xs = pairs.map((p) => p[1]), ys = pairs.map((p) => p[0]);
      const vx = sampleVar(xs);
      if (!(vx > 1e-12)) missing.beta = "flat_benchmark";
      else { const mx = mean(xs), my = mean(ys); beta = pairs.reduce((s, p) => s + (p[1] - mx) * (p[0] - my), 0) / (pairs.length - 1) / vx; }
    }
  }
  return {
    days: asset.length, from: asset[0]?.date ?? null, to: asset[asset.length - 1]?.date ?? null,
    periodReturn: asset.length >= 2 ? asset[asset.length - 1].close / asset[0].close - 1 : null,
    volatility, maxDrawdown: dd, beta, betaDays, missing,
  };
}
