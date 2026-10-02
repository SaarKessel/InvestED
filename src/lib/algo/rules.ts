// Rule-based strategy builder (educational). A strategy is two lists of
// indicator rules: entry (ALL must be true on the same bar) and exit (ANY
// triggers). Rules are read at each bar's CLOSE. Nothing is traded here; this
// module only answers "which bars would have signalled". The simulator
// (fills, costs) lives in a separate bundle on top of these signals.
//
// Educational simulation, not advice.

import { emaSeries, macdSeries, rsiSeries, smaSeries, toBars } from "./indicatorSeries.js";
import type { CandleDatum } from "../../types/index.js";
import type { PricePoint } from "../backtest/performance.js";

export type Rule =
  | { kind: "rsi_below"; period: number; level: number }
  | { kind: "rsi_above"; period: number; level: number }
  | { kind: "macd_cross_up"; fast: number; slow: number; signal: number }
  | { kind: "macd_cross_down"; fast: number; slow: number; signal: number }
  | { kind: "sma_cross_up"; fast: number; slow: number }
  | { kind: "sma_cross_down"; fast: number; slow: number }
  | { kind: "ema_cross_up"; fast: number; slow: number }
  | { kind: "ema_cross_down"; fast: number; slow: number };

export type RuleKind = Rule["kind"];

export interface RuleStrategy {
  entry: Rule[];
  exit: Rule[];
}

export interface SignalBar {
  date: string;
  close: number;
  entry: boolean;
  exit: boolean;
}

export interface SignalRun {
  bars: SignalBar[];
  /** First bar index where every rule had a value (before it nothing can fire). */
  warmupBars: number;
  droppedPoints: number;
}

export type RuleCheck = { ok: true } | { ok: false; reason: { en: string; he: string } };

export const DEFAULT_STRATEGY: RuleStrategy = {
  entry: [{ kind: "rsi_below", period: 14, level: 30 }],
  exit: [{ kind: "rsi_above", period: 14, level: 70 }],
};

export const MACD_CROSS_STRATEGY: RuleStrategy = {
  entry: [{ kind: "macd_cross_up", fast: 12, slow: 26, signal: 9 }],
  exit: [{ kind: "macd_cross_down", fast: 12, slow: 26, signal: 9 }],
};

const whole = (n: number) => Number.isInteger(n) && n >= 1 && n <= 500;

export function checkRule(rule: Rule): RuleCheck {
  const bad = (en: string, he: string): RuleCheck => ({ ok: false, reason: { en, he } });
  if (rule.kind === "rsi_below" || rule.kind === "rsi_above") {
    if (!whole(rule.period)) return bad("RSI period must be a whole number from 1 to 500", "תקופת RSI חייבת להיות מספר שלם בין 1 ל-500");
    if (!Number.isFinite(rule.level) || rule.level <= 0 || rule.level >= 100) return bad("RSI level must be between 0 and 100", "רמת RSI חייבת להיות בין 0 ל-100");
    return { ok: true };
  }
  if (rule.kind === "macd_cross_up" || rule.kind === "macd_cross_down") {
    if (![rule.fast, rule.slow, rule.signal].every(whole)) return bad("MACD periods must be whole numbers from 1 to 500", "תקופות MACD חייבות להיות מספרים שלמים בין 1 ל-500");
    if (rule.fast >= rule.slow) return bad("MACD fast period must be shorter than the slow one", "תקופת MACD המהירה חייבת להיות קצרה מהאיטית");
    return { ok: true };
  }
  if (!whole(rule.fast) || !whole(rule.slow)) return bad("Average periods must be whole numbers from 1 to 500", "תקופות הממוצע חייבות להיות מספרים שלמים בין 1 ל-500");
  if (rule.fast >= rule.slow) return bad("The fast average must be shorter than the slow one", "הממוצע המהיר חייב להיות קצר מהאיטי");
  return { ok: true };
}

export function checkStrategy(strategy: RuleStrategy): RuleCheck {
  if (strategy.entry.length === 0) return { ok: false, reason: { en: "Add at least one entry rule", he: "הוסיפו לפחות כלל כניסה אחד" } };
  if (strategy.exit.length === 0) return { ok: false, reason: { en: "Add at least one exit rule", he: "הוסיפו לפחות כלל יציאה אחד" } };
  for (const rule of [...strategy.entry, ...strategy.exit]) {
    const c = checkRule(rule);
    if (!c.ok) return c;
  }
  return { ok: true };
}

type Flags = Array<boolean | null>; // null = not enough history yet

function crossFlags(fast: Array<number | null>, slow: Array<number | null>, up: boolean): Flags {
  return fast.map((f, i) => {
    const s = slow[i];
    if (i === 0 || f === null || s === null) return null;
    const pf = fast[i - 1];
    const ps = slow[i - 1];
    if (pf === null || ps === null) return null;
    return up ? pf <= ps && f > s : pf >= ps && f < s;
  });
}

export function ruleFlags(rule: Rule, points: PricePoint[]): Flags {
  switch (rule.kind) {
    case "rsi_below":
      return rsiSeries(points, rule.period).map((v) => (v === null ? null : v < rule.level));
    case "rsi_above":
      return rsiSeries(points, rule.period).map((v) => (v === null ? null : v > rule.level));
    case "macd_cross_up":
    case "macd_cross_down": {
      const m = macdSeries(points, rule.fast, rule.slow, rule.signal);
      return crossFlags(m.map((x) => (x ? x.macd : null)), m.map((x) => (x ? x.signal : null)), rule.kind === "macd_cross_up");
    }
    case "sma_cross_up":
    case "sma_cross_down":
      return crossFlags(smaSeries(points, rule.fast), smaSeries(points, rule.slow), rule.kind === "sma_cross_up");
    case "ema_cross_up":
    case "ema_cross_down":
      return crossFlags(emaSeries(points, rule.fast), emaSeries(points, rule.slow), rule.kind === "ema_cross_up");
  }
}

/** Evaluate a strategy on real history. Throws RangeError on invalid rules. */
export function runSignals(history: ReadonlyArray<Pick<CandleDatum, "date" | "close">>, strategy: RuleStrategy): SignalRun {
  const check = checkStrategy(strategy);
  if (!check.ok) throw new RangeError(check.reason.en);
  const { points, droppedPoints } = toBars(history);
  const entryFlags = strategy.entry.map((r) => ruleFlags(r, points));
  const exitFlags = strategy.exit.map((r) => ruleFlags(r, points));
  let warmupBars = points.length;
  const bars: SignalBar[] = points.map((p, i) => {
    const entryVals = entryFlags.map((f) => f[i]);
    const exitVals = exitFlags.map((f) => f[i]);
    const entry = entryVals.every((v) => v === true);
    const exit = exitVals.some((v) => v === true);
    if (warmupBars === points.length && [...entryVals, ...exitVals].every((v) => v !== null)) warmupBars = i;
    return { date: p.date, close: p.close, entry, exit };
  });
  return { bars, warmupBars, droppedPoints };
}

export function countSignals(run: SignalRun): { entries: number; exits: number } {
  return { entries: run.bars.filter((b) => b.entry).length, exits: run.bars.filter((b) => b.exit).length };
}
