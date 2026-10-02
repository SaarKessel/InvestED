import { describe, expect, it } from "vitest";
import { walkForward } from "./walkForward";
import { simulate } from "./backtest";
import { evaluatePaperRun, isPaperRun, newPaperRun, readPaperRuns, removePaperRun, savePaperRun, PaperLimitError, PAPER_RUNS_LIMIT } from "./paper";
import type { RuleStrategy } from "./rules";

const strat: RuleStrategy = { entry: [{ kind: "sma_cross_up", fast: 3, slow: 8 }], exit: [{ kind: "sma_cross_down", fast: 3, slow: 8 }] };
function hist(closes: number[]) {
  const d = new Date("2020-01-01T00:00:00Z");
  return closes.map((close, i) => ({ date: new Date(d.getTime() + i * 86_400_000).toISOString().slice(0, 10), open: close, high: close, low: close, close, price: close, ohlcAvailable: true }));
}
const wave = (n: number) => Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 6) * 12 + i * 0.02);
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe("walk-forward", () => {
  it("splits by time, in-sample before out-of-sample, never shuffled", () => {
    const r = walkForward(hist(wave(300)), strat);
    expect(r.status).toBe("computed");
    if (r.status !== "computed") return;
    expect(r.value.inSample.status).toBe("computed");
    expect(r.value.outOfSample.status).toBe("computed");
    if (r.value.inSample.status === "computed" && r.value.outOfSample.status === "computed") {
      expect(r.value.inSample.value.endDate < r.value.outOfSample.value.startDate).toBe(true);
    }
    expect(r.value.windows).toHaveLength(4);
    for (let i = 1; i < r.value.windows.length; i++) expect(r.value.windows[i].startDate >= r.value.windows[i - 1].endDate).toBe(true);
    expect(r.value.inSampleTrades + r.value.outOfSampleTrades).toBe(r.value.sim.trades.length);
  });
  it("is unavailable when history is too short, and rejects a bad fraction", () => {
    expect(walkForward(hist(wave(30)), strat).status).toBe("unavailable");
    expect(walkForward(hist(wave(300)), strat, {}, { trainFraction: 1.2 }).status).toBe("unavailable");
  });
  it("warns when out-of-sample has too few trades", () => {
    const closes = [...wave(200), ...Array(100).fill(120)];
    const r = walkForward(hist(closes), strat);
    expect(r.status === "computed" && r.value.warnings.some((w) => w.en.includes("too few"))).toBe(true);
  });
});

describe("paper trading", () => {
  const h = hist(wave(300));
  it("never trades bars on or before the start date", () => {
    const start = h[150].date;
    const sim = simulate(h, strat, { tradeFromDate: start });
    expect(sim.trades.every((t) => t.entryDate > start)).toBe(true);
    expect(sim.equity.filter((p) => p.date <= start).every((p) => p.close === 10_000)).toBe(true);
  });
  it("waits when no bar is newer than the start date and runs once one arrives", () => {
    const run = newPaperRun("SPY", strat, {}, h[299].date);
    expect(evaluatePaperRun(run, h).status).toBe("waiting");
    const earlier = newPaperRun("SPY", strat, {}, h[200].date);
    const s = evaluatePaperRun(earlier, h);
    expect(s.status).toBe("running");
    if (s.status === "running") {
      expect(s.barsSinceStart).toBe(99);
      expect(s.sim.assumptions.startingCash).toBe(10_000);
    }
  });
  it("stores, validates, limits and removes runs", () => {
    const store = mem();
    const run = newPaperRun("SPY", strat, { commissionPct: 0.1 }, "2026-10-02");
    expect(isPaperRun(run)).toBe(true);
    expect(isPaperRun({ ...run, symbol: "bad symbol!" })).toBe(false);
    expect(isPaperRun({ ...run, startDate: "yesterday" })).toBe(false);
    expect(savePaperRun(run, store)).toHaveLength(1);
    expect(readPaperRuns(store)[0].id).toBe(run.id);
    expect(removePaperRun(run.id, store)).toHaveLength(0);
    for (let i = 0; i < PAPER_RUNS_LIMIT; i++) savePaperRun(newPaperRun("SPY", strat, {}, "2026-10-02"), store);
    expect(() => savePaperRun(newPaperRun("SPY", strat, {}, "2026-10-02"), store)).toThrow(PaperLimitError);
    store.setItem("invested_algo_paper_v1", "not json");
    expect(readPaperRuns(store)).toEqual([]);
  });
});
