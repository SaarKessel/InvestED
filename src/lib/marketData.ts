import type { CandleDatum, InterestArea, MarketAsset, MarketDataSource } from "@/types";
import { buildSymbolPlan, findKnownAsset, MAX_SYMBOLS, type KnownAsset } from "./market/knownAssets";
import { computeFreshness } from "./market/freshness";
import { resolveAssetSymbol } from "./market/symbolResolution";
import { isHistoryRange, type HistoryRange } from "./market/providers/types";

// ---------------------------------------------------------------------------
// InvestED — Market Data Client Service
//
// ברירת המחדל: נתונים אמיתיים דרך שכבת ה-Market Data בצד השרת
// (/api/market-quote — MarketDataService ← ProviderRouter ←
// Alpha Vantage / Yahoo Finance). זה עובד אוטומטית כשהאתר רץ ב-Vercel.
// אם ה-API לא זמין (למשל בהרצה מקומית עם `npm run dev` בלי
// `vercel dev`) — נופלים אוטומטית לנתונים מדומים שתמיד מסומנים
// כ-mock/simulated, כדי שהדשבורד יעבוד בפיתוח בלי לראמות "נתונים
// אמיתיים".
//
// כל asset שחוזר מכאן נושא את מקור הנתונים, חותמת הזמן, מצב ה-freshness
// ומצב ה-mock שלו. נתון מדומה לעולם לא מוצג כאילו הוא נתון שוק אמיתי.
// ---------------------------------------------------------------------------

// Note: rate-limit protection lives in the server-side cache
// (api/market-quote: short quote TTL, long history TTL). The client
// deliberately keeps no response cache of its own — every caller gets
// fresh provenance, and stale-looking data can never outlive its TTL
// inside the UI layer.

// ---------------------------------------------------------------------------
// Mock fallback (deterministic per-symbol, so it looks stable across renders)
// ---------------------------------------------------------------------------

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function seedFromSymbol(symbol: string): number {
  let seed = 7;
  for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i) * (i + 1);
  return seed;
}

function generateMockHistory(basePrice: number, seed: number, days = 90): CandleDatum[] {
  const rand = seededRandom(seed);
  const history: CandleDatum[] = [];
  let price = basePrice * 0.9;
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const drift = 0.0006;
    const noise = (rand() - 0.48) * 0.018;
    const open = price;
    price = price * (1 + drift + noise);
    const close = price;
    const high = Math.max(open, close) * (1 + rand() * 0.006);
    const low = Math.min(open, close) * (1 - rand() * 0.006);
    history.push({
      date: date.toISOString().slice(0, 10),
      price: Math.round(close * 100) / 100,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
  }
  return history;
}

function buildMockAsset(item: KnownAsset): MarketAsset {
  const history = generateMockHistory(item.basePrice, seedFromSymbol(item.symbol));
  const last = history[history.length - 1].price;
  const prev = history[history.length - 2]?.price ?? last;
  const changePercent = ((last - prev) / prev) * 100;

  return {
    symbol: item.symbol,
    name: item.name,
    assetType: item.assetType,
    price: last,
    previousClose: prev,
    change: Math.round((last - prev) * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    currency: null,
    volume: null,
    marketStatus: "unknown",
    history,
    // Simulated fallback data is always labeled as simulated.
    dataSource: "mock",
    timestamp: null,
    freshness: "simulated",
    isMock: true,
  };
}

function buildMockAssets(interests: InterestArea[]): MarketAsset[] {
  return buildSymbolPlan(interests).map(buildMockAsset);
}

// ---------------------------------------------------------------------------
// API response mapping (truthful provenance)
// ---------------------------------------------------------------------------

/** The wire shape of one asset from /api/market-quote. */
interface ApiMarketAsset {
  symbol?: string;
  name?: string;
  assetType?: MarketAsset["assetType"];
  price?: number | null;
  previousClose?: number | null;
  change?: number | null;
  changePercent?: number | null;
  currency?: string | null;
  volume?: number | null;
  marketStatus?: MarketAsset["marketStatus"];
  history?: CandleDatum[];
  dataSource?: string | null;
  timestamp?: string | null;
  freshness?: MarketAsset["freshness"];
  error?: string;
}

function isRealProviderSource(value: unknown): value is Exclude<MarketDataSource, "mock"> {
  return value === "alpha_vantage" || value === "yahoo_finance";
}

const FRESHNESS_VALUES = ["current", "recent", "stale", "simulated", "unavailable"];

function mapApiAsset(api: ApiMarketAsset, fallback: KnownAsset | undefined, seedIndex: number): MarketAsset | null {
  // An asset the server could not serve (price=null, freshness
  // "unavailable") is dropped here — never replaced with silent mock.
  if (!api || typeof api.price !== "number" || !Number.isFinite(api.price)) return null;

  const symbol = api.symbol || fallback?.symbol || "UNKNOWN";
  const hasRealHistory = Array.isArray(api.history) && api.history.length > 1;

  if (hasRealHistory) {
    const dataSource: MarketDataSource = isRealProviderSource(api.dataSource)
      ? api.dataSource
      : "yahoo_finance";
    return {
      symbol,
      name: api.name || fallback?.name || symbol,
      assetType: api.assetType ?? fallback?.assetType ?? "unknown",
      price: api.price,
      previousClose: api.previousClose ?? null,
      change: api.change ?? null,
      changePercent: typeof api.changePercent === "number" ? api.changePercent : 0,
      currency: api.currency ?? null,
      volume: api.volume ?? null,
      marketStatus: api.marketStatus ?? "unknown",
      history: api.history!,
      dataSource,
      timestamp: api.timestamp ?? null,
      freshness:
        api.freshness && FRESHNESS_VALUES.includes(api.freshness) && api.freshness !== "simulated"
          ? api.freshness
          : computeFreshness({ dataSource, timestamp: api.timestamp ?? null }),
      isMock: false,
    };
  }

  // The last price may be real, but a simulated history makes every
  // derived indicator (RSI, volatility) simulated — so the whole asset
  // is labeled mock. This rule is a Phase 3C truthfulness guarantee.
  const known = findKnownAsset(symbol);
  const history = generateMockHistory(api.price || 100, seedFromSymbol(symbol) + seedIndex);
  return {
    symbol,
    name: api.name || fallback?.name || symbol,
    assetType: api.assetType ?? known?.assetType ?? "unknown",
    price: api.price,
    previousClose: api.previousClose ?? null,
    change: api.change ?? null,
    changePercent: typeof api.changePercent === "number" ? api.changePercent : 0,
    currency: api.currency ?? null,
    volume: api.volume ?? null,
    marketStatus: "unknown",
    history,
    dataSource: "mock",
    timestamp: api.timestamp ?? null,
    freshness: "simulated",
    isMock: true,
  };
}

function normalizeRange(period?: string): HistoryRange {
  return period && isHistoryRange(period) ? period : "3mo";
}

async function requestAssets(symbols: string[], range: HistoryRange): Promise<MarketAsset[]> {
  const symbolQuery = symbols.join(",");
  const response = await fetch(
    `/api/market-quote?symbols=${encodeURIComponent(symbolQuery)}&range=${range}`
  );
  if (!response.ok) throw new Error(`market-quote responded ${response.status}`);

  const data = await response.json();
  if (!Array.isArray(data?.assets)) throw new Error("malformed response from market-quote");

  const assets = (data.assets as ApiMarketAsset[])
    .map((api, idx) => mapApiAsset(api, findKnownAsset(symbols[idx]), idx))
    .filter((asset): asset is MarketAsset => asset !== null);

  if (assets.length === 0) throw new Error("empty response from market-quote");
  return assets;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MarketDataFetchResult {
  assets: MarketAsset[];
  /**
   * True only when every returned asset came from a real market-data
   * provider (none simulated). The UI labels this state "Latest market
   * data" — never "Live", because free provider tiers serve delayed
   * data and the app cannot verify live-ness.
   */
  isLive: boolean;
}

export async function fetchMarketAssets(interests: InterestArea[] = []): Promise<MarketDataFetchResult> {
  const plan = buildSymbolPlan(interests).slice(0, MAX_SYMBOLS);
  const symbols = plan.map((p) => p.symbol);

  try {
    const assets = await requestAssets(symbols, "3mo");
    return { assets, isLive: assets.every((asset) => asset.isMock === false) };
  } catch {
    // נופלים בחזרה לנתונים מדומים — בפיתוח מקומי (npm run dev), או אם
    // שכבת ה-providers לא זמינה. תמיד מסומן mock/simulated.
    return { assets: buildMockAssets(interests), isLive: false };
  }
}

export async function fetchMarketAssetBySymbol(
  symbol: string,
  period?: string,
  _interval?: string
): Promise<MarketAsset | null> {
  const resolution = resolveAssetSymbol(symbol);
  if (!resolution) return null;
  const normalized = resolution.symbol;
  const range = normalizeRange(period);

  try {
    const assets = await requestAssets([normalized], range);
    return assets[0] ?? null;
  } catch {
    // API unreachable (local dev, provider outage): labeled mock fallback.
    return buildMockAsset({ symbol: normalized, name: normalized, assetType: "unknown", basePrice: 100 });
  }
}
