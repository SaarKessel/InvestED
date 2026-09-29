import type { InsuranceRecord } from './insuranceData';
export interface InsuranceResult { status: 'live' | 'cached' | 'unavailable'; reportPeriod: number | null; fetchedAt: string | null; records: InsuranceRecord[]; source: string }
export async function fetchInsuranceReports(): Promise<InsuranceResult> {
  const response = await fetch('/api/insurance-reports');
  if (!response.ok) throw new Error(`Insurance reports returned HTTP ${response.status}`);
  const payload = await response.json() as InsuranceResult;
  if (!['live', 'cached', 'unavailable'].includes(payload.status) || !Array.isArray(payload.records)) throw new Error('Invalid insurance report response');
  return payload;
}
