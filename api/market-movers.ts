// ---------------------------------------------------------------------------
// InvestED — /api/market-movers
//
// Serves the home-page market ticker: strongest gainers and decliners.
//
// Truthfulness contract:
// - Primary path: Yahoo Finance predefined screeners (day_gainers /
//   day_losers) — broad US-market coverage, labeled "screener".
// - Fallback path: movers computed from the bounded InvestED watchlist
//   (the known-assets universe) — labeled "watchlist" with its size, so
//   the UI can state the coverage honestly instead of implying
//   complete-market coverage.
// - If neither path can serve real data, available=false. The endpoint
//   NEVER returns simulated movers.
// ---------------------------------------------------------------------------

import { createTtlCache } from "../src/lib/market/cache.js";
import { findKnownAsset, listKnownAssets } from "../src/lib/market/knownAssets.js";
import {
  createYahooMoversFetcher,
  type MarketMover,
} from "../src/lib/market/movers.js";
import { createAlphaVantageProvider } from "../src/lib/market/providers/alphaVantage.js";
import { createYahooFinanceProvider } from "../src/lib/market/providers/yahooFinance.js";
import { createProviderRouter } from "../src/lib/market/router.js";

interface MoversRequest {
  query?: Record<string, string | string[] | undefined>;
}

interface MoversResponse {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
}

const CACHE_TTL_MS = Number(process.env.MARKET_MOVERS_CACHE_TTL_MS) || 5 * 60 * 1000;
const SCREENER_COUNT = 8;
const WATCHLIST_FALLBACK_COUNT = 5;

interface MoversPayload {
  available: boolean;
  coverage: "screener" | "watchlist" | null;
  /** Bounded-universe size when coverage is "watchlist". */
  watchlistSize: number | null;
  gainers: MarketMover[];
  losers: MarketMover[];
  fetchedAt: string;
}

const cache = createTtlCache<MoversPayload>({ ttlMs: CACHE_TTL_MS });

function buildRouter() {
  const providers = [];
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (alphaVantageKey) {
    providers.push(createAlphaVantageProvider({ apiKey: alphaVantageKey }));
  }
  providers.push(createYahooFinanceProvider());
  return createProviderRouter(providers);
}

async function fromScreener(): Promise<MoversPayload> {
  const fetcher = createYahooMoversFetcher();
  const [gainers, losers] = await Promise.all([
    fetcher.getMovers("day_gainers", SCREENER_COUNT),
    fetcher.getMovers("day_losers", SCREENER_COUNT),
  ]);
  if (gainers.length === 0 && losers.length === 0) {
    throw new Error("Yahoo Finance screener returned no movers");
  }
  return {
    available: true,
    coverage: "screener",
    watchlistSize: null,
    gainers,
    losers,
    fetchedAt: new Date().toISOString(),
  };
}

/** Bounded fallback: compute movers from the explicit InvestED watchlist. */
async function fromWatchlist(): Promise<MoversPayload> {
  const router = buildRouter();
  const watchlist = listKnownAssets();
  const quotes: MarketMover[] = [];
  const settled = await Promise.allSettled(watchlist.map((asset) => router.getQuote(asset.symbol)));
  settled.forEach((result) => {
    if (result.status !== "fulfilled") return;
    const { value: quote } = result.value;
    quotes.push({
      symbol: quote.symbol,
      name: quote.name !== quote.symbol ? quote.name : findKnownAsset(quote.symbol)?.name ?? quote.name,
      price: quote.price,
      changePercent: quote.changePercent,
      currency: quote.currency,
      dataSource: quote.dataSource,
      timestamp: quote.timestamp,
    });
  });
  if (quotes.length === 0) {
    throw new Error("No watchlist quotes available");
  }
  const byChange = (a: MarketMover, b: MarketMover) =>
    (b.changePercent ?? Number.NEGATIVE_INFINITY) - (a.changePercent ?? Number.NEGATIVE_INFINITY);
  const gainers = [...quotes].sort(byChange).filter((m) => (m.changePercent ?? 0) > 0).slice(0, WATCHLIST_FALLBACK_COUNT);
  const losers = [...quotes]
    .sort((a, b) => byChange(b, a))
    .filter((m) => (m.changePercent ?? 0) < 0)
    .slice(0, WATCHLIST_FALLBACK_COUNT);
  return {
    available: true,
    coverage: "watchlist",
    watchlistSize: quotes.length,
    gainers,
    losers,
    fetchedAt: new Date().toISOString(),
  };
}

export default async function handler(_req: MoversRequest, res: MoversResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const cached = cache.get("movers");
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  // The screener is a best-effort capability: ANY failure falls back to
  // the labeled bounded-watchlist computation, and only a watchlist
  // failure surfaces the honest unavailable state.
  let payload: MoversPayload;
  try {
    payload = await fromScreener();
  } catch {
    try {
      payload = await fromWatchlist();
    } catch {
      payload = {
        available: false,
        coverage: null,
        watchlistSize: null,
        gainers: [],
        losers: [],
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  cache.set("movers", payload);
  res.status(200).json(payload);
}
