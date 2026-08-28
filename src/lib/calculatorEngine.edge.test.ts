import { describe, it, expect } from "vitest";
import {
  computeProjection,
  calculateRequiredMonthlyContribution,
  calculateRetirementTargetAmount,
  calculateHorizonAnalysis,
  DEFAULT_INFLATION_PCT,
} from "./calculatorEngine";

describe("computeProjection", () => {
  it("calculates compound growth with no contributions", () => {
    const result = computeProjection(100_000, 0, 10, 7);
    expect(result.totalContributed).toBe(100_000);
    expect(result.finalBalance).toBeGreaterThan(100_000);
    expect(result.growth).toBeGreaterThan(0);
  });

  it("calculates with monthly contributions", () => {
    const result = computeProjection(0, 1000, 10, 7);
    expect(result.totalContributed).toBe(120_000);
    expect(result.finalBalance).toBeGreaterThan(result.totalContributed);
  });

  it("handles zero years", () => {
    const result = computeProjection(100_000, 1000, 0, 7);
    expect(result.finalBalance).toBe(100_000);
    expect(result.totalContributed).toBe(100_000);
    expect(result.growth).toBe(0);
  });

  it("handles zero return", () => {
    const result = computeProjection(100_000, 1000, 10, 0);
    expect(result.finalBalance).toBe(220_000);
    expect(result.growth).toBe(0);
  });

  it("handles zero initial and zero monthly", () => {
    const result = computeProjection(0, 0, 10, 7);
    expect(result.finalBalance).toBe(0);
    expect(result.totalContributed).toBe(0);
  });

  it("calculates inflation-adjusted value", () => {
    const result = computeProjection(100_000, 0, 10, 7, DEFAULT_INFLATION_PCT);
    expect(result.realValueAfterInflation).toBeLessThan(result.finalBalance);
  });

  it("handles very large values", () => {
    const result = computeProjection(10_000_000, 50_000, 30, 8);
    expect(result.finalBalance).toBeGreaterThan(10_000_000);
    expect(Number.isFinite(result.finalBalance)).toBe(true);
  });

  it("handles very short horizon", () => {
    const result = computeProjection(100_000, 0, 1, 7);
    expect(result.finalBalance).toBeGreaterThan(100_000);
    expect(result.series.length).toBeGreaterThan(0);
  });

  it("handles negative return", () => {
    const result = computeProjection(100_000, 0, 10, -3);
    expect(result.finalBalance).toBeLessThan(100_000);
  });
});

describe("calculateRequiredMonthlyContribution", () => {
  it("calculates required contribution for a goal", () => {
    const result = calculateRequiredMonthlyContribution(1_000_000, 0, 20, 7);
    expect(result).toBeGreaterThan(0);
  });

  it("returns 0 when target is already reached", () => {
    const result = calculateRequiredMonthlyContribution(100_000, 200_000, 10, 7);
    expect(result).toBe(0);
  });

  it("returns 0 for invalid inputs", () => {
    expect(calculateRequiredMonthlyContribution(0, 0, 10, 7)).toBe(0);
    expect(calculateRequiredMonthlyContribution(100_000, 0, 0, 7)).toBe(0);
    expect(calculateRequiredMonthlyContribution(-100, 0, 10, 7)).toBe(0);
  });

  it("handles zero return rate", () => {
    const result = calculateRequiredMonthlyContribution(120_000, 0, 10, 0);
    expect(result).toBe(1000);
  });
});

describe("calculateRetirementTargetAmount", () => {
  it("calculates base retirement target", () => {
    const result = calculateRetirementTargetAmount(10_000, 0, 4, 0);
    expect(result).toBe(3_000_000);
  });

  it("adjusts for inflation", () => {
    const result = calculateRetirementTargetAmount(10_000, 20, 4, 2.5);
    expect(result).toBeGreaterThan(3_000_000);
  });

  it("returns null for invalid inputs", () => {
    expect(calculateRetirementTargetAmount(0, 10, 4)).toBeNull();
    expect(calculateRetirementTargetAmount(-100, 10, 4)).toBeNull();
  });
});

describe("calculateHorizonAnalysis", () => {
  it("classifies short horizon", () => {
    const result = calculateHorizonAnalysis(3);
    expect(result.profile).toBe("short");
  });

  it("classifies medium horizon", () => {
    const result = calculateHorizonAnalysis(10);
    expect(result.profile).toBe("medium");
  });

  it("classifies long horizon", () => {
    const result = calculateHorizonAnalysis(20);
    expect(result.profile).toBe("long");
  });

  it("handles zero years", () => {
    const result = calculateHorizonAnalysis(0);
    expect(result.profile).toBe("short");
    expect(result.years).toBe(0);
  });

  it("handles negative years", () => {
    const result = calculateHorizonAnalysis(-5);
    expect(result.profile).toBe("short");
    expect(result.years).toBe(0);
  });
});
