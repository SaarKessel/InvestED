// InvestED - "what if you had copied this fund's 13F" lesson engine (educational simulation, not advice).
// Inputs are real: the manager's reported holdings (SEC 13F), SEC's own company ticker list, and real Yahoo daily closes.
// Honest limits, in line with SEC's 13F FAQ: a 13F lists long positions only (short positions are not included), is due
// up to 45 days after quarter end, and a position missing from a later filing is not proof of a sale.
// No execution prices are inferred: entries and exits are daily closes, no costs, taxes or dividends.
import type { Holding } from "./thirteenF";

export interface Close { date: string; close: number }

const SUFFIX = new Set(["INC", "INCORPORATED", "CORP", "CORPORATION", "CO", "COMPANY", "LTD", "LIMITED", "PLC", "LP", "NV", "SA", "THE"]);

/** Uppercase, "&" as AND, punctuation removed, trailing legal suffixes dropped. Used for exact name matching only. */
export function normalizeName(name: string): string {
  const tokens = name.toUpperCase().replace(/\/[A-Z]{2,3}\//g, " ").replace(/&/g, " AND ").replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  while (tokens.length > 1 && SUFFIX.has(tokens[tokens.length - 1])) tokens.pop();
  if (tokens[0] === "THE" && tokens.length > 1) tokens.shift();
  return tokens.join(" ");
}

export type TickerIndex = Map<string, string[]>;
/** Builds name -> tickers from SEC's company_tickers.json ({ "0": { ticker, title }, ... }). */
export function buildTickerIndex(json: unknown): TickerIndex {
  const idx: TickerIndex = new Map();
  if (!json || typeof json !== "object") return idx;
  for (const row of Object.values(json as Record<string, { ticker?: unknown; title?: unknown }>)) {
    if (typeof row?.ticker !== "string" || typeof row.title !== "string") continue;
    const k = normalizeName(row.title);
    const list = idx.get(k) ?? [];
    if (!list.includes(row.ticker)) list.push(row.ticker);
    idx.set(k, list);
  }
  return idx;
}

export interface MatchedHolding { issuer: string; ticker: string; valueUsd: number; weightPct: number }
export interface UnmatchedHolding { issuer: string; valueUsd: number; reason: "no_exact_name_match" | "several_tickers" | "not_common_stock" }

/** Common-stock rows only (shares, not principal amounts). The name must match exactly one ticker; nothing is guessed. */
export function matchHoldings(holdings: Holding[], idx: TickerIndex): { matched: MatchedHolding[]; unmatched: UnmatchedHolding[] } {
  const matched: MatchedHolding[] = []; const unmatched: UnmatchedHolding[] = [];
  const byTicker = new Map<string, MatchedHolding>();
  for (const h of holdings) {
    if (h.shareType !== "SH" || !/\b(COM|COMMON|CL [A-Z]|CLASS [A-Z]|ORD|SHS|NEW COM)\b/i.test(h.titleOfClass)) { unmatched.push({ issuer: h.issuer, valueUsd: h.valueUsd, reason: "not_common_stock" }); continue; }
    const hits = idx.get(normalizeName(h.issuer)) ?? [];
    if (hits.length === 0) { unmatched.push({ issuer: h.issuer, valueUsd: h.valueUsd, reason: "no_exact_name_match" }); continue; }
    if (hits.length > 1) { unmatched.push({ issuer: h.issuer, valueUsd: h.valueUsd, reason: "several_tickers" }); continue; }
    const prev = byTicker.get(hits[0]);
    if (prev) { prev.valueUsd += h.valueUsd; continue; }
    const m: MatchedHolding = { issuer: h.issuer, ticker: hits[0], valueUsd: h.valueUsd, weightPct: 0 };
    byTicker.set(hits[0], m); matched.push(m);
  }
  const total = matched.reduce((s, m) => s + m.valueUsd, 0);
  matched.forEach((m) => { m.weightPct = total > 0 ? (m.valueUsd / total) * 100 : 0; });
  return { matched, unmatched };
}

const lastOnOrBefore = (c: Close[], d: string) => [...c].reverse().find((x) => x.date <= d) ?? null;
const firstAfter = (c: Close[], d: string, today: string) => c.find((x) => x.date > d && x.date < today) ?? null;
const lastDone = (c: Close[], today: string) => [...c].reverse().find((x) => x.date < today) ?? null;

export interface CopyLeg { ticker: string; weightPct: number; entry: number; latest: number; returnPct: number }
export interface CopyResult {
  /** Copying on the first completed close after the filing became public: what a follower could really do. */
  fromFilingDate: { entryDate: string; latestDate: string; portfolioReturnPct: number; spyReturnPct: number; legs: CopyLeg[] } | null;
  /** Hindsight only: entering at the quarter-end close, which nobody outside the fund could do. Shows what the delay costs or saves. */
  fromQuarterEnd: { entryDate: string; portfolioReturnPct: number; spyReturnPct: number } | null;
  coveragePct: number; // share of the top holdings' reported value that was matched and priced
  notPriced: string[];
}

/** Buy-and-hold, weights from reported values rescaled over the priced holdings. Holdings without real closes are listed, never filled in. */
export function computeCopy(matched: MatchedHolding[], unmatchedValueUsd: number, closes: Record<string, Close[] | null>, spy: Close[] | null, filingDate: string, reportDate: string, today: string): CopyResult {
  const priced = matched.filter((m) => closes[m.ticker]?.length);
  const notPriced = matched.filter((m) => !closes[m.ticker]?.length).map((m) => m.ticker);
  const pricedValue = priced.reduce((s, m) => s + m.valueUsd, 0);
  const allValue = matched.reduce((s, m) => s + m.valueUsd, 0) + unmatchedValueUsd;
  const coveragePct = allValue > 0 ? (pricedValue / allValue) * 100 : 0;
  const empty: CopyResult = { fromFilingDate: null, fromQuarterEnd: null, coveragePct, notPriced };
  if (!spy || priced.length === 0) return empty;

  const spyEntry = firstAfter(spy, filingDate, today), spyLatest = lastDone(spy, today);
  const legs: CopyLeg[] = [];
  for (const m of priced) {
    const c = closes[m.ticker] as Close[];
    const e = firstAfter(c, filingDate, today), l = lastDone(c, today);
    if (!e || !l || l.date <= e.date) { notPriced.push(m.ticker); continue; }
    legs.push({ ticker: m.ticker, weightPct: 0, entry: e.close, latest: l.close, returnPct: (l.close / e.close - 1) * 100 });
  }
  if (legs.length === 0 || !spyEntry || !spyLatest || spyLatest.date <= spyEntry.date) return { ...empty, notPriced };
  const wsum = legs.reduce((s, l) => s + (matched.find((m) => m.ticker === l.ticker)?.valueUsd ?? 0), 0);
  legs.forEach((l) => { l.weightPct = ((matched.find((m) => m.ticker === l.ticker)?.valueUsd ?? 0) / wsum) * 100; });
  const portfolioReturnPct = legs.reduce((s, l) => s + (l.weightPct / 100) * l.returnPct, 0);
  const result: CopyResult = {
    fromFilingDate: { entryDate: spyEntry.date, latestDate: spyLatest.date, portfolioReturnPct, spyReturnPct: (spyLatest.close / spyEntry.close - 1) * 100, legs },
    fromQuarterEnd: null, coveragePct, notPriced,
  };
  // Hindsight line, same legs, same weights, entering at the quarter-end close.
  const spyQ = lastOnOrBefore(spy, reportDate);
  let hind = 0, ok = !!spyQ;
  for (const l of legs) {
    const c = closes[l.ticker] as Close[]; const q = lastOnOrBefore(c, reportDate), last = lastDone(c, today);
    if (!q || !last) { ok = false; break; }
    hind += (l.weightPct / 100) * (last.close / q.close - 1) * 100;
  }
  if (ok && spyQ && spyLatest) result.fromQuarterEnd = { entryDate: spyQ.date, portfolioReturnPct: hind, spyReturnPct: (spyLatest.close / spyQ.close - 1) * 100 };
  return result;
}
