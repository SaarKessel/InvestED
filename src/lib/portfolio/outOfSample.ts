// InvestED - out-of-sample portfolio check (educational simulation, not advice).
// Question: does a portfolio that was "optimized" on past prices still look good on prices it never saw?
// Real daily closes are cut at a date: weights are learned on the first part (train) only and then judged
// on the last part (test) next to equal-weight and SPY. Textbook long-only mean-variance weights, no
// forecasts. Returns are price returns (no dividends, costs or taxes). Nothing is filled in.
import { TRADING_DAYS, cleanCloses, maxDrawdown, type Close } from "@/lib/risk/riskMetrics";

export const MIN_ASSETS = 2;
export const MAX_ASSETS = 5;
export const MIN_TOTAL_DAYS = 400;
export const MIN_TEST_DAYS = 100;
export const TRAIN_FRACTION = 0.7;

export interface Aligned { dates: string[]; returns: number[][] } // returns[asset][t]

/** Daily simple returns on dates every series has. A date missing in any series is dropped, none is invented. */
export function alignReturns(series: Close[][]): Aligned {
  const cleaned = series.map((s) => cleanCloses(s));
  const maps = cleaned.map((s) => new Map(s.map((c) => [c.date, c.close])));
  const dates = [...maps[0].keys()].filter((d) => maps.every((m) => m.has(d))).sort();
  const returns = maps.map((m) => dates.slice(1).map((d, i) => (m.get(d) as number) / (m.get(dates[i]) as number) - 1));
  return { dates: dates.slice(1), returns };
}

function mean(x: number[]) { return x.reduce((a, b) => a + b, 0) / x.length; }
export function covMatrix(r: number[][]): number[][] {
  const n = r.length, T = r[0].length, mu = r.map(mean);
  const c = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
    let s = 0; for (let t = 0; t < T; t++) s += (r[i][t] - mu[i]) * (r[j][t] - mu[j]);
    c[i][j] = c[j][i] = s / (T - 1);
  }
  return c;
}

/** Euclidean projection onto the simplex (weights >= 0, sum 1). */
export function projectSimplex(v: number[]): number[] {
  const u = [...v].sort((a, b) => b - a);
  let css = 0, rho = -1, theta = 0;
  for (let i = 0; i < u.length; i++) { css += u[i]; const t = (css - 1) / (i + 1); if (u[i] - t > 0) { rho = i; theta = t; } }
  if (rho < 0) return v.map(() => 1 / v.length);
  return v.map((x) => Math.max(0, x - theta));
}

/** Long-only minimum variance by projected gradient from equal weights. Deterministic. */
export function minVarianceWeights(cov: number[][], iters = 4000): number[] {
  const n = cov.length; let w = new Array<number>(n).fill(1 / n);
  const scale = Math.max(...cov.map((row, i) => row[i])) || 1; const step = 0.5 / (n * scale);
  for (let k = 0; k < iters; k++) {
    const g = cov.map((row) => row.reduce((s, c, j) => s + c * w[j], 0));
    w = projectSimplex(w.map((x, i) => x - step * g[i] * 2));
  }
  return w;
}

/** Long-only maximum Sharpe (risk-free 0): normalized-gradient ascent with a shrinking step, projected onto the simplex. Deterministic. */
export function maxSharpeWeights(mu: number[], cov: number[][], iters = 3000): number[] {
  const n = mu.length; let w = new Array<number>(n).fill(1 / n);
  const sharpe = (x: number[]) => {
    const v = x.reduce((sum, xi, i) => sum + xi * cov[i].reduce((q, c, j) => q + c * x[j], 0), 0);
    return v > 0 ? x.reduce((sum, xi, i) => sum + xi * mu[i], 0) / Math.sqrt(v) : -Infinity;
  };
  let best = w, bestS = sharpe(w);
  for (let k = 0; k < iters; k++) {
    const cw = cov.map((row) => row.reduce((q, c, j) => q + c * w[j], 0));
    const v = w.reduce((q, x, i) => q + x * cw[i], 0);
    if (!(v > 0)) break;
    const sd = Math.sqrt(v), m = w.reduce((q, x, i) => q + x * mu[i], 0);
    const g = mu.map((x, i) => x / sd - (m * cw[i]) / (sd * v));
    const norm = Math.sqrt(g.reduce((q, x) => q + x * x, 0)) || 1;
    const eta = 0.2 / (1 + k * 0.02);
    w = projectSimplex(w.map((x, i) => x + (eta * g[i]) / norm));
    const sc = sharpe(w);
    if (sc > bestS) { bestS = sc; best = w; }
  }
  return best;
}

export interface Stats { annReturnPct: number; annVolPct: number; sharpe: number | null; maxDrawdownPct: number; totalReturnPct: number }
export function portfolioStats(daily: number[], dates: string[]): Stats {
  const m = mean(daily);
  const sd = Math.sqrt(daily.reduce((s, x) => s + (x - m) ** 2, 0) / (daily.length - 1));
  let level = 1; const curve: Close[] = [{ date: dates[0], close: 1 }];
  daily.forEach((x, i) => { level *= 1 + x; curve.push({ date: dates[i + 1] ?? dates[i], close: level }); });
  const dd = maxDrawdown(curve);
  return {
    annReturnPct: (Math.pow(level, TRADING_DAYS / daily.length) - 1) * 100,
    annVolPct: sd * Math.sqrt(TRADING_DAYS) * 100,
    sharpe: sd > 0 ? (m / sd) * Math.sqrt(TRADING_DAYS) : null,
    maxDrawdownPct: (dd?.value ?? 0) * 100,
    totalReturnPct: (level - 1) * 100,
  };
}

const combine = (r: number[][], w: number[], from: number, to: number) => {
  const out: number[] = [];
  for (let t = from; t < to; t++) out.push(w.reduce((s, x, i) => s + x * r[i][t], 0));
  return out;
};

export interface Row { name: "min_variance" | "max_sharpe" | "equal_weight" | "spy"; weights?: number[]; train: Stats; test: Stats }
export interface OosResult {
  symbols: string[]; splitDate: string; from: string; to: string; trainDays: number; testDays: number;
  rows: Row[];
  /** Sharpe lost between train and test for the max-Sharpe weights (positive means worse out of sample). */
  sharpeDropMaxSharpe: number | null;
  verdict: "held_up" | "degraded" | "mixed" | "unclear";
}
export type OosOutcome = { ok: true; result: OosResult } | { ok: false; reason: "too_few_assets" | "too_many_assets" | "too_little_history" | "spy_missing" };

export function runOutOfSample(symbols: string[], series: Close[][], spy: Close[] | null): OosOutcome {
  if (symbols.length < MIN_ASSETS) return { ok: false, reason: "too_few_assets" };
  if (symbols.length > MAX_ASSETS) return { ok: false, reason: "too_many_assets" };
  if (!spy) return { ok: false, reason: "spy_missing" };
  const a = alignReturns([...series, spy]);
  const T = a.dates.length;
  const split = Math.floor(T * TRAIN_FRACTION);
  if (T < MIN_TOTAL_DAYS || T - split < MIN_TEST_DAYS) return { ok: false, reason: "too_little_history" };
  const assets = a.returns.slice(0, symbols.length), spyR = a.returns[symbols.length];
  const trainR = assets.map((r) => r.slice(0, split));
  const cov = covMatrix(trainR), mu = trainR.map(mean);
  const wMin = minVarianceWeights(cov), wSharpe = maxSharpeWeights(mu, cov), wEq = new Array<number>(symbols.length).fill(1 / symbols.length);
  const mk = (name: Row["name"], daily: (f: number, t: number) => number[], weights?: number[]): Row => ({
    name, weights, train: portfolioStats(daily(0, split), a.dates.slice(0, split)), test: portfolioStats(daily(split, T), a.dates.slice(split)),
  });
  const rows: Row[] = [
    mk("min_variance", (f, t) => combine(assets, wMin, f, t), wMin),
    mk("max_sharpe", (f, t) => combine(assets, wSharpe, f, t), wSharpe),
    mk("equal_weight", (f, t) => combine(assets, wEq, f, t), wEq),
    mk("spy", (f, t) => spyR.slice(f, t)),
  ];
  const ms = rows[1];
  const drop = ms.train.sharpe !== null && ms.test.sharpe !== null ? ms.train.sharpe - ms.test.sharpe : null;
  const eqTest = rows[2].test.sharpe, msTest = ms.test.sharpe;
  const verdict: OosResult["verdict"] = drop === null || eqTest === null || msTest === null ? "unclear"
    : drop <= 0.2 && msTest >= eqTest ? "held_up" : drop > 0.2 && msTest < eqTest ? "degraded" : "mixed";
  return { ok: true, result: { symbols, splitDate: a.dates[split], from: a.dates[0], to: a.dates[T - 1], trainDays: split, testDays: T - split, rows, sharpeDropMaxSharpe: drop, verdict } };
}
