import { describe, it, expect } from "vitest";

import {
  createConversationSession,
  detectConversationLanguage,
  extractAssets,
} from "./conversationContext";

import {
  analyzeFinancialScenario,
  computeProjection,
} from "./calculatorEngine";

import {
  extractProfileFlags,
  computeRiskScore,
  classifyInvestor,
} from "./riskEngine";

import { analyzeInvestor } from "./financialAI";

// =====================================================
// Phase 3C — Conversation Context & Multi-Turn Understanding
// =====================================================

describe("conversationContext — language detection", () => {
  it("detects Hebrew", () => {
    expect(detectConversationLanguage("אם אני משקיע 2,000 שקל בחודש?")).toBe("he");
  });

  it("detects English", () => {
    expect(detectConversationLanguage("What if the return is 9%?")).toBe("en");
  });

  it("treats a Hebrew turn with a ticker as Hebrew, not mixed", () => {
    expect(detectConversationLanguage("ומה לגבי AMD?")).toBe("he");
  });

  it("detects mixed Hebrew/English", () => {
    expect(detectConversationLanguage("ומה לגבי AMD מבחינת risk?")).toBe("mixed");
  });
});

describe("conversationContext — entity extraction", () => {
  it("extracts known keyword assets", () => {
    expect(extractAssets("What is NVDA's RSI?")).toEqual(["NVDA"]);
  });

  it("extracts ticker-only assets outside the keyword database", () => {
    expect(extractAssets("What about AMD?")).toEqual(["AMD"]);
  });

  it("keeps comparison order and does not treat RSI as an asset", () => {
    expect(extractAssets("Compare NVDA and AMD by RSI")).toEqual(["NVDA", "AMD"]);
  });
});

describe("conversationContext — financial follow-ups", () => {
  it("1. changes monthly contribution while preserving the period (Hebrew)", () => {
    const session = createConversationSession();

    const first = session.processTurn("אם אני משקיע 2,000 שקל בחודש ל-15 שנה?");
    expect(first.status).toBe("resolved");
    expect(first.intent).toBe("financial_projection");
    expect(first.scenario?.monthlyContribution).toBe(2000);
    expect(first.scenario?.years).toBe(15);

    const followUp = session.processTurn("ומה אם אני מגדיל ל-3,000?");
    expect(followUp.status).toBe("resolved");
    expect(followUp.scenario?.monthlyContribution).toBe(3000);
    expect(followUp.scenario?.years).toBe(15);
    expect(followUp.overrides).toContain("monthlyContribution");
    expect(followUp.inheritedFromContext).toContain("years");
  });

  it("2. changes the return rate while preserving contribution, period and currency (English)", () => {
    const session = createConversationSession();

    session.processTurn(
      "Calculate an investment of 2,000 ILS per month for 15 years at 7%."
    );

    const followUp = session.processTurn("What if the return is 9%?");
    expect(followUp.status).toBe("resolved");
    expect(followUp.scenario?.annualReturnPct).toBe(9);
    expect(followUp.scenario?.monthlyContribution).toBe(2000);
    expect(followUp.scenario?.years).toBe(15);
    expect(followUp.scenario?.currency).toBe("ILS");
    expect(followUp.overrides).toContain("annualReturnPct");
    expect(followUp.inheritedFromContext).toEqual(
      expect.arrayContaining(["monthlyContribution", "years", "currency"])
    );
  });

  it("3. keeps later follow-ups anchored to the latest known parameters", () => {
    const session = createConversationSession();

    session.processTurn("אם אני משקיע 2,000 שקל בחודש ל-15 שנה?");
    session.processTurn("ומה אם אני מגדיל ל-3,000?");

    const third = session.processTurn("ומה אם אני משנה ל-20 שנה?");
    expect(third.status).toBe("resolved");
    expect(third.scenario?.years).toBe(20);
    // monthly contribution from the previous follow-up is preserved
    expect(third.scenario?.monthlyContribution).toBe(3000);
  });

  it("does not silently alter currency on a follow-up", () => {
    const session = createConversationSession();

    session.processTurn("Calculate 2,000 USD per month for 10 years at 7%.");
    const followUp = session.processTurn("What if the return is 9%?");
    expect(followUp.scenario?.currency).toBe("USD");

    const explicitChange = session.processTurn("And in ILS instead?");
    expect(explicitChange.scenario?.currency).toBe("ILS");
  });
});

describe("conversationContext — asset follow-ups", () => {
  it("4. switches the current asset NVDA → AMD without reusing NVDA", () => {
    const session = createConversationSession();

    const first = session.processTurn("What is NVDA's RSI?");
    expect(first.status).toBe("resolved");
    expect(first.currentAsset).toBe("NVDA");
    expect(first.intent).toBe("asset_analysis");

    const followUp = session.processTurn("What about AMD?");
    expect(followUp.status).toBe("resolved");
    expect(followUp.currentAsset).toBe("AMD");
    expect(followUp.intent).toBe("asset_analysis");
    expect(session.getContext().currentAsset).toBe("AMD");
  });

  it("5. keeps the investor profile unchanged on an asset follow-up", () => {
    const profile = {
      classification: "balanced",
      riskScore: 5,
      summary: "Medium horizon, moderate risk tolerance",
    };
    const session = createConversationSession({ investorProfile: profile });

    const first = session.processTurn("How does NVDA fit my investor profile?");
    expect(first.status).toBe("resolved");
    expect(first.intent).toBe("investor_profile_fit");
    expect(first.currentAsset).toBe("NVDA");
    expect(first.investorProfileContext).toEqual(profile);

    const followUp = session.processTurn("What about AMD?");
    expect(followUp.status).toBe("resolved");
    expect(followUp.currentAsset).toBe("AMD");
    expect(followUp.intent).toBe("investor_profile_fit");
    expect(followUp.investorProfileContext).toEqual(profile);
  });

  it("asks for clarification instead of inventing an investor profile", () => {
    const session = createConversationSession();

    const turn = session.processTurn("How does NVDA fit my investor profile?");
    expect(turn.status).toBe("needs_clarification");
    expect(turn.clarification?.missing).toContain("investor_profile");
    expect(turn.investorProfileContext).toBeNull();
  });
});

describe("conversationContext — comparison follow-ups", () => {
  it("6. keeps the comparison set on a relative follow-up", () => {
    const session = createConversationSession();

    const first = session.processTurn("Compare NVDA and AMD.");
    expect(first.status).toBe("resolved");
    expect(first.intent).toBe("comparison");
    expect(first.comparisonSet).toEqual(["NVDA", "AMD"]);

    const followUp = session.processTurn("Which is more volatile?");
    expect(followUp.status).toBe("resolved");
    expect(followUp.intent).toBe("comparison");
    expect(followUp.comparisonSet).toEqual(["NVDA", "AMD"]);
  });
});

describe("conversationContext — missing context", () => {
  it("7. asks for clarification on a follow-up with no prior context and never invents an asset", () => {
    const session = createConversationSession();

    const turn = session.processTurn("What about AMD?");
    expect(turn.status).toBe("needs_clarification");
    expect(turn.clarification?.missing).toContain("prior_context");
    expect(turn.currentAsset).not.toBe("NVDA");

    // The session must not record fabricated context.
    const context = session.getContext();
    expect(context.currentAsset).toBeNull();
    expect(context.currentIntent).toBeNull();
  });
});

describe("conversationContext — session isolation", () => {
  it("8. never shares context between sessions", () => {
    const sessionA = createConversationSession();
    const sessionB = createConversationSession();

    sessionA.processTurn("What is NVDA's RSI?");

    const turnInB = sessionB.processTurn("What about AMD?");
    expect(turnInB.status).toBe("needs_clarification");

    const turnInA = sessionA.processTurn("What about AMD?");
    expect(turnInA.status).toBe("resolved");
    expect(turnInA.currentAsset).toBe("AMD");

    expect(sessionA.getContext().currentAsset).toBe("AMD");
    expect(sessionB.getContext().currentAsset).toBeNull();
  });
});

describe("conversationContext — precedence", () => {
  it("9. explicit current-turn information overrides previous context", () => {
    const session = createConversationSession();

    session.processTurn("What is NVDA's RSI?");
    const override = session.processTurn("Actually, analyze AMD.");
    expect(override.status).toBe("resolved");
    expect(override.currentAsset).toBe("AMD");

    const context = session.getContext();
    expect(context.currentAsset).toBe("AMD");
  });

  it("a new standalone scenario does not inherit previous parameters", () => {
    const session = createConversationSession();

    session.processTurn("אם אני משקיע 2,000 שקל בחודש ל-15 שנה?");
    const standalone = session.processTurn("אני משקיע 5,000 שקל בחודש ל-20 שנה");

    expect(standalone.status).toBe("resolved");
    expect(standalone.scenario?.monthlyContribution).toBe(5000);
    expect(standalone.scenario?.years).toBe(20);
    expect(standalone.inheritedFromContext).not.toContain("monthlyContribution");
  });
});

describe("conversationContext — multilingual follow-ups", () => {
  it("10. resolves a Hebrew follow-up", () => {
    const session = createConversationSession();
    session.processTurn("מה ה-RSI של NVDA?");

    const followUp = session.processTurn("ומה לגבי AMD?");
    expect(followUp.status).toBe("resolved");
    expect(followUp.currentAsset).toBe("AMD");
    expect(followUp.language).toBe("he");
  });

  it("11. resolves an English follow-up", () => {
    const session = createConversationSession();
    session.processTurn("What is NVDA's RSI?");

    const followUp = session.processTurn("What about AMD?");
    expect(followUp.status).toBe("resolved");
    expect(followUp.currentAsset).toBe("AMD");
    expect(followUp.language).toBe("en");
  });

  it("12. resolves a mixed Hebrew/English follow-up", () => {
    const session = createConversationSession();
    session.processTurn("מה ה-RSI של NVDA?");

    const followUp = session.processTurn("ומה לגבי AMD מבחינת risk?");
    expect(followUp.status).toBe("resolved");
    expect(followUp.currentAsset).toBe("AMD");
    expect(followUp.language).toBe("mixed");
    expect(followUp.intent).toBe("asset_analysis");
  });
});

describe("conversationContext — determinism of calculations", () => {
  it("resolved scenarios feed the unchanged projection engine deterministically", () => {
    const session = createConversationSession();
    session.processTurn(
      "Calculate an investment of 2,000 ILS per month for 15 years at 7%."
    );
    const followUp = session.processTurn("What if the return is 9%?");

    const scenario = followUp.scenario;
    expect(scenario).not.toBeNull();

    const viaContext = computeProjection(
      scenario!.initialInvestment,
      scenario!.monthlyContribution,
      scenario!.years,
      scenario!.annualReturnPct,
      undefined,
      scenario!.currency
    );
    const direct = computeProjection(0, 2000, 15, 9, undefined, "ILS");
    expect(viaContext.finalBalance).toBe(direct.finalBalance);
  });
});

// =====================================================
// Regression guards: existing engines are untouched
// =====================================================

describe("Phase 3C regression — existing behavior unchanged", () => {
  it("13. existing Investor Profile behavior remains unchanged", () => {
    const text = "אני בן 27, מתחיל ומוכן לסיכון גבוה לטווח ארוך";
    const flags = extractProfileFlags(text);
    const score = computeRiskScore(flags);
    const investor = classifyInvestor(score);

    expect(flags.age).toBe(27);
    expect(investor.type).toBe(classifyInvestor(computeRiskScore(flags)).type);

    const aiResult = analyzeInvestor(text);
    expect(aiResult.profile).toEqual(flags);
    expect(aiResult.risk.score).toBe(score);
  });

  it("14. existing Financial Engine behavior remains unchanged", () => {
    const scenario = analyzeFinancialScenario(
      "יש לי 300 אלף להשקיע ל-15 שנה ואני מוסיף 2000 שקל בחודש במדד S&P 500"
    );
    expect(scenario.initialInvestment).toBe(300000);
    expect(scenario.monthlyContribution).toBe(2000);
    expect(scenario.years).toBe(15);
    expect(scenario.currency).toBe("ILS");

    // Same input → same output (deterministic engine untouched).
    const again = analyzeFinancialScenario(
      "יש לי 300 אלף להשקיע ל-15 שנה ואני מוסיף 2000 שקל בחודש במדד S&P 500"
    );
    expect(again).toEqual(scenario);
  });
});
