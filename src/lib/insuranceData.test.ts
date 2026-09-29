import { describe, expect, it } from 'vitest';
import { normalizeInsuranceRecord } from './insuranceData';
const base = { FUND_ID: 1, FUND_NAME: 'מסלול בדיקה', FUND_CLASSIFICATION: 'פוליסת ביטוח', REPORT_PERIOD: 202608, MONTHLY_YIELD: 0.35, YEAR_TO_DATE_YIELD: 2.83, AVG_ANNUAL_MANAGEMENT_FEE: 0.96 };
describe('official monthly insurance report normalization', () => {
  it('preserves report period, gross returns and fee field separately', () => {
    expect(normalizeInsuranceRecord(base)).toEqual({ fundId: 1, name: 'מסלול בדיקה', classification: 'פוליסת ביטוח', reportPeriod: 202608, monthlyYield: 0.35, yearToDateYield: 2.83, averageAnnualManagementFee: 0.96 });
  });
  it('rejects invalid month or identity and does not fabricate missing returns', () => {
    expect(normalizeInsuranceRecord({ ...base, REPORT_PERIOD: 202613 })).toBeNull();
    expect(normalizeInsuranceRecord({ ...base, FUND_ID: -1 })).toBeNull();
    expect(normalizeInsuranceRecord({ ...base, MONTHLY_YIELD: null, YEAR_TO_DATE_YIELD: '', AVG_ANNUAL_MANAGEMENT_FEE: 'bad' })).toMatchObject({ monthlyYield: null, yearToDateYield: null, averageAnnualManagementFee: null });
  });
});
