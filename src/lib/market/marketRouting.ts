// ---------------------------------------------------------------------------
// InvestED - Market routing policy
//
// Two ideas, ported as concepts into the existing provider router:
//
//  1. Symbol -> market routing: a symbol is classified into a market
//     (US equity, TASE, crypto, FX, index, futures, other exchange) and
//     only providers that can serve that market are tried.
//  2. Failure-risk ordering with cooldown: providers are tried from the
//     lowest to the highest ban/failure risk, and a provider that just
//     failed with an availability error (or a rate limit) is skipped
//     for a cooldown window instead of being hammered on every request.
//
// Inspired by the ordered data-source fallback design of Vibe-Trading
// (https://github.com/HKUDS/Vibe-Trading, MIT License). No code copied.
// No new data source is added: only the providers already configured.
// ---------------------------------------------------------------------------

import { ProviderRateLimitError } from "./errors.js";
import type { MarketProviderId } from "./providers/types.js";

export type MarketKind =
  | "us_equity"
  | "us_equity_class"
  | "tase"
  | "exchange_suffix"
  | "crypto"
  | "fx"
  | "index"
  | "futures"
  | "unknown";

const CRYPTO_QUOTES = ["USD", "USDT", "EUR", "ILS", "BTC", "ETH"];

export function classifyMarket(rawSymbol: string): MarketKind {
  const symbol = rawSymbol.trim().toUpperCase();
  if (!symbol) return "unknown";
  if (symbol.startsWith("^")) return "index";
  if (symbol.endsWith("=X")) return "fx";
  if (symbol.endsWith("=F")) return "futures";
  if (symbol.endsWith(".TA")) return "tase";
  const dash = symbol.match(/^([A-Z0-9]{2,10})-([A-Z]{3,4})$/);
  if (dash && CRYPTO_QUOTES.includes(dash[2])) return "crypto";
  if (/^[A-Z]{1,5}$/.test(symbol)) return "us_equity";
  if (/^[A-Z]{1,5}[.-][A-Z]$/.test(symbol)) return "us_equity_class";
  if (/^[A-Z0-9]{1,8}\.[A-Z]{1,3}$/.test(symbol)) return "exchange_suffix";
  return "unknown";
}

/**
 * Providers (by id) able to serve each market, ordered from lowest to
 * highest ban/failure risk. Alpha Vantage is an official keyed API that
 * only covers plain US tickers here; Yahoo Finance is an unofficial
 * endpoint (higher failure risk) but covers every market InvestED shows.
 */
const MARKET_PROVIDER_PREFERENCE: Record<MarketKind, MarketProviderId[]> = {
  us_equity: ["alpha_vantage", "yahoo_finance"],
  us_equity_class: ["yahoo_finance"],
  tase: ["yahoo_finance"],
  exchange_suffix: ["yahoo_finance"],
  crypto: ["yahoo_finance"],
  fx: ["yahoo_finance"],
  index: ["yahoo_finance"],
  futures: ["yahoo_finance"],
  unknown: ["alpha_vantage", "yahoo_finance"],
};

export function providerPreferenceFor(symbol: string): MarketProviderId[] {
  return MARKET_PROVIDER_PREFERENCE[classifyMarket(symbol)];
}

export interface ProviderHealthOptions {
  now?: () => number;
  /** Cooldown after an availability failure. */
  failureCooldownMs?: number;
  /** Cooldown after a rate limit (longer: retrying burns quota/risks a ban). */
  rateLimitCooldownMs?: number;
}

export interface ProviderHealth {
  isCoolingDown(id: MarketProviderId): boolean;
  cooldownRemainingMs(id: MarketProviderId): number;
  recordFailure(id: MarketProviderId, error: unknown): void;
  recordSuccess(id: MarketProviderId): void;
}

export function createProviderHealth(options: ProviderHealthOptions = {}): ProviderHealth {
  const now = options.now ?? (() => Date.now());
  const failureCooldownMs = options.failureCooldownMs ?? 30_000;
  const rateLimitCooldownMs = options.rateLimitCooldownMs ?? 5 * 60_000;
  const until = new Map<MarketProviderId, number>();

  return {
    isCoolingDown(id) {
      return (until.get(id) ?? 0) > now();
    },
    cooldownRemainingMs(id) {
      return Math.max(0, (until.get(id) ?? 0) - now());
    },
    recordFailure(id, error) {
      const ms = error instanceof ProviderRateLimitError ? rateLimitCooldownMs : failureCooldownMs;
      until.set(id, now() + ms);
    },
    recordSuccess(id) {
      until.delete(id);
    },
  };
}

export interface RoutingPolicy {
  health?: ProviderHealth;
  /** Override the default per-market preference (tests, future providers). */
  preference?: (symbol: string) => MarketProviderId[];
}
