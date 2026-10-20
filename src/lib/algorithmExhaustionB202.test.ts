// ---------------------------------------------------------------------------
// B202 - algorithm exhaustion pass: mathematical invariants and independent
// closed-form oracles for every core numeric engine.
//
// Each test verifies an IDENTITY or a textbook closed form, computed
// independently of the implementation under test (several oracles were
// produced with Python's statistics.NormalDist and plain arithmetic).
// Deterministic seeded pseudo-random inputs only; no network, no randomness.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { alignedReturns, covarianceMatrix, minVarianceReport, minVarianceWeights, projectSimplex, variance } from "./analytics/portfolio.js";
import { computeVar, normInv, periodReturns } from "./analytics/risk.js";
import { computeRisk, maxDrawdown as riskMaxDrawdown, type Close } from "./risk/riskMetrics.js";
import { computeDcf, dcfSensitivity } from "./analytics/dcf.js";
import { computeSchpitzer, computeSillukin } from "./loanEngine.js";
import { calculateRequiredMonthlyContribution } from "./calculatorEngine.js";
import { calculateEma, calculateMacd, calculateRsi, calculateSma, calculateVolatility } from "./market/indicators.js";
import { cleanSeries, computePerformance, maxDrawdown, splitTrainTest } from "./backtest/performance.js";
import { simulate } from "./algo/backtest.js";
import { walkForward } from "./algo/walkForward.js";
import { checkRule, checkStrategy, type RuleStrategy } from "./algo/rules.js";
import { bollinger, rangePosition } from "./market/factors.js";
import type { CandleDatum } from "../types/index.js";

// Deterministic RNG (mulberry32) so the property tests never flake.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dates = (n: number, from = "2024-01-01"): string[] => {
  const out: string[] = [];
  const t0 = Date.parse(from);
  for (let i = 0; i < n; i++) out.push(new Date(t0 + i * 86_400_000).toISOString().slice(0, 10));
  return out;
};

const closes = (vals: number[], from = "2024-01-01"): Close[] => vals.map((close, i) => ({ date: dates(vals.length, from)[i], close }));
const candles = (vals: number[]): CandleDatum[] => vals.map((close, i) => ({ date: dates(vals.length)[i], close } as CandleDatum));

// ---------------------------------------------------------------------------
// analytics/portfolio: simplex projection, covariance, minimum variance
// ---------------------------------------------------------------------------

describe("portfolio exhaustion", () => {
  it("projectSimplex lands on the simplex and is idempotent", () => {
    const rand = rng(42);
    for (let t = 0; t < 200; t++) {
      const v = Array.from({ length: 2 + Math.floor(rand() * 8) }, () => (rand() - 0.7) * 4);
      const w = projectSimplex(v);
      expect(w.every((x) => x >= -1e-12)).toBe(true);
      expect(Math.abs(w.reduce((s, x) => s + x, 0) - 1)).toBeLessThan(1e-9);
      const w2 = projectSimplex(w);
      expect(Math.max(...w2.map((x, i) => Math.abs(x - w[i])))).toBeLessThan(1e-9);
    }
  });

  it("covarianceMatrix is symmetric with sample variance on the diagonal", () => {
    const rand = rng(7);
    const returns = [0, 1, 2].map(() => Array.from({ length: 50 }, () => (rand() - 0.5) * 0.04));
    const cov = covarianceMatrix(returns);
    for (let i = 0; i < 3; i++) {
      const m = returns[i].reduce((s, x) => s + x, 0) / 50;
      const v = returns[i].reduce((s, x) => s + (x - m) ** 2, 0) / 49;
      expect(cov[i][i]).toBeCloseTo(v, 12);
      for (let j = 0; j < 3; j++) expect(cov[i][j]).toBeCloseTo(cov[j][i], 15);
    }
  });

  it("minimum variance never loses to equal weight, and matches the closed form for diagonal covariance", () => {
    const cov = [[0.04, 0, 0], [0, 0.01, 0], [0, 0, 0.0025]];
    const w = minVarianceWeights(cov);
    expect(w.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 9);
    // closed form for diagonal cov: w_i proportional to 1/var_i
    const inv = [1 / 0.04, 1 / 0.01, 1 / 0.0025];
    const total = inv.reduce((s, x) => s + x, 0);
    for (let i = 0; i < 3; i++) expect(w[i]).toBeCloseTo(inv[i] / total, 2);
    const eq = [1 / 3, 1 / 3, 1 / 3];
    expect(variance(w, cov)).toBeLessThanOrEqual(variance(eq, cov) + 1e-12);
  });

  it("alignedReturns inner-joins dates and matches price ratios exactly", () => {
    const a = closes([100, 101, 102, 103]);
    const b = closes([50, 51, 52], "2024-01-02"); // only 3 dates, offset by one
    const r = alignedReturns({ A: a, B: b, C: a });
    expect(r.status).toBe("unavailable"); // only 3 common dates < 61 minimum
    const many = (mul: number) => dates(80).map((d, i) => ({ date: d, close: mul * (100 + i) }));
    const okR = alignedReturns({ A: many(1), B: many(2) });
    expect(okR.status).toBe("computed");
    if (okR.status === "computed") {
      expect(okR.value.dates).toBe(80);
      expect(okR.value.returns[0][0]).toBeCloseTo(101 / 100 - 1, 15);
      expect(okR.value.returns[1][0]).toBeCloseTo(2 * 101 / (2 * 100) - 1, 15);
    }
  });

  it("minVarianceReport reports in-sample and both volatilities", () => {
    const rand = rng(11);
    const mk = (drift: number) => {
      let p = 100;
      return dates(120).map((date) => { p *= 1 + drift + (rand() - 0.5) * 0.02; return { date, close: p }; });
    };
    const r = minVarianceReport({ A: mk(0.0004), B: mk(0.0002), C: mk(0) }, 252);
    expect(r.status).toBe("computed");
    if (r.status === "computed") {
      expect(r.value.weights.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 6);
      expect(r.value.minVolPct).toBeLessThanOrEqual(r.value.equalWeightVolPct + 1e-9);
      expect(r.value.inSample).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// analytics/risk: norm inverse and VaR/ES
// ---------------------------------------------------------------------------

describe("VaR exhaustion", () => {
  it("normInv matches Python statistics.NormalDist constants", () => {
    const oracle: [number, number][] = [
      [0.5, 0], [0.975, 1.9599639845400536], [0.95, 1.6448536269514715],
      [0.05, -1.6448536269514726], [0.025, -1.9599639845400538],
      [0.01, -2.3263478740408408], [0.99, 2.3263478740408408],
    ];
    for (const [p, z] of oracle) expect(Math.abs(normInv(p) - z)).toBeLessThan(1e-8);
    expect(Number.isNaN(normInv(0))).toBe(true);
    expect(Number.isNaN(normInv(1))).toBe(true);
    const rand = rng(3);
    for (let t = 0; t < 100; t++) {
      const p = 0.001 + rand() * 0.998;
      expect(Math.abs(normInv(p) + normInv(1 - p))).toBeLessThan(1e-8); // symmetry identity
    }
  });

  it("ES is at least VaR and VaR rises with confidence, on random and hand-built samples", () => {
    const rand = rng(99);
    for (let t = 0; t < 50; t++) {
      const r = Array.from({ length: 100 }, () => (rand() - 0.55) * 0.05);
      for (const conf of [90, 95, 99]) {
        const v = computeVar(r, conf);
        expect(v.status).toBe("computed");
        if (v.status === "computed") expect(v.value.expectedShortfallPct).toBeGreaterThanOrEqual(v.value.historicalVarPct - 1e-9);
      }
      const v90 = computeVar(r, 90), v99 = computeVar(r, 99);
      if (v90.status === "computed" && v99.status === "computed") {
        expect(v99.value.historicalVarPct).toBeGreaterThanOrEqual(v90.value.historicalVarPct - 1e-9);
      }
    }
    // hand-built: 100 returns, worst five are -5%, -4%, -3%, -2%, -1%
    const r = [...Array(95).fill(0.01), -0.05, -0.04, -0.03, -0.02, -0.01];
    const v = computeVar(r, 95);
    expect(v.status).toBe("computed");
    if (v.status === "computed") {
      // alpha*n = 5 -> the 5th order statistic is -1% (the five tail losses are -5..-1)
      expect(v.value.historicalVarPct).toBeCloseTo(1, 9);
      expect(v.value.expectedShortfallPct).toBeCloseTo((5 + 4 + 3 + 2 + 1) / 5, 9);
    }
  });

  it("periodReturns drops non-positive closes instead of inventing values", () => {
    expect(periodReturns([100, 110, 0, 121])[0]).toBeCloseTo(0.1, 15);
    expect(periodReturns([100, -5, 110])).toEqual([]);
  });

  it("refuses too few observations and bad confidence", () => {
    expect(computeVar(Array(59).fill(0.01)).status).toBe("unavailable");
    expect(computeVar(Array(100).fill(0.01), 50).status).toBe("unavailable");
    expect(computeVar(Array(100).fill(0.01), 100).status).toBe("unavailable");
  });
});

// ---------------------------------------------------------------------------
// risk/riskMetrics: drawdown and beta
// ---------------------------------------------------------------------------

describe("riskMetrics exhaustion", () => {
  it("maxDrawdown finds the exact peak-to-trough fall", () => {
    const dd = riskMaxDrawdown(closes([100, 120, 90, 130, 85]));
    expect(dd).not.toBeNull();
    expect(dd!.value).toBeCloseTo(85 / 130 - 1, 12);
    expect(dd!.peakDate).toBe(dates(5)[3]);
    expect(dd!.troughDate).toBe(dates(5)[4]);
  });

  it("beta of a synthetic 2x-levered asset is exactly 2", () => {
    const n = 120;
    const ds = dates(n);
    let bp = 1000, ap = 100;
    const bench: Close[] = [], asset: Close[] = [];
    const rand = rng(5);
    for (let i = 0; i < n; i++) {
      const rb = i === 0 ? 0 : (rand() - 0.5) * 0.03;
      bp *= 1 + rb; ap *= 1 + 2 * rb;
      bench.push({ date: ds[i], close: bp });
      asset.push({ date: ds[i], close: ap });
    }
    const r = computeRisk(asset, bench);
    expect(r.beta).toBeCloseTo(2, 6);
    expect(r.betaDays).toBe(n - 1);
  });

  it("volatility of a constant-price series is zero, not null", () => {
    const r = computeRisk(closes(Array(60).fill(100)));
    expect(r.volatility).toBe(0);
    expect(r.maxDrawdown!.value).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// analytics/dcf: two-stage Gordon growth
// ---------------------------------------------------------------------------

describe("DCF exhaustion", () => {
  it("one-year case matches the closed form (Python oracle)", () => {
    const o = computeDcf({ baseCashFlow: 100, growthPct: 10, discountPct: 12, terminalGrowthPct: 2, years: 1, netDebt: 100, shares: 10 });
    expect(o.ok).toBe(true);
    if (o.ok) {
      expect(o.result.presentValueOfCashFlows).toBeCloseTo(98.21428571428572, 9);
      expect(o.result.presentValueOfTerminal).toBeCloseTo(1001.7857142857144, 9);
      expect(o.result.enterpriseValue).toBeCloseTo(1100, 9);
      expect(o.result.equityValue).toBeCloseTo(1000, 9);
      expect(o.result.perShare).toBeCloseTo(100, 9);
    }
  });

  it("sensitivity centre cell equals the base enterprise value", () => {
    const input = { baseCashFlow: 250, growthPct: 8, discountPct: 11, terminalGrowthPct: 3, years: 7 };
    const base = computeDcf(input);
    const grid = dcfSensitivity(input);
    const center = grid.find((c) => c.discountPct === input.discountPct && c.terminalGrowthPct === input.terminalGrowthPct);
    expect(base.ok && center?.enterpriseValue !== null).toBe(true);
    if (base.ok) expect(center!.enterpriseValue!).toBeCloseTo(base.result.enterpriseValue, 9);
  });

  it("enterprise value rises with growth and falls with discount rate", () => {
    const mk = (g: number, r: number) => computeDcf({ baseCashFlow: 100, growthPct: g, discountPct: r, terminalGrowthPct: 2, years: 5 });
    const a = mk(5, 10), b = mk(10, 10), c = mk(10, 12);
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (a.ok && b.ok && c.ok) {
      expect(b.result.enterpriseValue).toBeGreaterThan(a.result.enterpriseValue);
      expect(c.result.enterpriseValue).toBeLessThan(b.result.enterpriseValue);
    }
  });

  it("rejects terminal growth at or above the discount rate", () => {
    expect(computeDcf({ baseCashFlow: 100, growthPct: 5, discountPct: 10, terminalGrowthPct: 10, years: 5 }).ok).toBe(false);
    expect(computeDcf({ baseCashFlow: 100, growthPct: 5, discountPct: 10, terminalGrowthPct: 12, years: 5 }).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loanEngine: Shpitzer (annuity) vs Sillukin (equal principal)
// ---------------------------------------------------------------------------

describe("loan exhaustion", () => {
  it("Shpitzer payment matches the closed form and amortizes to zero (Python oracle)", () => {
    const r = computeSchpitzer(120000, 6, 10);
    expect(r.firstMonthlyPayment).toBe(Math.round(1332.2460232998144));
    expect(r.lastMonthlyPayment).toBe(r.firstMonthlyPayment);
    expect(r.totalInterest).toBe(Math.round(39869.52279597432));
    expect(r.totalRepayment).toBe(Math.round(1332.2460232998144 * 120));
    const last = r.yearlySeries[r.yearlySeries.length - 1];
    expect(last.remainingBalance).toBe(0);
  });

  it("Sillukin pays equal principal and declining interest (Python oracle)", () => {
    const r = computeSillukin(120000, 6, 10);
    expect(r.firstMonthlyPayment).toBe(1600); // 1000 principal + 600 interest
    expect(r.lastMonthlyPayment).toBe(1005); // 1000 principal + 5 interest
    expect(r.totalInterest).toBe(36300);
    const last = r.yearlySeries[r.yearlySeries.length - 1];
    expect(last.remainingBalance).toBe(0);
  });

  it("equal principal always costs less total interest than the annuity", () => {
    const rand = rng(13);
    for (let t = 0; t < 50; t++) {
      const amount = 50000 + rand() * 950000;
      const rate = 0.5 + rand() * 9;
      const years = 1 + Math.floor(rand() * 30);
      const s = computeSchpitzer(amount, rate, years);
      const k = computeSillukin(amount, rate, years);
      expect(k.totalInterest).toBeLessThanOrEqual(s.totalInterest);
    }
  });

  it("zero-rate Shpitzer is a plain division", () => {
    const r = computeSchpitzer(120000, 0, 10);
    expect(r.firstMonthlyPayment).toBe(1000);
    expect(r.totalInterest).toBe(0);
    expect(r.totalRepayment).toBe(120000);
  });
});

// ---------------------------------------------------------------------------
// calculatorEngine: required monthly contribution satisfies the FV identity
// ---------------------------------------------------------------------------

describe("goal contribution exhaustion", () => {
  it("contributions plus growth land on the target (future-value identity)", () => {
    const rand = rng(21);
    for (let t = 0; t < 100; t++) {
      const target = 10000 + rand() * 900000;
      const initial = rand() * target * 0.5;
      const years = 1 + Math.floor(rand() * 30);
      const ret = rand() * 12;
      const pmt = calculateRequiredMonthlyContribution(target, initial, years, ret);
      const months = Math.round(years * 12);
      const mr = ret / 100 / 12;
      const fv = initial * Math.pow(1 + mr, months) + (mr === 0 ? pmt * months : pmt * ((Math.pow(1 + mr, months) - 1) / mr));
      // the payment is rounded to a whole unit: at most 0.5/month short, compounded
      const annuityFactor = mr === 0 ? months : (Math.pow(1 + mr, months) - 1) / mr;
      expect(fv).toBeGreaterThanOrEqual(target - (annuityFactor / 2 + 1));
      expect(pmt).toBeGreaterThanOrEqual(0);
    }
  });

  it("zero return is a plain division, and an already-funded goal needs nothing", () => {
    expect(calculateRequiredMonthlyContribution(120000, 0, 10, 0)).toBe(1000);
    expect(calculateRequiredMonthlyContribution(100, 200, 10, 8)).toBe(0);
    expect(calculateRequiredMonthlyContribution(0, 0, 10, 8)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// market/indicators: SMA/EMA/RSI/MACD identities
// ---------------------------------------------------------------------------

describe("indicator exhaustion", () => {
  it("SMA and EMA of a constant series are the constant; volatility is zero", () => {
    const h = candles(Array(60).fill(42));
    expect(calculateSma(h, 20)).toBe(42);
    expect(calculateEma(h, 20)).toBeCloseTo(42, 9);
    expect(calculateVolatility(h)).toBe(0);
    const macd = calculateMacd(h);
    expect(macd).not.toBeNull();
    expect(macd!.macd).toBeCloseTo(0, 9);
  });

  it("RSI of a strictly rising series is 100, strictly falling is 0, always bounded", () => {
    const up = candles(Array.from({ length: 40 }, (_, i) => 100 + i));
    expect(calculateRsi(up, 14)).toBe(100);
    const down = candles(Array.from({ length: 40 }, (_, i) => 200 - i));
    expect(calculateRsi(down, 14)).toBe(0);
    const rand = rng(31);
    const h = candles(Array.from({ length: 60 }, () => 50 + rand() * 100));
    const rsi = calculateRsi(h, 14);
    expect(rsi).not.toBeNull();
    expect(rsi!).toBeGreaterThanOrEqual(0);
    expect(rsi!).toBeLessThanOrEqual(100);
  });

  it("SMA of the last n values matches their plain mean", () => {
    const rand = rng(8);
    const vals = Array.from({ length: 50 }, () => rand() * 1000);
    const h = candles(vals);
    for (const n of [5, 10, 20, 50]) {
      const mean = vals.slice(-n).reduce((s, x) => s + x, 0) / n;
      expect(calculateSma(h, n)).toBeCloseTo(mean, 1); // implementation rounds to 2dp
    }
    expect(calculateSma(h, 51)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// backtest/performance: CAGR, volatility and benchmark identities
// ---------------------------------------------------------------------------

describe("performance exhaustion", () => {
  it("constant daily growth reproduces the CAGR identity (Python oracle)", () => {
    const pts = dates(505).map((date, i) => ({ date, close: 100 * Math.pow(1.001, i) }));
    const r = computePerformance(pts);
    expect(r.status).toBe("computed");
    if (r.status === "computed") {
      expect(r.value.totalReturnPct).toBeCloseTo((Math.pow(1.001, 504) - 1) * 100, 1);
      expect(r.value.cagrPct.status).toBe("computed");
      if (r.value.cagrPct.status === "computed") expect(r.value.cagrPct.value).toBeCloseTo((Math.pow(1.001, 365.25) - 1) * 100, 2);
      // near-zero-variance returns -> volatility is ~0
      expect(r.value.annualizedVolatilityPct.status).toBe("computed");
      if (r.value.annualizedVolatilityPct.status === "computed") expect(r.value.annualizedVolatilityPct.value).toBeLessThan(0.01);
    }
  });

  it("monotonic series has zero drawdown and does not claim recovery", () => {
    const pts = dates(30).map((date, i) => ({ date, close: 100 + i }));
    const dd = maxDrawdown(pts);
    expect(dd.status).toBe("computed");
    if (dd.status === "computed") {
      expect(dd.value.maxDrawdownPct).toBe(0);
      expect(dd.value.recovered).toBe(false);
    }
  });

  it("beta of a synthetic 2x asset against its benchmark is 2", () => {
    const n = 200;
    const ds = dates(n);
    let bp = 1000, ap = 100;
    const bench: { date: string; close: number }[] = [];
    const asset: { date: string; close: number }[] = [];
    for (let i = 0; i < n; i++) {
      const rb = i === 0 ? 0 : i % 2 === 1 ? 0.01 : -0.004;
      bp *= 1 + rb; ap *= 1 + 2 * rb;
      bench.push({ date: ds[i], close: bp });
      asset.push({ date: ds[i], close: ap });
    }
    const r = computePerformance(asset, { benchmark: bench });
    expect(r.status).toBe("computed");
    if (r.status === "computed" && r.value.benchmark.status === "computed") {
      expect(r.value.benchmark.value.beta.status).toBe("computed");
      if (r.value.benchmark.value.beta.status === "computed") expect(r.value.benchmark.value.beta.value).toBeCloseTo(2, 1);
      expect(r.value.benchmark.value.excessReturnPct).toBeGreaterThan(0);
    }
  });

  it("train/test split is chronological and contiguous", () => {
    const pts = dates(100).map((date, i) => ({ date, close: 100 + i }));
    const s = splitTrainTest(pts, 0.7);
    expect(s.status).toBe("computed");
    if (s.status === "computed") {
      expect(s.value.train.length).toBe(70);
      expect(s.value.test.length).toBe(30);
      expect(s.value.train[s.value.train.length - 1].date < s.value.test[0].date).toBe(true);
      expect(s.value.splitDate).toBe(s.value.test[0].date);
    }
  });

  it("cleanSeries drops duplicates and invalid points, never fills", () => {
    const { points, quality } = cleanSeries([
      { date: "2024-01-02", close: 101 },
      { date: "2024-01-01", close: 100 },
      { date: "2024-01-02", close: 999 }, // duplicate date
      { date: "2024-01-03", close: -5 }, // invalid price
      { date: "not-a-date", close: 10 },
    ]);
    expect(points.map((p) => p.date)).toEqual(["2024-01-01", "2024-01-02"]);
    expect(quality.droppedDuplicateDate).toBe(1);
    expect(quality.droppedInvalidPrice).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// algo/backtest: simulator identities
// ---------------------------------------------------------------------------

const ALWAYS_IN: RuleStrategy = {
  entry: [{ kind: "rsi_above", period: 2, level: 1 }],
  exit: [{ kind: "rsi_below", period: 2, level: 1 }],
};

describe("rule validation exhaustion", () => {
  it("rejects RSI period 1, which never stabilizes and would silently never fire", () => {
    const c = checkRule({ kind: "rsi_below", period: 1, level: 30 });
    expect(c.ok).toBe(false);
    if (!c.ok) {
      expect(c.reason.en).toContain("2 to 500");
      expect(c.reason.he).toContain("2");
    }
    expect(checkRule({ kind: "rsi_below", period: 2, level: 30 }).ok).toBe(true);
    expect(checkStrategy(ALWAYS_IN).ok).toBe(true);
  });
});

describe("simulator exhaustion", () => {
  const rising = dates(60).map((date, i) => ({ date, close: 100 * Math.pow(1.005, i) }));

  it("always-in with zero costs tracks the price from the fill bar", () => {
    const r = simulate(rising, ALWAYS_IN);
    expect(r.fillBasis).toBe("next_close"); // no opens supplied
    expect(r.trades.length).toBe(0);
    expect(r.openPosition).not.toBeNull();
    expect(r.totalCosts).toBe(0);
    // from the actual entry bar on, equity tracks the price ratio exactly
    const eq = r.equity;
    const entryIdx = eq.findIndex((p) => p.date === r.openPosition!.entryDate);
    expect(entryIdx).toBeGreaterThan(0);
    for (let i = entryIdx + 1; i < eq.length; i++) {
      expect(eq[i].close / eq[i - 1].close).toBeCloseTo(rising[i].close / rising[i - 1].close, 9);
    }
  });

  it("costs strictly reduce the final equity, monotonically", () => {
    const base = simulate(rising, ALWAYS_IN);
    const taxed = simulate(rising, ALWAYS_IN, { commissionPct: 1, commissionFixed: 10, slippagePct: 0.5 });
    expect(taxed.totalCosts).toBeGreaterThan(0);
    expect(taxed.equity[taxed.equity.length - 1].close).toBeLessThan(base.equity[base.equity.length - 1].close);
    expect(taxed.equity[0].close).toBeCloseTo(base.equity[0].close, 9); // before any trade
  });

  it("a never-true entry keeps cash flat with zero trades", () => {
    const never: RuleStrategy = {
      entry: [{ kind: "rsi_below", period: 2, level: 1 }],
      exit: [{ kind: "rsi_above", period: 2, level: 99 }],
    };
    const r = simulate(rising, never, { startingCash: 7777 });
    expect(r.trades.length).toBe(0);
    expect(r.openPosition).toBeNull();
    expect(r.equity.every((p) => p.close === 7777)).toBe(true);
    expect(r.exposurePct).toBe(0);
  });

  it("tradeFromDate blocks fills on or before the boundary", () => {
    const boundary = rising[30].date;
    const r = simulate(rising, ALWAYS_IN, { tradeFromDate: boundary });
    expect(r.openPosition).not.toBeNull();
    expect(r.openPosition!.entryDate > boundary).toBe(true);
    // equity is flat cash until the first tradable bar
    expect(r.equity[30].close).toBe(10000);
  });

  it("invalid option ranges throw SimInputError, never clamp silently", () => {
    expect(() => simulate(rising, ALWAYS_IN, { positionPct: 0 })).toThrow(RangeError);
    expect(() => simulate(rising, ALWAYS_IN, { commissionPct: 6 })).toThrow(RangeError);
    expect(() => simulate(rising, ALWAYS_IN, { startingCash: 0 })).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// algo/walkForward: window partitioning
// ---------------------------------------------------------------------------

describe("walk-forward exhaustion", () => {
  it("windows are consecutive and cover the whole equity curve", () => {
    const rising = dates(200).map((date, i) => ({ date, close: 100 * Math.pow(1.002, i) }));
    const r = walkForward(rising, ALWAYS_IN, {}, { windows: 4, minBars: 20 });
    expect(r.status).toBe("computed");
    if (r.status === "computed") {
      const ws = r.value.windows;
      expect(ws.length).toBe(4);
      expect(ws[0].startDate).toBe(rising[0].date);
      expect(ws[ws.length - 1].endDate).toBe(rising[rising.length - 1].date);
      for (let i = 1; i < ws.length; i++) expect(ws[i].startDate > ws[i - 1].endDate).toBe(true);
      // in-sample ends before out-of-sample begins
      expect(r.value.inSample.status === "computed" && r.value.outOfSample.status === "computed").toBe(true);
      if (r.value.inSample.status === "computed" && r.value.outOfSample.status === "computed") {
        expect(r.value.inSample.value.endDate < r.value.outOfSample.value.startDate).toBe(true);
      }
    }
  });

  it("refuses when either side of the split is too short", () => {
    const short = dates(30).map((date, i) => ({ date, close: 100 + i }));
    expect(walkForward(short, ALWAYS_IN, {}, { minBars: 20 }).status).toBe("unavailable");
  });
});

// ---------------------------------------------------------------------------
// market/factors: Bollinger band identities
// ---------------------------------------------------------------------------

describe("factor exhaustion", () => {
  it("Bollinger middle band is the SMA and bands are ordered", () => {
    const rand = rng(23);
    const mk = () => {
      let c = 100;
      return Array.from({ length: 60 }, (_, i) => { c *= 1 + (rand() - 0.5) * 0.02; return { date: dates(60)[i], close: c, open: c * 0.999, high: c * 1.01, low: c * 0.99, volume: 1e6 } as unknown as Parameters<typeof bollinger>[0][number]; });
    };
    for (let t = 0; t < 20; t++) {
      const h = mk();
      const b = bollinger(h, 20, 2);
      expect(b.status).toBe("computed");
      if (b.status === "computed") {
        const mean = h.slice(-20).reduce((s, x) => s + x.close, 0) / 20;
        expect(b.value.middle).toBeCloseTo(mean, 3); // implementation rounds to 4dp
        expect(b.value.lower).toBeLessThan(b.value.middle);
        expect(b.value.upper).toBeGreaterThan(b.value.middle);
      }
    }
  });

  it("range position stays inside [0, 1]", () => {
    const rand = rng(29);
    const h = Array.from({ length: 40 }, (_, i) => {
      const c = 100 + rand() * 50;
      return { date: dates(40)[i], close: c, open: c, high: c + rand() * 5, low: c - rand() * 5, volume: 1e6 } as unknown as Parameters<typeof rangePosition>[0][number];
    });
    const rp = rangePosition(h, 14);
    expect(rp.status).toBe("computed");
    if (rp.status === "computed") {
      expect(rp.value).toBeGreaterThanOrEqual(0);
      expect(rp.value).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// stockSimulationEngine: historical DCA and projection closed forms
// ---------------------------------------------------------------------------

import { projectStockInvestment, simulateHistoricalInvestment } from "./stockSimulationEngine.js";
import { evaluatePaperRun } from "./algo/paper.js";
import { buildAllocation } from "./portfolioEngine.js";
import { computeRiskScore } from "./riskEngine.js";
import type { ProfileFlags } from "../types/index.js";

describe("stock simulation exhaustion", () => {
  const prices = dates(400).map((date, i) => ({ date, price: 100 + (i % 50) }));

  it("zero-fee one-time investment is a pure price ratio", () => {
    const r = simulateHistoricalInvestment({
      symbol: "TEST", prices,
      contribution: { cadence: "one_time", initialInvestment: 1000 },
    });
    expect(r.shares).toBeCloseTo(1000 / prices[0].price, 6);
    expect(r.finalValue).toBeCloseTo((1000 / prices[0].price) * prices[prices.length - 1].price, 2);
    expect(r.invested).toBe(1000);
    expect(r.purchases).toBe(1);
  });

  it("a purchase fee only ever reduces the final value", () => {
    const free = simulateHistoricalInvestment({ symbol: "T", prices, contribution: { cadence: "one_time", initialInvestment: 1000 } });
    const taxed = simulateHistoricalInvestment({ symbol: "T", prices, contribution: { cadence: "one_time", initialInvestment: 1000 }, purchaseFeePercent: 2 });
    expect(taxed.finalValue).toBeLessThan(free.finalValue);
    expect(taxed.invested).toBe(1000);
    expect(taxed.finalValue).toBeCloseTo((1000 / 1.02 / prices[0].price) * prices[prices.length - 1].price, 2);
  });

  it("monthly cash cadence buys once per calendar month", () => {
    const r = simulateHistoricalInvestment({ symbol: "T", prices, contribution: { cadence: "monthly_cash", monthlyContribution: 100 } });
    const months = new Set(prices.map((p) => p.date.slice(0, 7)));
    expect(r.purchases).toBe(months.size);
    expect(r.invested).toBeCloseTo(100 * months.size, 6);
    // conservation: final value equals shares times the last price
    expect(r.finalValue).toBeCloseTo(r.shares * prices[prices.length - 1].price, 2);
  });

  it("invalid prices are dropped, never filled", () => {
    const dirty = [...prices.slice(0, 5), { date: "2024-02-01", price: -3 }, { date: "2024-02-02", price: NaN }, ...prices.slice(5)];
    const clean = simulateHistoricalInvestment({ symbol: "T", prices, contribution: { cadence: "one_time", initialInvestment: 500 } });
    const washed = simulateHistoricalInvestment({ symbol: "T", prices: dirty, contribution: { cadence: "one_time", initialInvestment: 500 } });
    expect(washed.series.length).toBe(clean.series.length);
    expect(washed.finalValue).toBe(clean.finalValue);
  });

  it("projection matches the ordinary-annuity closed form", () => {
    const initial = 5000, monthly = 200, years = 10, ret = 7.2;
    const r = projectStockInvestment({ symbol: "T", initialInvestment: initial, monthlyContribution: monthly, years, annualReturnPercent: ret, inflationPercent: 2 });
    const n = years * 12, mr = ret / 100 / 12;
    const fv = initial * Math.pow(1 + mr, n) + monthly * ((Math.pow(1 + mr, n) - 1) / mr);
    expect(r.projectedValue).toBeCloseTo(fv, 0); // implementation rounds to 2dp
    expect(r.contributed).toBe(initial + monthly * n);
    expect(r.realValueAfterInflation).toBeCloseTo(fv / Math.pow(1.02, years), 0);
    expect(r.series.length).toBe(n + 1);
  });

  it("annualized return needs at least a year of history", () => {
    const short = simulateHistoricalInvestment({ symbol: "T", prices: prices.slice(0, 100), contribution: { cadence: "one_time", initialInvestment: 100 } });
    expect(short.annualizedReturnPercent).toBeNull();
    const long = simulateHistoricalInvestment({ symbol: "T", prices, contribution: { cadence: "one_time", initialInvestment: 100 } });
    expect(long.annualizedReturnPercent).not.toBeNull();
  });
});

describe("paper run exhaustion", () => {
  const strategy = { entry: [{ kind: "rsi_above", period: 2, level: 1 } as const], exit: [{ kind: "rsi_below", period: 2, level: 1 } as const] };

  it("waits when no bar is dated after the start date", () => {
    const history = dates(30).map((date, i) => ({ date, close: 100 + i }));
    const run = { id: "p1", symbol: "TEST", startDate: "2024-01-30", createdAt: "2024-01-30T00:00:00Z", strategy, options: {} }; // last bar is 2024-01-30
    const s = evaluatePaperRun(run, history);
    expect(s.status).toBe("waiting");
  });

  it("a paper run never trades bars on or before its start date", () => {
    const history = dates(60).map((date, i) => ({ date, close: 100 * Math.pow(1.004, i) }));
    const run = { id: "p1", symbol: "TEST", startDate: history[20].date, createdAt: "2024-01-21T00:00:00Z", strategy, options: {} };
    const s = evaluatePaperRun(run, history);
    expect(s.status).toBe("running");
    if (s.status === "running") {
      expect(s.sim.openPosition).not.toBeNull();
      expect(s.sim.openPosition!.entryDate > run.startDate).toBe(true);
      expect(s.returnPct).toBeCloseTo((s.currentValue / 10000 - 1) * 100, 1);
    }
  });
});

// ---------------------------------------------------------------------------
// portfolioEngine: allocation invariants over every template and flag grid
// ---------------------------------------------------------------------------

const mkFlags = (over: Partial<ProfileFlags>): ProfileFlags => ({
  age: null, interests: [], preferences: [], knowledgeLevel: "beginner",
  riskLevel: "moderate", horizon: "medium", goal: "growth", ...over,
});

describe("allocation exhaustion", () => {
  const types = ["conservative", "dividend", "balanced", "value", "passive", "growth"] as const;

  it("every template and adjustment sums to 100 with positive weights", () => {
    for (const t of types) {
      for (const flags of [
        mkFlags({}),
        mkFlags({ preferences: ["dividend"] }),
        mkFlags({ preferences: ["bonds"] }),
        mkFlags({ interests: ["technology", "healthcare"] }),
        mkFlags({ age: 25, horizon: "long" }),
        mkFlags({ age: 65 }),
        mkFlags({ horizon: "short" }),
        mkFlags({ preferences: ["dividend", "bonds"], interests: ["technology"], age: 70, horizon: "short" }),
      ]) {
        const alloc = buildAllocation(t, flags, "en");
        const sum = alloc.reduce((s, a) => s + a.value, 0);
        expect(Math.abs(sum - 100), `${t} sum ${sum}`).toBeLessThanOrEqual(0.5);
        expect(alloc.every((a) => a.value > 0)).toBe(true);
      }
    }
  });

  it("older or short-horizon profiles hold at most the base equity weight", () => {
    const equity = (t: (typeof types)[number], flags: ProfileFlags) =>
      buildAllocation(t, flags, "en").find((a) => a.name.includes("US Stocks"))?.value ?? 0;
    for (const t of types) {
      const base = equity(t, mkFlags({}));
      expect(equity(t, mkFlags({ age: 65 }))).toBeLessThanOrEqual(base);
      expect(equity(t, mkFlags({ horizon: "short" }))).toBeLessThanOrEqual(base);
    }
  });

  it("labels are bilingual", () => {
    const he = buildAllocation("balanced", mkFlags({}), "he");
    const en = buildAllocation("balanced", mkFlags({}), "en");
    expect(he.length).toBe(en.length);
    expect(he.some((a) => /[א-ת]/.test(a.name))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// riskEngine: score monotonicity across the five declared risk levels
// ---------------------------------------------------------------------------

describe("risk score exhaustion", () => {
  it("score never decreases as declared risk rises", () => {
    const levels = ["very_low", "low", "moderate", "high", "very_high"] as const;
    let prev = -1;
    for (const riskLevel of levels) {
      const s = computeRiskScore(mkFlags({ riskLevel }));
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
    const scores = levels.map((riskLevel) => computeRiskScore(mkFlags({ riskLevel })));
    // strictly increasing at the ends of the scale
    expect(scores[0]).toBeLessThan(scores[2]);
    expect(scores[2]).toBeLessThan(scores[4]);
  });

  it("score stays inside 1..10 for every flag combination", () => {
    const rand = rng(77);
    const riskLevels = ["very_low", "low", "moderate", "high", "very_high", null] as const;
    const horizons = ["short", "medium", "long"] as const;
    const knowledge = ["beginner", "intermediate", "experienced"] as const;
    for (let t = 0; t < 200; t++) {
      const s = computeRiskScore(mkFlags({
        riskLevel: riskLevels[Math.floor(rand() * riskLevels.length)],
        horizon: horizons[Math.floor(rand() * 3)],
        knowledgeLevel: knowledge[Math.floor(rand() * 3)],
        age: rand() < 0.2 ? null : 18 + Math.floor(rand() * 70),
      }));
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(10);
      expect(Number.isInteger(s)).toBe(true);
    }
  });
});
