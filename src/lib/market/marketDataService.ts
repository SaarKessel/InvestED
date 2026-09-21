// ---------------------------------------------------------------------------
// InvestED — MarketDataService (Phase 4)
//
// The single entry point for real market data:
//
//   UI / AI / Calculator
//     ↓
//   MarketDataService
//     ↓                     ↓ (miss/stale)
//   Cache (quotes, short TTL; history, long TTL)
//     ↓
//   ProviderRouter (preferred provider, fallback only on availability)
//     ↓
//   Unified MarketAsset (source, timestamp, freshness, mock status)
//
// The service never fabricates data: it has no mock path. Simulated
// fallback for local development lives in the client layer
// (src/lib/marketData.ts) and is always labeled mock/simulated.
// ---------------------------------------------------------------------------

import type { CandleDatum, MarketAsset } from "../../types/index.js";
import type { TtlCache } from "./cache.js";
import { SymbolNotFoundError } from "./errors.js";
import { computeFreshness } from "./freshness.js";
import { findKnownAsset } from "./knownAssets.js";
import type { ProviderRouter } from "./router.js";
import { resolveAssetSymbol } from "./symbolResolution.js";
import type { HistoryRange, NormalizedQuote } from "./providers/types.js";

export interface CachedQuote {
  quote: NormalizedQuote;
  fetchedAt: number;
}

export interface MarketDataServiceConfig {
  router: ProviderRouter;
  /** Short-TTL quote cache. */
  quoteCache: TtlCache<CachedQuote>;
  /** Long-TTL history cache. */
  historyCache: TtlCache<CandleDatum[]>;
  now?: () => number;
}

export interface MarketDataService {
  getAsset(symbolInput: string, options?: { range?: HistoryRange }): Promise<MarketAsset>;
}

export function createMarketDataService(config: MarketDataServiceConfig): MarketDataService {
  const now = config.now ?? (() => Date.now());

  return {
    async getAsset(symbolInput, options = {}) {
      const resolution = resolveAssetSymbol(symbolInput);
      if (!resolution) {
        throw new SymbolNotFoundError(`Cannot resolve "${symbolInput}" to a supported asset`);
      }
      const symbol = resolution.symbol;
      const range = options.range ?? "3mo";

      let cached = config.quoteCache.get(symbol);
      if (!cached) {
        const routed = await config.router.getQuote(symbol);
        cached = { quote: routed.value, fetchedAt: now() };
        config.quoteCache.set(symbol, cached);
      }

      const historyKey = `${symbol}:${range}`;
      let history = config.historyCache.get(historyKey);
      if (!history) {
        const routed = await config.router.getHistory(symbol, range);
        history = routed.value;
        config.historyCache.set(historyKey, history);
      }

      const known = findKnownAsset(symbol);
      const quote = cached.quote;

      const freshness = computeFreshness({
        dataSource: quote.dataSource,
        timestamp: quote.timestamp,
        fetchedAt: cached.fetchedAt,
        now,
      });

      const asset: MarketAsset = {
        symbol,
        // Providers that supply no name keep the known-assets name.
        name: quote.name !== symbol ? quote.name : known?.name ?? quote.name,
        assetType: quote.assetType !== "unknown" ? quote.assetType : known?.assetType ?? "unknown",
        price: quote.price,
        previousClose: quote.previousClose,
        change: quote.change,
        changePercent: quote.changePercent,
        currency: quote.currency,
        volume: quote.volume,
        marketStatus: quote.marketStatus,
        history,
        dataSource: quote.dataSource,
        timestamp: quote.timestamp,
        freshness,
        isMock: false,
      };
      return asset;
    },
  };
}
