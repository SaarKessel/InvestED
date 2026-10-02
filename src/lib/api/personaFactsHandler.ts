// InvestED - /api/persona-facts (read-only): annual XBRL company facts for one US-listed ticker, from SEC EDGAR
// (official, free, no key). Usage: GET /api/persona-facts?symbol=AAPL. No match or no filings -> 404, never a guess.
import { createTtlCache } from "../market/cache.js";
import { parseCompanyFacts, type PersonaFacts } from "../research/personaLens.js";

interface Req { query?: Record<string, string | string[] | undefined> }
interface Res { setHeader(n: string, v: string): void; status(c: number): { json(b: unknown): void } }
const UA = process.env.SEC_USER_AGENT || "InvestED educational app saar.kessel@gmail.com";
const cache = createTtlCache<PersonaFacts>({ ttlMs: 6 * 60 * 60 * 1000 });
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function handler(req: Req, res: Res, fetchImpl: typeof fetch = fetch) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
  const symbol = (first(req.query?.symbol) ?? "").toUpperCase();
  if (!/^[A-Z]{1,5}([.-][A-Z])?$/.test(symbol)) return res.status(400).json({ error: "invalid_symbol" });
  const hit = cache.get(symbol);
  if (hit) return res.status(200).json({ facts: hit, source: "sec_edgar_companyfacts" });
  try {
    const get = (url: string) => fetchImpl(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(9000) });
    const tr = await get("https://www.sec.gov/files/company_tickers.json");
    if (!tr.ok) return res.status(503).json({ error: "sec_unavailable" });
    const rows = Object.values((await tr.json()) as Record<string, { cik_str: number; ticker: string }>);
    const row = rows.find((r) => r.ticker?.toUpperCase() === symbol.replace(".", "-"));
    if (!row) return res.status(404).json({ error: "not_a_us_filer" });
    const cik = String(row.cik_str).padStart(10, "0");
    const fr = await get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
    if (fr.status === 404) return res.status(404).json({ error: "no_facts" });
    if (!fr.ok) return res.status(503).json({ error: "sec_unavailable" });
    const facts = parseCompanyFacts(await fr.json(), cik);
    if (!facts) return res.status(404).json({ error: "no_facts" });
    cache.set(symbol, facts);
    return res.status(200).json({ facts, source: "sec_edgar_companyfacts" });
  } catch {
    return res.status(503).json({ error: "sec_unavailable" });
  }
}
