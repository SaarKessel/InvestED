// ---------------------------------------------------------------------------
// InvestED — Market Data Provider Interface (Phase 4)
//
// Every provider normalizes its raw payloads into the same unified
// market model. Consumers (router, service, cache, AI) only ever see
// NormalizedQuote / MarketPricePoint, never provider-specific shapes.
// ---------------------------------------------------------------------------

import type {
  CandleDatum,
  MarketAssetType,
  MarketDataSource,
  MarketStatus,
} from "../../../types/index.js";

export type MarketProviderId = Extract<MarketDataSource, "alpha_vantage" | "yahoo_finance">;

export type HistoryRange = "3mo" | "1y" | "10y";

export const HISTORY_RANGES: HistoryRange[] = ["3mo", "1y", "10y"];

export function isHistoryRange(value: unknown): value is HistoryRange {
  return typeof value === "string" && (HISTORY_RANGES as string[]).includes(value);
}

/** The quote half of the unified model (everything except history). */
export interface NormalizedQuote {
  symbol: string;
  name: string;
  assetType: MarketAssetType;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number;
  currency: string | null;
  volume: number | null;
  marketStatus: MarketStatus;
  dataSource: MarketProviderId;
  /** The provider's own timestamp for this data (ISO), or null. */
  timestamp: string | null;
}

export interface MarketDataProvider {
  readonly id: MarketProviderId;
  getQuote(symbol: string): Promise<NormalizedQuote>;
  getHistory(symbol: string, range: HistoryRange): Promise<CandleDatum[]>;
}

export type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;
