import { describe, it, expect } from "vitest";
import { generateAIInsight } from "./aiExplanationEngine";
import type { FinancialScenario } from "@/types";
import type { ProjectionResult } from "@/lib/calculatorEngine";

const scenario = (over: Partial<FinancialScenario> = {}): FinancialScenario => ({
  initialInvestment: 10000,
  monthlyContribution: 500,
  currentAge: 30,
  targetAge: 40,
  targetAmount: null,
  targetMonthlyIncome: null,
  years: 10,
  assetClassKey: "sp500",
  annualReturnPct: 7,
  goal: "growth",
  confidence: 0.8,
  detectedInterests: [],
  currency: "₪",
  ...over,
});
const projection: ProjectionResult = {
  finalBalance: 150000,
  totalContributed: 70000,
  growth: 80000,
  realValueAfterInflation: 120000,
  series: [],
  currency: "₪",
};

describe("generateAIInsight", () => {
  it("returns every field populated in Hebrew by default", () => {
    const i = generateAIInsight(scenario(), projection);
    for (const v of [i.headline, i.riskLevel, i.horizonInsight, i.growthInsight, i.recommendation, i.diversificationInsight]) {
      expect(typeof v).toBe("string");
      expect((v as string).length).toBeGreaterThan(0);
    }
    expect(i.riskEmoji.length).toBeGreaterThan(0);
    expect(i.confidence).toBeGreaterThan(0);
  });
  it("honors English output", () => {
    const i = generateAIInsight(scenario(), projection, "en");
    expect(i.headline).not.toMatch(/[\u0590-\u05ff]/);
    expect(i.recommendation).not.toMatch(/[\u0590-\u05ff]/);
  });
  it("clamps nonsense years instead of crashing", () => {
    expect(() => generateAIInsight(scenario({ years: NaN }), projection)).not.toThrow();
    const i = generateAIInsight(scenario({ years: -5 }), projection);
    expect(i.headline).toBeTruthy();
  });
  it("reflects the asset class in the output", () => {
    const he = generateAIInsight(scenario({ assetClassKey: "sp500" }), projection);
    expect(he.headline + he.recommendation + he.diversificationInsight).toContain("S&P");
  });
  it("normalizes confidence into a sane range", () => {
    const low = generateAIInsight(scenario({ confidence: -3 }), projection);
    const high = generateAIInsight(scenario({ confidence: 42 }), projection);
    expect(low.confidence).toBeGreaterThanOrEqual(0);
    expect(high.confidence).toBeLessThanOrEqual(100);
  });
  it("is deterministic for identical input", () => {
    expect(generateAIInsight(scenario(), projection)).toEqual(generateAIInsight(scenario(), projection));
  });
});
