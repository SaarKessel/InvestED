// InvestED - /api/closes (read-only): daily closes for one symbol from Yahoo's chart API, for the prediction ledger.
// Only real closes are returned; a failure returns an error and the caller shows "unavailable".
// Usage: GET /api/closes?symbol=AAPL&from=2026-09-01   (from is optional; default is the last 30 days)

interface Req { query?: Record<string, string | string[] | undefined> }
interface Res { setHeader(n: string, v: string): void; status(c: number): { json(b: unknown): void } }

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseCloses(body: unknown): { date: string; close: number }[] | null {
  const r = (body as { chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] } })?.chart?.result?.[0];
  const ts = r?.timestamp, cl = r?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(ts) || !Array.isArray(cl) || ts.length !== cl.length) return null;
  const out: { date: string; close: number }[] = [];
  ts.forEach((t, i) => {
    const c = cl[i];
    if (typeof c === "number" && Number.isFinite(c) && c > 0) out.push({ date: new Date(t * 1000).toISOString().slice(0, 10), close: Math.round(c * 10000) / 10000 });
  });
  return out.length ? out : null;
}

export default async function handler(req: Req, res: Res, fetchImpl: typeof fetch = fetch) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const symbol = (first(req.query?.symbol) ?? "").toUpperCase();
  if (!/^[A-Z0-9^][A-Z0-9.\-^=]{0,9}$/.test(symbol)) return res.status(400).json({ error: "invalid_symbol" });
  const fromRaw = first(req.query?.from);
  const now = Math.floor(Date.now() / 1000);
  let p1 = now - 30 * 86400;
  if (fromRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromRaw)) return res.status(400).json({ error: "invalid_from" });
    const t = Date.parse(`${fromRaw}T00:00:00Z`);
    if (!Number.isFinite(t) || t / 1000 > now) return res.status(400).json({ error: "invalid_from" });
    p1 = Math.floor(t / 1000) - 5 * 86400; // a few days earlier so a weekend start still finds the prior close
  }
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${p1}&period2=${now + 86400}&interval=1d&events=div`;
    const r = await fetchImpl(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    if (r.status === 404) return res.status(404).json({ error: "symbol_not_found" });
    if (!r.ok) return res.status(503).json({ error: "provider_unavailable" });
    const closes = parseCloses(await r.json());
    if (!closes) return res.status(502).json({ error: "no_closes" });
    return res.status(200).json({ symbol, closes, source: "yahoo_finance_chart", note: "Daily price closes, dividends not included." });
  } catch {
    return res.status(503).json({ error: "provider_unavailable" });
  }
}
