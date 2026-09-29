import { describe, expect, it } from 'vitest';
import { estimateFixedLoan } from './loanEducation';
describe('educational fixed-rate loan calculation', () => {
  it('keeps principal and zero-interest installments exact', () => {
    expect(estimateFixedLoan(1200, 0, 12)).toMatchObject({ monthlyPayment: 100, totalPaid: 1200, totalInterest: 0 });
  });
  it('uses amortization rather than simple annual interest', () => {
    const result = estimateFixedLoan(10000, 12, 12)!;
    expect(result.monthlyPayment).toBeCloseTo(888.49, 2);
    expect(result.totalInterest).toBeCloseTo(661.85, 0);
    expect(result.totalPaid).toBeCloseTo(result.principal + result.totalInterest, 8);
  });
  it('rejects invalid, extreme or fractional duration assumptions', () => {
    for (const args of [[0, 5, 12], [1000, -1, 12], [1000, 101, 12], [1000, 5, 1.5], [1000, 5, 601], [Infinity, 5, 12], [1000, NaN, 12]]) {
      expect(estimateFixedLoan(...args)).toBeNull();
    }
  });
});
