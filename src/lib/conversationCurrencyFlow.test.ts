import { describe, expect, it } from "vitest";

import { createConversationSession } from "./conversationContext";
import {
  analyzeFinancialScenarioWithProjection,
  computeProjection,
  type UnifiedFinancialAnalysis,
} from "./calculatorEngine";

type Language = "he" | "en";

/** Mirrors CalculatorPage's final calculation assembly without rendering React. */
function runTurn(
  session: ReturnType<typeof createConversationSession>,
  text: string,
  uiCurrency: string,
  language: Language = "en"
) {
  const resolution = session.processTurn(text, { fallbackCurrency: uiCurrency });
  expect(resolution.status).toBe("resolved");

  const parsed = analyzeFinancialScenarioWithProjection(text, language);
  // Mirrors CalculatorPage: context-resolved scenario wins; the UI
  // selection only fills a non-financial turn; the UI state never
  // overwrites the resolved currency afterwards.
  const scenario = resolution.scenario ?? { ...parsed.scenario, currency: uiCurrency };
  const resolvedCurrency = scenario.currency ?? uiCurrency;
  const projection = {
    ...computeProjection(
      scenario.initialInvestment,
      scenario.monthlyContribution,
      scenario.years,
      scenario.annualReturnPct,
      undefined,
      resolvedCurrency
    ),
    currency: resolvedCurrency,
  };

  const analysis: UnifiedFinancialAnalysis = {
    ...parsed,
    scenario: { ...scenario, currency: resolvedCurrency },
    projection,
  };

  return { resolution, projection, analysis };
}

function expectOneCurrency(
  result: ReturnType<typeof runTurn>,
  expectedCurrency: string
) {
  expect(result.resolution.financialParameters.currency).toBe(expectedCurrency);
  expect(result.resolution.scenario?.currency).toBe(expectedCurrency);
  expect(result.projection.currency).toBe(expectedCurrency);
  expect(result.analysis.scenario.currency).toBe(expectedCurrency);
}

describe("Calculator conversation currency precedence", () => {
  it("preserves explicit USD through a follow-up even when the UI is ILS", () => {
    const session = createConversationSession();
    runTurn(session, "Calculate 2,000 USD per month for 10 years at 7%.", "ILS");

    const followUp = runTurn(session, "What if the return is 9%?", "ILS");
    expectOneCurrency(followUp, "USD");
  });

  it("preserves explicit ILS through a follow-up even when the UI is USD", () => {
    const session = createConversationSession();
    runTurn(session, "Calculate 2,000 ILS per month for 10 years at 7%.", "USD");

    const followUp = runTurn(session, "What if the return is 9%?", "USD");
    expectOneCurrency(followUp, "ILS");
  });

  it("lets a current-turn explicit ILS change override USD context", () => {
    const session = createConversationSession();
    runTurn(session, "Calculate 2,000 USD per month for 10 years at 7%.", "EUR");

    const changed = runTurn(session, "And in ILS instead?", "EUR");
    expectOneCurrency(changed, "ILS");
  });

  it("uses the UI currency for a standalone calculation with no currency", () => {
    const session = createConversationSession();

    const standalone = runTurn(
      session,
      "Calculate 2,000 per month for 10 years at 7%.",
      "EUR"
    );
    expectOneCurrency(standalone, "EUR");
  });

  it("inherits the UI fallback currency into later follow-ups", () => {
    const session = createConversationSession();
    runTurn(session, "Calculate 2,000 per month for 10 years at 7%.", "USD");

    const followUp = runTurn(session, "What if the return is 9%?", "ILS");
    expectOneCurrency(followUp, "USD");
  });

  it("keeps context resolution, projection and final analysis on one currency", () => {
    const session = createConversationSession();
    runTurn(session, "Calculate 2,000 USD per month for 10 years at 7%.", "ILS");

    const followUp = runTurn(session, "What if the return is 9%?", "EUR");
    expectOneCurrency(followUp, "USD");
    expect(followUp.projection.series.every(point => point.currency === "USD")).toBe(true);
  });
});
