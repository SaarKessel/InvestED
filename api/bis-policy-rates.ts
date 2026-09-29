import { BIS_RATE_API, BIS_RATE_SERIES, parseBisMonthlyRates, type BisRatePoint } from '../src/lib/bisPolicyRate.js';
interface Response { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }
interface Payload { status: 'live' | 'cached' | 'unavailable'; fetchedAt: string | null; latestObservation: string | null; points: BisRatePoint[]; source: string }
let cache: { at: number; payload: Payload } | null = null;
const TTL = 12 * 60 * 60 * 1000;
export default async function handler(_req: unknown, res: Response) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const now = Date.now();
  if (cache && now - cache.at < TTL) { res.status(200).json({ ...cache.payload, status: 'cached' }); return; }
  try {
    const url = `${BIS_RATE_API}?startPeriod=${new Date(now - 3 * 365 * 86_400_000).toISOString().slice(0, 7)}`;
    const response = await fetch(url, { headers: { Accept: 'application/xml' }, signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error('BIS data unavailable');
    const points = parseBisMonthlyRates(await response.text());
    if (points.length === 0) throw new Error('No valid Israel monthly observations');
    const payload: Payload = { status: 'live', fetchedAt: new Date(now).toISOString(), latestObservation: points.at(-1)!.month, points, source: BIS_RATE_SERIES };
    cache = { at: now, payload };
    res.status(200).json(payload);
  } catch {
    if (cache) { res.status(200).json({ ...cache.payload, status: 'cached' }); return; }
    res.status(200).json({ status: 'unavailable', fetchedAt: null, latestObservation: null, points: [], source: BIS_RATE_SERIES } satisfies Payload);
  }
}
