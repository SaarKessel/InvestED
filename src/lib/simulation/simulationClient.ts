// ---------------------------------------------------------------------------
// InvestED — Simulation quote loading: real quotes only.
//
// Unlike the dashboard's labeled mock fallback, a simulation can neither
// start nor be valued on simulated prices — that would fabricate results.
// ---------------------------------------------------------------------------

import type { SimulationQuote } from "./simulationEngine";

interface ApiAsset {
  symbol?: string;
  name?: string;
  price?: number | null;
  currency?: string | null;
  dataSource?: string | null;
  timestamp?: string | null;
  freshness?: string;
  isMock?: boolean;
  error?: string;
}

const MAX_SYMBOLS_PER_REQUEST = 8;

export async function fetchSimulationQuotes(symbols: string[]): Promise<Record<string, SimulationQuote | null>> {
  const result: Record<string, SimulationQuote | null> = {};
  for (let i = 0; i < symbols.length; i += MAX_SYMBOLS_PER_REQUEST) {
    const chunk = symbols.slice(i, i + MAX_SYMBOLS_PER_REQUEST);
    const response = await fetch(`/api/market-quote?symbols=${encodeURIComponent(chunk.join(","))}&range=3mo`);
    if (!response.ok) throw new Error(`market-quote responded ${response.status}`);
    const data = await response.json();
    const assets = Array.isArray(data?.assets) ? (data.assets as ApiAsset[]) : [];
    for (const symbol of chunk) {
      const asset = assets.find((a) => a.symbol === symbol);
      result[symbol] =
        asset && typeof asset.price === "number" && Number.isFinite(asset.price)
          ? {
              symbol,
              price: asset.price,
              currency: asset.currency ?? "",
              dataSource: asset.dataSource ?? "unknown",
              timestamp: asset.timestamp ?? null,
              freshness: asset.freshness ?? "unavailable",
              isMock: asset.isMock === true,
            }
          : null;
    }
  }
  return result;
}
