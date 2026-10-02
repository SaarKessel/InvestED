import { describe, expect, it } from "vitest";
import { monthlyPaymentFor, rentVsBuy, sensitivity, validateInputs, type RentBuyInputs } from "./rentVsBuy";
const base: RentBuyInputs = { homePrice: 1_000_000, downPayment: 200_000, mortgageRatePct: 4, mortgageYears: 25, ownCostPct: 1, homeGrowthPct: 3, monthlyRent: 3500, rentGrowthPct: 3, investReturnPct: 5, years: 20, sellCostPct: 3 };
describe("rentVsBuy", () => {
  it("monthly payment matches the annuity formula", () => {
    expect(monthlyPaymentFor(100_000, 0, 10)).toBeCloseTo(833.33, 2);
    expect(monthlyPaymentFor(100_000, 6, 30)).toBeCloseTo(599.55, 2);
  });
  it("produces one row per year", () => {
    const r = rentVsBuy(base)!;
    expect(r.rows).toHaveLength(20);
    expect(r.rows[0].year).toBe(1);
  });
  it("rejects missing or impossible inputs instead of defaulting", () => {
    expect(rentVsBuy({ ...base, homePrice: 0 })).toBeNull();
    expect(rentVsBuy({ ...base, downPayment: 2_000_000 })).toBeNull();
    const partial: Partial<typeof base> = { ...base };
    delete partial.years;
    expect(validateInputs(partial)).toBe(false);
    expect(rentVsBuy({ ...base, investReturnPct: NaN })).toBeNull();
  });
  it("very cheap rent never breaks even; very expensive rent breaks even early", () => {
    expect(rentVsBuy({ ...base, monthlyRent: 500 })!.breakEvenYear).toBeNull();
    const high = rentVsBuy({ ...base, monthlyRent: 9000 })!.breakEvenYear;
    expect(high).not.toBeNull();
    expect(high!).toBeLessThanOrEqual(10);
  });
  it("a higher investment return helps the renter's pot", () => {
    const a = rentVsBuy({ ...base, investReturnPct: 2 })!.rows[19].liquidInvestments;
    const b = rentVsBuy({ ...base, investReturnPct: 8 })!.rows[19].liquidInvestments;
    expect(b).toBeGreaterThan(a);
  });
  it("sensitivity returns three runs", () => {
    const s = sensitivity(base, "homeGrowthPct", 1);
    expect(s.down).not.toBeNull();
    expect(s.up!.rows[19].homeEquity).toBeGreaterThan(s.down!.rows[19].homeEquity);
  });
  it("mortgage is paid off at the end of the term", () => {
    const r = rentVsBuy({ ...base, mortgageYears: 10, years: 12, homeGrowthPct: 0, sellCostPct: 0 })!;
    expect(r.rows[11].homeEquity).toBeCloseTo(1_000_000, 0);
  });
});
