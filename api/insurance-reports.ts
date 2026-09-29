import { INSURANCE_DATASET, INSURANCE_RESOURCE_ID, normalizeInsuranceRecord, type InsuranceRecord } from '../src/lib/insuranceData.js';

interface Request { query?: Record<string, string | string[] | undefined> }
interface Response { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }
interface Payload { status: 'live' | 'cached' | 'unavailable'; reportPeriod: number | null; fetchedAt: string | null; records: InsuranceRecord[]; source: string }
const URL_BASE = 'https://data.gov.il/api/3/action/datastore_search';
const CACHE_TTL = 6 * 60 * 60 * 1000;
let cache: { payload: Payload; at: number } | null = null;

export default async function handler(_req: Request, res: Response) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL) { res.status(200).json({ ...cache.payload, status: 'cached' }); return; }
  try {
    const query = new URL(URL_BASE);
    query.searchParams.set('resource_id', INSURANCE_RESOURCE_ID);
    query.searchParams.set('sort', 'REPORT_PERIOD desc');
    query.searchParams.set('limit', '100');
    const response = await fetch(query, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error('Official data unavailable');
    const data = await response.json() as { success?: boolean; result?: { records?: unknown[] } };
    if (data.success !== true || !Array.isArray(data.result?.records)) throw new Error('Invalid official response');
    const valid = data.result.records.map(normalizeInsuranceRecord).filter((row): row is InsuranceRecord => row !== null);
    const reportPeriod = Math.max(0, ...valid.map(row => row.reportPeriod));
    if (!reportPeriod) throw new Error('No valid reporting month');
    // The upstream query is sorted, but validate each row's month rather than assuming it.
    const records = valid.filter(row => row.reportPeriod === reportPeriod).slice(0, 24);
    if (!records.length) throw new Error('No valid fund records');
    const payload: Payload = { status: 'live', reportPeriod, fetchedAt: new Date(now).toISOString(), records, source: INSURANCE_DATASET };
    cache = { payload, at: now };
    res.status(200).json(payload);
  } catch {
    if (cache) { res.status(200).json({ ...cache.payload, status: 'cached' }); return; }
    res.status(200).json({ status: 'unavailable', reportPeriod: null, fetchedAt: null, records: [], source: INSURANCE_DATASET } satisfies Payload);
  }
}
