import { describe, expect, it } from "vitest";
import {
  analyzeFinancialScenario,
  computeProjection,
  calculateRequiredMonthlyContribution,
  calculateBaseRetirementTargetAmount,
  calculateRetirementTargetAmount,
  calculateHorizonAnalysis,
} from "./calculatorEngine";

describe("analyzeFinancialScenario", () => {
  it("parses Hebrew natural language with a target amount, monthly contribution, and age", () => {
    const scenario = analyzeFinancialScenario(
      "אני בן 32, רוצה לחסוך מיליון שקל, מפקיד 3000 שקל בחודש עד גיל 60, ומשקיע במדד S&P 500"
    );

    expect(scenario.initialInvestment).toBe(0);
    expect(scenario.monthlyContribution).toBe(3000);
    expect(scenario.currentAge).toBe(32);
    expect(scenario.targetAge).toBe(60);
    expect(scenario.years).toBe(28);
    expect(scenario.goal).toBe("retirement");
    expect(scenario.assetClassKey).toBe("sp500");
  });

  it("handles English money abbreviations and phrase variants", () => {
    const scenario = analyzeFinancialScenario(
      "I want to retire with 3 million and invest 10K monthly for 15 years"
    );

    expect(scenario.targetAmount).toBe(3000000);
    expect(scenario.monthlyContribution).toBe(10000);
    expect(scenario.years).toBe(15);
    expect(scenario.goal).toBe("retirement");
  });

  it("extracts one-time amounts and short Hebrew forms like 'חצי מיליון'", () => {
    const scenario = analyzeFinancialScenario(
      "יש לי חצי מיליון שקל להשקיע ל-20 שנה"
    );

    expect(scenario.initialInvestment).toBe(500000);
    expect(scenario.years).toBe(20);
    expect(scenario.goal).toBe("growth");
  });
});

describe("Beta v1 amount parsing", () => {
  it.each([
    ["100 אלף", 100000],
    ["100,000", 100000],
    ["2.5 מיליון", 2500000],
    ["חצי מיליון", 500000],
    ["מיליון וחצי", 1500000],
    ["חצי מליון", 500000],
    ["שני מיליון", 2000000],
    ["רבע מליון", 250000],
  ])("parses %s as %s", (amount, expected) => {
    const scenario = analyzeFinancialScenario(
      `יש לי ${amount} שקל להשקיע`
    );

    expect(scenario.initialInvestment).toBe(expected);
  });

  it.each([
    ["150K בחודש", 150000],
    ["150 אלף בחודש", 150000],
    ["2.5 מיליון בחודש", 2500000],
  ])("parses monthly contribution %s as %s", (input, expected) => {
    const scenario = analyzeFinancialScenario(
      `אני מפקיד ${input}`
    );

    expect(scenario.monthlyContribution).toBe(expected);
  });
});

describe("Beta v1 time parsing", () => {
  it("calculates years from current age to target age", () => {
    const scenario = analyzeFinancialScenario(
      "אני בן 27 עד גיל 60"
    );

    expect(scenario.currentAge).toBe(27);
    expect(scenario.targetAge).toBe(60);
    expect(scenario.years).toBe(33);
  });

  it("parses an explicit future period", () => {
    const scenario = analyzeFinancialScenario(
      "אני רוצה להשקיע בעוד 20 שנה"
    );

    expect(scenario.years).toBe(20);
  });
});

describe("Beta v1 target amount parsing", () => {
  it.each([
    ["להגיע לחצי מיליון", 500000],
    ["להגיע למיליון וחצי", 1500000],
  ])("parses target %s as %s", (input, expected) => {
    const scenario = analyzeFinancialScenario(input);

    expect(scenario.targetAmount).toBe(expected);
  });
});

describe("Beta v1 asset detection", () => {
  it("detects S&P 500", () => {
    const scenario = analyzeFinancialScenario(
      "אני רוצה להשקיע ב-S&P 500"
    );

    expect(scenario.assetClassKey).toBe("sp500");
  });

  it("detects Hebrew Nasdaq spelling", () => {
    const scenario = analyzeFinancialScenario(
      "אני רוצה להשקיע בנאסד״ק"
    );

    expect(scenario.assetClassKey).toBe("nasdaq");
  });

  it("does not classify technology as Nasdaq", () => {
    const scenario = analyzeFinancialScenario(
      "אני מתעניין בטכנולוגיה"
    );

    expect(scenario.assetClassKey).toBe("balanced");
  });

  it("does not classify diversification as Balanced explicitly", () => {
    const scenario = analyzeFinancialScenario(
      "אני רוצה פיזור"
    );

    expect(scenario.assetClassKey).toBe("balanced");
  });

  it("does not classify a generic portfolio as Balanced explicitly", () => {
    const scenario = analyzeFinancialScenario(
      "אני רוצה תיק השקעות"
    );

    expect(scenario.assetClassKey).toBe("balanced");
  });
});

describe("computeProjection financial mathematics", () => {
  it("calculates compound growth with initial principal and monthly contributions", () => {
    // 100,000 principal, 1,000 monthly, 10 years, 7% annual return
    const result = computeProjection(100_000, 1_000, 10, 7, 2.5);

    expect(result.finalBalance).toBeGreaterThan(100_000 + 1_000 * 120);
    expect(result.totalContributed).toBe(100_000 + 1_000 * 120); // 220,000
    expect(result.growth).toBe(result.finalBalance - result.totalContributed);
    expect(result.realValueAfterInflation).toBeLessThan(result.finalBalance);
    expect(result.series.length).toBe(11); // Year 0 to 10
  });

  it("handles 0% annual return as a purely linear accumulation", () => {
    const result = computeProjection(50_000, 2_000, 5, 0, 0);

    expect(result.finalBalance).toBe(50_000 + 2_000 * 60); // 170,000
    expect(result.totalContributed).toBe(170_000);
    expect(result.growth).toBe(0);
    expect(result.realValueAfterInflation).toBe(170_000);
  });

  it("handles 0 monthly contribution (pure lump sum compounding)", () => {
    const result = computeProjection(100_000, 0, 10, 8, 2.5);

    // FV = 100000 * (1 + 0.08/12)^120 ≈ 221,964
    expect(result.totalContributed).toBe(100_000);
    expect(result.finalBalance).toBeCloseTo(221_964, -2);
    expect(result.growth).toBe(result.finalBalance - 100_000);
  });

  it("gracefully handles edge cases: negative or invalid inputs", () => {
    const result = computeProjection(-1000, -500, -5, NaN, -2);

    expect(result.finalBalance).toBe(0);
    expect(result.totalContributed).toBe(0);
    expect(result.growth).toBe(0);
  });
});

describe("calculateRequiredMonthlyContribution formula correctness", () => {
  it("calculates exact required monthly contribution to reach target", () => {
    const target = 1_000_000;
    const initial = 100_000;
    const years = 15;
    const returnPct = 8;

    const pmt = calculateRequiredMonthlyContribution(target, initial, years, returnPct);
    expect(pmt).toBeGreaterThan(0);

    // Verify consistency: plug PMT back into computeProjection
    const projection = computeProjection(initial, pmt, years, returnPct);
    // Projection final balance should reach within 1% of the target
    expect(Math.abs(projection.finalBalance - target) / target).toBeLessThan(0.01);
  });

  it("returns 0 if initial principal already exceeds target with growth", () => {
    const target = 100_000;
    const initial = 200_000;
    const years = 10;
    const returnPct = 7;

    const pmt = calculateRequiredMonthlyContribution(target, initial, years, returnPct);
    expect(pmt).toBe(0);
  });

  it("handles 0% return gracefully", () => {
    const target = 120_000;
    const initial = 0;
    const years = 10;

    const pmt = calculateRequiredMonthlyContribution(target, initial, years, 0);
    expect(pmt).toBe(1_000); // 120,000 / 120 months = 1,000
  });

  it("handles invalid or zero parameters safely", () => {
    expect(calculateRequiredMonthlyContribution(0, 10000, 10, 7)).toBe(0);
    expect(calculateRequiredMonthlyContribution(-50000, 10000, 10, 7)).toBe(0);
    expect(calculateRequiredMonthlyContribution(100000, 0, 0, 7)).toBe(0);
    expect(calculateRequiredMonthlyContribution(100000, 0, 10, NaN)).toBe(0);
  });
});

describe("calculateRetirementTargetAmount (4% rule + inflation)", () => {
  it("calculates base target using the 4% safe withdrawal rule (300x monthly income)", () => {
    // 10,000 monthly income -> 120,000 annual -> at 4% withdrawal rate -> 3,000,000
    const target = calculateBaseRetirementTargetAmount(10_000, 4);
    expect(target).toBe(3_000_000);
  });

  it("compounds retirement target for inflation over the horizon years", () => {
    const monthlyIncome = 10_000;
    const years = 20;
    const inflationPct = 2.5;

    const target = calculateRetirementTargetAmount(monthlyIncome, years, 4, inflationPct);
    const expected = Math.round(3_000_000 * Math.pow(1 + 0.025, 20));
    expect(target).toBe(expected);
  });

  it("handles invalid monthly income safely", () => {
    expect(calculateRetirementTargetAmount(0, 10)).toBeNull();
    expect(calculateRetirementTargetAmount(-5000, 10)).toBeNull();
  });
});

describe("calculateHorizonAnalysis", () => {
  it("correctly buckets horizons into short, medium, and long", () => {
    expect(calculateHorizonAnalysis(3).profile).toBe("short");
    expect(calculateHorizonAnalysis(10).profile).toBe("medium");
    expect(calculateHorizonAnalysis(20).profile).toBe("long");
  });
});
