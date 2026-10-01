// Server-side pass-through to World Bank open data (CC BY 4.0). The browser cannot call it reliably (CORS is inconsistent), so this fixed allowlist forwards only four indicators for eight countries.
interface Req { query?: Record<string, string | string[] | undefined> }
interface Response { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }
const COUNTRIES = new Set(['ISR', 'USA', 'GBR', 'DEU', 'EMU', 'JPN', 'CHN', 'IND']);
const INDICATORS = new Set(['FP.CPI.TOTL.ZG', 'NY.GDP.MKTP.KD.ZG', 'SL.UEM.TOTL.ZS', 'NY.GDP.MKTP.CD']);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
export default async function handler(req: Req, res: Response) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  const country = one(req.query?.country), code = one(req.query?.code);
  if (!COUNTRIES.has(country) || !INDICATORS.has(code)) { res.status(400).json({ error: 'unsupported' }); return; }
  try {
    const r = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/${code}?format=json&mrv=6&per_page=6`, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) throw new Error('upstream');
    res.status(200).json(await r.json());
  } catch { res.status(502).json({ error: 'unavailable' }); }
}
