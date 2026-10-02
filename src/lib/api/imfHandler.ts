// GET /api/imf-weo?indicator=&country=: pass-through to the IMF DataMapper (World Economic Outlook). The IMF API sends no CORS
// headers, so the browser cannot call it. Fixed allowlist, keyless. Served through /api/system (function cap).
import { IMF_COUNTRIES, IMF_INDICATORS } from "../macro/official.js";

interface Req { method?: string; query?: Record<string, string | string[] | undefined> }
interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function handler(req: Req, res: Res, fetcher: typeof fetch = fetch) {
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
  const indicator = one(req.query?.indicator), country = one(req.query?.country);
  if (!(indicator in IMF_INDICATORS) || !(IMF_COUNTRIES as readonly string[]).includes(country)) return res.status(400).json({ error: "unsupported" });
  try {
    const r = await fetcher(`https://www.imf.org/external/datamapper/api/v1/${indicator}/${country}`, { headers: { "User-Agent": "InvestED educational app saar.kessel@gmail.com", Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
    if (!r.ok) return res.status(502).json({ error: "unavailable" });
    const body = (await r.json()) as { values?: Record<string, Record<string, unknown>> };
    // The IMF answers with every country; forward only the requested one.
    const only = body?.values?.[indicator]?.[country];
    if (!only) return res.status(502).json({ error: "unavailable" });
    return res.status(200).json({ values: { [indicator]: { [country]: only } } });
  } catch { return res.status(502).json({ error: "unavailable" }); }
}
