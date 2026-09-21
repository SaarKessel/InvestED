// ---------------------------------------------------------------------------
// InvestED — Known Assets (Phase 4)
//
// The bounded universe of assets the product explicitly supports: the
// core ETF/fund set shown on the dashboard, the interest-area symbols,
// and (for name resolution) the existing S&P 500 keyword database.
// This is intentionally NOT a universal financial database.
// ---------------------------------------------------------------------------

import type { InterestArea, MarketAssetType } from "../../types/index.js";

export interface KnownAsset {
  symbol: string;
  name: string;
  assetType: MarketAssetType;
  basePrice: number;
  aliases?: string[];
}

export const CORE_SYMBOLS: KnownAsset[] = [
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", assetType: "etf", basePrice: 512 },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", assetType: "etf", basePrice: 268 },
  { symbol: "VXUS", name: "Vanguard Total International Stock ETF", assetType: "etf", basePrice: 63 },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", assetType: "fund", basePrice: 73 },
];

export const INTEREST_SYMBOLS: Record<InterestArea, KnownAsset[]> = {
  technology: [
    { symbol: "AAPL", name: "Apple Inc.", assetType: "stock", basePrice: 210 },
    { symbol: "MSFT", name: "Microsoft Corp.", assetType: "stock", basePrice: 430 },
  ],
  finance: [
    { symbol: "JPM", name: "JPMorgan Chase & Co.", assetType: "stock", basePrice: 210 },
    { symbol: "V", name: "Visa Inc.", assetType: "stock", basePrice: 280 },
  ],
  healthcare: [
    { symbol: "JNJ", name: "Johnson & Johnson", assetType: "stock", basePrice: 155 },
    { symbol: "UNH", name: "UnitedHealth Group", assetType: "stock", basePrice: 500 },
  ],
  energy: [
    { symbol: "XOM", name: "Exxon Mobil Corp.", assetType: "stock", basePrice: 115 },
    { symbol: "CVX", name: "Chevron Corp.", assetType: "stock", basePrice: 160 },
  ],
  real_estate: [
    { symbol: "VNQ", name: "Vanguard Real Estate ETF", assetType: "etf", basePrice: 90 },
    { symbol: "O", name: "Realty Income Corp.", assetType: "stock", basePrice: 58 },
  ],
};

export const MAX_SYMBOLS = 8;

/** All explicitly supported non-index assets, deduplicated by symbol. */
export function listKnownAssets(): KnownAsset[] {
  const seen = new Set<string>();
  const assets: KnownAsset[] = [];
  for (const asset of [...CORE_SYMBOLS, ...Object.values(INTEREST_SYMBOLS).flat()]) {
    if (seen.has(asset.symbol)) continue;
    seen.add(asset.symbol);
    assets.push(asset);
  }
  return assets;
}

export function findKnownAsset(symbol: string): KnownAsset | undefined {
  return listKnownAssets().find((asset) => asset.symbol === symbol);
}

export function buildSymbolPlan(interests: InterestArea[]): KnownAsset[] {
  const plan = [...CORE_SYMBOLS];
  const seen = new Set(plan.map((p) => p.symbol));

  for (const interest of interests) {
    for (const candidate of INTEREST_SYMBOLS[interest] ?? []) {
      if (plan.length >= MAX_SYMBOLS) break;
      if (seen.has(candidate.symbol)) continue;
      plan.push(candidate);
      seen.add(candidate.symbol);
    }
  }

  return plan;
}
