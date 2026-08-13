import { describe, expect, it } from "vitest";
import { analyzeFinancialScenario } from "./calculatorEngine";

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
