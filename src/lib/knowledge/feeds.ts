/**
 * Learning loop: turn existing free data feeds into dated knowledge notes.
 * Every figure is copied from the feed response; nothing is estimated.
 */
import type { BisRateResult } from "../bisRateClient";
import type { InsuranceResult } from "../insuranceClient";

export interface FeedNote { title: string; body: string; lang: "he" | "en"; source_label: string; source_url: string | null; published_at: string | null }

export function buildRateNotes(r: BisRateResult): FeedNote[] {
  const last = r.points[r.points.length - 1];
  if (r.status === "unavailable" || !last) return [];
  const label = "BIS policy rate data";
  const url = r.source && /^https?:\/\//.test(r.source) ? r.source : null;
  const date = /^\d{4}-\d{2}$/.test(last.month) ? `${last.month}-01` : null;
  return [
    { title: "Bank of Israel policy interest rate", body: `The Bank of Israel policy interest rate was ${last.rate}% in ${last.month} (latest observation in the BIS series).`, lang: "en", source_label: label, source_url: url, published_at: date },
    { title: "ריבית בנק ישראל (ריבית המדיניות)", body: `ריבית בנק ישראל הייתה ${last.rate}% ב-${last.month} (התצפית האחרונה בסדרת BIS).`, lang: "he", source_label: label, source_url: url, published_at: date },
  ];
}

export function buildInsuranceNotes(r: InsuranceResult): FeedNote[] {
  if (r.status === "unavailable" || !r.reportPeriod) return [];
  const ranked = r.records.filter((x) => x.yearToDateYield !== null).sort((a, b) => (b.yearToDateYield ?? 0) - (a.yearToDateYield ?? 0)).slice(0, 5);
  if (!ranked.length) return [];
  const label = "Capital Market Authority insurance reports";
  const url = r.source && /^https?:\/\//.test(r.source) ? r.source : null;
  const list = ranked.map((x) => `${x.name}: ${x.yearToDateYield!.toFixed(2)}%`).join("; ");
  const p = String(r.reportPeriod);
  const date = /^\d{6}$/.test(p) ? `${p.slice(0, 4)}-${p.slice(4)}-01` : null;
  return [
    { title: "Top insurance fund year-to-date yields", body: `Highest year-to-date yields in the latest report (${p}): ${list}. Past yields do not predict future returns.`, lang: "en", source_label: label, source_url: url, published_at: date },
    { title: "תשואות מצטברות מובילות בקרנות ביטוח", body: `התשואות המצטברות הגבוהות בדוח האחרון (${p}): ${list}. תשואות עבר אינן צופות תוצאות עתידיות.`, lang: "he", source_label: label, source_url: url, published_at: date },
  ];
}
