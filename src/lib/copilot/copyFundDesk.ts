/**
 * "What if I had copied this fund's 13F" lesson, through the site's own /api/copy-13f (SEC EDGAR + real Yahoo closes).
 * Fires only when the question names a known manager (or CIK) AND asks to copy/mirror/follow it. Educational simulation,
 * not advice. Nothing is inferred: unmatched or unpriced holdings are listed, not filled in.
 */
import { findManager, type FilingsRequest } from "./filingsDesk";
import type { CopyResult, MatchedHolding, UnmatchedHolding } from "@/lib/sec/copyFund";

export type CopyFundRequest = FilingsRequest;
export interface CopyFundResult extends CopyFundRequest {
  filerName: string; reportDate: string; filingDate: string; sourceUrl: string; topCount: number;
  matched: MatchedHolding[]; unmatched: UnmatchedHolding[]; copy: CopyResult; today: string;
}

const ASKS_COPY = /\b(copy|copied|copying|mirror|mirrored|follow|followed|replicate|clone)\b|if i (had )?(bought|invested|held)|תעתיק|להעתיק|העתק|העתקתי|לחקות|הייתי מעתיק|ללכת אחרי|לעקוב אחרי/i;

export function parseCopyFundRequest(text: string): CopyFundRequest | null {
  if (text.length > 160 || !ASKS_COPY.test(text)) return null;
  return findManager(text);
}

export async function loadCopyFund(req: CopyFundRequest, fetcher: typeof fetch = fetch): Promise<CopyFundResult | null> {
  try {
    const r = await fetcher(`/api/copy-13f?cik=${encodeURIComponent(req.cik)}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { result?: Omit<CopyFundResult, keyof CopyFundRequest> };
    const x = j.result;
    if (!x || !x.copy || typeof x.reportDate !== "string" || !Array.isArray(x.matched)) return null;
    return { ...req, ...x };
  } catch { return null; }
}
