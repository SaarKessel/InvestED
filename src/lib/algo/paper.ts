// Paper trading for a rule strategy: a virtual $10,000 account that starts on a
// date and ONLY trades bars dated on or after it. Save today, come back later,
// and the saved rules run on the real history that arrived since. Nothing is
// ever sent to a broker; it is stored on this device only.
//
// Separate from the career game ledger on purpose (those stay fictional/
// source-snapshot records). Educational simulation, not advice.

import type { CandleDatum } from "../../types/index.js";
import { simulate, type SimOptions, type SimResult } from "./backtest.js";
import { checkStrategy, type RuleStrategy } from "./rules.js";

export const PAPER_RUNS_KEY = "invested_algo_paper_v1";
export const PAPER_RUNS_LIMIT = 10;

export interface PaperRun {
  id: string;
  symbol: string;
  startDate: string;
  createdAt: string;
  strategy: RuleStrategy;
  options: Omit<SimOptions, "tradeFromDate">;
}

export type PaperStatus =
  | { status: "waiting"; reason: "no_new_bars" }
  | { status: "running"; sim: SimResult; currentValue: number; returnPct: number; barsSinceStart: number };

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v));

export function isPaperRun(v: unknown): v is PaperRun {
  if (!v || typeof v !== "object") return false;
  const r = v as PaperRun;
  return (
    typeof r.id === "string" && r.id.length > 0 &&
    typeof r.symbol === "string" && /^[A-Z0-9^][A-Z0-9.\-^=]{0,9}$/.test(r.symbol) &&
    isDate(r.startDate) && typeof r.createdAt === "string" &&
    !!r.strategy && Array.isArray(r.strategy.entry) && Array.isArray(r.strategy.exit) &&
    checkStrategy(r.strategy).ok && typeof r.options === "object" && r.options !== null
  );
}

export function readPaperRuns(storage: Pick<Storage, "getItem"> = localStorage): PaperRun[] {
  try {
    const raw = storage.getItem(PAPER_RUNS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isPaperRun).slice(0, PAPER_RUNS_LIMIT) : [];
  } catch {
    return [];
  }
}

export class PaperLimitError extends Error {}

export function savePaperRun(run: PaperRun, storage: Pick<Storage, "getItem" | "setItem"> = localStorage): PaperRun[] {
  if (!isPaperRun(run)) throw new RangeError("Invalid paper run");
  const current = readPaperRuns(storage);
  if (current.length >= PAPER_RUNS_LIMIT) throw new PaperLimitError("Paper run limit reached");
  const next = [...current, run];
  storage.setItem(PAPER_RUNS_KEY, JSON.stringify(next));
  return next;
}

export function removePaperRun(id: string, storage: Pick<Storage, "getItem" | "setItem"> = localStorage): PaperRun[] {
  const next = readPaperRuns(storage).filter((r) => r.id !== id);
  storage.setItem(PAPER_RUNS_KEY, JSON.stringify(next));
  return next;
}

export function newPaperRun(symbol: string, strategy: RuleStrategy, options: PaperRun["options"], startDate: string, now = new Date()): PaperRun {
  return { id: `paper-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, symbol, startDate, createdAt: now.toISOString(), strategy, options };
}

/** Run a saved paper run against the latest real history. */
export function evaluatePaperRun(
  run: PaperRun,
  history: ReadonlyArray<Pick<CandleDatum, "date" | "close" | "open" | "ohlcAvailable">>
): PaperStatus {
  const sim = simulate(history, run.strategy, { ...run.options, tradeFromDate: run.startDate });
  const idx = sim.equity.findIndex((p) => p.date > run.startDate);
  if (idx < 0) return { status: "waiting", reason: "no_new_bars" };
  const base = sim.assumptions.startingCash;
  const now = sim.equity[sim.equity.length - 1].close;
  return { status: "running", sim, currentValue: Number(now.toFixed(2)), returnPct: Number(((now / base - 1) * 100).toFixed(2)), barsSinceStart: sim.equity.length - idx };
}
