// ---------------------------------------------------------------------------
// InvestED — Alpha Vantage Provider (Phase 4)
//
// Wraps the Alpha Vantage REST API (GLOBAL_QUOTE + TIME_SERIES_DAILY /
// TIME_SERIES_MONTHLY) and normalizes every payload into the unified
// market model.
//
// Truthfulness notes:
// - The free tier serves delayed/end-of-day data; GLOBAL_QUOTE's
//   "latest trading day" is a date, not an intraday timestamp, so the
//   normalized timestamp is that date (never presented as live).
// - Alpha Vantage has no market-session field: marketStatus is
//   "unknown" rather than a guess.
// - Alpha Vantage reports rate limits as HTTP 200 with a Note/
//   Information payload; those become ProviderRateLimitError so the
//   router can fall back to another provider.
// ---------------------------------------------------------------------------

import type { CandleDatum } from "../../../types/index.js";
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

const DEFAULT_BASE_URL = "https://www.alphavantage.co/query";

export interface AlphaVantageProviderConfig {
  apiKey: string;
  fetchImpl?: FetchLike;
  baseUrl?: string;
}

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
}

function parseNumberField(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(String(value).replace(/%$/, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** True when the payload is an Alpha Vantage rate-limit notice. */
export function isAlphaVantageRateLimit(raw: unknown): boolean {
  const record = asRecord(raw);
  return record !== null && ("Note" in record || "Information" in record);
}

/** True when the payload is an Alpha Vantage "no such symbol" error. */
export function isAlphaVantageErrorMessage(raw: unknown): boolean {
  const record = asRecord(raw);
  return record !== null && "Error Message" in record;
}

export function normalizeAlphaVantageQuote(raw: unknown, symbol: string): NormalizedQuote {
  const record = asRecord(raw);
  const quote = asRecord(record?.["Global Quote"]);
  if (!quote || Object.keys(quote).length === 0) {
    throw new SymbolNotFoundError(`Alpha Vantage returned no quote for ${symbol}`);
  }

  const price = parseNumberField(quote["05. price"]);
  if (price === null) {
    throw new ProviderResponseError(`Alpha Vantage quote for ${symbol} has no usable price`);
  }

  const previousClose = parseNumberField(quote["08. previous close"]);
  const change = parseNumberField(quote["09. change"]);
  const changePercentRaw = parseNumberField(quote["10. change percent"]);
  const volume = parseNumberField(quote["06. volume"]);
  const tradingDay = quote["07. latest trading day"];

  return {
    symbol: typeof quote["01. symbol"] === "string" ? (quote["01. symbol"] as string) : symbol,
    name: symbol, // GLOBAL_QUOTE supplies no company name; the service layer fills known names.
    assetType: "unknown",
    price: round2(price),
    previousClose: previousClose !== null ? round2(previousClose) : null,
    change: change !== null ? round2(change) : null,
    changePercent:
      changePercentRaw !== null
        ? round2(changePercentRaw)
        : previousClose
          ? round2(((price - previousClose) / previousClose) * 100)
          : 0,
    // Alpha Vantage's free US endpoints quote in USD.
    currency: "USD",
    volume,
    // Alpha Vantage supplies no market-session field; never guess it.
    marketStatus: "unknown",
    dataSource: "alpha_vantage",
    timestamp: typeof tradingDay === "string" ? tradingDay : null,
  };
}

export function normalizeAlphaVantageTimeSeries(
  raw: unknown,
  symbol: string,
  seriesKey: "Time Series (Daily)" | "Monthly Time Series"
): CandleDatum[] {
  const record = asRecord(raw);
  const series = asRecord(record?.[seriesKey]);
  if (!series) {
    throw new SymbolNotFoundError(`Alpha Vantage returned no history for ${symbol}`);
  }

  const points: CandleDatum[] = [];
  for (const [date, rawBar] of Object.entries(series)) {
    const bar = asRecord(rawBar);
    if (!bar) continue;
    const open = parseNumberField(bar["1. open"]);
    const high = parseNumberField(bar["2. high"]);
    const low = parseNumberField(bar["3. low"]);
    const close = parseNumberField(bar["4. close"]);
    const volume = parseNumberField(bar["5. volume"]);
    if (close === null || open === null || high === null || low === null) continue;
    points.push({
      date,
      price: round2(close),
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume,
    });
  }

  if (points.length === 0) {
    throw new ProviderResponseError(`Alpha Vantage history for ${symbol} had no usable bars`);
  }

  // Alpha Vantage returns newest-first; the unified model is oldest-first.
  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

function rangeToHistoryRequest(range: HistoryRange): { fn: string; seriesKey: "Time Series (Daily)" | "Monthly Time Series"; outputsize?: string; limit: number } {
  switch (range) {
    case "10y":
      return { fn: "TIME_SERIES_MONTHLY", seriesKey: "Monthly Time Series", limit: 121 };
    case "1y":
      return { fn: "TIME_SERIES_DAILY", seriesKey: "Time Series (Daily)", outputsize: "full", limit: 366 };
    case "3mo":
    default:
      return { fn: "TIME_SERIES_DAILY", seriesKey: "Time Series (Daily)", outputsize: "compact", limit: 92 };
  }
}

export function createAlphaVantageProvider(config: AlphaVantageProviderConfig): MarketDataProvider {
  const fetchImpl = config.fetchImpl ?? (fetch as unknown as FetchLike);
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;

  async function callApi(params: Record<string, string>): Promise<unknown> {
    const url = `${baseUrl}?${new URLSearchParams({ ...params, apikey: config.apiKey }).toString()}`;
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await fetchImpl(url);
    } catch (error) {
      throw new ProviderUnavailableError(
        `Alpha Vantage request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (response.status === 429) {
      throw new ProviderRateLimitError("Alpha Vantage returned HTTP 429");
    }
    if (!response.ok) {
      throw new ProviderUnavailableError(`Alpha Vantage returned HTTP ${response.status}`);
    }
    const raw = await response.json();
    if (isAlphaVantageRateLimit(raw)) {
      throw new ProviderRateLimitError("Alpha Vantage rate limit reached");
    }
    if (isAlphaVantageErrorMessage(raw)) {
      throw new SymbolNotFoundError("Alpha Vantage does not recognize the requested symbol");
    }
    return raw;
  }

  return {
    id: "alpha_vantage",
    async getQuote(symbol) {
      const raw = await callApi({ function: "GLOBAL_QUOTE", symbol });
      return normalizeAlphaVantageQuote(raw, symbol);
    },
    async getHistory(symbol, range) {
      const request = rangeToHistoryRequest(range);
      const params: Record<string, string> = { function: request.fn, symbol };
      if (request.outputsize) params.outputsize = request.outputsize;
      const raw = await callApi(params);
      return normalizeAlphaVantageTimeSeries(raw, symbol, request.seriesKey).slice(-request.limit);
    },
  };
}
