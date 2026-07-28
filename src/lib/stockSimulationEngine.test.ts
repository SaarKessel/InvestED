import { describe, expect, it } from "vitest";
import { projectStockInvestment, simulateHistoricalInvestment } from "./stockSimulationEngine";

describe("simulateHistoricalInvestment", () => {
  it("simulates a lump-sum investment across historical prices", () => {
    const result = simulateHistoricalInvestment({
      symbol: "VOO",
      contribution: { cadence: "one_time", initialInvestment: 1000 },
      prices: [
        { date: "2024-01-02", price: 100 },
        { date: "2024-02-01", price: 120 },
        { date: "2024-03-01", price: 90 },
        { date: "2025-01-02", price: 150 },
      ],
    });

    expect(result.invested).toBe(1000);
    expect(result.shares).toBe(10);
    expect(result.finalValue).toBe(1500);
    expect(result.returnPercent).toBe(50);
    expect(result.maxDrawdownPercent).toBe(-25);
    expect(result.annualizedReturnPercent).not.toBeNull();
  });

  it("invests fixed cash on the first available trading day of each month", () => {
    const result = simulateHistoricalInvestment({
      symbol: "AAPL",
      contribution: { cadence: "monthly_cash", monthlyContribution: 100 },
      prices: [
        { date: "2024-01-02", price: 100 },
        { date: "2024-01-31", price: 110 },
        { date: "2024-02-01", price: 200 },
        { date: "2024-02-29", price: 210 },
      ],
    });

    expect(result.purchases).toBe(2);
    expect(result.invested).toBe(200);
    expect(result.shares).toBe(1.5);
    expect(result.finalValue).toBe(315);
  });

  it("includes purchase fees in contributed capital", () => {
    const result = simulateHistoricalInvestment({
      symbol: "AAPL",
      purchaseFeePercent: 1,
      contribution: { cadence: "monthly_shares", monthlyShares: 2 },
      prices: [{ date: "2024-01-02", price: 100 }],
    });

    expect(result.invested).toBe(202);
    expect(result.shares).toBe(2);
    expect(result.finalValue).toBe(200);
  });
});

describe("projectStockInvestment", () => {
  it("projects monthly contributions with a disclosed annual assumption", () => {
    const result = projectStockInvestment({
      symbol: "VOO",
      years: 1,
      annualReturnPercent: 12,
      initialInvestment: 1000,
      monthlyContribution: 100,
      inflationPercent: 3,
    });

    expect(result.contributed).toBe(2200);
    expect(result.projectedValue).toBeGreaterThan(result.contributed);
    expect(result.realValueAfterInflation).toBeLessThan(result.projectedValue);
    expect(result.series).toHaveLength(13);
  });
});

