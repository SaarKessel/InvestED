/** Live ticker strip: when it shows, and which quotes it may show. Real quotes only, never filled in. */
export const TICKER_SYMBOLS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA"] as const;
export type TickerPhase = "open" | "after" | "closed";

interface EtParts { weekday: number; minutes: number; ymd: string }
export function easternParts(now: Date): EtParts {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(String(p.weekday));
  return { weekday, minutes: Number(p.hour) * 60 + Number(p.minute), ymd: `${p.year}-${p.month}-${p.day}` };
}
/** US regular session 9:30-16:00 ET, after-market until 20:00 ET, weekdays. Holidays are caught by the data check below. */
export function tickerPhase(now: Date): TickerPhase {
  const { weekday, minutes } = easternParts(now);
  if (weekday === 0 || weekday === 6) return "closed";
  if (minutes >= 9 * 60 + 30 && minutes < 16 * 60) return "open";
  if (minutes >= 16 * 60 && minutes < 20 * 60) return "after";
  return "closed";
}
export interface TickerQuote { symbol: string; price: number; changePercent: number; timestamp: string }
export function parseTickerQuotes(body: unknown): TickerQuote[] {
  const assets = (body as { assets?: unknown[] } | null)?.assets;
  if (!Array.isArray(assets)) return [];
  const out: TickerQuote[] = [];
  for (const a of assets as Record<string, unknown>[]) {
    if (a?.isMock === true || typeof a?.symbol !== "string" || typeof a.price !== "number" || typeof a.changePercent !== "number" || typeof a.timestamp !== "string") continue;
    out.push({ symbol: a.symbol, price: a.price, changePercent: a.changePercent, timestamp: a.timestamp });
  }
  return out;
}
/** The strip shows only inside the window AND when the quotes are from today's session (holidays and outages stay hidden). */
export function shouldShowTicker(now: Date, quotes: TickerQuote[], preview = false): boolean {
  if (quotes.length === 0) return false;
  if (preview) return true;
  const phase = tickerPhase(now);
  if (phase === "closed") return false;
  const newest = Math.max(...quotes.map((q) => Date.parse(q.timestamp)).filter(Number.isFinite));
  if (!Number.isFinite(newest)) return false;
  if (easternParts(new Date(newest)).ymd !== easternParts(now).ymd) return false;
  return phase === "after" || now.getTime() - newest < 30 * 60 * 1000;
}
export const newestTime = (quotes: TickerQuote[]): string => {
  const t = Math.max(...quotes.map((q) => Date.parse(q.timestamp)).filter(Number.isFinite));
  return Number.isFinite(t) ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(t)) : "";
};
