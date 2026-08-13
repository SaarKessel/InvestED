import { describe, expect, it } from "vitest";
import { buildRetirementPlan } from "./goalEngine";

describe("buildRetirementPlan", () => {
  it("creates a retirement-oriented goal plan with scenario alternatives and success confidence", () => {
    const plan = buildRetirementPlan({
      currentAge: 32,
      expectedRetirementAge: 60,
      currentAssets: 100000,
      monthlyInvestment: 3000,
      annualReturnPct: 8,
      inflationPct: 3,
      targetMonthlyIncome: 18000,
    });

    expect(plan.yearsRemaining).toBe(28);
    expect(plan.requiredMonthlyContribution).toBeGreaterThan(0);
    expect(plan.futureValue).toBeGreaterThan(plan.currentAssets);
    expect(plan.monthlyIncomeDuringRetirement).toBeGreaterThan(0);
    expect(plan.probabilityOfSuccess).toBeGreaterThan(0);
    expect(plan.scenarioAlternatives.length).toBeGreaterThanOrEqual(3);
    expect(plan.recommendations.length).toBeGreaterThan(0);
  });
});
