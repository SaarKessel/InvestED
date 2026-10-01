/**
 * Phase 3 (H2): read-only data desks reachable from chat. Detection is
 * deterministic keyword routing; numbers come straight from the existing
 * endpoints' clients, never from a model.
 */
import { fetchMarketMovers, type TickerMover } from "../marketMovers";
import { fetchBisRateHistory, type BisRateResult } from "../bisRateClient";
import { fetchInsuranceReports } from "../insuranceClient";
import type { InsuranceRecord } from "../insuranceData";

export type DataDeskKind = "movers" | "policy_rate" | "insurance";

export function resolveDataDesk(text: string): DataDeskKind | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (/policy rate|interest rate (?:in|of) israel|bank of israel (?:rate|interest)|israel(?:i)? (?:base|policy|interest) rate/.test(t) || /ריבית בנק ישראל|ריבית המדיניות|ריבית בישראל|ריבית הבנק המרכזי/.test(t)) return "policy_rate";
  if (/insurance (?:funds?|yields?|reports?|returns?|management fees?)|pension (?:funds?|yields?)/.test(t) || /תשואות? (?:ב)?ביטוח|קרנות פנסיה|דמי ניהול בביטוח|דוחות ביטוח (?:אחרונים|עדכניים)/.test(t)) return "insurance";
  if (/top (?:gainers|losers|movers)|biggest (?:gainers|losers|movers)|market movers|what(?:'s| is) moving/.test(t) || /מובילי? (?:העליות|הירידות|השוק)|הכי עולות|הכי יורדות|מניות שזזות|מה זז בשוק/.test(t)) return "movers";
  return null;
}

export type DataDeskResult =
  | { kind: "movers"; available: boolean; gainers: TickerMover[]; losers: TickerMover[]; fetchedAt: string; coverage?: "screener" | "watchlist" | null; watchlistSize?: number | null }
  | { kind: "policy_rate"; result: BisRateResult }
  | { kind: "insurance"; status: string; reportPeriod: number | null; top: InsuranceRecord[]; source: string };

export async function loadDataDesk(kind: DataDeskKind): Promise<DataDeskResult> {
  if (kind === "movers") {
    const r = await fetchMarketMovers();
    return { kind, available: r.available, gainers: r.gainers.slice(0, 5), losers: r.losers.slice(0, 5), fetchedAt: r.fetchedAt, coverage: r.coverage, watchlistSize: r.watchlistSize };
  }
  if (kind === "policy_rate") return { kind, result: await fetchBisRateHistory() };
  const r = await fetchInsuranceReports();
  const ranked = r.records.filter((x) => x.yearToDateYield !== null).sort((a, b) => (b.yearToDateYield ?? 0) - (a.yearToDateYield ?? 0)).slice(0, 5);
  return { kind, status: r.status, reportPeriod: r.reportPeriod, top: ranked, source: r.source };
}
