import type { BisRatePoint } from './bisPolicyRate';
export interface BisRateResult { status: 'live' | 'cached' | 'unavailable'; fetchedAt: string | null; latestObservation: string | null; points: BisRatePoint[]; source: string }
export async function fetchBisRateHistory(): Promise<BisRateResult> {
  const response = await fetch('/api/bis-policy-rates');
  if (!response.ok) throw new Error('BIS history unavailable');
  const data = await response.json() as BisRateResult;
  if (!['live', 'cached', 'unavailable'].includes(data.status) || !Array.isArray(data.points)) throw new Error('Invalid BIS history');
  return data;
}
