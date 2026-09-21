import { describe, expect, it, vi } from "vitest";
import type { MarketAsset } from "@/types";
import { processAIMessage, type AIConversationDependencies } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";

function fixture(symbol: string, source: "yahoo_finance" | "mock" = "yahoo_finance"): MarketAsset {
  return {
    symbol,
    name: symbol,
    price: 100,
    changePercent: 2,
    currency: "USD",
    history: [100, 101, 100, 103].map((price, i) => ({ date: `2026-01-0${i + 1}`, price, open: price, high: price, low: price, close: price })),
    dataSource: source,
    timestamp: "2026-09-21T07:00:00Z",
    freshness: source === "mock" ? "simulated" : "current",
    isMock: source === "mock",
  };
}

function setup(overrides: Partial<Record<string, MarketAsset | null>> = {}) {
  const fetchAsset = vi.fn(async (symbol: string) => (symbol in overrides ? overrides[symbol]! : fixture(symbol)));
  const deps: AIConversationDependencies = { fetchAsset, enhance: vi.fn(async () => null) };
  return { deps, fetchAsset };
}

describe("Phase 6 Copilot strategy routing", () => {
  it("routes an English strategy question to the Strategy Engine", async () => {
    const { deps, fetchAsset } = setup();
    const turn = await processAIMessage(createConversationSession(), "What is dividend investing?", "en", deps);
    expect(turn.resolution.intent).toBe("strategy_question");
    expect(turn.response.strategies).toEqual(["dividend"]);
    expect(turn.response.text).toContain("Dividend Investing");
    expect(turn.response.text).toContain("education only");
    expect(turn.response.dataDependencies).toContain("strategy_engine");
    expect(fetchAsset).not.toHaveBeenCalled();
  });

  it("routes a Hebrew strategy question and answers in Hebrew", async () => {
    const { deps } = setup();
    const turn = await processAIMessage(createConversationSession(), "מהי אסטרטגיית מיצוע עלויות?", "he", deps);
    expect(turn.resolution.intent).toBe("strategy_question");
    expect(turn.response.strategies).toEqual(["dollar-cost-averaging"]);
    expect(turn.response.text).toContain("מיצוע עלויות");
    expect(turn.response.text).toContain("לצורכי למידה בלבד");
    expect(turn.response.language).toBe("he");
  });

  it("compares strategies inside the conversation", async () => {
    const { deps } = setup();
    const turn = await processAIMessage(createConversationSession(), "Compare value investing and growth investing strategies", "en", deps);
    expect(turn.resolution.intent).toBe("strategy_question");
    expect(turn.response.strategies).toEqual(["value", "growth"]);
    expect(turn.response.text).toContain("Value Investing");
    expect(turn.response.text).toContain("Growth Investing");
    expect(turn.response.text).toContain("education only");
  });

  it("carries the active strategy into follow-up questions", async () => {
    const session = createConversationSession();
    const { deps } = setup();
    await processAIMessage(session, "What is momentum investing?", "en", deps);
    const followUp = await processAIMessage(session, "And what about its risk level?", "en", deps);
    expect(followUp.resolution.intent).toBe("strategy_question");
    expect(followUp.response.strategies).toEqual(["momentum"]);
  });

  it("asks which strategy when none can be resolved", async () => {
    const { deps } = setup();
    const turn = await processAIMessage(createConversationSession(), "Tell me about a strategy", "en", deps);
    expect(turn.resolution.intent).toBe("strategy_question");
    expect(turn.response.clarification?.missing).toContain("strategy_selection");
  });

  it("evaluates profile fit only against a genuine supplied profile", async () => {
    const { deps } = setup();
    const missing = await processAIMessage(createConversationSession(), "Does momentum investing fit my profile?", "en", deps);
    expect(missing.response.clarification?.missing).toContain("investor_profile");

    const session = createConversationSession({
      investorProfile: { classification: "growth", riskScore: 8, summary: "high risk tolerance" },
    });
    const present = await processAIMessage(session, "Does momentum investing fit my profile?", "en", deps);
    expect(present.response.strategyFit?.status).toBe("assessed");
    expect(present.response.strategyFit?.fit).toBe("high");
    expect(present.response.text).toMatch(/not personalized investment advice/i);
  });

  it("loads market examples with provenance only when asked", async () => {
    const session = createConversationSession();
    const { deps, fetchAsset } = setup();
    const plain = await processAIMessage(session, "What is index investing?", "en", deps);
    expect(fetchAsset).not.toHaveBeenCalled();
    expect(plain.response.assets).toEqual([]);

    const withMarket = await processAIMessage(session, "Show me market examples and prices for index investing", "en", deps);
    expect(withMarket.response.strategies).toEqual(["long-term-index"]);
    expect(withMarket.response.assets.length).toBeGreaterThan(0);
    expect(withMarket.response.text).toContain("Source: yahoo finance");
    expect(withMarket.response.dataSources).toContain("yahoo_finance");
  });

  it("reports unavailable market examples without inventing values", async () => {
    const { deps } = setup({ VTI: null, VOO: null });
    const turn = await processAIMessage(createConversationSession(), "Show me market prices for dollar cost averaging", "en", deps);
    expect(turn.response.strategies).toEqual(["dollar-cost-averaging"]);
    expect(turn.response.assets).toEqual([]);
    expect(turn.response.text).toMatch(/unavailable/i);
  });

  it("keeps strategy context isolated between sessions", async () => {
    const { deps } = setup();
    const a = createConversationSession();
    const b = createConversationSession();
    await processAIMessage(a, "What is dividend investing?", "en", deps);
    const turn = await processAIMessage(b, "And what about it?", "en", deps);
    // Session b never discussed a strategy; the follow-up cannot
    // borrow session a's strategy focus.
    expect(turn.response.strategies ?? []).not.toContain("dividend");
  });

  it("does not turn an explicit financial scenario mentioning an index into a strategy turn", async () => {
    const { deps } = setup();
    const turn = await processAIMessage(createConversationSession(), "Calculate 2,000 ILS per month for 15 years at 7% in a broad index fund", "en", deps);
    expect(turn.resolution.intent).toBe("financial_projection");
    expect(turn.response.strategies).toEqual([]);
  });

  it("preserves mixed-language strategy answers", async () => {
    const { deps } = setup();
    const turn = await processAIMessage(createConversationSession(), "תסביר מה זה momentum investing", "en", deps);
    expect(turn.response.intent).toBe("strategy_question");
    expect(turn.response.language).toBe("mixed");
    expect(turn.response.strategies).toEqual(["momentum"]);
  });
});
