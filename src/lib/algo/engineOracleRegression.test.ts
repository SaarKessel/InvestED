// Regression tests added after mutation testing showed cost, P&L, exposure and
// walk-forward window math was not pinned by exact expected values.
// Expected values come from an independent re-implementation written here
// (different structure from the product code), plus hand-computed constants.
import { describe, expect, it } from "vitest";
import { simulate } from "./backtest";
import { walkForward } from "./walkForward";
import type { RuleStrategy } from "./rules";

const strat: RuleStrategy = { entry: [{ kind: "sma_cross_up", fast: 3, slow: 6 }], exit: [{ kind: "sma_cross_down", fast: 3, slow: 6 }] };
const date = (i: number) => new Date(Date.UTC(2020, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
function hist(closes: number[], opens: number[]) {
  return closes.map((close, i) => ({ date: date(i), open: opens[i], high: close, low: close, close, price: close, ohlcAvailable: true }));
}
const closes = Array.from({ length: 160 }, (_, i) => 100 + Math.sin(i / 5) * 10);
const opens = closes.map((c, i) => c + 0.3 + (i % 3) * 0.1);

const sma = (a: number[], n: number, i: number) => (i >= n - 1 ? a.slice(i - n + 1, i + 1).reduce((s, x) => s + x, 0) / n : null);
// Independent signal: fast crosses above/below slow between bar i-1 and i.
function signals() {
  const up: boolean[] = [], down: boolean[] = [];
  for (let i = 0; i < closes.length; i++) {
    const f = sma(closes, 3, i), s = sma(closes, 6, i), pf = i ? sma(closes, 3, i - 1) : null, ps = i ? sma(closes, 6, i - 1) : null;
    const ok = f !== null && s !== null && pf !== null && ps !== null;
    up.push(ok && pf! <= ps! && f! > s!);
    down.push(ok && pf! >= ps! && f! < s!);
  }
  return { up, down };
}

function oracle(o: { cash: number; pos: number; cPct: number; cFix: number; slip: number; from?: string }) {
  const { up, down } = signals();
  let cash = o.cash, sh = 0, cashOut = 0, entryI = -1, entryCost = 0, costs = 0, inMkt = 0;
  const trades: { entry: string; exit: string; pnl: number; ret: number; held: number; costs: number; shares: number }[] = [];
  const eq: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    const ok = !o.from || date(i) > o.from;
    if (i > 0 && ok) {
      if (sh === 0 && up[i - 1]) {
        const px = opens[i] * (1 + o.slip / 100);
        const qty = (cash * o.pos / 100 - o.cFix) / (px * (1 + o.cPct / 100));
        if (qty > 0) {
          const fee = qty * px * o.cPct / 100 + o.cFix;
          cash -= qty * px + fee; sh = qty; cashOut = qty * px + fee; entryI = i;
          entryCost = fee + qty * (px - opens[i]); costs += entryCost;
        }
      } else if (sh > 0 && down[i - 1]) {
        const px = opens[i] * (1 - o.slip / 100);
        const fee = sh * px * o.cPct / 100 + o.cFix;
        const proceeds = sh * px - fee; cash += proceeds;
        const slipC = sh * (opens[i] - px); costs += fee + slipC;
        trades.push({ entry: date(entryI), exit: date(i), pnl: proceeds - cashOut, ret: (proceeds - cashOut) / cashOut * 100, held: i - entryI, costs: entryCost + fee + slipC, shares: sh });
        sh = 0;
      }
    }
    if (sh > 0) inMkt++;
    eq.push(cash + sh * closes[i]);
  }
  return { trades, eq, costs, exposure: inMkt / closes.length * 100, open: sh > 0, openPnl: sh > 0 ? sh * closes.at(-1)! - cashOut : 0 };
}

const cases = [
  { cash: 10_000, pos: 100, cPct: 0, cFix: 0, slip: 0 },
  { cash: 10_000, pos: 100, cPct: 0.5, cFix: 0, slip: 0 },
  { cash: 10_000, pos: 100, cPct: 0, cFix: 7, slip: 0 },
  { cash: 10_000, pos: 100, cPct: 0, cFix: 0, slip: 0.4 },
  { cash: 25_000, pos: 60, cPct: 0.25, cFix: 3, slip: 0.2 },
];

describe("simulator matches an independent oracle", () => {
  for (const c of cases) {
    it(`cash ${c.cash} pos ${c.pos}% commission ${c.cPct}% + ${c.cFix}, slippage ${c.slip}%`, () => {
      const exp = oracle(c);
      const sim = simulate(hist(closes, opens), strat, { startingCash: c.cash, positionPct: c.pos, commissionPct: c.cPct, commissionFixed: c.cFix, slippagePct: c.slip });
      expect(exp.trades.length).toBeGreaterThan(2);
      expect(sim.trades).toHaveLength(exp.trades.length);
      sim.trades.forEach((t, k) => {
        const e = exp.trades[k];
        expect(t.entryDate).toBe(e.entry);
        expect(t.exitDate).toBe(e.exit);
        expect(t.pnl).toBeCloseTo(e.pnl, 2);
        expect(t.returnPct).toBeCloseTo(e.ret, 2);
        expect(t.costs).toBeCloseTo(e.costs, 2);
        expect(t.barsHeld).toBe(e.held);
        expect(t.shares).toBeCloseTo(e.shares, 5);
      });
      expect(sim.totalCosts).toBeCloseTo(exp.costs, 1);
      expect(sim.exposurePct).toBeCloseTo(exp.exposure, 1);
      sim.equity.forEach((p, i) => expect(p.close).toBeCloseTo(exp.eq[i], 6));
      expect(sim.openPosition !== null).toBe(exp.open);
      if (sim.openPosition) expect(sim.openPosition.unrealizedPnl).toBeCloseTo(exp.openPnl, 2);
    });
  }
  it("tradeFromDate blocks fills on or before that date, allows the next day", () => {
    const base = oracle(cases[0]);
    const from = base.trades[1].entry; // block this entry day exactly
    const exp = oracle({ ...cases[0], from });
    const sim = simulate(hist(closes, opens), strat, { tradeFromDate: from });
    expect(sim.trades.map((t) => t.entryDate)).toEqual(exp.trades.map((t) => t.entry));
    expect(sim.trades.some((t) => t.entryDate <= from || t.exitDate <= from)).toBe(false);
  });
  it("hand-computed single trade: 1% slippage, 1% commission, 5 fixed", () => {
    // entry px = 100*1.01 = 101; qty = (10000-5)/(101*1.01) = 9995/102.01
    // then the oracle value is fixed by arithmetic, not by product code
    const px = 101, qty = 9995 / (px * 1.01);
    const fee = qty * px * 0.01 + 5;
    expect(qty * px + fee).toBeCloseTo(10_000, 8); // whole budget is spent exactly
    const o = oracle({ cash: 10_000, pos: 100, cPct: 1, cFix: 5, slip: 1 });
    expect(o.trades.length).toBeGreaterThan(0);
  });
  it("rejects boundary option values exactly at the limits and just beyond", () => {
    const ok = (o: object) => () => simulate(hist(closes, opens), strat, o);
    expect(ok({ positionPct: 1 })).not.toThrow();
    expect(ok({ positionPct: 100 })).not.toThrow();
    expect(ok({ commissionPct: 5 })).not.toThrow();
    expect(ok({ commissionPct: 5.01 })).toThrow();
    expect(ok({ commissionPct: -0.01 })).toThrow();
    expect(ok({ commissionFixed: 1000 })).not.toThrow();
    expect(ok({ commissionFixed: 1000.01 })).toThrow();
    expect(ok({ commissionFixed: -1 })).toThrow();
    expect(ok({ slippagePct: 5 })).not.toThrow();
    expect(ok({ slippagePct: 5.01 })).toThrow();
    expect(ok({ slippagePct: -0.01 })).toThrow();
    expect(ok({ positionPct: 100.01 })).toThrow();
    expect(ok({ positionPct: 0.99 })).toThrow();
    expect(ok({ startingCash: 0 })).toThrow();
  });
});

describe("walk-forward window math matches an independent computation", () => {
  it("per-window return, drawdown, trade counts, split date and warnings", () => {
    const h = hist(closes, opens);
    const r = walkForward(h, strat);
    expect(r.status).toBe("computed");
    if (r.status !== "computed") return;
    const eq = r.value.sim.equity.map((p) => p.close);
    const n = eq.length, size = Math.floor(n / 4);
    expect(r.value.windows).toHaveLength(4);
    r.value.windows.forEach((w, k) => {
      const a = k * size, b = k === 3 ? n : (k + 1) * size;
      const seg = eq.slice(a, b);
      let dd = 0;
      seg.forEach((v, i) => { const pk = Math.max(...seg.slice(0, i + 1)); dd = Math.min(dd, v / pk - 1); });
      expect(w.startDate).toBe(date(a));
      expect(w.endDate).toBe(date(b - 1));
      expect(w.returnPct).toEqual({ status: "computed", value: Number(((seg.at(-1)! / seg[0] - 1) * 100).toFixed(2)) });
      expect(w.maxDrawdownPct).toEqual({ status: "computed", value: Number((dd * 100).toFixed(2)) });
      const tr = r.value.sim.trades.filter((t) => t.exitDate >= date(a) && t.exitDate <= date(b - 1)).length;
      expect(w.trades).toBe(tr);
      expect(w.maxDrawdownPct.status === "computed" && w.maxDrawdownPct.value <= 0).toBe(true);
    });
    expect(r.value.windows.some((w) => w.maxDrawdownPct.status === "computed" && w.maxDrawdownPct.value < 0)).toBe(true);
    const cut = Math.floor(n * 0.7);
    expect(r.value.splitDate).toBe(date(cut));
    expect(r.value.inSampleTrades).toBe(r.value.sim.trades.filter((t) => t.exitDate < date(cut)).length);
    expect(r.value.outOfSampleTrades).toBe(r.value.sim.trades.filter((t) => t.exitDate >= date(cut)).length);
    const losing = r.value.windows.filter((w) => w.returnPct.status === "computed" && w.returnPct.value < 0).length;
    expect(r.value.warnings.some((w) => /consecutive windows lost money/.test(w.en))).toBe(losing >= 2);
  });
  it("window boundaries: trainFraction and minBars are honoured exactly", () => {
    const h = hist(closes, opens);
    expect(walkForward(h, strat, {}, { minBars: 48 }).status).toBe("computed");
    expect(walkForward(h, strat, {}, { minBars: 49 }).status).toBe("unavailable");
    const r = walkForward(h, strat, {}, { windows: 4, minBars: 40 });
    expect(r.status === "computed" && r.value.windows.length).toBe(4);
    const r2 = walkForward(h, strat, {}, { windows: 5, minBars: 33 });
    expect(r2.status === "computed" && r2.value.windows.length).toBe(0); // size 32 < 33
  });
});
