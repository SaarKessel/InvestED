// ---------------------------------------------------------------------------
// InvestED - /api/dividends (read-only)
//
// Dividend history of one stock or ETF from Yahoo Finance's public chart endpoint (events=div).
// No key. Only real paid amounts are returned; nothing is filled in. In-process cache, 6 hours.
// Served through /api/system?fn=dividends (rewrite in vercel.json).
//
// Usage: GET /api/dividends?symbol=AAPL
// ---------------------------------------------------------------------------

import { createTtlCache } from "../market/cache.js";

interface Req { query?: Record<string, string | string[] | undefined> }
interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }

export interface DividendPayload { symbol: string; name: string; currency: string; price: number | null; priceAsOf: string | null; dividends: { date: string; amount: number }[] }

const cache = createTtlCache<DividendPayload>({ ttlMs: 6 * 60 * 60 * 1000 });
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
export const cleanSymbol = (raw: string): string | null => { const s = raw.trim().toUpperCase(); return /^[A-Z]{1,5}([.-][A-Z])?$/.test(s) ? s : null; };

/** Pure parser of Yahoo's chart JSON, exported for tests. Returns null when the shape is not what we expect. */
export function parseYahooDividends(json: unknown, symbol: string): DividendPayload | null {
  const result = (json as { chart?: { result?: unknown[] } })?.chart?.result?.[0] as
    | { meta?: Record<string, unknown>; events?: { dividends?: Record<string, { amount?: unknown; date?: unknown }> } } | undefined;
  if (!result?.meta) return null;
  const m = result.meta;
  const divs = Object.values(result.events?.dividends ?? {})
    .filter((d) => typeof d.amount === "number" && d.amount > 0 && typeof d.date === "number")
    .map((d) => ({ date: new Date((d.date as number) * 1000).toISOString().slice(0, 10), amount: d.amount as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const price = typeof m.regularMarketPrice === "number" && m.regularMarketPrice > 0 ? m.regularMarketPrice : null;
  const t = typeof m.regularMarketTime === "number" ? new Date(m.regularMarketTime * 1000).toISOString().slice(0, 10) : null;
  return { symbol, name: typeof m.longName === "string" ? m.longName : typeof m.shortName === "string" ? m.shortName : symbol, currency: typeof m.currency === "string" ? m.currency : "USD", price, priceAsOf: t, dividends: divs };
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
  const symbol = cleanSymbol(first(req.query?.symbol) ?? "");
  if (!symbol) { res.status(400).json({ error: "invalid_symbol" }); return; }
  const cached = cache.get(symbol);
  if (cached) { res.status(200).json({ data: cached, source: "yahoo_finance" }); return; }
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=10y&interval=1mo&events=div`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; InvestED educational app)", Accept: "application/json" } });
    if (r.status === 404) { res.status(404).json({ error: "unknown_symbol" }); return; }
    if (!r.ok) { res.status(502).json({ error: "upstream_unavailable" }); return; }
    const data = parseYahooDividends(await r.json(), symbol);
    if (!data) { res.status(502).json({ error: "unexpected_response" }); return; }
    cache.set(symbol, data);
    res.status(200).json({ data, source: "yahoo_finance" });
  } catch { res.status(502).json({ error: "upstream_unavailable" }); }
}
