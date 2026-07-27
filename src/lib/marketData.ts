import type { InterestArea, MarketAsset } from "@/types";

// ---------------------------------------------------------------------------
// InvestED — Market Data Service
//
// ברירת המחדל: נתונים אמיתיים מ-Yahoo Finance, דרך פונקציית ה-Serverless
// שנמצאת ב-/api/market-quote (ראו api/market-quote.js). זה עובד אוטומטית
// כשהאתר רץ ב-Vercel. אם ה-API לא זמין (למשל בהרצה מקומית עם `npm run dev`
// בלי `vercel dev`, או אם Yahoo חוסם את הבקשה) — נופלים אוטומטית לנתונים
// מדומים, כדי שהדשבורד תמיד יעבוד.
//
// הבחירה אילו סמלים להציג מתבססת על תחומי העניין שזוהו בפרומפט של המשתמש,
// כך שהגרף באמת "מגיב" למה שהמשתמש כתב.
// ---------------------------------------------------------------------------

const CORE_SYMBOLS: { symbol: string; name: string; basePrice: number }[] = [
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", basePrice: 512 },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", basePrice: 268 },
  { symbol: "VXUS", name: "Vanguard Total International Stock ETF", basePrice: 63 },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", basePrice: 73 },
];

const INTEREST_SYMBOLS: Record<InterestArea, { symbol: string; name: string; basePrice: number }[]> = {
  "טכנולוגיה": [
    { symbol: "AAPL", name: "Apple Inc.", basePrice: 210 },
    { symbol: "MSFT", name: "Microsoft Corp.", basePrice: 430 },
  ],
  "פיננסים": [
    { symbol: "JPM", name: "JPMorgan Chase & Co.", basePrice: 210 },
    { symbol: "V", name: "Visa Inc.", basePrice: 280 },
  ],
  "בריאות": [
    { symbol: "JNJ", name: "Johnson & Johnson", basePrice: 155 },
    { symbol: "UNH", name: "UnitedHealth Group", basePrice: 500 },
  ],
  "אנרגיה": [
    { symbol: "XOM", name: "Exxon Mobil Corp.", basePrice: 115 },
    { symbol: "CVX", name: "Chevron Corp.", basePrice: 160 },
  ],
  "נדל\"ן": [
    { symbol: "VNQ", name: "Vanguard Real Estate ETF", basePrice: 90 },
    { symbol: "O", name: "Realty Income Corp.", basePrice: 58 },
  ],
};

const MAX_SYMBOLS = 8;

function buildSymbolPlan(interests: InterestArea[]) {
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

function generateMockHistory(basePrice: number, seed: number, days = 90) {
  const rand = seededRandom(seed);
  const history: { date: string; price: number; open: number; high: number; low: number; close: number }[] = [];
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

function buildMockAsset(item: { symbol: string; name: string; basePrice: number }): MarketAsset {
  const history = generateMockHistory(item.basePrice, seedFromSymbol(item.symbol));
  const last = history[history.length - 1].price;
  const prev = history[history.length - 2]?.price ?? last;
  const changePercent = ((last - prev) / prev) * 100;

  return {
    symbol: item.symbol,
    name: item.name,
    price: last,
    changePercent: Math.round(changePercent * 100) / 100,
    history,
  };
}

function buildMockAssets(interests: InterestArea[]): MarketAsset[] {
  return buildSymbolPlan(interests).map(buildMockAsset);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MarketDataFetchResult {
  assets: MarketAsset[];
  isLive: boolean;
}

export async function fetchMarketAssets(interests: InterestArea[] = []): Promise<MarketDataFetchResult> {
  const plan = buildSymbolPlan(interests);
  const symbolQuery = plan.map((p) => p.symbol).join(",");

  try {
    const response = await fetch(`/api/market-quote?symbols=${encodeURIComponent(symbolQuery)}`);
    if (!response.ok) throw new Error(`market-quote responded ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data?.assets) || data.assets.length === 0) {
      throw new Error("empty response from market-quote");
    }

    const assets: MarketAsset[] = data.assets.map((a: MarketAsset, idx: number) => ({
      symbol: a.symbol || plan[idx]?.symbol,
      name: a.name || plan[idx]?.name,
      price: a.price,
      changePercent: a.changePercent,
      history: Array.isArray(a.history) && a.history.length > 1 ? a.history : generateMockHistory(a.price || 100, idx),
    }));

    return { assets, isLive: true };
  } catch {
    // נופלים בחזרה לנתונים מדומים — בפיתוח מקומי (npm run dev), או אם
    // Yahoo Finance חסם/שינה את ה-API.
    return { assets: buildMockAssets(interests), isLive: false };
  }
}
