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
import { SymbolNotFoundError } from "./errors.js";
import { providerPreferenceFor, type RoutingPolicy } from "./marketRouting.js";
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

export function createProviderRouter(
  providers: MarketDataProvider[],
  policy?: RoutingPolicy
): ProviderRouter {
  if (providers.length === 0) {
    throw new Error("createProviderRouter requires at least one provider");
  }

  /**
   * Without a policy: configured order. With a policy: only providers
   * that serve the symbol's market, in that market's risk order, with
   * providers in cooldown skipped (and reported as failures).
   */
  function candidatesFor(symbol: string, failures: ProviderFailure[]): MarketDataProvider[] {
    if (!policy) return providers;
    const preference = (policy.preference ?? providerPreferenceFor)(symbol);
    const ordered = preference
      .map((id) => providers.find((provider) => provider.id === id))
      .filter((provider): provider is MarketDataProvider => provider !== undefined);
    if (ordered.length === 0) {
      throw new SymbolNotFoundError(
        `No configured market data provider serves ${symbol}`
      );
    }
    const health = policy.health;
    if (!health) return ordered;
    const ready: MarketDataProvider[] = [];
    for (const provider of ordered) {
      if (health.isCoolingDown(provider.id)) {
        failures.push({ providerId: provider.id, error: "cooling down after recent failure" });
      } else {
        ready.push(provider);
      }
    }
    return ready;
  }

  async function route<T>(
    symbol: string,
    operation: (provider: MarketDataProvider) => Promise<T>
  ): Promise<RoutedResult<T>> {
    const failures: ProviderFailure[] = [];
    for (const provider of candidatesFor(symbol, failures)) {
      try {
        const value = await operation(provider);
        policy?.health?.recordSuccess(provider.id);
        return { value, providerId: provider.id, failedProviders: failures };
      } catch (error) {
        if (isAvailabilityError(error)) {
          policy?.health?.recordFailure(provider.id, error);
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
      return route(symbol, (provider) => provider.getQuote(symbol));
    },
    getHistory(symbol, range) {
      return route(symbol, (provider) => provider.getHistory(symbol, range));
    },
  };
}
