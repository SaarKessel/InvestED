// Educational strategy simulator (long-only, one asset).
//
// Honest-realism rules:
//  - No look-ahead: a signal read at bar i's CLOSE is filled at bar i+1's OPEN.
//    If the provider has no real open (closes only), the fill uses bar i+1's
//    close and the run says so (fillBasis = "next_close").
//  - Costs are explicit inputs: commission (% of trade value + fixed per
//    trade) and slippage (% against you on every fill). Default is zero, and
//    the result echoes the assumptions used.
//  - Position size is a % of current equity (default 100%).
//  - An open position at the end is marked to market, not force-closed.
//  - Real history only; invalid prices are dropped and counted, never filled.
//
// Educational simulation, not advice. Past results do not predict the future.
// Concepts only (signal-at-close/fill-next-open, cost models) as in zipline
// (Apache-2.0) and jesse (MIT); no code copied.

import type { CandleDatum } from "../../types/index.js";
import { cleanSeries, type PricePoint } from "../backtest/performance.js";
import { runSignals, type RuleStrategy } from "./rules.js";

export interface SimOptions {
  startingCash?: number;
  /** Percent of equity put into each position, 1..100. */
  positionPct?: number;
  commissionPct?: number;
  commissionFixed?: number;
  slippagePct?: number;
  /** No order is filled on a bar dated on or before this (YYYY-MM-DD). Used by paper trading so past bars never trade. */
  tradeFromDate?: string;
}

export interface SimAssumptions {
  startingCash: number;
  positionPct: number;
  commissionPct: number;
  commissionFixed: number;
  slippagePct: number;
}

export interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnl: number;
  returnPct: number;
  costs: number;
  barsHeld: number;
}

export interface OpenPosition {
  entryDate: string;
  entryPrice: number;
  shares: number;
  markPrice: number;
  unrealizedPnl: number;
}

export interface SimResult {
  assumptions: SimAssumptions;
  fillBasis: "next_open" | "next_close";
  equity: PricePoint[];
  trades: Trade[];
  openPosition: OpenPosition | null;
  totalCosts: number;
  exposurePct: number;
  droppedPoints: number;
}

export class SimInputError extends RangeError {}

export function resolveOptions(o: SimOptions = {}): SimAssumptions {
  const a: SimAssumptions = {
    startingCash: o.startingCash ?? 10_000,
    positionPct: o.positionPct ?? 100,
    commissionPct: o.commissionPct ?? 0,
    commissionFixed: o.commissionFixed ?? 0,
    slippagePct: o.slippagePct ?? 0,
  };
  if (!(a.startingCash > 0)) throw new SimInputError("Starting cash must be above 0");
  if (!(a.positionPct >= 1 && a.positionPct <= 100)) throw new SimInputError("Position size must be between 1% and 100%");
  if (!(a.commissionPct >= 0 && a.commissionPct <= 5)) throw new SimInputError("Commission must be between 0% and 5%");
  if (!(a.commissionFixed >= 0 && a.commissionFixed <= 1000)) throw new SimInputError("Fixed commission must be between 0 and 1000");
  if (!(a.slippagePct >= 0 && a.slippagePct <= 5)) throw new SimInputError("Slippage must be between 0% and 5%");
  return a;
}

type Candle = Pick<CandleDatum, "date" | "close" | "open" | "ohlcAvailable">;

export function simulate(history: ReadonlyArray<Candle>, strategy: RuleStrategy, options: SimOptions = {}): SimResult {
  const a = resolveOptions(options);
  const run = runSignals(history, strategy);
  const bars = run.bars;
  const openByDate = new Map<string, number>();
  let haveOpens = history.length > 0;
  for (const h of history) {
    if (h.ohlcAvailable === false || !Number.isFinite(h.open) || h.open <= 0) haveOpens = false;
    else openByDate.set(h.date, h.open);
  }
  const fillBasis = haveOpens ? "next_open" : "next_close";
  const fillPrice = (i: number) => (haveOpens ? openByDate.get(bars[i].date) ?? bars[i].close : bars[i].close);

  let cash = a.startingCash;
  let shares = 0;
  let entry: { date: string; price: number; index: number; cost: number; cashOut: number } | null = null;
  let totalCosts = 0;
  let barsInMarket = 0;
  const trades: Trade[] = [];
  const equity: PricePoint[] = [];

  for (let i = 0; i < bars.length; i++) {
    // Fill orders decided at the previous close, at this bar's open.
    if (i > 0) {
      const prev = bars[i - 1];
      const tradable = !options.tradeFromDate || bars[i].date > options.tradeFromDate;
      if (shares === 0 && prev.entry && tradable) {
        const px = fillPrice(i) * (1 + a.slippagePct / 100);
        const budget = cash * (a.positionPct / 100);
        const qty = (budget - a.commissionFixed) / (px * (1 + a.commissionPct / 100));
        if (qty > 0) {
          const value = qty * px;
          const fee = value * (a.commissionPct / 100) + a.commissionFixed;
          cash -= value + fee;
          shares = qty;
          totalCosts += fee + qty * (px - fillPrice(i));
          entry = { date: bars[i].date, price: px, index: i, cost: fee + qty * (px - fillPrice(i)), cashOut: value + fee };
        }
      } else if (shares > 0 && prev.exit && entry && tradable) {
        const raw = fillPrice(i);
        const px = raw * (1 - a.slippagePct / 100);
        const value = shares * px;
        const fee = value * (a.commissionPct / 100) + a.commissionFixed;
        const proceeds = value - fee;
        cash += proceeds;
        const slipCost = shares * (raw - px);
        totalCosts += fee + slipCost;
        trades.push({
          entryDate: entry.date,
          exitDate: bars[i].date,
          entryPrice: round(entry.price, 4),
          exitPrice: round(px, 4),
          shares: round(shares, 6),
          pnl: round(proceeds - entry.cashOut, 2),
          returnPct: round(((proceeds - entry.cashOut) / entry.cashOut) * 100, 2),
          costs: round(entry.cost + fee + slipCost, 2),
          barsHeld: i - entry.index,
        });
        shares = 0;
        entry = null;
      }
    }
    if (shares > 0) barsInMarket += 1;
    equity.push({ date: bars[i].date, close: cash + shares * bars[i].close });
  }

  const last = bars[bars.length - 1];
  const openPosition: OpenPosition | null =
    shares > 0 && entry && last
      ? { entryDate: entry.date, entryPrice: round(entry.price, 4), shares: round(shares, 6), markPrice: last.close, unrealizedPnl: round(shares * last.close - entry.cashOut, 2) }
      : null;

  return {
    assumptions: a,
    fillBasis,
    equity,
    trades,
    openPosition,
    totalCosts: round(totalCosts, 2),
    exposurePct: bars.length ? round((barsInMarket / bars.length) * 100, 1) : 0,
    droppedPoints: run.droppedPoints,
  };
}

function round(v: number, d = 2): number {
  return Number(v.toFixed(d));
}

/** Convenience for tests and the UI: cleaned history used by the simulator. */
export function cleanedHistory(history: ReadonlyArray<Pick<CandleDatum, "date" | "close">>) {
  return cleanSeries(history).points;
}
