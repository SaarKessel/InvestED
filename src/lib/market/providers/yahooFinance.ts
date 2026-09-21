// ---------------------------------------------------------------------------
// InvestED — Yahoo Finance Provider (the "yfinance" path, Phase 4)
//
// This is the server-side realization of the yfinance path: the Python
// yfinance library cannot run inside InvestED's JavaScript serverless
// runtime, so this provider calls the same Yahoo Finance backend
// (query1.finance.yahoo.com v8 chart API) that yfinance itself wraps.
//
// Truthfulness notes:
// - The endpoint is unofficial and serves delayed data; freshness is
//   derived from meta.regularMarketTime, never assumed.
// - marketState is mapped from the provider's own field; unknown
//   values stay "unknown".
// ---------------------------------------------------------------------------

import type { CandleDatum, MarketStatus } from "../../../types/index.js";
import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
  SymbolNotFoundError,
} from "../errors.js";
import type {
  FetchLike,
  HistoryRange,
  MarketDataProvider,
  NormalizedQuote,
} from "./types.js";

const DEFAULT_BASE_URL = "https://query1.finance.yahoo.com";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface YahooFinanceProviderConfig {
  fetchImpl?: FetchLike;
  baseUrl?: string;
}

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function mapYahooMarketState(value: unknown): MarketStatus {
  switch (typeof value === "string" ? value.toUpperCase() : "") {
    case "REGULAR":
      return "open";
    case "CLOSED":
      return "closed";
    case "PRE":
    case "PREPRE":
      return "pre_market";
    case "POST":
    case "POSTPOST":
      return "after_hours";
    default:
      return "unknown";
  }
}

function rangeToRequest(range: HistoryRange): { range: string; interval: string } {
  switch (range) {
    case "10y":
      return { range: "10y", interval: "1mo" };
    case "1y":
      return { range: "1y", interval: "1d" };
    case "3mo":
    default:
      return { range: "3mo", interval: "1d" };
  }
}

export function normalizeYahooChart(
  raw: unknown,
  symbol: string
): { quote: NormalizedQuote; history: CandleDatum[] } {
  const chart = asRecord(asRecord(raw)?.chart);
  const chartError = asRecord(chart?.error);
  if (chartError) {
    const description = String(chartError.description ?? "");
    if (/no data|not found|no symbol/i.test(description)) {
      throw new SymbolNotFoundError(`Yahoo Finance has no data for ${symbol}`);
    }
    throw new ProviderResponseError(`Yahoo Finance chart error for ${symbol}: ${description}`);
  }

  const results = chart?.result;
  const result = asRecord(Array.isArray(results) ? results[0] : null);
  if (!result) {
    throw new ProviderResponseError(`Yahoo Finance returned an empty chart for ${symbol}`);
  }

  const meta = asRecord(result.meta) ?? {};
  const timestamps = Array.isArray(result.timestamp) ? (result.timestamp as unknown[]) : [];
  const quoteBlock = asRecord(asRecord(asRecord(result.indicators)?.quote ? (asRecord(result.indicators)!.quote as unknown[])[0] : null)) ?? {};
  const closes = Array.isArray(quoteBlock.close) ? (quoteBlock.close as unknown[]) : [];
  const opens = Array.isArray(quoteBlock.open) ? (quoteBlock.open as unknown[]) : [];
  const highs = Array.isArray(quoteBlock.high) ? (quoteBlock.high as unknown[]) : [];
  const lows = Array.isArray(quoteBlock.low) ? (quoteBlock.low as unknown[]) : [];
  const volumes = Array.isArray(quoteBlock.volume) ? (quoteBlock.volume as unknown[]) : [];

  const history: CandleDatum[] = [];
  timestamps.forEach((t, i) => {
    const close = asNumber(closes[i]);
    const open = asNumber(opens[i]);
    const high = asNumber(highs[i]);
    const low = asNumber(lows[i]);
    if (typeof t !== "number" || close === null) return;
    history.push({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      price: round2(close),
      open: open !== null ? round2(open) : round2(close),
      high: high !== null ? round2(high) : round2(close),
      low: low !== null ? round2(low) : round2(close),
      close: round2(close),
      volume: asNumber(volumes[i]),
    });
  });

  const lastClose = history[history.length - 1]?.price ?? null;
  const price = asNumber(meta.regularMarketPrice) ?? lastClose;
  if (price === null) {
    throw new ProviderResponseError(`Yahoo Finance chart for ${symbol} has no usable price`);
  }

  const previousClose =
    asNumber(meta.chartPreviousClose) ?? asNumber(meta.previousClose) ?? null;
  const change = previousClose !== null ? price - previousClose : null;
  const changePercent =
    previousClose !== null && previousClose !== 0
      ? ((price - previousClose) / previousClose) * 100
      : 0;

  const regularMarketTime = asNumber(meta.regularMarketTime);

  const quote: NormalizedQuote = {
    symbol: typeof meta.symbol === "string" ? (meta.symbol as string) : symbol,
    name:
      typeof meta.longName === "string"
        ? (meta.longName as string)
        : typeof meta.shortName === "string"
          ? (meta.shortName as string)
          : symbol,
    assetType:
      typeof meta.instrumentType === "string" && /etf/i.test(meta.instrumentType as string)
        ? "etf"
        : typeof meta.instrumentType === "string" && /index/i.test(meta.instrumentType as string)
          ? "index"
          : typeof meta.instrumentType === "string" && /mutualfund|fund/i.test(meta.instrumentType as string)
            ? "fund"
            : "stock",
    price: round2(price),
    previousClose: previousClose !== null ? round2(previousClose) : null,
    change: change !== null ? round2(change) : null,
    changePercent: round2(changePercent),
    currency: typeof meta.currency === "string" ? (meta.currency as string) : null,
    volume: asNumber(meta.regularMarketVolume),
    marketStatus: mapYahooMarketState(meta.marketState),
    dataSource: "yahoo_finance",
    timestamp:
      regularMarketTime !== null ? new Date(regularMarketTime * 1000).toISOString() : null,
  };

  return { quote, history };
}

export function createYahooFinanceProvider(config: YahooFinanceProviderConfig = {}): MarketDataProvider {
  const fetchImpl = config.fetchImpl ?? (fetch as unknown as FetchLike);
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;

  async function fetchChart(symbol: string, range: HistoryRange | "5d"): Promise<unknown> {
    const request = range === "5d" ? { range: "5d", interval: "1d" } : rangeToRequest(range);
    const url = `${baseUrl}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${request.range}&interval=${request.interval}`;
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await fetchImpl(url, {
        headers: {
          // Yahoo blocks some requests without a real browser User-Agent.
          "User-Agent": BROWSER_USER_AGENT,
          Accept: "application/json",
        },
      });
    } catch (error) {
      throw new ProviderUnavailableError(
        `Yahoo Finance request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (response.status === 404) {
      throw new SymbolNotFoundError(`Yahoo Finance has no symbol ${symbol}`);
    }
    if (response.status === 429) {
      throw new ProviderRateLimitError("Yahoo Finance returned HTTP 429");
    }
    if (!response.ok) {
      throw new ProviderUnavailableError(`Yahoo Finance returned HTTP ${response.status}`);
    }
    return response.json();
  }

  return {
    id: "yahoo_finance",
    async getQuote(symbol) {
      const raw = await fetchChart(symbol, "5d");
      return normalizeYahooChart(raw, symbol).quote;
    },
    async getHistory(symbol, range) {
      const raw = await fetchChart(symbol, range);
      return normalizeYahooChart(raw, symbol).history;
    },
  };
}
