// ---------------------------------------------------------------------------
// InvestED - minimum-variance portfolio weights (Markowitz), long-only,
// from textbook math. Inputs are REAL aligned period returns; dates missing in
// any asset are dropped for all (never filled). The result is IN-SAMPLE: it
// describes how the past data would have been weighted, not what to hold.
// ---------------------------------------------------------------------------

import type { Metric } from "./risk.js";

export interface PricePointLike { date: string; close: number }

/** Inner-join on dates, then period returns per asset. Reports how many dates were dropped. */
export function alignedReturns(series: Record<string, ReadonlyArray<PricePointLike>>): Metric<{ symbols: string[]; returns: number[][]; dates: number; dropped: number }> {
  const symbols = Object.keys(series);
  if (symbols.length < 2) return { status: "unavailable", reason: "At least two assets with history are needed" };
  const maps = symbols.map((s) => new Map(series[s].filter((p) => p.close > 0 && Number.isFinite(p.close)).map((p) => [p.date, p.close])));
  const common = [...maps[0].keys()].filter((d) => maps.every((m) => m.has(d))).sort();
  const union = new Set(maps.flatMap((m) => [...m.keys()])).size;
  if (common.length < 61) return { status: "unavailable", reason: `Only ${common.length} common dates across assets; at least 61 are needed` };
  const returns = maps.map((m) => common.slice(1).map((d, i) => (m.get(d) as number) / (m.get(common[i]) as number) - 1));
  return { status: "computed", value: { symbols, returns, dates: common.length, dropped: union - common.length } };
}

export function covarianceMatrix(returns: number[][]): number[][] {
  const n = returns.length, t = returns[0].length;
  const mean = returns.map((r) => r.reduce((s, x) => s + x, 0) / t);
  return returns.map((_, i) => returns.map((__, j) => { let s = 0; for (let k = 0; k < t; k++) s += (returns[i][k] - mean[i]) * (returns[j][k] - mean[j]); return s / (t - 1); }).slice(0, n));
}

/** Euclidean projection onto the probability simplex (sort-based algorithm, Duchi et al. 2008). */
export function projectSimplex(v: number[]): number[] {
  const u = [...v].sort((a, b) => b - a);
  let css = 0, rho = 0, theta = 0;
  for (let i = 0; i < u.length; i++) { css += u[i]; const t = (css - 1) / (i + 1); if (u[i] - t > 0) { rho = i + 1; theta = t; } }
  void rho;
  return v.map((x) => Math.max(0, x - theta));
}

export const variance = (w: number[], cov: number[][]) => w.reduce((s, wi, i) => s + wi * w.reduce((t, wj, j) => t + wj * cov[i][j], 0), 0);

/** Long-only minimum variance by projected gradient descent; deterministic. */
export function minVarianceWeights(cov: number[][], iterations = 5000): number[] {
  const n = cov.length;
  let w = Array(n).fill(1 / n);
  const lip = 2 * Math.max(...cov.map((row) => row.reduce((s, x) => s + Math.abs(x), 0)));
  if (!(lip > 0)) return w;
  const step = 1 / lip;
  for (let it = 0; it < iterations; it++) {
    const grad = w.map((_, i) => 2 * w.reduce((s, wj, j) => s + cov[i][j] * wj, 0));
    const next = projectSimplex(w.map((x, i) => x - step * grad[i]));
    const delta = next.reduce((s, x, i) => s + Math.abs(x - w[i]), 0);
    w = next;
    if (delta < 1e-12) break;
  }
  return w;
}

export interface MinVarianceReport { symbols: string[]; weights: number[]; equalWeightVolPct: number; minVolPct: number; periods: number; dates: number; dropped: number; inSample: true }

export function minVarianceReport(series: Record<string, ReadonlyArray<PricePointLike>>, periodsPerYear: number): Metric<MinVarianceReport> {
  const a = alignedReturns(series);
  if (a.status === "unavailable") return a;
  const { symbols, returns, dates, dropped } = a.value;
  const cov = covarianceMatrix(returns);
  const w = minVarianceWeights(cov);
  const eq = Array(symbols.length).fill(1 / symbols.length);
  const ann = Math.sqrt(periodsPerYear) * 100;
  return { status: "computed", value: { symbols, weights: w, equalWeightVolPct: Math.sqrt(variance(eq, cov)) * ann, minVolPct: Math.sqrt(variance(w, cov)) * ann, periods: returns[0].length, dates, dropped, inSample: true } };
}
