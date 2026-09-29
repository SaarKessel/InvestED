/** Public regulator reports. No personal policy data or live market prices. */
export const INSURANCE_DATASET = 'https://data.gov.il/api/3/action/package_show?id=insurance';
export const INSURANCE_LICENSE = 'https://data.gov.il/terms-of-use';
export const INSURANCE_RESOURCE_ID = 'c6c62cc7-fe02-4b18-8f3e-813abfbb4647';

export interface InsuranceRecord {
  fundId: number;
  name: string;
  classification: string;
  reportPeriod: number;
  monthlyYield: number | null;
  yearToDateYield: number | null;
  averageAnnualManagementFee: number | null;
}

function finitePercent(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= 10_000 ? number : null;
}
export function normalizeInsuranceRecord(value: unknown): InsuranceRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const fundId = Number(record.FUND_ID);
  const reportPeriod = Number(record.REPORT_PERIOD);
  const name = record.FUND_NAME;
  const classification = record.FUND_CLASSIFICATION;
  if (!Number.isSafeInteger(fundId) || fundId <= 0 || typeof name !== 'string' || !name.trim() ||
      name.length > 240 || typeof classification !== 'string' || classification.length > 200 ||
      !Number.isInteger(reportPeriod) || reportPeriod < 199901 || reportPeriod > 210012 || reportPeriod % 100 < 1 || reportPeriod % 100 > 12) return null;
  return { fundId, name: name.trim(), classification: classification.trim(), reportPeriod,
    monthlyYield: finitePercent(record.MONTHLY_YIELD),
    yearToDateYield: finitePercent(record.YEAR_TO_DATE_YIELD),
    averageAnnualManagementFee: finitePercent(record.AVG_ANNUAL_MANAGEMENT_FEE) };
}
