/**
 * Dividends in chat: what a stock or ETF paid (history) and what it may pay next (estimate).
 * History is the real list of paid amounts from Yahoo Finance's public chart data, through the site's own /api/dividends.
 * The forward part is NOT a declared payout: no free keyless source gives declared amounts, so it is a labeled estimate
 * (last paid amount x observed payment frequency) and it is withheld when the payments look like they stopped.
 * Nothing is invented; a symbol with no dividend data comes back as "none found" or unavailable.
 */
export interface DividendRequest { symbol: string; shares: number | null; focus: "history" | "expected" }
export interface DividendPayment { date: string; amount: number }
export interface DividendEstimate { perYear: number; lastAmount: number; annualPerShare: number; nextDateApprox: string | null; yieldPct: number | null }
export interface DividendResult extends DividendRequest {
  name: string; currency: string; price: number | null; priceAsOf: string | null;
  payments: DividendPayment[]; recent: DividendPayment[]; trailing12mPerShare: number; trailing12mCount: number;
  trailingYieldPct: number | null; estimate: DividendEstimate | null; stopped: boolean; asOf: string;
}

const NAMES: [RegExp, string][] = [
  [/\bapple\b|אפל/i, "AAPL"], [/\bmicrosoft\b|מיקרוסופט/i, "MSFT"], [/\bcoca[- ]?cola\b|קוקה[- ]?קולה/i, "KO"], [/\bjohnson\s*(?:&|and)\s*johnson\b|ג'?ונסון/i, "JNJ"],
  [/\bpepsi(?:co)?\b|פפסי/i, "PEP"], [/\bexxon\b|אקסון/i, "XOM"], [/\bchevron\b|שברון/i, "CVX"], [/\bmcdonald'?s\b|מקדונלד/i, "MCD"], [/\bverizon\b|וריזון/i, "VZ"],
  [/\bprocter\b|פרוקטר/i, "PG"], [/\bwalmart\b|וולמארט/i, "WMT"], [/\bjpmorgan\b|ג'?יי ?פי ?מורגן/i, "JPM"], [/\bnvidia\b|אנבידיה|אנבדיה/i, "NVDA"], [/\bintel\b|אינטל/i, "INTC"],
  [/\bat&t\b/i, "T"], [/\bdisney\b|דיסני/i, "DIS"], [/\bvisa\b|ויזה/i, "V"], [/\bpfizer\b|פייזר/i, "PFE"], [/\bcisco\b|סיסקו/i, "CSCO"], [/\bs&p ?500\b|אס ?אנד ?פי/i, "VOO"],
];
const NOT_TICKERS = new Set(["ETF", "ETFS", "USD", "ILS", "NIS", "EUR", "SEC", "USA", "THE", "AND", "FOR", "HOW", "MUCH", "DID", "PAY", "PAID", "DO", "I", "A", "AI", "FAQ", "IRA", "GDP", "CPI", "TTM", "DRIP", "YIELD", "EPS", "IPO", "ATM", "AM", "PM", "IS", "OF", "TO", "IN", "ON", "OR", "MY", "ME", "WILL", "GET", "CAN", "WHAT", "WHEN", "ARE", "HAS", "ANY"]);
const DIV_CUE = /dividends?|payouts?|דיבידנד|דיבידנדים|דיביד/i;
const EXPECT_CUE = /expect|will |next|forecast|upcoming|going to|receive|per year|annual|yield|אמור|צפוי|יקבל|אקבל|לקבל|תשואת|הקרוב|הבא/i;

export function parseDividendRequest(text: string): DividendRequest | null {
  if (text.length > 160 || !DIV_CUE.test(text)) return null;
  let symbol: string | null = null;
  for (const [re, s] of NAMES) if (re.test(text)) { symbol = s; break; }
  if (!symbol) {
    const caps = (text.match(/(?<![A-Za-z])[A-Z]{1,5}(?![A-Za-z])/g) ?? []).find((w) => !NOT_TICKERS.has(w) && w.length >= 2);
    symbol = caps ?? null;
  }
  if (!symbol) return null;
  const sh = /(\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:\.\d+)?|\d[\d,]*(?:\.\d+)?)\s*(?:[A-Z]{1,5}\s+)?(?:shares?|stocks?|units?|מניות|מניה|יחידות)/i.exec(text) ?? /(?:מניות|מניה)\s*(?:של)?\s*\d/.exec(text) ;
  const shares = sh && sh[1] ? Number(/^\d+,\d{1,2}$/.test(sh[1]) ? sh[1].replace(",", ".") : sh[1].replace(/[,\u00a0\u202f ]/g, "")) : null;
  const focus = EXPECT_CUE.test(text) ? "expected" : "history";
  return { symbol, shares: shares && shares > 0 && Number.isFinite(shares) ? shares : null, focus };
}

const DAY = 86400000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Pure: turn the payment list and price into the card data. `now` is injected so tests are deterministic. */
export function summarizeDividends(req: DividendRequest, d: { name: string; currency: string; price: number | null; priceAsOf: string | null; dividends: DividendPayment[] }, now: Date): DividendResult {
  const payments = [...d.dividends].sort((a, b) => a.date.localeCompare(b.date));
  const nowMs = now.getTime();
  const t12 = payments.filter((p) => nowMs - Date.parse(p.date) <= 365 * DAY && Date.parse(p.date) <= nowMs);
  const trailing = r4(t12.reduce((s, p) => s + p.amount, 0));
  const trailingYieldPct = d.price && trailing > 0 ? Math.round((trailing / d.price) * 1e4) / 100 : null;
  let estimate: DividendEstimate | null = null;
  let stopped = false;
  if (payments.length >= 2) {
    const last = payments[payments.length - 1];
    const lastMs = Date.parse(last.date);
    const window = payments.slice(-5);
    const gaps = window.slice(1).map((p, i) => (Date.parse(p.date) - Date.parse(window[i].date)) / DAY).sort((a, b) => a - b);
    const gap = gaps[Math.floor(gaps.length / 2)];
    const perYear = gap < 45 ? 12 : gap < 135 ? 4 : gap < 250 ? 2 : 1;
    const interval = 365 / perYear;
    if (nowMs - lastMs > interval * 1.6 * DAY) stopped = true;
    else {
      const annual = r4(last.amount * perYear);
      let next = lastMs + gap * DAY;
      while (next < nowMs) next += gap * DAY;
      estimate = { perYear, lastAmount: last.amount, annualPerShare: annual, nextDateApprox: iso(next), yieldPct: d.price ? Math.round((annual / d.price) * 1e4) / 100 : null };
    }
  } else if (payments.length === 1 && nowMs - Date.parse(payments[0].date) > 400 * DAY) stopped = true;
  return { ...req, name: d.name, currency: d.currency, price: d.price, priceAsOf: d.priceAsOf, payments, recent: payments.slice(-8).reverse(), trailing12mPerShare: trailing, trailing12mCount: t12.length, trailingYieldPct, estimate, stopped, asOf: iso(nowMs) };
}

export async function loadDividends(req: DividendRequest, fetcher: typeof fetch = fetch, now: Date = new Date()): Promise<DividendResult | null> {
  try {
    const r = await fetcher(`/api/dividends?symbol=${encodeURIComponent(req.symbol)}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { data?: { name?: unknown; currency?: unknown; price?: unknown; priceAsOf?: unknown; dividends?: unknown } };
    const d = j.data;
    if (!d || !Array.isArray(d.dividends)) return null;
    const dividends = (d.dividends as DividendPayment[]).filter((p) => p && typeof p.date === "string" && typeof p.amount === "number" && p.amount > 0 && Number.isFinite(p.amount));
    return summarizeDividends(req, { name: typeof d.name === "string" ? d.name : req.symbol, currency: typeof d.currency === "string" ? d.currency : "USD", price: typeof d.price === "number" ? d.price : null, priceAsOf: typeof d.priceAsOf === "string" ? d.priceAsOf : null, dividends }, now);
  } catch { return null; }
}
