import { describe, expect, it } from "vitest";
import {
  analyzeFinancialScenario,
} from "./calculatorEngine";
import {
  buildRetirementPlan,
} from "./goalEngine";

describe("Retirement NLP", () => {

  it("parses 15 אלף בחודש בפרישה", () => {
    const result = analyzeFinancialScenario(
      "אני רוצה 15 אלף בחודש בפרישה"
    );

    expect(result.targetMonthlyIncome).toBe(15000);
  });

  it("parses 15000 בחודש בפרישה", () => {
    const result = analyzeFinancialScenario(
      "אני רוצה 15000 בחודש בפרישה"
    );

    expect(result.targetMonthlyIncome).toBe(15000);
  });

  it("parses 10K בחודש בפרישה", () => {
    const result = analyzeFinancialScenario(
      "אני רוצה 10K בחודש בפרישה"
    );

    expect(result.targetMonthlyIncome).toBe(10000);
  });

  it("parses 12,000 ₪ לחודש בפרישה", () => {
    const result = analyzeFinancialScenario(
      "אני רוצה 12,000 ₪ לחודש בפרישה"
    );

    expect(result.targetMonthlyIncome).toBe(12000);
  });

  it("parses retirement income with financial freedom context", () => {
    const result = analyzeFinancialScenario(
      "אני רוצה חופש כלכלי עם 15 אלף בחודש"
    );

    expect(result.targetMonthlyIncome).toBe(15000);
  });

});

describe("Retirement Engine", () => {

  const baseInput = {
    currentAge: 30,
    expectedRetirementAge: 60,
    currentAssets: 0,
    monthlyInvestment: 0,
    annualReturnPct: 7,
    inflationPct: 2,
    targetMonthlyIncome: 15000,
  };

  it("handles zero current assets", () => {
    const result = buildRetirementPlan(baseInput);

    expect(result.currentAssets).toBe(0);
    expect(result.futureValue).toBe(0);
    expect(result.monthlyIncomeDuringRetirement).toBe(0);
  });

  it("includes existing assets in future value", () => {
    const result = buildRetirementPlan({
      ...baseInput,
      currentAssets: 500000,
    });

    expect(result.futureValue).toBeGreaterThan(500000);
    expect(result.monthlyIncomeDuringRetirement).toBeGreaterThan(0);
  });

  it("includes monthly contributions", () => {
    const withoutContribution = buildRetirementPlan({
      ...baseInput,
      currentAssets: 100000,
      monthlyInvestment: 0,
    });

    const withContribution = buildRetirementPlan({
      ...baseInput,
      currentAssets: 100000,
      monthlyInvestment: 3000,
    });

    expect(
      withContribution.futureValue
    ).toBeGreaterThan(
      withoutContribution.futureValue
    );
  });

  it("handles zero return", () => {
    const result = buildRetirementPlan({
      ...baseInput,
      annualReturnPct: 0,
      currentAssets: 100000,
      monthlyInvestment: 2000,
    });

    expect(result.futureValue).toBe(
      100000 + 2000 * 360
    );
  });

  it("handles zero-year retirement horizon", () => {
    const result = buildRetirementPlan({
      ...baseInput,
      currentAge: 60,
      expectedRetirementAge: 60,
      currentAssets: 500000,
      monthlyInvestment: 3000,
    });

    expect(result.yearsRemaining).toBe(0);
    expect(result.futureValue).toBe(500000);
  });

  it("accounts for inflation in the retirement target", () => {
    const noInflation = buildRetirementPlan({
      ...baseInput,
      inflationPct: 0,
    });

    const withInflation = buildRetirementPlan({
      ...baseInput,
      inflationPct: 3,
    });

    expect(
      withInflation.requiredMonthlyContribution
    ).toBeGreaterThanOrEqual(
      noInflation.requiredMonthlyContribution
    );
  });

  it("returns zero required contribution when target is already achieved", () => {
    const result = buildRetirementPlan({
      currentAge: 60,
      expectedRetirementAge: 60,
      currentAssets: 5000000,
      monthlyInvestment: 0,
      annualReturnPct: 7,
      inflationPct: 0,
      targetMonthlyIncome: 10000,
    });

    expect(result.requiredMonthlyContribution).toBe(0);
    expect(result.probabilityOfSuccess).toBe(100);
  });

  it("returns conservative, base and growth scenarios", () => {
    const result = buildRetirementPlan({
      ...baseInput,
      currentAssets: 250000,
      monthlyInvestment: 2500,
    });

    expect(result.scenarioAlternatives).toHaveLength(3);

    expect(
      result.scenarioAlternatives[0].label
    ).toBe("שמרני");

    expect(
      result.scenarioAlternatives[1].label
    ).toBe("בסיס");

    expect(
      result.scenarioAlternatives[2].label
    ).toBe("צמיחה");

    expect(
      result.scenarioAlternatives[2].futureValue
    ).toBeGreaterThan(
      result.scenarioAlternatives[0].futureValue
    );
  });

});
