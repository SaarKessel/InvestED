// ---------------------------------------------------------------------------
// InvestED — Market Movers (gainers / decliners)
//
// Normalizes the Yahoo Finance predefined-screener payloads (day_gainers,
// day_losers) into the shared mover model. Truthfulness notes:
// - The screener is a real provider capability; when it cannot be served
//   the API layer falls back to computing movers from the bounded known
//   watchlist and LABELS that coverage difference explicitly.
// - Prices are delayed per provider tier; timestamps come from the
//   provider payload, never assumed.
// ---------------------------------------------------------------------------

import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
} from "./errors.js";
import type { FetchLike, MarketProviderId } from "./providers/types.js";

export type MoversListId = "day_gainers" | "day_losers";

export interface MarketMover {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  currency: string | null;
  dataSource: MarketProviderId;
  /** Provider's own timestamp (ISO), or null. */
  timestamp: string | null;
}

export interface MarketMoversProvider {
  readonly id: MarketProviderId;
  getMovers(list: MoversListId, count?: number): Promise<MarketMover[]>;
}

export function supportsMovers(provider: unknown): provider is MarketMoversProvider {
  return !!provider && typeof (provider as MarketMoversProvider).getMovers === "function";
}

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
}

function rawNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const record = asRecord(value);
  if (record && typeof record.raw === "number" && Number.isFinite(record.raw)) {
    return record.raw;
  }
  return null;
}

/** Pure normalization, exported for tests. */
export function normalizeYahooScreener(raw: unknown, source: MarketProviderId = "yahoo_finance"): MarketMover[] {
  const finance = asRecord(asRecord(raw)?.finance);
  if (finance?.error) {
    throw new ProviderResponseError(
      `Yahoo Finance screener error: ${JSON.stringify(finance.error)}`
    );
  }
  const results = Array.isArray(finance?.result) ? (finance.result as unknown[]) : [];
  const first = asRecord(results[0]);
  const quotes = Array.isArray(first?.quotes) ? (first.quotes as unknown[]) : null;
  if (!quotes) {
    throw new ProviderResponseError("Yahoo Finance screener returned an unexpected payload");
  }

  const movers: MarketMover[] = [];
  for (const entry of quotes) {
    const quote = asRecord(entry);
    if (!quote || typeof quote.symbol !== "string" || quote.symbol.length === 0) continue;
    const marketTime = rawNumber(quote.regularMarketTime);
    movers.push({
      symbol: quote.symbol,
      name:
        typeof quote.longName === "string"
          ? quote.longName
          : typeof quote.shortName === "string"
            ? quote.shortName
            : quote.symbol,
      price: rawNumber(quote.regularMarketPrice),
      changePercent: rawNumber(quote.regularMarketChangePercent),
      currency: typeof quote.currency === "string" ? quote.currency : null,
      dataSource: source,
      timestamp: marketTime !== null ? new Date(marketTime * 1000).toISOString() : null,
    });
  }
  return movers;
}

const DEFAULT_BASE_URL = "https://query1.finance.yahoo.com";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export function createYahooMoversFetcher(config: {
  fetchImpl?: FetchLike;
  baseUrl?: string;
} = {}): MarketMoversProvider {
  const fetchImpl = config.fetchImpl ?? (fetch as unknown as FetchLike);
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;

  return {
    id: "yahoo_finance",
    async getMovers(list, count = 10) {
      const url = `${baseUrl}/v1/finance/screener/predefined/saved?count=${count}&scrIds=${list}`;
      let response: Awaited<ReturnType<FetchLike>>;
      try {
        response = await fetchImpl(url, {
          headers: { "User-Agent": BROWSER_USER_AGENT, Accept: "application/json" },
        });
      } catch (error) {
        throw new ProviderUnavailableError(
          `Yahoo Finance screener request failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      if (response.status === 429) {
        throw new ProviderRateLimitError("Yahoo Finance screener returned HTTP 429");
      }
      if (!response.ok) {
        throw new ProviderUnavailableError(`Yahoo Finance screener returned HTTP ${response.status}`);
      }
      return normalizeYahooScreener(await response.json());
    },
  };
}
