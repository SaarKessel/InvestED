/**
 * Risk desk: real risk numbers for tickers, computed from about a year of daily closes served by the
 * existing market-data layer (Yahoo Finance through /api/market-quote). Every number comes from
 * riskMetrics. Nothing is invented: a ticker that cannot be served is reported as unavailable.
 */
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import type { MarketAsset } from "@/types";
import type { Bi, DataState } from "@/lib/intelligence/envelope";
import { lookupSymbol } from "@/lib/copilot/symbolDesk";
import { cleanCloses, computeRisk, type RiskMetrics } from "./riskMetrics";

export const BENCHMARK = "SPY";
const BENCHMARK_NAME: Bi = { en: "SPY, an ETF that tracks the S&P 500", he: "SPY, קרן סל שעוקבת אחרי S&P 500" };
export const MAX_TICKERS = 3;

export type RiskItem =
  | { symbol: string; unavailable: true }
  | { symbol: string; unavailable?: false; name: string; state: DataState; freshness: string; asOf: string | null; metrics: RiskMetrics; benchmarkOk: boolean };
export interface RiskDeskResult { items: RiskItem[]; benchmark: string }
export type AssetLoader = (symbol: string) => Promise<MarketAsset | null>;

const STOP = new Set(["AI", "ETF", "USD", "EUR", "ILS", "VS", "THE", "AND", "FOR", "OF", "IS", "IT", "ME", "MY", "A", "I", "PE", "ROI", "APR", "APY", "GDP", "CPI", "S", "P"]);
const WORDS = /(?:risk|volatil\w*|drawdown|beta|riskier|סיכון|סיכונים|תנודתיות|תנודתי|ירידה מקסימלית|בטא)/i;

/** Uppercase tickers in the text, in order, at most MAX_TICKERS. */
export function tickersIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(?<![A-Za-z\u0590-\u05FF])\$?([A-Z]{1,5}(?:[.-][A-Z])?)(?![A-Za-z])/g)) {
    const s = m[1];
    if (!STOP.has(s) && !out.includes(s)) out.push(s);
    if (out.length >= MAX_TICKERS) break;
  }
  return out;
}

/** "volatility of AAPL", "risk of VOO and SPY", "סיכון של AAPL": a risk word plus at least one ticker. */
export function parseRiskRequest(text: string): string[] | null {
  if (!WORDS.test(text)) return null;
  const t = tickersIn(text);
  return t.length ? t : null;
}

const defaultLoader: AssetLoader = (s) => fetchMarketAssetBySymbol(s, "1y", undefined, { allowSimulated: false });

function stateOf(a: MarketAsset): DataState { return a.freshness === "current" ? "live" : "cached"; }

export async function loadRisk(symbols: string[], load: AssetLoader = defaultLoader): Promise<RiskDeskResult> {
  const wanted = symbols.slice(0, MAX_TICKERS);
  const [bench, ...assets] = await Promise.all([BENCHMARK, ...wanted].map((s) => load(s).catch(() => null)));
  const usable = (a: MarketAsset | null): a is MarketAsset => !!a && a.isMock !== true && a.dataSource !== "mock" && Array.isArray(a.history) && a.history.length > 0;
  const benchCloses = usable(bench) ? cleanCloses(bench.history) : undefined;
  const items: RiskItem[] = wanted.map((symbol, i) => {
    const a = assets[i];
    if (!usable(a)) return { symbol, unavailable: true };
    const closes = cleanCloses(a.history);
    if (closes.length < 2) return { symbol, unavailable: true };
    const metrics = computeRisk(closes, symbol === BENCHMARK ? undefined : benchCloses);
    if (symbol === BENCHMARK) metrics.missing.beta = undefined;
    return { symbol: a.symbol || symbol, name: a.name || symbol, state: stateOf(a), freshness: a.freshness ?? "unavailable", asOf: metrics.to, metrics, benchmarkOk: !!benchCloses };
  });
  return { items, benchmark: BENCHMARK };
}

const iso = (t: string) => `\u2066${t}\u2069`;
const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
const sgn = (x: number, d = 1) => `${x < 0 ? "-" : x > 0 ? "+" : ""}${Math.abs(x * 100).toFixed(d)}%`;

const STATE_TEXT: Record<DataState, Bi> = {
  live: { en: "latest provider data (a few minutes old at most)", he: "הנתונים העדכניים ביותר מהספק (בני דקות ספורות לכל היותר)" },
  cached: { en: "cached or older provider data", he: "נתוני ספק ממטמון או ישנים יותר" },
  fallback: { en: "fallback data", he: "נתוני גיבוי" }, static: { en: "stored list", he: "רשימה שמורה" }, calculated: { en: "calculated", he: "מחושב" },
};

export function formatRisk(r: RiskDeskResult, lang: "en" | "he"): string {
  const he = lang === "he";
  const blocks = r.items.map((it) => {
    if (it.unavailable) return he ? `${iso(it.symbol)}: אין לי כרגע נתוני מחיר אמיתיים לסימול הזה, אז אני לא מחשב לו סיכון. לא אנחש.` : `${it.symbol}: I have no real price data for this ticker right now, so I do not calculate its risk. I will not guess.`;
    const m = it.metrics;
    const head = he
      ? `${iso(it.symbol)} (${it.name}) - ${m.days} ימי מסחר, ${m.from} עד ${m.to}. מצב: ${STATE_TEXT[it.state].he}.`
      : `${it.symbol} (${it.name}) - ${m.days} trading days, ${m.from} to ${m.to}. State: ${STATE_TEXT[it.state].en}.`;
    const lines: string[] = [];
    lines.push(m.volatility !== null
      ? he ? `תנודתיות: ${iso(pct(m.volatility))} בשנה (סטיית התקן של השינויים היומיים, מוכפלת בשורש 252).` : `Volatility: ${pct(m.volatility)} a year (standard deviation of daily moves, times the square root of 252).`
      : he ? "תנודתיות: אין מספיק ימים לחישוב (צריך לפחות 30)." : "Volatility: not enough days to calculate (needs at least 30).");
    lines.push(m.maxDrawdown
      ? he ? `ירידה מקסימלית: ${iso(sgn(m.maxDrawdown.value))} (משיא ב-${m.maxDrawdown.peakDate} עד שפל ב-${m.maxDrawdown.troughDate}).` : `Worst drop: ${sgn(m.maxDrawdown.value)} (from a high on ${m.maxDrawdown.peakDate} to a low on ${m.maxDrawdown.troughDate}).`
      : he ? "ירידה מקסימלית: אין מספיק ימים לחישוב." : "Worst drop: not enough days to calculate.");
    if (it.symbol === BENCHMARK) lines.push(he ? "בטא: זה מדד הייחוס עצמו, לכן הבטא שלו היא 1 מעצם ההגדרה." : "Beta: this is the benchmark itself, so its beta is 1 by definition.");
    else if (m.beta !== null) lines.push(he ? `בטא מול ${BENCHMARK_NAME.he}: ${iso(m.beta.toFixed(2))} על פני ${m.betaDays} ימים משותפים. 1 אומר תנועה דומה לשוק, מעל 1 תנודתי ממנו, מתחת ל-1 רגוע ממנו.` : `Beta against ${BENCHMARK_NAME.en}: ${m.beta.toFixed(2)} over ${m.betaDays} shared days. 1 means it moved like the market, above 1 more than the market, below 1 less.`);
    else lines.push(he ? `בטא: לא חושבה (${m.missing.beta === "too_few_overlap" ? "פחות מ-60 ימים משותפים עם המדד" : m.missing.beta === "flat_benchmark" ? "מדד הייחוס לא זז" : "אין נתוני מדד ייחוס כרגע"}).` : `Beta: not calculated (${m.missing.beta === "too_few_overlap" ? "fewer than 60 shared days with the benchmark" : m.missing.beta === "flat_benchmark" ? "the benchmark did not move" : "no benchmark data right now"}).`);
    if (m.periodReturn !== null) lines.push(he ? `שינוי בתקופה: ${iso(sgn(m.periodReturn))}.` : `Change over the period: ${sgn(m.periodReturn)}.`);
    return `${head}\n${lines.join("\n")}`;
  });
  const foot = he
    ? `מקור: Yahoo Finance דרך שרת האתר, מחירי סגירה יומיים של כשנה, עיכוב אפשרי. החישוב נעשה בקוד קבוע, לא במודל. זה מתאר מה קרה בעבר, לא מה יקרה, ואינו ייעוץ השקעות.`
    : `Source: Yahoo Finance through the site's server, about a year of daily closes, possibly delayed. Calculated by fixed code, not by a model. This describes what happened, not what will happen, and is not investment advice.`;
  return `${blocks.join("\n\n")}\n\n${foot}`;
}

/** Keeps only tickers that exist in the stored symbol list, so "Roth IRA" or "NASDAQ" never trigger a price lookup. */
export async function knownTickers(list: string[]): Promise<string[]> {
  const hits = await Promise.all(list.map(async (t) => ((await lookupSymbol(t)) ? t : null)));
  return hits.filter((t): t is string => !!t);
}
