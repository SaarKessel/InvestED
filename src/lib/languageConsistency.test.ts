import { describe, expect, it } from "vitest";
import { processAIMessage, type AIConversationDependencies } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";
import { buildRuleBasedAnalysis } from "./analysisService";

const deps: AIConversationDependencies = {
  fetchAsset: async () => null,
  enhance: async () => null,
};

describe("selected-language consistency", () => {
  it("keeps Hebrew UI responses Hebrew when profile input is English", async () => {
    const turn = await processAIMessage(
      createConversationSession(),
      "I am 30, a beginner, prefer low risk and invest long term",
      "he",
      deps
    );
    expect(turn.result?.investor.reason).toMatch(/[א-ת]/);
    expect(turn.result?.horizonExplanation).toMatch(/[א-ת]/);
    expect(turn.result?.allocation.map((item) => item.name).join(" ")).toMatch(/[א-ת]/);
    expect(turn.result?.explainability.signals.every((signal) => !/^AI |Insight$/.test(signal.title))).toBe(true);
  });

  it("keeps English UI responses English when profile input is Hebrew", async () => {
    const turn = await processAIMessage(
      createConversationSession(),
      "אני בן 30, מתחיל, מעדיף סיכון נמוך ומשקיע לטווח ארוך",
      "en",
      deps
    );
    expect(turn.result?.investor.reason).not.toMatch(/[א-ת]/);
    expect(turn.result?.horizonExplanation).not.toMatch(/[א-ת]/);
    expect(turn.result?.allocation.map((item) => item.name).join(" ")).not.toMatch(/[א-ת]/);
  });


  it("localizes deterministic profile fields", () => {
    const he = buildRuleBasedAnalysis("סיכון נמוך טווח ארוך", "he");
    const en = buildRuleBasedAnalysis("low risk long term", "en");
    expect(he.investor.reason).toMatch(/[א-ת]/);
    expect(he.aiNarration.profileSummary).toMatch(/[א-ת]/);
    expect(en.investor.reason).not.toMatch(/[א-ת]/);
  });
});
