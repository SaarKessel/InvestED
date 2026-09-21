import { describe, expect, it, vi } from "vitest";
import { createConversationSession } from "./conversationContext";
import { processAIMessage, type AIConversationDependencies } from "./aiConversationService";
import type { MarketAsset } from "@/types";

function asset(symbol: string, changes: number[]): MarketAsset {
  let price = 100;
  const history = changes.map((change, index) => {
    price *= 1 + change;
    return { date: `2026-01-${String(index + 1).padStart(2, "0")}`, price, open: price, high: price, low: price, close: price };
  });
  return { symbol, name: symbol, price, changePercent: changes.at(-1)! * 100, history };
}

function dependencies() {
  const assets: Record<string, MarketAsset> = {
    NVDA: asset("NVDA", [0, .01, -.01, .02]),
    AMD: asset("AMD", [0, .04, -.03, .05]),
  };
  const seen: { symbolCalls: string[]; resolutions: unknown[] } = { symbolCalls: [], resolutions: [] };
  const deps: AIConversationDependencies = {
    fetchAsset: vi.fn(async (symbol) => { seen.symbolCalls.push(symbol); return assets[symbol] ?? null; }),
    enhance: vi.fn(async (_result, resolution) => { seen.resolutions.push(resolution); return null; }),
  };
  return { deps, seen };
}

describe("actual AI orchestration path", () => {
  it("1-2. inherits financial years/rate/currency and final calculation uses changed contribution", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    await processAIMessage(session, "Calculate an investment of 2,000 ILS per month for 15 years at 7%.", "en", deps);
    const turn = await processAIMessage(session, "What if I increase it to 3,000?", "en", deps);
    expect(turn.resolution.scenario).toMatchObject({ monthlyContribution: 3000, years: 15, annualReturnPct: 7, currency: "ILS" });
    expect(turn.result?.scenario).toMatchObject({ monthlyContribution: 3000, years: 15, annualReturnPct: 7, currency: "ILS" });
    expect(turn.result!.projection.totalContributed).toBe(3000 * 12 * 15);
  });

  it("3. changed return reaches the final calculation", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    await processAIMessage(session, "Calculate 2,000 ILS per month for 15 years at 7%.", "en", deps);
    const turn = await processAIMessage(session, "What if the return is 9%?", "en", deps);
    expect(turn.result?.scenario?.annualReturnPct).toBe(9);
    expect(turn.result?.scenario?.annualReturnPct).toBe(9);
    const baseline = await processAIMessage(createConversationSession(), "Calculate 2,000 ILS per month for 15 years at 7%.", "en", deps);
    expect(turn.result!.projection.finalBalance).toBeGreaterThan(baseline.result!.projection.finalBalance);
  });

  it("4. NVDA to AMD reaches actual market analysis", async () => {
    const session = createConversationSession(); const { deps, seen } = dependencies();
    await processAIMessage(session, "What is NVDA's RSI?", "en", deps);
    const turn = await processAIMessage(session, "What about AMD?", "en", deps);
    expect(seen.symbolCalls).toEqual(["NVDA", "AMD"]);
    expect(turn.assetAnalyses[0].symbol).toBe("AMD");
    expect(turn.result?.conversation?.currentAsset).toBe("AMD");
  });

  it("5. profile-fit follow-up changes asset and preserves supplied profile", async () => {
    const session = createConversationSession({ investorProfile: { classification: "balanced", riskScore: 5, summary: "moderate" } });
    const { deps } = dependencies();
    await processAIMessage(session, "How does NVDA fit my investor profile?", "en", deps);
    const turn = await processAIMessage(session, "What about AMD?", "en", deps);
    expect(turn.resolution.currentAsset).toBe("AMD");
    expect(turn.resolution.investorProfileContext).toMatchObject({ classification: "balanced", riskScore: 5 });
  });

  it("6. comparison follow-up preserves and analyzes both symbols", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    await processAIMessage(session, "Compare NVDA and AMD.", "en", deps);
    const turn = await processAIMessage(session, "Which is more volatile?", "en", deps);
    expect(turn.resolution.comparisonSet).toEqual(["NVDA", "AMD"]);
    expect(turn.assetAnalyses.map((item) => item.symbol)).toEqual(["NVDA", "AMD"]);
    expect(turn.assetAnalyses[1].volatilityPct).toBeGreaterThan(turn.assetAnalyses[0].volatilityPct);
  });

  it("7. missing context is returned as a clarification and no analysis is fabricated", async () => {
    const { deps } = dependencies();
    const turn = await processAIMessage(createConversationSession(), "What about AMD?", "en", deps);
    expect(turn.clarification).toBeTruthy(); expect(turn.result).toBeNull();
  });

  it("8. separate AI conversations are isolated", async () => {
    const { deps } = dependencies(); const a = createConversationSession(); const b = createConversationSession();
    await processAIMessage(a, "What is NVDA's RSI?", "en", deps);
    const turn = await processAIMessage(b, "What about AMD?", "en", deps);
    expect(turn.result).toBeNull(); expect(b.getContext().currentAsset).toBeNull();
  });

  it.each([
    ["9. Hebrew", "אם אני משקיע 2,000 שקל בחודש ל-15 שנה?", "ומה אם אני מגדיל ל-3,000?", "he"],
    ["10. English", "Calculate 2,000 ILS per month for 15 years at 7%.", "What if I increase it to 3,000?", "en"],
    ["11. mixed", "מה ה-RSI של NVDA?", "What לגבי AMD מבחינת risk?", "mixed"],
  ])("%s follow-up reaches final orchestration", async (_label, first, followUp, expected) => {
    const session = createConversationSession(); const { deps } = dependencies();
    await processAIMessage(session, first, "en", deps);
    const turn = await processAIMessage(session, followUp, "en", deps);
    expect(turn.resolution.language).toBe(expected);
    expect(turn.result?.conversation?.language).toBe(expected);
  });

  it("12. current-turn information overrides prior context", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    await processAIMessage(session, "Calculate 2,000 USD per month for 15 years at 7%.", "en", deps);
    const turn = await processAIMessage(session, "Use 3,000 ILS per month for 20 years at 9%.", "en", deps);
    expect(turn.result?.scenario).toMatchObject({ monthlyContribution: 3000, years: 20, annualReturnPct: 9, currency: "ILS" });
  });

  it("13. no investor profile is fabricated", async () => {
    const { deps } = dependencies();
    const turn = await processAIMessage(createConversationSession(), "How does NVDA fit my investor profile?", "en", deps);
    expect(turn.result).toBeNull(); expect(turn.resolution.investorProfileContext).toBeNull();
  });

  it("14. existing single-turn AI result remains available", async () => {
    const { deps } = dependencies();
    const turn = await processAIMessage(createConversationSession(), "I prefer moderate risk and a long investment horizon.", "en", deps);
    expect(turn.result?.investor.type).toBeTruthy(); expect(turn.result?.projection).toBeTruthy(); expect(turn.clarification).toBeNull();
  });
});


describe("Phase 3C hardening: investor profile provenance", () => {
  it("financial analysis does not create an investor profile", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    const turn = await processAIMessage(session, "Calculate 2,000 ILS per month for 15 years at 7%.", "en", deps);
    expect(turn.result).not.toBeNull();
    expect(turn.resolution.establishesInvestorProfile).toBe(false);
    expect(session.getContext().investorProfileContext).toBeNull();

    const fit = await processAIMessage(session, "How does NVDA fit my investor profile?", "en", deps);
    expect(fit.result).toBeNull();
    expect(fit.clarification).toBeTruthy();
  });

  it("asset analysis does not create an investor profile", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    const turn = await processAIMessage(session, "What is NVDA's RSI?", "en", deps);
    expect(turn.result).not.toBeNull();
    expect(session.getContext().investorProfileContext).toBeNull();
  });

  it("general self-description without a profile request does not create an investor profile", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    const turn = await processAIMessage(session, "I prefer moderate risk.", "en", deps);
    expect(turn.result).not.toBeNull();
    expect(turn.resolution.establishesInvestorProfile).toBe(false);
    expect(session.getContext().investorProfileContext).toBeNull();
  });

  it("explicit profile analysis establishes the profile for later fit and asset follow-ups", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    const profileTurn = await processAIMessage(
      session,
      "Analyze my investor profile: I am 30 years old, I prefer moderate risk and a long term horizon.",
      "en",
      deps
    );
    expect(profileTurn.clarification).toBeNull();
    expect(profileTurn.resolution.establishesInvestorProfile).toBe(true);
    expect(profileTurn.resolution.investorProfileContext).toBeNull();

    const fit = await processAIMessage(session, "How does NVDA fit my investor profile?", "en", deps);
    expect(fit.clarification).toBeNull();
    expect(fit.result).not.toBeNull();
    expect(fit.resolution.investorProfileContext?.classification).toBe(profileTurn.result!.investor.type);

    const followUp = await processAIMessage(session, "What about AMD?", "en", deps);
    expect(followUp.resolution.currentAsset).toBe("AMD");
    expect(followUp.resolution.investorProfileContext?.classification).toBe(profileTurn.result!.investor.type);
  });

  it("a fit question mentioning one preference word still does not fabricate a profile", async () => {
    const session = createConversationSession(); const { deps } = dependencies();
    const turn = await processAIMessage(session, "Does high risk fit my investor profile?", "en", deps);
    expect(turn.result).toBeNull();
    expect(turn.clarification).toBeTruthy();
    expect(session.getContext().investorProfileContext).toBeNull();
  });

  it("every asset handed to the AI layer carries machine-readable source metadata", async () => {
    const session = createConversationSession(); const { deps, seen } = dependencies();
    await processAIMessage(session, "What is NVDA's RSI?", "en", deps);
    const turn = await processAIMessage(session, "Compare NVDA and AMD.", "en", deps);
    expect(turn.assetAnalyses.length).toBe(2);
    for (const asset of turn.assetAnalyses) {
      expect(asset.dataSource).toBe("mock");
    }
    expect(seen.symbolCalls).toEqual(["NVDA", "NVDA", "AMD"]);
  });
});
