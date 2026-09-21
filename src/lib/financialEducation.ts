import type { AssetAnalysis } from "@/types";
import type { ConversationLanguage } from "./conversationContext";

export interface HoldingRequest {
  quantity: number;
  symbol: string | null;
}

export interface HoldingValuation {
  quantity: number;
  symbol: string;
  price: number;
  currency: string | null;
  total: number;
  dataSource: AssetAnalysis["dataSource"];
  freshness: AssetAnalysis["freshness"];
  timestamp: string | null;
  available: boolean;
  reason: "simulated" | "unavailable" | null;
}

interface ConceptEntry {
  patterns: RegExp[];
  he: string;
  en: string;
}

const CONCEPTS: ConceptEntry[] = [
  {
    patterns: [/קרן\s+נאמנות/i, /mutual\s+fund/i],
    he: "קרן נאמנות היא כלי השקעה שמרכז כסף ממשקיעים רבים ומנוהל לפי מדיניות מוגדרת. הקרן קונה סל של ניירות ערך, והמשקיע מחזיק יחידות בקרן ולא את הנכסים ישירות. לפני השקעה בודקים בין היתר מדיניות השקעה, רמת סיכון, דמי ניהול, ביצועי עבר ונזילות. ביצועי עבר אינם מבטיחים תשואה עתידית.",
    en: "A mutual fund pools money from many investors and invests it under a defined policy. Investors own units in the fund rather than the underlying securities directly. Key checks include its mandate, risk level, fees, past performance, and liquidity. Past performance does not guarantee future returns.",
  },
  {
    patterns: [/\betf\b/i, /קרן\s+סל/i, /תעודת\s+סל/i],
    he: "ETF (קרן סל) היא קרן שעוקבת בדרך כלל אחרי מדד או סל נכסים ונסחרת בבורסה לאורך יום המסחר כמו מניה. היא יכולה לספק פיזור בעסקה אחת, אך כרוכה בסיכון, דמי ניהול ולעיתים פער עקיבה.",
    en: "An ETF is a fund that usually tracks an index or basket of assets and trades on an exchange throughout the day like a stock. It can provide diversification in one holding, but it still has risk, fees, and possible tracking error.",
  },
  {
    patterns: [/אג["״']?ח|אגרת\s+חוב/i, /\bbond(?:s)?\b/i],
    he: "איגרת חוב היא הלוואה למשלה, חברה או גוף אחר. המנפיק מתחייב לתשלומי ריבית ולהחזר הקרן לפי התנאים, אך קיימים סיכוני אשראי, ריבית, אינפלציה ונזילות.",
    en: "A bond is a loan to a government, company, or other issuer. The issuer promises interest and principal payments under stated terms, but bonds carry credit, interest-rate, inflation, and liquidity risk.",
  },
  {
    patterns: [/ריבית\s+דריבית/i, /compound(?:ing|ed)?\s+interest/i],
    he: "ריבית דריבית היא צמיחה שבה התשואה מצטברת גם על הסכום המקורי וגם על תשואות קודמות. הזמן וקצב התשואה משפיעים מאוד, אבל תשואה בשוק אינה מובטחת.",
    en: "Compound interest is growth earned on both the original amount and prior gains. Time and the rate of return matter greatly, but market returns are not guaranteed.",
  },
  {
    patterns: [/שווי\s+שוק/i, /market\s+cap(?:italization)?/i],
    he: "שווי שוק של חברה הוא מחיר מניה כפול מספר המניות הקיימות. זהו מדד לגודל החברה בבורסה, לא המחיר ההוגן שלה ולא שווי הפעילות ללא התאמות.",
    en: "Market capitalization is share price multiplied by shares outstanding. It measures a public company's equity-market size, not necessarily fair value or enterprise value.",
  },
  {
    patterns: [/דיבידנד/i, /\bdividend(?:s)?\b/i],
    he: "דיבידנד הוא חלוקת מזומן או נכסים מחברה לבעלי המניות. הוא אינו מובטח, יכול להשתנות, ומחיר המניה בדרך כלל מתואם כלפי מטה ביום האקס.",
    en: "A dividend is a distribution of cash or assets from a company to shareholders. It is not guaranteed, can change, and the share price normally adjusts on the ex-dividend date.",
  },
  {
    patterns: [/מכפיל\s+רווח/i, /\bp\/?e\b|price[ -]to[ -]earnings/i],
    he: "מכפיל רווח (P/E) הוא מחיר המניה חלקי הרווח למניה. הוא מאפשר השוואה בסיסית בין חברות, אך מושפע מצמיחה צפויה, איכות הרווח והענף, ואינו מספיק לבדו להחלטה.",
    en: "The P/E ratio is share price divided by earnings per share. It supports basic comparisons, but depends on expected growth, earnings quality, and industry and is not sufficient by itself.",
  },
  {
    patterns: [/דמי\s+ניהול|יחס\s+הוצאות/i, /expense\s+ratio|management\s+fee/i],
    he: "דמי ניהול הם העלות השנתית שקרן גובה מנכסיה. גם פער קטן מצטבר לאורך זמן, ולכן משווים את העלות לצד מדיניות הקרן, עקיבה, סיכון ושירות.",
    en: "An expense ratio is the annual cost a fund deducts from its assets. Small differences compound over time, so compare cost together with mandate, tracking, risk, and service.",
  },
  {
    patterns: [/תנודתיות/i, /volatil(?:ity|e)/i],
    he: "תנודתיות מתארת את גודל ותדירות שינויי המחיר. תנודתיות גבוהה פירושה טווח תוצאות רחב יותר, לא בהכרח תשואה גבוהה יותר.",
    en: "Volatility describes the size and frequency of price changes. Higher volatility means a wider range of outcomes, not necessarily a higher return.",
  },
  {
    patterns: [/פיזור/i, /diversif(?:ication|y)/i],
    he: "פיזור מפחית תלות בנכס, חברה או שוק יחיד. הוא אינו מונע הפסדים, אך יכול לצמצם את הפגיעה מאירוע נקודתי.",
    en: "Diversification reduces dependence on one asset, company, or market. It cannot prevent losses, but it can limit the impact of a single event.",
  },
];

export function explainFinancialConcept(message: string, language: ConversationLanguage): string | null {
  const concept = CONCEPTS.find((entry) => entry.patterns.some((pattern) => pattern.test(message)));
  if (!concept) return null;
  return language === "en" ? concept.en : concept.he;
}

const HOLDING_PATTERNS = [
  /(?:יש\s+לי|מחזיק(?:ה)?(?:\s+ב)?)\s*([\d,.]+)\s*(?:מניות|יחידות)(?:\s*(?:של|ב)[-\s]*([A-Z][A-Z0-9.-]{0,9}))?/i,
  /([\d,.]+)\s*(?:מניות|יחידות)\s*(?:של|ב)?\s*([A-Z][A-Z0-9.-]{0,9})/i,
  /(?:i\s+(?:have|own|hold)|my)\s*([\d,.]+)\s*(?:shares?|units?)\s*(?:of|in)?\s*([A-Z][A-Z0-9.-]{0,9})?/i,
  /([\d,.]+)\s*(?:shares?|units?)\s*(?:of|in)?\s*([A-Z][A-Z0-9.-]{0,9})/i,
];

export function parseHoldingRequest(message: string): HoldingRequest | null {
  for (const pattern of HOLDING_PATTERNS) {
    const match = message.match(pattern);
    if (!match) continue;
    const quantity = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000_000) return null;
    return { quantity, symbol: match[2]?.toUpperCase() ?? null };
  }
  return null;
}

export function valueHolding(request: HoldingRequest, asset: AssetAnalysis | undefined): HoldingValuation {
  const symbol = request.symbol ?? asset?.symbol ?? "";
  if (!asset) return { quantity: request.quantity, symbol, price: 0, currency: null, total: 0, dataSource: "mock", freshness: "unavailable", timestamp: null, available: false, reason: "unavailable" };
  if (asset.isMock || asset.freshness === "simulated") return { quantity: request.quantity, symbol: asset.symbol, price: asset.price, currency: asset.currency ?? null, total: 0, dataSource: asset.dataSource, freshness: asset.freshness, timestamp: asset.timestamp ?? null, available: false, reason: "simulated" };
  return { quantity: request.quantity, symbol: asset.symbol, price: asset.price, currency: asset.currency ?? null, total: request.quantity * asset.price, dataSource: asset.dataSource, freshness: asset.freshness, timestamp: asset.timestamp ?? null, available: true, reason: null };
}

export interface PurchasePowerRequest {
  amount: number;
  sourceCurrency: "ILS" | "USD" | "EUR" | "GBP";
  symbol: string;
}

export interface PurchasePowerResult extends PurchasePowerRequest {
  available: boolean;
  assetPrice: number | null;
  assetCurrency: string | null;
  fxSymbol: string | null;
  fxRate: number | null;
  convertedBudget: number | null;
  wholeShares: number | null;
  residualAssetCurrency: number | null;
  residualSourceCurrency: number | null;
  asset: AssetAnalysis | null;
  fx: AssetAnalysis | null;
  reason: "market_unavailable" | "unsupported_currency_pair" | null;
}

const PURCHASE_PATTERNS = [
  /(?:יש\s+לי|עם)\s*([\d,.]+)\s*(אלף|מיליון)?\s*(שקל|ש["״']?ח|ILS|דולר|USD|יורו|EUR|פאונד|GBP).*?(?:כמה|how many).*?(?:מניות|יחידות|shares?|units?).*?([A-Z][A-Z0-9.-]{0,9})/i,
  /(?:i\s+have|with)\s*([\d,.]+)\s*(thousand|million)?\s*(ILS|NIS|USD|dollars?|EUR|euros?|GBP|pounds?).*?(?:how many).*?(?:shares?|units?).*?([A-Z][A-Z0-9.-]{0,9})/i,
];

function currencyCode(raw: string): PurchasePowerRequest["sourceCurrency"] | null {
  if (/שקל|ש["״']?ח|ILS|NIS/i.test(raw)) return "ILS";
  if (/דולר|USD|dollars?/i.test(raw)) return "USD";
  if (/יורו|EUR|euros?/i.test(raw)) return "EUR";
  if (/פאונד|GBP|pounds?/i.test(raw)) return "GBP";
  return null;
}

export function parsePurchasePowerRequest(message: string): PurchasePowerRequest | null {
  for (const pattern of PURCHASE_PATTERNS) {
    const match = message.match(pattern);
    if (!match) continue;
    const multiplier = /אלף|thousand/i.test(match[2] ?? "") ? 1_000 : /מיליון|million/i.test(match[2] ?? "") ? 1_000_000 : 1;
    const amount = Number(match[1].replace(/,/g, "")) * multiplier;
    const sourceCurrency = currencyCode(match[3]);
    if (!sourceCurrency || !Number.isFinite(amount) || amount <= 0) return null;
    return { amount, sourceCurrency, symbol: match[4].toUpperCase() };
  }
  return null;
}

export function fxSymbolFor(source: string, target: string): { symbol: string; divide: boolean } | null {
  if (source === target) return { symbol: "", divide: false };
  if (target === "USD" && ["ILS", "EUR", "GBP"].includes(source)) return { symbol: `USD${source}=X`, divide: true };
  if (source === "USD" && ["ILS", "EUR", "GBP"].includes(target)) return { symbol: `USD${target}=X`, divide: false };
  return null;
}

export function calculatePurchasePower(request: PurchasePowerRequest, asset: AssetAnalysis | undefined, fx: AssetAnalysis | undefined): PurchasePowerResult {
  const target = asset?.currency ?? null;
  const pair = target ? fxSymbolFor(request.sourceCurrency, target) : null;
  const realAsset = asset && !asset.isMock && asset.freshness !== "simulated";
  const needsFx = request.sourceCurrency !== target;
  const realFx = !needsFx || (fx && !fx.isMock && fx.freshness !== "simulated" && fx.price > 0);
  if (!realAsset || !pair || !realFx) return { ...request, available: false, assetPrice: asset?.price ?? null, assetCurrency: target, fxSymbol: pair?.symbol ?? null, fxRate: fx?.price ?? null, convertedBudget: null, wholeShares: null, residualAssetCurrency: null, residualSourceCurrency: null, asset: asset ?? null, fx: fx ?? null, reason: pair ? "market_unavailable" : "unsupported_currency_pair" };
  const convertedBudget = needsFx ? (pair.divide ? request.amount / fx!.price : request.amount * fx!.price) : request.amount;
  const wholeShares = Math.floor(convertedBudget / asset!.price);
  const residualAssetCurrency = convertedBudget - wholeShares * asset!.price;
  const residualSourceCurrency = needsFx ? (pair.divide ? residualAssetCurrency * fx!.price : residualAssetCurrency / fx!.price) : residualAssetCurrency;
  return { ...request, available: true, assetPrice: asset!.price, assetCurrency: target, fxSymbol: pair.symbol || null, fxRate: needsFx ? fx!.price : 1, convertedBudget, wholeShares, residualAssetCurrency, residualSourceCurrency, asset: asset!, fx: needsFx ? fx! : null, reason: null };
}
