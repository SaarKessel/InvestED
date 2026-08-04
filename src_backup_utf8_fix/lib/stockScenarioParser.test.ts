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

