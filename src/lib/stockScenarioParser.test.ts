import { describe, expect, it } from "vitest";
import { parseStockScenario } from "./stockScenarioParser";

describe("parseStockScenario", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");

  it("parses monthly Apple share purchases", () => {
    const scenario = parseStockScenario(
      "אני קונה 10 מניות אפל כל חודש במשך 20 שנה",
      now
    );

    expect(scenario).toMatchObject({
      symbol: "AAPL",
      mode: "projection",
      years: 20,
      contribution: {
        cadence: "monthly_shares",
        monthlyShares: 10,
      },
      ambiguities: [],
    });
  });

  it("parses monthly S&P 500 contributions using VOO as the documented proxy", () => {
    const scenario = parseStockScenario(
      "השקעתי 5000 שקל בחודש ב-S&P500",
      now
    );

    expect(scenario).toMatchObject({
      symbol: "VOO",
      contribution: {
        cadence: "monthly_cash",
        monthlyContribution: 5000,
      },
    });

    expect(scenario.ambiguities).toContain(
      "לא זוהה אופק זמן תקין."
    );
  });

  it("parses a historical VOO lump-sum scenario", () => {
    const scenario = parseStockScenario(
      "אם הייתי משקיע 100 אלף שקל ב-VOO לפני 10 שנים",
      now
    );

    expect(scenario).toMatchObject({
      symbol: "VOO",
      mode: "historical",
      years: 10,
      startDate: "2016-07-27",
      contribution: {
        cadence: "one_time",
        initialInvestment: 100000,
      },
      ambiguities: [],
    });
  });

  it("reports missing required information", () => {
    const scenario = parseStockScenario(
      "אני רוצה להשקיע",
      now
    );

    expect(scenario.ambiguities).toEqual([
      "לא זוהה נכס או סימול מסחר.",
      "לא זוהה אופק זמן תקין.",
      "לא זוהה סכום השקעה.",
    ]);
  });
});

describe("Mixed language scenarios", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");

  it("parses Hebrew text with English asset names", () => {
    const scenario = parseStockScenario(
      "אני רוצה להשקיע ב-Apple למשך 15 שנה",
      now
    );

    expect(scenario.symbol).toBe("AAPL");
    expect(scenario.years).toBe(15);
    expect(scenario.mode).toBe("projection");
  });

  it("parses English text with Hebrew time expressions", () => {
    const scenario = parseStockScenario(
      "I want to invest in VOO for 20 שנים",
      now
    );

    expect(scenario.symbol).toBe("VOO");
    expect(scenario.years).toBe(20);
  });

  it("parses mixed language with cash contribution", () => {
    const scenario = parseStockScenario(
      "I want to invest 5000 שקל בחודש in VOO for 10 שנים",
      now
    );

    expect(scenario.symbol).toBe("VOO");
    expect(scenario.contribution.cadence).toBe("monthly_cash");
    expect(scenario.contribution.monthlyContribution).toBe(5000);
  });
});

describe("Missing information handling", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");

  it("reports missing asset when no stock mentioned", () => {
    const scenario = parseStockScenario(
      "אני רוצה להשקיע למשך 10 שנים",
      now
    );

    expect(scenario.symbol).toBeNull();
    expect(scenario.ambiguities).toContain("לא זוהה נכס או סימול מסחר.");
  });

  it("reports missing years when no time specified", () => {
    const scenario = parseStockScenario(
      "I want to invest in Apple",
      now
    );

    expect(scenario.ambiguities).toContain("לא זוהה אופק זמן תקין.");
    expect(scenario.years).toBe(10);
  });

  it("reports missing amount when no money mentioned", () => {
    const scenario = parseStockScenario(
      "I want to buy Apple stock monthly",
      now
    );

    expect(scenario.ambiguities).toContain("לא זוהה סכום השקעה.");
  });

  it("returns multiple ambiguities for completely empty input", () => {
    const scenario = parseStockScenario(
      "",
      now
    );

    expect(scenario.ambiguities.length).toBeGreaterThanOrEqual(2);
  });

  it("does not report amount ambiguity when monthly shares are detected", () => {
    const scenario = parseStockScenario(
      "I buy 10 shares of Apple monthly for 5 years",
      now
    );

    expect(scenario.ambiguities).not.toContain("לא זוהה סכום השקעה.");
    expect(scenario.contribution.cadence).toBe("monthly_shares");
    expect(scenario.contribution.monthlyShares).toBe(10);
  });
});

describe("English-only scenarios", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");

  it("parses monthly Apple purchases", () => {
    const scenario = parseStockScenario(
      "I buy 5 shares of Apple monthly for 20 years",
      now
    );

    expect(scenario.symbol).toBe("AAPL");
    expect(scenario.contribution.cadence).toBe("monthly_shares");
    expect(scenario.contribution.monthlyShares).toBe(5);
    expect(scenario.years).toBe(20);
    expect(scenario.mode).toBe("projection");
  });

  it("parses monthly S&P 500 cash contributions", () => {
    const scenario = parseStockScenario(
      "I invest 3000 monthly in S&P 500 for 15 years",
      now
    );

    expect(scenario.symbol).toBe("VOO");
    expect(scenario.contribution.cadence).toBe("monthly_cash");
    expect(scenario.contribution.monthlyContribution).toBe(3000);
    expect(scenario.ambiguities).toContain("S&P 500 זוהה באמצעות VOO כפרוקסי");
  });

  it("parses historical backtest scenario", () => {
    const scenario = parseStockScenario(
      "If I backtest 100000 in VOO 5 years ago",
      now
    );

    expect(scenario.symbol).toBe("VOO");
    expect(scenario.mode).toBe("historical");
    expect(scenario.years).toBe(5);
    expect(scenario.contribution.cadence).toBe("one_time");
    expect(scenario.contribution.initialInvestment).toBe(100000);
  });

  it("detects QQQ ticker as asset", () => {
    const scenario = parseStockScenario(
      "I invest in QQQ for 10 years",
      now
    );

    expect(scenario.symbol).toBe("QQQ");
    expect(scenario.years).toBe(10);
  });

  it("detects SPY ticker as asset", () => {
    const scenario = parseStockScenario(
      "I invest 5000 monthly in SPY for 25 years",
      now
    );

    expect(scenario.symbol).toBe("SPY");
    expect(scenario.contribution.monthlyContribution).toBe(5000);
    expect(scenario.years).toBe(25);
  });
});

describe("Hebrew-only scenarios", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");

  it("parses monthly Apple purchases in Hebrew", () => {
    const scenario = parseStockScenario(
      "אני קונה 8 מניות אפל כל חודש במשך 18 שנה",
      now
    );

    expect(scenario.symbol).toBe("AAPL");
    expect(scenario.contribution.cadence).toBe("monthly_shares");
    expect(scenario.contribution.monthlyShares).toBe(8);
    expect(scenario.years).toBe(18);
  });

  it("parses S&P 500 projection in Hebrew", () => {
    const scenario = parseStockScenario(
      "השקעתי 4000 שקל בחודש ב-S&P500",
      now
    );

    expect(scenario.symbol).toBe("VOO");
    expect(scenario.contribution.cadence).toBe("monthly_cash");
    expect(scenario.contribution.monthlyContribution).toBe(4000);
    expect(scenario.ambiguities).toContain("לא זוהה אופק זמן תקין.");
  });

  it("parses historical VOO lump-sum in Hebrew", () => {
    const scenario = parseStockScenario(
      "אם הייתי משקיע 50 אלף שקל ב-VOO לפני 7 שנים",
      now
    );

    expect(scenario.symbol).toBe("VOO");
    expect(scenario.mode).toBe("historical");
    expect(scenario.years).toBe(7);
    expect(scenario.contribution.cadence).toBe("one_time");
    expect(scenario.contribution.initialInvestment).toBe(50000);
  });

  it("detects מדד as QQQ alias", () => {
    const scenario = parseStockScenario(
      "אני משקיע ב-מדד למשך 12 שנה",
      now
    );

    expect(scenario.symbol).toBe("QQQ");
    expect(scenario.years).toBe(12);
  });
});
