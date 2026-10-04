import { describe, expect, it } from "vitest";
import { walkForward } from "./walkForward";
import { simulate } from "./backtest";
import type { RuleStrategy } from "./rules";

const strat: RuleStrategy = { entry: [{ kind: "sma_cross_up", fast: 3, slow: 8 }], exit: [{ kind: "sma_cross_down", fast: 3, slow: 8 }] };
function hist(closes: number[]) {
  const d = new Date("2020-01-01T00:00:00Z");
  return closes.map((close, i) => ({ date: new Date(d.getTime() + i * 86_400_000).toISOString().slice(0, 10), open: close, high: close, low: close, close, price: close, ohlcAvailable: true }));
}
const wave = (n: number) => Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 6) * 12 + i * 0.02);
const get = <T,>(m: { status: string; value?: T }) => { if (m.status !== "computed") throw new Error("na"); return m.value as T; };

describe("walkForward boundaries (B191)", () => {
  it("trainFraction guard: 0, 1, negative, NaN rejected; message is exact", () => {
    for (const f of [0, 1, -0.1, NaN, 1.5]) expect(walkForward(hist(wave(300)), strat, {}, { trainFraction: f })).toEqual({ status: "unavailable", reason: "trainFraction must be between 0 and 1" });
    expect(walkForward(hist(wave(300)), strat, {}, { trainFraction: 0.5 }).status).toBe("computed");
  });
  it("minBars boundary on both sides of the split", () => {
    // 100 bars @0.7 => cut 70; test side 30. minBars 30 ok, 31 not.
    const h = hist(wave(100));
    expect(walkForward(h, strat, {}, { minBars: 30 }).status).toBe("computed");
    const r = walkForward(h, strat, {}, { minBars: 31 });
    expect(r).toEqual({ status: "unavailable", reason: "Need at least 31 points in each window" });
    // train side: cut 70 vs minBars 70 ok (cut<minBars false), but test side 30 < 70 -> unavailable; use fraction .3 for train short
    expect(walkForward(h, strat, {}, { trainFraction: 0.3, minBars: 30 }).status).toBe("computed");
    expect(walkForward(h, strat, {}, { trainFraction: 0.29, minBars: 30 }).status).toBe("unavailable");
    expect(walkForward(h, strat, {}, { trainFraction: 0.71, minBars: 30 }).status).toBe("unavailable");
  });
  it("split date, in/out windows and trade counts partition at the cut bar", () => {
    const h = hist(wave(300));
    const r = get(walkForward(h, strat));
    const sim = simulate(h, strat, {});
    const cut = Math.floor(sim.equity.length * 0.7);
    expect(r.splitDate).toBe(sim.equity[cut].date);
    expect(r.inSampleTrades).toBe(sim.trades.filter((t) => t.exitDate < r.splitDate).length);
    expect(r.outOfSampleTrades).toBe(sim.trades.filter((t) => t.exitDate >= r.splitDate).length);
    const ins = get(r.inSample) as { startDate: string; endDate: string };
    const outs = get(r.outOfSample) as { startDate: string; endDate: string };
    expect(ins.startDate).toBe(sim.equity[0].date);
    expect(ins.endDate).toBe(sim.equity[cut - 1].date);
    expect(outs.startDate).toBe(r.splitDate);
    expect(outs.endDate).toBe(sim.equity[sim.equity.length - 1].date);
  });
  it("windows: count, size, last window absorbs remainder, minBars gate, config.windows", () => {
    const h = hist(wave(301));
    const r = get(walkForward(h, strat));
    const eq = r.sim.equity;
    expect(r.windows).toHaveLength(4);
    expect(r.windows[0].startDate).toBe(eq[0].date);
    expect(r.windows[0].endDate).toBe(eq[74].date);
    expect(r.windows[1].startDate).toBe(eq[75].date);
    expect(r.windows[3].startDate).toBe(eq[225].date);
    expect(r.windows[3].endDate).toBe(eq[eq.length - 1].date);
    expect(get(walkForward(h, strat, {}, { windows: 2 })).windows).toHaveLength(2);
    // size = floor(eq/windows) must be >= minBars: 301/7=43 ok at minBars 43, not 44
    expect(get(walkForward(h, strat, {}, { windows: 7, minBars: 43 })).windows).toHaveLength(7);
    expect(get(walkForward(h, strat, {}, { windows: 7, minBars: 44 })).windows).toHaveLength(0);
  });
  it("window return and drawdown are exact and 2dp", () => {
    const h = hist(wave(300));
    const r = get(walkForward(h, strat));
    const eq = r.sim.equity;
    const w = r.windows[1];
    const sl = eq.slice(75, 150);
    expect(get(w.returnPct)).toBe(Number(((sl[sl.length - 1].close / sl[0].close - 1) * 100).toFixed(2)));
    let peak = -Infinity, worst = 0;
    for (const p of sl) { peak = Math.max(peak, p.close); worst = Math.min(worst, p.close / peak - 1); }
    expect(get(w.maxDrawdownPct)).toBe(Number((worst * 100).toFixed(2)));
    expect(get(w.maxDrawdownPct)).toBeLessThanOrEqual(0);
    // window trades are counted inclusively by exit date
    expect(w.trades).toBe(r.sim.trades.filter((t) => t.exitDate >= sl[0].date && t.exitDate <= sl[sl.length - 1].date).length);
  });
  it("overfit warning needs in-sample Sharpe > 0 and OOS < 50% of it; losing-window warning at ceil(half)", () => {
    // strong uptrend first 70%, then crash/flat: windows lose, sharpe drops
    const closes = [...Array.from({ length: 210 }, (_, i) => 100 * Math.exp(i * 0.004 + Math.sin(i / 4) * 0.03)), ...Array.from({ length: 90 }, (_, i) => 230 * Math.exp(-i * 0.006 + Math.sin(i / 4) * 0.03))];
    const r = get(walkForward(hist(closes), strat));
    const ins = get(r.inSample) as { sharpeRatio: { status: string; value?: number } };
    const outs = get(r.outOfSample) as { sharpeRatio: { status: string; value?: number } };
    const sIn = ins.sharpeRatio.value!, sOut = outs.sharpeRatio.value!;
    expect(sIn).toBeGreaterThan(0);
    const has = r.warnings.some((x) => x.en.includes("in-sample but only"));
    expect(has).toBe(sOut < sIn * 0.5);
    const w = r.warnings.find((x) => x.en.includes("in-sample but only"));
    if (w) { expect(w.en).toContain(`Sharpe was ${sIn} in-sample but only ${sOut} out-of-sample`); expect(w.he).toContain(String(sIn)); }
    const losing = r.windows.filter((x) => x.returnPct.status === "computed" && (x.returnPct as { value: number }).value < 0).length;
    const lw = r.warnings.find((x) => x.en.includes("consecutive windows lost money"));
    expect(Boolean(lw)).toBe(losing >= Math.ceil(r.windows.length / 2));
    if (lw) expect(lw.en).toContain(`${losing} of ${r.windows.length}`);
  });
  it("flat (no-trade) market: no window loses, so no losing-window warning, and few-trades warning shows the count", () => {
    const r = get(walkForward(hist(Array.from({ length: 300 }, (_, i) => 200 * Math.exp(-i * 0.003))), strat));
    expect(r.windows.every((w) => (w.returnPct as { value: number }).value === 0)).toBe(true);
    expect(r.warnings.some((w) => w.en.includes("consecutive windows"))).toBe(false);
    expect(r.warnings.some((w) => w.en.startsWith(`Only ${r.outOfSampleTrades} trades closed out-of-sample`))).toBe(true);
  });
  it("losing windows warning counts equal-half boundary using ceil", () => {
    const r = get(walkForward(hist(Array.from({ length: 400 }, (_, i) => 100 + Math.sin(i / 3) * 15 - i * 0.15)), strat));
    const losing = r.windows.filter((w) => (w.returnPct as { value: number }).value < 0).length;
    const lw = r.warnings.find((w) => w.en.includes("consecutive windows lost money"));
    expect(Boolean(lw)).toBe(losing >= Math.ceil(r.windows.length / 2));
    if (lw) expect(lw.en.startsWith(`${losing} of 4 consecutive`)).toBe(true);
  });
  it("no windows -> no losing-window warning even when everything falls", () => {
    const r = get(walkForward(hist(Array.from({ length: 300 }, (_, i) => 200 * Math.exp(-i * 0.003))), strat, {}, { windows: 4, minBars: 76 }));
    expect(r.windows).toHaveLength(0);
    expect(r.warnings.some((w) => w.en.includes("consecutive windows"))).toBe(false);
  });
  it("3 or more OOS trades suppress the too-few-trades warning", () => {
    const h = hist(Array.from({ length: 400 }, (_, i) => 100 + Math.sin(i / 3) * 15));
    const r = get(walkForward(h, strat));
    expect(r.outOfSampleTrades).toBeGreaterThanOrEqual(3);
    expect(r.warnings.some((w) => w.en.includes("closed out-of-sample"))).toBe(false);
  });
});
