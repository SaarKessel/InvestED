// ---------------------------------------------------------------------------
// Chat benchmark: the quality bar for the AI chat centerpiece.
//
// Covers free-form and tricky financial questions in both languages:
// concept definitions, holdings value, buying power, multi-turn follow-ups,
// prediction requests, guarantee requests, off-topic questions and
// unavailable data. Every case asserts an HONEST response — grounded in
// data or explicitly declining, never fabricating.
// ---------------------------------------------------------------------------
import { describe, expect, it, vi } from "vitest";
import type { MarketAsset } from "@/types";
import { processAIMessage, type AIConversationDependencies } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";

function fixture(symbol: string, source: "yahoo_finance" | "mock" = "yahoo_finance"): MarketAsset {
  return {
    symbol,
    name: symbol,
    price: 103,
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
  const deps: AIConversationDependencies = {
    fetchAsset: vi.fn(async (symbol: string) => (symbol in overrides ? overrides[symbol]! : fixture(symbol))),
    enhance: vi.fn(async () => null),
  };
  return deps;
}

describe("chat benchmark — concepts", () => {
  it.each([
    ["מהי קרן נאמנות?", "he", "קרן נאמנות"],
    ["What is a mutual fund?", "en", "mutual fund"],
    ["מה ההבדל בין קרן סל לקרן נאמנות?", "he", "קרן סל"],
    ["what is compound interest?", "en", "Compound interest"],
    ["מה זה RSI?", "he", "RSI"],
    ["what is diversification", "en", "Diversification"],
  ] as const)("answers %s with concept content", async (message, language, expected) => {
    const turn = await processAIMessage(createConversationSession(), message, language, setup());
    expect(turn.response.text).toContain(expected);
    expect(turn.response.clarification).toBeNull();
  });

  it("explains both sides of a difference question with labels", async () => {
    const turn = await processAIMessage(createConversationSession(), "מה ההבדל בין קרן נאמנות לקרן סל?", "he", setup());
    expect(turn.response.text).toContain("קרן נאמנות:");
    expect(turn.response.text).toContain("קרן סל");
  });
});

describe("chat benchmark — market calculations", () => {
  it("values a holding from real data with provenance and education note", async () => {
    const turn = await processAIMessage(createConversationSession(), "כמה שווה 199 מניות של TSLA?", "he", setup());
    expect(turn.response.text).toContain("199");
    expect(turn.response.text).toContain("TSLA");
    expect(turn.response.text).toContain("20,497");
    expect(turn.response.text).toContain("לא ייעוץ");
  });

  it("refuses to value a holding on unavailable data", async () => {
    const turn = await processAIMessage(createConversationSession(), "how much are 10 VOO shares worth?", "en", setup({ VOO: null }));
    expect(turn.response.text).not.toMatch(/\d+\.\d{2}/);
    expect(turn.response.text.toLowerCase()).toMatch(/unavailable|not available/);
  });
});

describe("chat benchmark — tricky questions", () => {
  it("declines price predictions honestly, in English", async () => {
    const turn = await processAIMessage(createConversationSession(), "will TSLA go up tomorrow?", "en", setup());
    expect(turn.response.text).toMatch(/can't predict/);
    expect(turn.response.text).toContain("TSLA");
    expect(turn.response.text).toMatch(/103\.00/);
  });

  it("declines price predictions honestly, in Hebrew", async () => {
    const turn = await processAIMessage(createConversationSession(), "מה תהיה הריבית בעוד שנה?", "he", setup());
    expect(turn.response.text).toContain("לא יכולה לנבא");
  });

  it("rejects guaranteed-return requests with the fraud red-flag education", async () => {
    const turn = await processAIMessage(createConversationSession(), "give me a guaranteed investment", "en", setup());
    expect(turn.response.text).toMatch(/no such thing as a guaranteed/);
    expect(turn.response.text).not.toContain("projected final balance");
  });

  it("rejects guaranteed-return requests in Hebrew too", async () => {
    const turn = await processAIMessage(createConversationSession(), "מה השקעה בטוחה עם תשואה גבוהה?", "he", setup());
    expect(turn.response.text).toContain("אין דבר כזה");
    expect(turn.response.text).not.toContain("יתרה חזויה של 0");
  });

  it("never renders a projection of zeros for input-less financial questions", async () => {
    const turn = await processAIMessage(createConversationSession(), "what will my savings be worth?", "en", setup());
    expect(turn.response.text).not.toMatch(/final balance 0/);
    expect(turn.response.text).toMatch(/need the real inputs/);
  });

  it("answers off-topic questions with an honest out-of-scope note, in Hebrew", async () => {
    const turn = await processAIMessage(createConversationSession(), "מה מזג האוויר בתל אביב?", "he", setup());
    expect(turn.response.text).toContain("אין לי עליה מענה מהימן");
  });

  it("answers off-topic questions with an honest out-of-scope note, in English", async () => {
    const turn = await processAIMessage(createConversationSession(), "who will win the election?", "en", setup());
    expect(turn.response.text).toContain("outside what I can reliably answer");
  });

  it("keeps the buy/sell boundary for advice-seeking questions", async () => {
    const turn = await processAIMessage(createConversationSession(), "should I buy NVDA now?", "en", setup());
    expect(turn.response.text).toMatch(/cannot tell you what to buy or sell/);
  });
});

describe("chat benchmark — multi-turn follow-ups", () => {
  it("reuses the previous buying-power question on a short follow-up", async () => {
    const session = createConversationSession();
    const deps = setup();
    await processAIMessage(session, "כמה מניות של VOO אפשר לקנות ב-10,000 דולר?", "he", deps);
    const turn = await processAIMessage(session, "ועם 20 אלף?", "he", deps);
    expect(turn.response.text).toContain("20,000");
    expect(turn.response.text).toContain("VOO");
  });

  it("keeps comparison context across follow-ups", async () => {
    const session = createConversationSession();
    const deps = setup();
    await processAIMessage(session, "Compare NVDA and AMD.", "en", deps);
    const turn = await processAIMessage(session, "Which is more volatile?", "en", deps);
    expect(turn.response.comparison?.map((a) => a.symbol)).toEqual(["NVDA", "AMD"]);
  });
});
