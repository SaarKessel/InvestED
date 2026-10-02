// ---------------------------------------------------------------------------
// InvestED - /api/sec-nport (read-only)
//
// Latest public N-PORT holdings of an ETF or fund, straight from SEC EDGAR
// (free, official, no key). Same User-Agent rule as /api/sec-13f.
// Fund list cached 24h, results 12h, in-process.
//
// Usage: GET /api/sec-nport?ticker=VOO&top=10
// ---------------------------------------------------------------------------

import { createTtlCache } from "../market/cache.js";
import { cleanTicker, fetchFundHoldings, NoNportError, NportParseError, type FundHoldings } from "../sec/nport.js";
import { SecUnavailableError, type SecFetch } from "../sec/thirteenF.js";

interface Req { query?: Record<string, string | string[] | undefined> }
interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }

const USER_AGENT = process.env.SEC_USER_AGENT || "InvestED educational app saar.kessel@gmail.com";
const resultCache = createTtlCache<FundHoldings>({ ttlMs: 12 * 60 * 60 * 1000 });
const mapCache = createTtlCache<unknown>({ ttlMs: 24 * 60 * 60 * 1000 });

const fetchSec: SecFetch = async (url) => {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json, text/xml, application/atom+xml, */*" } });
  return { ok: response.ok, status: response.status, text: () => response.text() };
};
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function handler(req: Req, res: Res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
  const ticker = cleanTicker(first(req.query?.ticker) ?? "");
  if (!ticker) { res.status(400).json({ error: "invalid_ticker" }); return; }
  const top = Math.min(50, Math.max(1, Number(first(req.query?.top)) || 10));
  const key = `${ticker}:${top}`;
  const cached = resultCache.get(key);
  if (cached) { res.status(200).json({ fund: cached, source: "sec_edgar" }); return; }
  try {
    let seriesMap = mapCache.get("mf");
    if (!seriesMap) {
      const r = await fetchSec("https://www.sec.gov/files/company_tickers_mf.json");
      if (!r.ok) throw new SecUnavailableError(`SEC returned HTTP ${r.status}`);
      seriesMap = JSON.parse(await r.text());
      mapCache.set("mf", seriesMap);
    }
    const fund = await fetchFundHoldings(ticker, fetchSec, { topN: top, seriesMap });
    resultCache.set(key, fund);
    res.status(200).json({ fund, source: "sec_edgar" });
  } catch (error) {
    if (error instanceof NoNportError) res.status(404).json({ error: "no_nport_found" });
    else if (error instanceof SecUnavailableError) res.status(503).json({ error: "sec_unavailable" });
    else if (error instanceof NportParseError) res.status(502).json({ error: "filing_unreadable" });
    else res.status(500).json({ error: "unknown_error" });
  }
}
