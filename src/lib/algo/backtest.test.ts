import { describe, expect, it } from "vitest";
import { simulate, resolveOptions, SimInputError } from "./backtest";
import { buildReportCard, tradeStats, rollingVolatility } from "./reportCard";
import type { RuleStrategy } from "./rules";

const strat: RuleStrategy = { entry: [{ kind: "sma_cross_up", fast: 3, slow: 6 }], exit: [{ kind: "sma_cross_down", fast: 3, slow: 6 }] };

function hist(closes: number[], opens?: number[]) {
  const d = new Date("2020-01-01T00:00:00Z");
  return closes.map((close, i) => ({ date: new Date(d.getTime() + i * 86_400_000).toISOString().slice(0, 10), open: opens ? opens[i] : close, high: close, low: close, close, price: close, ohlcAvailable: true }));
}
const wave = (n: number, amp = 10) => Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 5) * amp);

describe("simulator", () => {
  it("fills at the NEXT bar's open, never the signal bar's close", () => {
    const closes = wave(120);
    const opens = closes.map((c) => c + 0.5); // distinct from close
    const h = hist(closes, opens);
    const sim = simulate(h, strat);
    expect(sim.fillBasis).toBe("next_open");
    expect(sim.trades.length).toBeGreaterThan(1);
    const t = sim.trades[0];
    const entryIdx = h.findIndex((x) => x.date === t.entryDate);
    expect(t.entryPrice).toBeCloseTo(opens[entryIdx], 3);
    expect(t.entryPrice).not.toBeCloseTo(closes[entryIdx - 1], 3);
  });
  it("falls back to next close and says so when opens are not real", () => {
    const h = hist(wave(120)).map((x) => ({ ...x, ohlcAvailable: false }));
    expect(simulate(h, strat).fillBasis).toBe("next_close");
  });
  it("costs reduce results and are reported", () => {
    const h = hist(wave(160), wave(160).map((c) => c + 0.3));
    const free = simulate(h, strat);
    const costly = simulate(h, strat, { commissionPct: 0.5, commissionFixed: 2, slippagePct: 0.3 });
    expect(free.totalCosts).toBe(0);
    expect(costly.totalCosts).toBeGreaterThan(0);
    expect(costly.equity.at(-1)!.close).toBeLessThan(free.equity.at(-1)!.close);
    expect(costly.assumptions.slippagePct).toBe(0.3);
  });
  it("position size limits exposure and a flat series stays in cash", () => {
    const half = simulate(hist(wave(160)), strat, { positionPct: 50 });
    expect(half.trades[0].shares * half.trades[0].entryPrice).toBeLessThanOrEqual(5_000 + 1);
    const flat = simulate(hist(Array(100).fill(50)), strat);
    expect(flat.trades).toHaveLength(0);
    expect(flat.equity.every((p) => p.close === 10_000)).toBe(true);
  });
  it("equity is cash plus marked position and open position is not force-closed", () => {
    const closes = [...Array(20).fill(100), ...Array.from({ length: 30 }, (_, i) => 100 + i * 2)];
    const sim = simulate(hist(closes), strat);
    expect(sim.openPosition).not.toBeNull();
    expect(sim.openPosition!.unrealizedPnl).toBeGreaterThan(0);
    expect(sim.equity.at(-1)!.close).toBeGreaterThan(10_000);
  });
  it("validates inputs", () => {
    expect(() => resolveOptions({ positionPct: 0 })).toThrow(SimInputError);
    expect(() => resolveOptions({ slippagePct: 9 })).toThrow(SimInputError);
    expect(() => resolveOptions({ startingCash: -1 })).toThrow(SimInputError);
  });
});

describe("report card", () => {
  const h = hist(wave(400, 15));
  it("computes strategy and buy-and-hold metrics from the existing engine", () => {
    const rc = buildReportCard(h, strat, { commissionPct: 0.1 });
    expect(rc.strategy.status).toBe("computed");
    expect(rc.buyAndHold.status).toBe("computed");
    expect(rc.vsBuyAndHoldPct.status).toBe("computed");
    if (rc.strategy.status === "computed") {
      expect(rc.strategy.value.sharpeRatio).toBeDefined();
      expect(rc.strategy.value.benchmark.status).toBe("computed");
    }
    expect(rc.whyLost.length).toBeGreaterThan(0);
    expect(rc.historicalOnly).toBe(true);
  });
  it("trade stats: win rate, profit factor, unavailable when no trades or no losers", () => {
    const none = tradeStats(simulate(hist(Array(60).fill(50)), strat));
    expect(none.count).toBe(0);
    expect(none.winRatePct.status).toBe("unavailable");
    const fake = { trades: [{ pnl: 10, returnPct: 1 }, { pnl: -5, returnPct: -0.5 }, { pnl: 5, returnPct: 0.5 }] } as never;
    const s = tradeStats(fake);
    expect(s.winRatePct).toEqual({ status: "computed", value: 66.67 });
    expect(s.profitFactor).toEqual({ status: "computed", value: 3 });
    const allWin = tradeStats({ trades: [{ pnl: 1, returnPct: 1 }] } as never);
    expect(allWin.profitFactor.status).toBe("unavailable");
  });
  it("rolling volatility is unavailable with too little data", () => {
    const eq = hist(wave(20)).map((x) => ({ date: x.date, close: x.close }));
    expect(rollingVolatility(eq, 30).status).toBe("unavailable");
    const eq2 = hist(wave(100)).map((x) => ({ date: x.date, close: x.close }));
    const r = rollingVolatility(eq2, 30);
    expect(r.status).toBe("computed");
  });
  it("explains a losing strategy honestly (bilingual) and a never-traded one", () => {
    const down = hist([...Array.from({ length: 200 }, (_, i) => 200 - i * 0.2 + Math.sin(i / 2) * 6)]);
    const rc = buildReportCard(down, strat, { commissionPct: 0.3, slippagePct: 0.2 });
    expect(rc.whyLost.every((x) => x.en.length > 10 && /[\u0590-\u05ff]/.test(x.he))).toBe(true);
    const flat = buildReportCard(hist(Array(100).fill(50)), strat);
    expect(flat.whyLost[0].en).toContain("never completed a trade");
  });
});
