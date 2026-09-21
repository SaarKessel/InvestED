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
