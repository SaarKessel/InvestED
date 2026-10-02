// ---------------------------------------------------------------------------
// InvestED - /api/sec-13f (read-only)
//
// Latest 13F-HR holdings of an institutional manager, straight from SEC
// EDGAR (free, official). No API key. SEC requires a descriptive
// User-Agent WITH a contact address (requests without one get HTTP 403);
// set SEC_USER_AGENT in the environment to override the
// default. Results are cached in-process for 6 hours.
//
// Usage: GET /api/sec-13f?cik=1067983&top=25
// ---------------------------------------------------------------------------

import { createTtlCache } from "../src/lib/market/cache.js";
import {
  cleanCik,
  fetchLatest13F,
  No13FError,
  SecUnavailableError,
  ThirteenFParseError,
  type Latest13F,
  type SecFetch,
} from "../src/lib/sec/thirteenF.js";

interface Req {
  query?: Record<string, string | string[] | undefined>;
}
interface Res {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
}

const USER_AGENT = process.env.SEC_USER_AGENT || "InvestED educational app saar.kessel@gmail.com";
const cache = createTtlCache<Latest13F>({ ttlMs: 6 * 60 * 60 * 1000 });

const fetchSec: SecFetch = async (url) => {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json, text/xml, */*" } });
  return { ok: response.ok, status: response.status, text: () => response.text() };
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function handler(req: Req, res: Res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");

  const cik = cleanCik(first(req.query?.cik) ?? "");
  if (!cik) {
    res.status(400).json({ error: "invalid_cik" });
    return;
  }
  const top = Math.min(100, Math.max(1, Number(first(req.query?.top)) || 25));
  const key = `${cik}:${top}`;
  const cached = cache.get(key);
  if (cached) {
    res.status(200).json({ filing: cached, source: "sec_edgar" });
    return;
  }
  try {
    const filing = await fetchLatest13F(cik, fetchSec, { topN: top });
    cache.set(key, filing);
    res.status(200).json({ filing, source: "sec_edgar" });
  } catch (error) {
    if (error instanceof No13FError) res.status(404).json({ error: "no_13f_found" });
    else if (error instanceof SecUnavailableError) res.status(503).json({ error: "sec_unavailable" });
    else if (error instanceof ThirteenFParseError) res.status(502).json({ error: "filing_unreadable" });
    else res.status(500).json({ error: "unknown_error" });
  }
}
