// ---------------------------------------------------------------------------
// InvestED — Market Movers client
//
// Fetches /api/market-movers for the home-page ticker. Never fabricates:
// when the endpoint reports unavailable, the UI shows that state as-is.
// ---------------------------------------------------------------------------

export interface TickerMover {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  currency: string | null;
  dataSource: string;
  timestamp: string | null;
}

export interface MarketMoversResult {
  available: boolean;
  coverage: "screener" | "watchlist" | null;
  watchlistSize: number | null;
  gainers: TickerMover[];
  losers: TickerMover[];
  fetchedAt: string;
}

export async function fetchMarketMovers(): Promise<MarketMoversResult> {
  const response = await fetch("/api/market-movers");
  if (!response.ok) throw new Error(`market-movers responded ${response.status}`);
  const payload = (await response.json()) as MarketMoversResult;
  return payload;
}

/** A one-day move this large is more often a split, spin-off or reverse split in the raw feed than a market move. We flag it, we never hide or adjust it. */
export const EXTREME_MOVE_PCT = 40;
export const isExtremeMove = (pct: number | null | undefined): boolean => typeof pct === "number" && Math.abs(pct) >= EXTREME_MOVE_PCT;

export interface KnownAction { symbol: string; effective: string; text: { en: string; he: string }; url: string; source: { en: string; he: string } }
/** Corporate actions confirmed from the company's own announcements. Shown only for a few days after the date, and only next to an extreme move. The price is never adjusted. */
export const KNOWN_ACTIONS: KnownAction[] = [
  { symbol: "CTVA", effective: "2026-10-01",
    text: { en: "Corteva spun off its seed business into Vylor (VYLR) on Oct 1, 2026, one Vylor share per Corteva share. The raw price drop is not adjusted here and may not be fully explained by it.", he: "Corteva הפרידה את עסק הזרעים ל-Vylor (VYLR) ב-1 באוקטובר 2026, מניית Vylor אחת לכל מניית Corteva. ירידת המחיר הגולמית לא מותאמת כאן, וייתכן שההפרדה לא מסבירה אותה במלואה." },
    url: "https://www.prnewswire.com/news-releases/corteva-begins-new-chapter-as-focused-innovation-led-global-crop-protection-leader-302895869.html",
    source: { en: "Corteva press release", he: "הודעת Corteva לעיתונות" } },
];
export function knownAction(symbol: string, now: Date = new Date()): KnownAction | null {
  const a = KNOWN_ACTIONS.find((x) => x.symbol === symbol.toUpperCase());
  if (!a) return null;
  const days = (now.getTime() - new Date(`${a.effective}T00:00:00Z`).getTime()) / 86_400_000;
  return days >= 0 && days <= 7 ? a : null;
}
