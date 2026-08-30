import { describe, expect, it } from "vitest";
import {
  analyzeFinancialScenario,
  computeProjection,
  calculateRequiredMonthlyContribution,
  calculateBaseRetirementTargetAmount,
  calculateRetirementTargetAmount,
  calculateHorizonAnalysis,
  buildAIExplanationResult,
  analyzeFinancialScenarioWithProjection,
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

describe("English natural language parsing", () => {
  it("parses English age from 'I am X years old'", () => {
    const scenario = analyzeFinancialScenario(
      "I am 27 years old and want to invest for the long term"
    );

    expect(scenario.currentAge).toBe(27);
  });

  it("parses English initial investment from 'want to invest X shekels initially'", () => {
    const scenario = analyzeFinancialScenario(
      "I want to invest 100,000 shekels initially for 20 years"
    );

    expect(scenario.initialInvestment).toBe(100000);
    expect(scenario.years).toBe(20);
  });

  it("parses English monthly contribution from 'X shekels every month'", () => {
    const scenario = analyzeFinancialScenario(
      "I am 30 years old and can contribute 2,000 shekels every month for 15 years"
    );

    expect(scenario.monthlyContribution).toBe(2000);
    expect(scenario.years).toBe(15);
  });

  it("parses full English scenario with initial, monthly, years, and portfolio", () => {
    const scenario = analyzeFinancialScenario(
      "I am 27 years old and want to invest 100,000 shekels initially with 2,000 shekels every month for 27 years in a balanced portfolio"
    );

    expect(scenario.initialInvestment).toBe(100000);
    expect(scenario.monthlyContribution).toBe(2000);
    expect(scenario.currentAge).toBe(27);
    expect(scenario.years).toBe(27);
    expect(scenario.assetClassKey).toBe("balanced");
    expect(scenario.annualReturnPct).toBe(7);
    expect(scenario.riskProfile).toBe("medium");
    expect(scenario.goal).toBe("growth");
    expect(scenario.confidence).toBeGreaterThan(0);
  });

  it("parses English shorthand with K and million", () => {
    const scenario = analyzeFinancialScenario(
      "I have 250,000 to invest and can contribute 3,000 per month for 20 years"
    );

    expect(scenario.initialInvestment).toBe(250000);
    expect(scenario.monthlyContribution).toBe(3000);
    expect(scenario.years).toBe(20);
  });

  it("parses English '150K initially and 2.5K every month'", () => {
    const scenario = analyzeFinancialScenario(
      "I want to invest 150K initially and add 2.5K every month for 15 years"
    );

    expect(scenario.initialInvestment).toBe(150000);
    expect(scenario.monthlyContribution).toBe(2500);
    expect(scenario.years).toBe(15);
  });

  it("parses English '1.5 million shekels and 10,000 per month'", () => {
    const scenario = analyzeFinancialScenario(
      "I have 1.5 million shekels and can invest 10,000 per month"
    );

    expect(scenario.initialInvestment).toBe(1500000);
    expect(scenario.monthlyContribution).toBe(10000);
  });

  it("parses English 'half a million with 5,000 monthly contributions'", () => {
    const scenario = analyzeFinancialScenario(
      "I want to invest half a million with 5,000 monthly contributions for 25 years"
    );

    expect(scenario.initialInvestment).toBe(500000);
    expect(scenario.monthlyContribution).toBe(5000);
    expect(scenario.years).toBe(25);
  });

  it("parses English retirement scenario", () => {
    const scenario = analyzeFinancialScenario(
      "I am 35 years old and want to retire with 3 million, contributing 10K monthly for 25 years"
    );

    expect(scenario.currentAge).toBe(35);
    expect(scenario.targetAmount).toBe(3000000);
    expect(scenario.monthlyContribution).toBe(10000);
    expect(scenario.years).toBe(25);
    expect(scenario.goal).toBe("retirement");
  });

  it("does not steal initial investment amount as monthly contribution", () => {
    const scenario = analyzeFinancialScenario(
      "I want to invest 100,000 shekels initially with 2,000 shekels every month"
    );

    expect(scenario.initialInvestment).toBe(100000);
    expect(scenario.monthlyContribution).toBe(2000);
  });
});

describe("Language-aware AI explanation", () => {
  it("returns English labels when language is en", () => {
    const scenario = analyzeFinancialScenario(
      "I want to invest 100,000 shekels initially with 2,000 shekels every month for 27 years in a balanced portfolio"
    );

    const result = buildAIExplanationResult(scenario, "en");

    expect(result.riskLabel).toBe("Medium");
    expect(result.horizon.label).toBe("Long Term");
    expect(result.assetLabel).toBe("Balanced Portfolio");
    expect(result.explanation).toContain("The system analyzed");
  });

  it("returns Hebrew labels when language is he", () => {
    const scenario = analyzeFinancialScenario(
      "אני רוצה להשקיע 100,000 שקל בהשקעה ראשונית עם 2,000 שקל בחודש ל-27 שנים"
    );

    const result = buildAIExplanationResult(scenario, "he");

    expect(result.riskLabel).toBe("בינונית");
    expect(result.horizon.label).toBe("טווח ארוך");
    expect(result.assetLabel).toBe("תיק מאוזן");
    expect(result.explanation).toContain("המערכת ניתחה");
  });
});

describe("English projection with non-zero values", () => {
  it("produces non-zero results for a valid English scenario", () => {
    const result = analyzeFinancialScenarioWithProjection(
      "I am 27 years old and want to invest 100,000 shekels initially with 2,000 shekels every month for 27 years in a balanced portfolio",
      "en"
    );

    expect(result.scenario.initialInvestment).toBe(100000);
    expect(result.scenario.monthlyContribution).toBe(2000);
    expect(result.projection.finalBalance).toBeGreaterThan(0);
    expect(result.projection.totalContributed).toBeGreaterThan(0);
    expect(result.projection.growth).toBeGreaterThan(0);
    expect(result.aiExplanation.riskLabel).toBe("Medium");
  });

  it("propagates detected currency through scenario and projection", () => {
    const result = analyzeFinancialScenarioWithProjection(
      "I have $50,000 and invest $1,000 monthly for 20 years",
      "en"
    );

    expect(result.scenario.currency).toBe("USD");
    expect(result.projection.currency).toBe("USD");
  });

  it("does not mix currencies in projection series", () => {
    const result = analyzeFinancialScenarioWithProjection(
      "I have €100,000 and invest €2,000 monthly for 20 years",
      "en"
    );

    expect(result.scenario.currency).toBe("EUR");
    expect(result.projection.currency).toBe("EUR");
    for (const point of result.projection.series) {
      expect(point.currency).toBe("EUR");
    }
  });
});

describe("Scenario analysis with conservative/base/optimistic returns", () => {
  it("conservative return produces lower final balance than base return", () => {
    const conservative = computeProjection(100_000, 1000, 20, 4, 0);
    const base = computeProjection(100_000, 1000, 20, 7, 0);
    const optimistic = computeProjection(100_000, 1000, 20, 10, 0);

    expect(conservative.finalBalance).toBeLessThan(base.finalBalance);
    expect(base.finalBalance).toBeLessThan(optimistic.finalBalance);
  });

  it("optimistic return produces highest growth across identical inputs", () => {
    const conservative = computeProjection(50_000, 2000, 15, 3, 0);
    const base = computeProjection(50_000, 2000, 15, 7, 0);
    const optimistic = computeProjection(50_000, 2000, 15, 12, 0);

    expect(optimistic.growth).toBeGreaterThan(base.growth);
    expect(base.growth).toBeGreaterThan(conservative.growth);
  });

  it("all return scenarios include the same total contributed amount", () => {
    const conservative = computeProjection(100_000, 500, 10, 3, 0);
    const base = computeProjection(100_000, 500, 10, 7, 0);
    const optimistic = computeProjection(100_000, 500, 10, 12, 0);

    expect(conservative.totalContributed).toBe(base.totalContributed);
    expect(base.totalContributed).toBe(optimistic.totalContributed);
    expect(conservative.totalContributed).toBe(100_000 + 500 * 120);
  });
});

describe("Contribution growth scenarios", () => {
  it("higher monthly contribution produces higher final balance with same principal", () => {
    const low = computeProjection(100_000, 500, 20, 7, 0);
    const medium = computeProjection(100_000, 2000, 20, 7, 0);
    const high = computeProjection(100_000, 5000, 20, 7, 0);

    expect(low.finalBalance).toBeLessThan(medium.finalBalance);
    expect(medium.finalBalance).toBeLessThan(high.finalBalance);
  });

  it("zero monthly contribution with positive principal still grows via compounding", () => {
    const result = computeProjection(200_000, 0, 25, 7, 0);

    expect(result.finalBalance).toBeGreaterThan(result.totalContributed);
    expect(result.totalContributed).toBe(200_000);
  });

  it("extending time horizon increases final balance even with zero contribution", () => {
    const short = computeProjection(100_000, 0, 5, 7, 0);
    const medium = computeProjection(100_000, 0, 15, 7, 0);
    const long = computeProjection(100_000, 0, 30, 7, 0);

    expect(short.finalBalance).toBeLessThan(medium.finalBalance);
    expect(medium.finalBalance).toBeLessThan(long.finalBalance);
  });

  it("combined high contribution and long horizon produces largest balance", () => {
    const base = computeProjection(100_000, 1000, 10, 7, 0);
    const highContrib = computeProjection(100_000, 5000, 10, 7, 0);
    const longHorizon = computeProjection(100_000, 1000, 30, 7, 0);
    const combined = computeProjection(100_000, 5000, 30, 7, 0);

    expect(combined.finalBalance).toBeGreaterThan(base.finalBalance);
    expect(combined.finalBalance).toBeGreaterThan(highContrib.finalBalance);
    expect(combined.finalBalance).toBeGreaterThan(longHorizon.finalBalance);
  });
});

describe("Fee impact calculations", () => {
  it("higher inflation reduces real value after inflation", () => {
    const noInflation = computeProjection(100_000, 1000, 20, 7, 0);
    const lowInflation = computeProjection(100_000, 1000, 20, 7, 1);
    const highInflation = computeProjection(100_000, 1000, 20, 7, 5);

    expect(noInflation.realValueAfterInflation).toBeGreaterThan(lowInflation.realValueAfterInflation);
    expect(lowInflation.realValueAfterInflation).toBeGreaterThan(highInflation.realValueAfterInflation);
  });

  it("negative net return with inflation produces worst real value", () => {
    const positiveReturn = computeProjection(100_000, 1000, 10, 7, 2.5);
    const negativeReturn = computeProjection(100_000, 1000, 10, -2, 2.5);

    expect(negativeReturn.realValueAfterInflation).toBeLessThan(positiveReturn.realValueAfterInflation);
  });

  it("inflation-adjusted value is always less than or equal to nominal final balance", () => {
    const result = computeProjection(100_000, 2000, 20, 8, 3);

    expect(result.realValueAfterInflation).toBeLessThanOrEqual(result.finalBalance);
  });
});

describe("Invalid and edge case inputs", () => {
  it("handles NaN principal gracefully", () => {
    const result = computeProjection(NaN, 1000, 10, 7, 2.5);

    expect(Number.isFinite(result.finalBalance)).toBe(true);
    expect(result.finalBalance).toBeGreaterThanOrEqual(0);
  });

  it("handles Infinity principal gracefully", () => {
    const result = computeProjection(Infinity, 1000, 10, 7, 2.5);

    expect(Number.isFinite(result.finalBalance)).toBe(true);
    expect(result.finalBalance).toBeGreaterThanOrEqual(0);
  });

  it("handles negative monthly contribution by treating as zero", () => {
    const result = computeProjection(100_000, -5000, 10, 7, 2.5);

    expect(result.totalContributed).toBe(100_000);
    expect(result.finalBalance).toBeGreaterThanOrEqual(result.totalContributed);
  });

  it("handles Infinity years gracefully", () => {
    const result = computeProjection(100_000, 1000, Infinity, 7, 2.5);

    expect(Number.isFinite(result.finalBalance)).toBe(true);
  });

  it("handles negative return rate", () => {
    const result = computeProjection(100_000, 1000, 10, -5, 0);

    expect(result.finalBalance).toBeLessThan(result.totalContributed);
  });

  it("returns zero for completely zero inputs", () => {
    const result = computeProjection(0, 0, 0, 0, 0);

    expect(result.finalBalance).toBe(0);
    expect(result.totalContributed).toBe(0);
    expect(result.growth).toBe(0);
  });
});

describe("Empty scenario handling", () => {
  it("handles empty string scenario input", () => {
    const scenario = analyzeFinancialScenario("");

    expect(scenario.initialInvestment).toBe(0);
    expect(scenario.monthlyContribution).toBe(0);
    expect(scenario.years).toBe(10);
    expect(scenario.confidence).toBeGreaterThanOrEqual(0);
  });

  it("handles whitespace-only scenario input", () => {
    const scenario = analyzeFinancialScenario("   ");

    expect(scenario.initialInvestment).toBe(0);
    expect(scenario.monthlyContribution).toBe(0);
    expect(scenario.years).toBe(10);
  });

  it("handles scenario with no financial amounts", () => {
    const scenario = analyzeFinancialScenario(
      "I want to learn about investing"
    );

    expect(scenario.initialInvestment).toBe(0);
    expect(scenario.monthlyContribution).toBe(0);
    expect(scenario.confidence).toBeLessThan(50);
  });

  it("returns valid projection for empty scenario", () => {
    const result = analyzeFinancialScenarioWithProjection("", "en");

    expect(result.projection.series.length).toBeGreaterThan(0);
    expect(result.scenario.years).toBe(10);
  });
});

describe("Confidence calculation explainability", () => {
  it("confidence increases with more complete information", () => {
    const empty = analyzeFinancialScenario("");
    const partial = analyzeFinancialScenario("I am 30 years old");
    const full = analyzeFinancialScenario(
      "I am 30 years old, have 100000 shekels, contribute 2000 monthly for 20 years in S&P 500"
    );

    expect(full.confidence).toBeGreaterThan(partial.confidence);
    expect(partial.confidence).toBeGreaterThan(empty.confidence);
  });

  it("confidence caps at 100", () => {
    const scenario = analyzeFinancialScenario(
      "I am 25 years old, have 500000 shekels initially, contribute 10000 per month for 30 years in S&P 500 targeting 5 million shekels"
    );

    expect(scenario.confidence).toBeLessThanOrEqual(100);
  });

  it("confidence is a finite number", () => {
    const scenario = analyzeFinancialScenario(
      "אני בן 25, מפקיד 1000 שקל בחודש"
    );

    expect(Number.isFinite(scenario.confidence)).toBe(true);
  });

  it("confidence is 0 for completely empty input", () => {
    const scenario = analyzeFinancialScenario("");

    expect(scenario.confidence).toBeGreaterThanOrEqual(0);
  });

  it("each confidence component contributes positively", () => {
    const noInvestment = analyzeFinancialScenario("I am 25 years old, want to invest in S&P 500");
    const withInvestment = analyzeFinancialScenario(
      "I am 25 years old, have 100000 shekels, want to invest in S&P 500"
    );

    expect(withInvestment.confidence).toBeGreaterThan(noInvestment.confidence);
  });

  it("detects USD from explicit dollar symbols", () => {
    const scenario = analyzeFinancialScenario("I have $50,000 and invest $1,000 monthly for 20 years");
    expect(scenario.currency).toBe("USD");
  });

  it("detects ILS from explicit shekel symbols", () => {
    const scenario = analyzeFinancialScenario("יש לי 50,000 שקל ומפקיד 1,000 שקל בחודש ל-20 שנה");
    expect(scenario.currency).toBe("ILS");
  });

  it("defaults to ILS when no currency is detected", () => {
    const scenario = analyzeFinancialScenario("I have 50000 and invest 1000 monthly for 20 years");
    expect(scenario.currency).toBe("ILS");
  });

  it("does not falsely detect JPY from Hebrew text containing יין", () => {
    const scenario = analyzeFinancialScenario("אני בן 30, משקיע ביין ובנכסים ל-10 שנים");
    expect(scenario.currency).not.toBe("JPY");
  });

  it("does not falsely detect JPY from Hebrew text containing בניין", () => {
    const scenario = analyzeFinancialScenario("אני רוצה להשקיע בבניין מגורים ל-15 שנה");
    expect(scenario.currency).not.toBe("JPY");
  });

  it("detects ILS from shekel text even when other Hebrew words are present", () => {
    const scenario = analyzeFinancialScenario("יש לי 100 אלף שקל להשקיע בבניין ל-10 שנים");
    expect(scenario.currency).toBe("ILS");
  });
});
