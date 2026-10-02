import { describe, expect, it } from "vitest";
import { calculateSma } from "../market/indicators";
import { rsiSeries, smaSeries, macdSeries, toBars } from "./indicatorSeries";
import { checkStrategy, countSignals, DEFAULT_STRATEGY, MACD_CROSS_STRATEGY, runSignals, type RuleStrategy } from "./rules";
import { explainRule } from "./explain";

function hist(closes: number[]) {
  const d = new Date("2020-01-01T00:00:00Z");
  return closes.map((close, i) => ({ date: new Date(d.getTime() + i * 86_400_000).toISOString().slice(0, 10), open: close, high: close, low: close, close, price: close }));
}
const wave = (n: number) => Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 4) * 10 + i * 0.05);

describe("indicator series", () => {
  const points = toBars(hist(wave(120))).points;
  it("is null during warm-up and a number afterwards", () => {
    const rsi = rsiSeries(points, 14);
    expect(rsi.slice(0, 14).every((v) => v === null)).toBe(true);
    expect(rsi[14]).not.toBeNull();
    expect(rsi.every((v) => v === null || (v >= 0 && v <= 100))).toBe(true);
  });
  it("SMA series last value matches the existing last-value SMA", () => {
    const sma = smaSeries(points, 20);
    expect(Number(sma.at(-1)!.toFixed(2))).toBe(calculateSma(hist(wave(120)), 20));
  });
  it("RSI series equals a hand-written Wilder RSI", () => {
    const closes = wave(120);
    const pts = toBars(hist(closes)).points;
    let g = 0, l = 0;
    for (let i = 1; i <= 14; i++) { const d = closes[i] - closes[i - 1]; g += Math.max(d, 0) / 14; l += Math.max(-d, 0) / 14; }
    for (let i = 15; i < closes.length; i++) { const d = closes[i] - closes[i - 1]; g = (g * 13 + Math.max(d, 0)) / 14; l = (l * 13 + Math.max(-d, 0)) / 14; }
    const expected = 100 - 100 / (1 + g / l);
    expect(rsiSeries(pts, 14).at(-1)!).toBeCloseTo(expected, 6);
  });
  it("MACD needs slow+signal bars", () => {
    const m = macdSeries(points, 12, 26, 9);
    expect(m[20]).toBeNull();
    expect(m.at(-1)).not.toBeNull();
  });
  it("rejects fast >= slow", () => {
    expect(() => macdSeries(points, 26, 12, 9)).toThrow(RangeError);
  });
});

describe("rule strategies", () => {
  it("RSI rule fires entry in a selloff and exit in a rally", () => {
    const closes = [...Array.from({ length: 30 }, (_, i) => 100 + (i % 2)), ...Array.from({ length: 20 }, (_, i) => 100 - i * 2), ...Array.from({ length: 30 }, (_, i) => 62 + i * 3)];
    const run = runSignals(hist(closes), DEFAULT_STRATEGY);
    const c = countSignals(run);
    expect(c.entries).toBeGreaterThan(0);
    expect(c.exits).toBeGreaterThan(0);
    const firstEntry = run.bars.findIndex((b) => b.entry);
    const firstExit = run.bars.findIndex((b) => b.exit);
    expect(firstEntry).toBeLessThan(firstExit);
  });
  it("MACD crosses fire only on the crossing bar", () => {
    const run = runSignals(hist(wave(200)), MACD_CROSS_STRATEGY);
    const c = countSignals(run);
    expect(c.entries).toBeGreaterThan(0);
    expect(c.entries).toBeLessThan(run.bars.length / 5);
  });
  it("no signal before warm-up and a flat series never signals a cross", () => {
    const s: RuleStrategy = { entry: [{ kind: "sma_cross_up", fast: 5, slow: 20 }], exit: [{ kind: "sma_cross_down", fast: 5, slow: 20 }] };
    const run = runSignals(hist(Array(80).fill(50)), s);
    expect(countSignals(run)).toEqual({ entries: 0, exits: 0 });
    const early = runSignals(hist(wave(60)), s);
    expect(early.bars.slice(0, early.warmupBars).some((b) => b.entry || b.exit)).toBe(false);
  });
  it("entry rules combine with AND, exit with OR", () => {
    const s: RuleStrategy = { entry: [{ kind: "rsi_below", period: 14, level: 99 }, { kind: "rsi_above", period: 14, level: 99.5 }], exit: [{ kind: "rsi_above", period: 14, level: 1 }] };
    const run = runSignals(hist(wave(100)), s);
    expect(countSignals(run).entries).toBe(0);
    expect(countSignals(run).exits).toBeGreaterThan(0);
  });
  it("drops invalid prices instead of filling them and reports it", () => {
    const h = hist(wave(60));
    h[10].close = NaN;
    h[11].close = -3;
    const run = runSignals(h, DEFAULT_STRATEGY);
    expect(run.bars).toHaveLength(58);
    expect(run.droppedPoints).toBe(2);
  });
  it("validates rules", () => {
    expect(checkStrategy({ entry: [], exit: DEFAULT_STRATEGY.exit }).ok).toBe(false);
    expect(checkStrategy({ entry: [{ kind: "rsi_below", period: 14, level: 130 }], exit: DEFAULT_STRATEGY.exit }).ok).toBe(false);
    expect(() => runSignals(hist(wave(50)), { entry: [{ kind: "sma_cross_up", fast: 20, slow: 5 }], exit: DEFAULT_STRATEGY.exit })).toThrow(RangeError);
    expect(checkStrategy(DEFAULT_STRATEGY).ok).toBe(true);
  });
  it("explains every rule kind in both languages with steps", () => {
    const kinds = [
      { kind: "rsi_below", period: 14, level: 30 }, { kind: "rsi_above", period: 14, level: 70 },
      { kind: "macd_cross_up", fast: 12, slow: 26, signal: 9 }, { kind: "macd_cross_down", fast: 12, slow: 26, signal: 9 },
      { kind: "sma_cross_up", fast: 5, slow: 20 }, { kind: "sma_cross_down", fast: 5, slow: 20 },
      { kind: "ema_cross_up", fast: 5, slow: 20 }, { kind: "ema_cross_down", fast: 5, slow: 20 },
    ] as const;
    for (const k of kinds) {
      const e = explainRule(k);
      expect(e.steps.length).toBeGreaterThanOrEqual(3);
      expect(e.title.he).toMatch(/[\u0590-\u05ff]/);
      expect(e.steps.every((s) => s.en.length > 10 && /[\u0590-\u05ff]/.test(s.he))).toBe(true);
    }
  });
});
