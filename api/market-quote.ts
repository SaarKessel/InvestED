// ---------------------------------------------------------------------------
// InvestED — /api/market-quote (Phase 4: Live Market Data Foundation)
//
// Vercel serverless entry point for real market data. All provider
// calls happen server-side (CORS + API-key secrecy); the browser only
// ever talks to this endpoint.
//
// Request → MarketDataService → Cache → ProviderRouter → providers:
//
//   1. Alpha Vantage (preferred, only when ALPHA_VANTAGE_API_KEY is set)
//   2. Yahoo Finance (the "yfinance" path; always configured)
//
// The router falls back only on availability/rate-limit/network
// failures — never on business/data errors. The cache is in-process
// (per warm serverless instance): short TTL for quotes, long TTL for
// history. No Redis or external infrastructure.
//
// This endpoint NEVER returns simulated data. A symbol that cannot be
// served comes back with price=null and freshness="unavailable"; the
// client owns the (labeled) development mock fallback.
//
// Usage: GET /api/market-quote?symbols=VOO,AAPL&range=3mo
//   range: 3mo (default) | 1y | 10y
// ---------------------------------------------------------------------------

import type { CandleDatum, MarketAsset } from "../src/types/index.js";
import { createTtlCache } from "../src/lib/market/cache.js";
import {
  AllProvidersUnavailableError,
  MarketDataError,
  SymbolNotFoundError,
} from "../src/lib/market/errors.js";
import { createMarketDataService, type CachedQuote } from "../src/lib/market/marketDataService.js";
import { createAlphaVantageProvider } from "../src/lib/market/providers/alphaVantage.js";
import { createYahooFinanceProvider } from "../src/lib/market/providers/yahooFinance.js";
import { isHistoryRange } from "../src/lib/market/providers/types.js";
import { createProviderRouter } from "../src/lib/market/router.js";

// Minimal structural types for the Vercel request/response objects.
interface MarketQuoteRequest {
  query?: Record<string, string | string[] | undefined>;
}

interface MarketQuoteResponse {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
}

const QUOTE_CACHE_TTL_MS = Number(process.env.MARKET_QUOTE_CACHE_TTL_MS) || 60_000;
const HISTORY_CACHE_TTL_MS = Number(process.env.MARKET_HISTORY_CACHE_TTL_MS) || 6 * 60 * 60 * 1000;
const MAX_SYMBOLS = 8;
const SYMBOL_PATTERN = /^[A-Z0-9.\-^=]{1,10}$/;

// Module-level caches survive across warm invocations of the same
// serverless instance; cold starts simply miss and re-fetch.
const quoteCache = createTtlCache<CachedQuote>({ ttlMs: QUOTE_CACHE_TTL_MS });
const historyCache = createTtlCache<CandleDatum[]>({ ttlMs: HISTORY_CACHE_TTL_MS });

/** An asset the service could not serve: never silently simulated. */
interface UnavailableAsset {
  symbol: string;
  name: string;
  price: null;
  history: [];
  dataSource: null;
  isMock: false;
  freshness: "unavailable";
  error: string;
}

function buildService() {
  const providers = [];
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (alphaVantageKey) {
    // Preferred provider when configured.
    providers.push(createAlphaVantageProvider({ apiKey: alphaVantageKey }));
  }
  providers.push(createYahooFinanceProvider());

  return createMarketDataService({
    router: createProviderRouter(providers),
    quoteCache,
    historyCache,
  });
}

function unavailableAsset(symbol: string, error: unknown): UnavailableAsset {
  return {
    symbol,
    name: symbol,
    price: null,
    history: [],
    dataSource: null,
    isMock: false,
    freshness: "unavailable",
    error:
      error instanceof SymbolNotFoundError
        ? "symbol_not_found"
        : error instanceof AllProvidersUnavailableError
          ? "providers_unavailable"
          : error instanceof MarketDataError
            ? "provider_error"
            : "unknown_error",
  };
}

export default async function handler(req: MarketQuoteRequest, res: MarketQuoteResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // CDN caching mirrors the short quote TTL; freshness labels inside
  // the payload stay truthful because they derive from provider
  // timestamps, not from this response's age.
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  const symbolsParam = req.query?.symbols;
  const symbolsRaw = Array.isArray(symbolsParam) ? symbolsParam[0] : symbolsParam;
  if (!symbolsRaw || typeof symbolsRaw !== "string") {
    res.status(400).json({ error: "חסר פרמטר symbols, לדוגמה: ?symbols=VOO,AAPL" });
    return;
  }

  const rangeParam = req.query?.range;
  const rangeRaw = Array.isArray(rangeParam) ? rangeParam[0] : rangeParam;
  const range = rangeRaw === undefined ? "3mo" : rangeRaw;
  if (!isHistoryRange(range)) {
    res.status(400).json({ error: "range חייב להיות אחד מ: 3mo, 1y, 10y" });
    return;
  }

  const symbols = symbolsRaw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => SYMBOL_PATTERN.test(s))
    .slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) {
    res.status(400).json({ error: "לא סופקו סמלים תקינים" });
    return;
  }

  const service = buildService();

  // Per-symbol isolation: one bad symbol never fails the whole batch.
  const assets: (MarketAsset | UnavailableAsset)[] = await Promise.all(
    symbols.map(async (symbol): Promise<MarketAsset | UnavailableAsset> => {
      try {
        return await service.getAsset(symbol, { range });
      } catch (error) {
        return unavailableAsset(symbol, error);
      }
    })
  );

  res.status(200).json({ assets });
}
