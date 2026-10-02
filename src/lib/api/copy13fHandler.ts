// InvestED - /api/copy-13f (read-only): "what if you had copied this fund's latest 13F".
// Holdings come from SEC EDGAR (13F-HR), tickers from SEC's own company_tickers.json (exact name match only), prices from
// Yahoo daily closes. Anything that cannot be matched or priced is returned as such, never filled in.
// Usage: GET /api/copy-13f?cik=1067983
import { createTtlCache } from "../market/cache.js";
import { cleanCik, fetchLatest13F, No13FError, SecUnavailableError, ThirteenFParseError, type SecFetch } from "../sec/thirteenF.js";
import { buildTickerIndex, computeCopy, matchHoldings, type Close } from "../sec/copyFund.js";

interface Req { query?: Record<string, string | string[] | undefined> }
interface Res { setHeader(n: string, v: string): void; status(c: number): { json(b: unknown): void } }

const USER_AGENT = process.env.SEC_USER_AGENT || "InvestED educational app saar.kessel@gmail.com";
const YAHOO_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TOP_N = 15;
const cache = createTtlCache<unknown>({ ttlMs: 60 * 60 * 1000 });
function parseCloses(body: unknown): Close[] | null {
  const r = (body as { chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] } })?.chart?.result?.[0];
  const ts = r?.timestamp, cl = r?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(ts) || !Array.isArray(cl) || ts.length !== cl.length) return null;
  const out: Close[] = [];
  ts.forEach((t, i) => { const c = cl[i]; if (typeof c === "number" && Number.isFinite(c) && c > 0) out.push({ date: new Date(t * 1000).toISOString().slice(0, 10), close: c }); });
  return out.length ? out : null;
}
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const fetchSec: SecFetch = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json, text/xml, */*" } });
  return { ok: r.ok, status: r.status, text: () => r.text() };
};

async function yahooCloses(symbol: string, fromIso: string): Promise<Close[] | null> {
  try {
    const p1 = Math.floor(Date.parse(`${fromIso}T00:00:00Z`) / 1000) - 10 * 86400;
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${p1}&period2=${Math.floor(Date.now() / 1000) + 86400}&interval=1d`, { headers: { "User-Agent": YAHOO_UA }, signal: AbortSignal.timeout(8000) });
    return r.ok ? parseCloses(await r.json()) : null;
  } catch { return null; }
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
  const cik = cleanCik(first(req.query?.cik) ?? "");
  if (!cik) return res.status(400).json({ error: "invalid_cik" });
  const hit = cache.get(cik);
  if (hit) return res.status(200).json({ result: hit });
  try {
    const filing = await fetchLatest13F(cik, fetchSec, { topN: TOP_N });
    const tr = await fetchSec("https://www.sec.gov/files/company_tickers.json");
    if (!tr.ok) return res.status(503).json({ error: "sec_unavailable" });
    const idx = buildTickerIndex(JSON.parse(await tr.text()));
    const { matched, unmatched } = matchHoldings(filing.holdings, idx);
    const today = new Date().toISOString().slice(0, 10);
    const [spy, ...rest] = await Promise.all([yahooCloses("SPY", filing.reportDate), ...matched.map((m) => yahooCloses(m.ticker, filing.reportDate))]);
    const closes: Record<string, Close[] | null> = {};
    matched.forEach((m, i) => { closes[m.ticker] = rest[i]; });
    const unmatchedValue = unmatched.reduce((s, u) => s + u.valueUsd, 0);
    const copy = computeCopy(matched, unmatchedValue, closes, spy, filing.filingDate, filing.reportDate, today);
    const result = { filerName: filing.managerName, reportDate: filing.reportDate, filingDate: filing.filingDate, sourceUrl: filing.sourceUrl, topCount: filing.holdings.length, matched, unmatched, copy, today };
    cache.set(cik, result);
    return res.status(200).json({ result });
  } catch (e) {
    if (e instanceof No13FError) return res.status(404).json({ error: "no_13f_found" });
    if (e instanceof SecUnavailableError) return res.status(503).json({ error: "sec_unavailable" });
    if (e instanceof ThirteenFParseError) return res.status(502).json({ error: "filing_unreadable" });
    return res.status(500).json({ error: "unknown_error" });
  }
}
