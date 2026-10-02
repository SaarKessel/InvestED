// Two-quarter 13F comparison lesson. Concept only (leftmove/wallstreetlocal, MIT); code written here.
// SEC wording governs: a 13F is filed up to 45 days after quarter end, lists long positions only (shorts are
// omitted), and a position missing from the later filing is NOT a confirmed sale. Values are the filings'
// own quarter-end valuations; nothing is priced or inferred by us.
import type { Holding, Latest13F } from "./thirteenF.js";

export type Change = "new" | "absent" | "increased" | "decreased" | "unchanged";
export interface PositionChange {
  cusip: string; issuer: string; titleOfClass: string; shareType: string; change: Change;
  sharesPrev: number; sharesCur: number; shareDelta: number;
  valuePrevUsd: number; valueCurUsd: number;
}
export interface Concentration { top1Pct: number; top5Pct: number; top10Pct: number; positions: number }
export interface Comparison {
  previousReportDate: string; currentReportDate: string;
  changes: PositionChange[];
  counts: Record<Change, number>;
  concentrationPrev: Concentration; concentrationCur: Concentration;
  totalPrevUsd: number; totalCurUsd: number;
}

const key = (h: Pick<Holding, "cusip" | "titleOfClass" | "shareType">) => `${h.cusip}|${h.titleOfClass}|${h.shareType}`;

export function concentration(holdings: Holding[]): Concentration {
  const total = holdings.reduce((s, h) => s + h.valueUsd, 0);
  const sorted = [...holdings].sort((a, b) => b.valueUsd - a.valueUsd);
  const pct = (n: number) => (total > 0 ? Number(((sorted.slice(0, n).reduce((s, h) => s + h.valueUsd, 0) / total) * 100).toFixed(2)) : 0);
  return { top1Pct: pct(1), top5Pct: pct(5), top10Pct: pct(10), positions: holdings.length };
}

/** Share counts only decide the label. Changes in value are NOT split into "price" and "trading": we never infer prices. */
export function compare13F(previous: Latest13F, current: Latest13F): Comparison | null {
  if (!previous.reportDate || !current.reportDate || previous.reportDate >= current.reportDate || previous.cik !== current.cik) return null;
  const prev = new Map(previous.holdings.map((h) => [key(h), h]));
  const cur = new Map(current.holdings.map((h) => [key(h), h]));
  const changes: PositionChange[] = [];
  for (const [k, c] of cur) {
    const p = prev.get(k);
    const sharesPrev = p?.shares ?? 0;
    const change: Change = !p ? "new" : c.shares > p.shares ? "increased" : c.shares < p.shares ? "decreased" : "unchanged";
    changes.push({ cusip: c.cusip, issuer: c.issuer, titleOfClass: c.titleOfClass, shareType: c.shareType, change, sharesPrev, sharesCur: c.shares, shareDelta: c.shares - sharesPrev, valuePrevUsd: p?.valueUsd ?? 0, valueCurUsd: c.valueUsd });
  }
  for (const [k, p] of prev) {
    if (cur.has(k)) continue;
    changes.push({ cusip: p.cusip, issuer: p.issuer, titleOfClass: p.titleOfClass, shareType: p.shareType, change: "absent", sharesPrev: p.shares, sharesCur: 0, shareDelta: -p.shares, valuePrevUsd: p.valueUsd, valueCurUsd: 0 });
  }
  changes.sort((a, b) => Math.max(b.valueCurUsd, b.valuePrevUsd) - Math.max(a.valueCurUsd, a.valuePrevUsd));
  const counts: Record<Change, number> = { new: 0, absent: 0, increased: 0, decreased: 0, unchanged: 0 };
  for (const c of changes) counts[c.change]++;
  return {
    previousReportDate: previous.reportDate, currentReportDate: current.reportDate, changes, counts,
    concentrationPrev: concentration(previous.holdings), concentrationCur: concentration(current.holdings),
    totalPrevUsd: previous.holdings.reduce((s, h) => s + h.valueUsd, 0), totalCurUsd: current.holdings.reduce((s, h) => s + h.valueUsd, 0),
  };
}
