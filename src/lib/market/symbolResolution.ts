// ---------------------------------------------------------------------------
// InvestED — Symbol / Asset Resolution (Phase 4)
//
// Bounded resolution: NVDA / Nvidia / NVIDIA / אנבידיה resolve to the
// same asset, and so do VTI / "Vanguard Total Stock Market ETF".
// Bounded means: ticker-pattern tokens, the existing S&P 500 keyword
// database, and the explicitly supported ETF/fund table — not a
// universal financial database.
// ---------------------------------------------------------------------------

import { SP500_STOCKS } from "../sp500Stocks.js";
import { listKnownAssets } from "./knownAssets.js";

const TICKER_PATTERN = /^(?:[A-Za-z]{1,5}|[A-Za-z]{3,6}=X)$/;

export interface SymbolResolution {
  symbol: string;
  matched: "ticker" | "name" | "alias";
}

function normalize(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function resolveAssetSymbol(query: string): SymbolResolution | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Ticker-pattern tokens resolve directly ("NVDA", "nvda", "amd").
  if (TICKER_PATTERN.test(trimmed)) {
    return { symbol: trimmed.toUpperCase(), matched: "ticker" };
  }

  const needle = normalize(trimmed);

  // Explicitly supported ETFs/funds/stocks (exact name match first).
  for (const asset of listKnownAssets()) {
    if (normalize(asset.name) === needle) {
      return { symbol: asset.symbol, matched: "name" };
    }
    for (const alias of asset.aliases ?? []) {
      if (normalize(alias) === needle) {
        return { symbol: asset.symbol, matched: "alias" };
      }
    }
  }

  // S&P 500 keyword database (company names, Hebrew names, tickers).
  for (const stock of SP500_STOCKS) {
    if (normalize(stock.name) === needle || normalize(stock.hebrewName) === needle) {
      return { symbol: stock.symbol, matched: "name" };
    }
    for (const keyword of stock.keywords) {
      if (normalize(keyword) === needle) {
        return { symbol: stock.symbol, matched: "alias" };
      }
    }
  }

  return null;
}
