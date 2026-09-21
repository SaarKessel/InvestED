// ---------------------------------------------------------------------------
// InvestED — Provider Router (Phase 4)
//
// One request, one provider: the router never calls every provider for
// a single query. It tries providers in configured preference order and
// falls back ONLY on availability-class failures (network down, 5xx,
// timeout, rate limit). Business/data errors (symbol not found,
// malformed payload) propagate immediately — falling back on those
// would hide bugs and data-quality problems.
// ---------------------------------------------------------------------------

import {
  AllProvidersUnavailableError,
  isAvailabilityError,
  type ProviderFailure,
} from "./errors.js";
import type { CandleDatum } from "../../types/index.js";
import type {
  HistoryRange,
  MarketDataProvider,
  MarketProviderId,
  NormalizedQuote,
} from "./providers/types.js";

export interface RoutedResult<T> {
  value: T;
  providerId: MarketProviderId;
  /** Providers that failed with availability errors before this result. */
  failedProviders: ProviderFailure[];
}

export interface ProviderRouter {
  readonly providers: MarketProviderId[];
  getQuote(symbol: string): Promise<RoutedResult<NormalizedQuote>>;
  getHistory(symbol: string, range: HistoryRange): Promise<RoutedResult<CandleDatum[]>>;
}

export function createProviderRouter(providers: MarketDataProvider[]): ProviderRouter {
  if (providers.length === 0) {
    throw new Error("createProviderRouter requires at least one provider");
  }

  async function route<T>(
    operation: (provider: MarketDataProvider) => Promise<T>
  ): Promise<RoutedResult<T>> {
    const failures: ProviderFailure[] = [];
    for (const provider of providers) {
      try {
        const value = await operation(provider);
        return { value, providerId: provider.id, failedProviders: failures };
      } catch (error) {
        if (isAvailabilityError(error)) {
          failures.push({
            providerId: provider.id,
            error: error instanceof Error ? error.message : String(error),
          });
          continue;
        }
        // Business/data errors (symbol not found, malformed payload)
        // never fall back.
        throw error;
      }
    }
    throw new AllProvidersUnavailableError(failures);
  }

  return {
    providers: providers.map((provider) => provider.id),
    getQuote(symbol) {
      return route((provider) => provider.getQuote(symbol));
    },
    getHistory(symbol, range) {
      return route((provider) => provider.getHistory(symbol, range));
    },
  };
}
