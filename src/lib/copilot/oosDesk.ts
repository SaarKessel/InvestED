/**
 * Out-of-sample portfolio check in the chat: "does a portfolio optimized on past prices hold up on prices it never saw?"
 * Fires on an out-of-sample / overfitting / train-test question with 2 to 5 tickers. Real daily closes only, from the same
 * market-data layer the risk desk uses; a ticker with no real history makes the whole check unavailable, never estimated.
 * Educational simulation, not advice.
 */
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import type { MarketAsset } from "@/types";
import { cleanCloses, type Close } from "@/lib/risk/riskMetrics";
import { MAX_ASSETS, MIN_ASSETS, runOutOfSample, type OosOutcome } from "@/lib/portfolio/outOfSample";

export interface OosRequest { symbols: string[] }
export interface OosDeskResult { symbols: string[]; outcome: OosOutcome; unavailable: string[] }

const WORDS = /out[- ]of[- ]sample|overfit\w*|over-?fitting|train[\s/-]*(and|\/)?[\s-]*test|unseen data|hold up on (new|unseen|future) data|התאמת יתר|מחוץ למדגם|אימון ומבחן|נתונים שלא ראה/i;
const STOP = new Set(["AI", "ETF", "USD", "EUR", "ILS", "VS", "THE", "AND", "FOR", "OF", "IS", "IT", "ME", "MY", "A", "I", "PE", "ROI", "APR", "APY", "GDP", "CPI", "S", "P", "OOS", "TEST", "TRAIN", "ON", "IN", "TO", "DO", "DOES", "OR", "NOT"]);

export function parseOosRequest(text: string): OosRequest | null {
  if (text.length > 220 || !WORDS.test(text)) return null;
  const out: string[] = [];
  for (const m of text.matchAll(/(?<![A-Za-z\u0590-\u05FF])\$?([A-Z]{1,5}(?:[.-][A-Z])?)(?![A-Za-z])/g)) {
    if (!STOP.has(m[1]) && !out.includes(m[1])) out.push(m[1]);
    if (out.length > MAX_ASSETS) break;
  }
  return out.length >= 1 ? { symbols: out } : null;
}

type Loader = (symbol: string) => Promise<MarketAsset | null>;
const defaultLoader: Loader = (s) => fetchMarketAssetBySymbol(s, "10y", undefined, { allowSimulated: false });

const usable = (a: MarketAsset | null): a is MarketAsset => !!a && a.isMock !== true && a.dataSource !== "mock" && Array.isArray(a.history) && a.history.length > 0;

export async function loadOos(req: OosRequest, load: Loader = defaultLoader): Promise<OosDeskResult> {
  const symbols = req.symbols.slice(0, MAX_ASSETS + 1);
  if (symbols.length < MIN_ASSETS || symbols.length > MAX_ASSETS) return { symbols, outcome: { ok: false, reason: symbols.length < MIN_ASSETS ? "too_few_assets" : "too_many_assets" }, unavailable: [] };
  const [spyA, ...assets] = await Promise.all(["SPY", ...symbols].map((s) => load(s).catch(() => null)));
  const unavailable = symbols.filter((_, i) => !usable(assets[i]));
  if (unavailable.length > 0) return { symbols, outcome: { ok: false, reason: "too_little_history" }, unavailable };
  const closes: Close[][] = assets.map((a) => cleanCloses((a as MarketAsset).history));
  const spy = usable(spyA) ? cleanCloses(spyA.history) : null;
  return { symbols, outcome: runOutOfSample(symbols, closes, spy), unavailable: [] };
}
