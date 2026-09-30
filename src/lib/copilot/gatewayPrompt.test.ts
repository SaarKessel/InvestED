import { describe, expect, it } from "vitest";
import {
  buildGatewayFacts,
  buildGatewayMessages,
  buildSystemPrompt,
  normalizeGatewayPayload,
  parseGatewayResponse,
  MAX_ANSWER_LENGTH,
} from "./gatewayPrompt";
import type { CopilotResponse } from "../copilotResponse";

function response(overrides: Partial<CopilotResponse> = {}): CopilotResponse {
  return {
    text: "VOO trades at 706.07 USD, down 0.22% today. Educational data, not advice.",
    language: "en",
    intent: "asset_analysis",
    assets: [
      {
        symbol: "VOO",
        price: 706.07,
        changePercent: -0.22,
        volatilityPct: 14.2,
        rsi: 51,
        dataSource: "yahoo",
        timestamp: "2026-09-30T13:00:00Z",
      },
    ],
    calculation: null,
    comparison: null,
    strategies: [],
    strategyFit: null,
    profileContextUsed: false,
    dataDependencies: ["market"],
    dataSources: ["yahoo"],
    dataFreshness: ["current"],
    clarification: null,
    holdingValuation: null,
    purchasePower: null,
    toolResult: null,
    ...overrides,
  } as CopilotResponse;
}

describe("gatewayPrompt", () => {
  it("buildGatewayFacts carries only validated numbers and labels mock data", () => {
    const facts = buildGatewayFacts(response({ assets: [{ ...response().assets[0], isMock: true }] }));
    expect(facts.intent).toBe("asset_analysis");
    expect(facts.assets).toEqual([
      { symbol: "VOO", price: 706.07, changePercent: -0.22, volatilityPct: 14.2, rsi: 51, isMock: true },
    ]);
  });

  it("system prompt forbids new facts in both languages", () => {
    const he = buildSystemPrompt("he");
    const en = buildSystemPrompt("en");
    for (const prompt of [he, en]) {
      expect(prompt).toContain("Never add, remove, or alter any number");
      expect(prompt).toContain("Never give investment advice");
    }
    expect(he).toContain("עברית בלבד");
    expect(en).toContain("English only");
  });

  it("messages embed the question, the validated answer, and the fact set", () => {
    const messages = buildGatewayMessages({
      question: "מה מחיר VOO?",
      language: "he",
      answer: "VOO נסחר ב-706.07 דולר.",
      facts: buildGatewayFacts(response()),
    });
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].content).toContain("מה מחיר VOO?");
    expect(messages[1].content).toContain("VOO נסחר ב-706.07 דולר.");
    expect(messages[1].content).toContain('"price":706.07');
  });

  it("parseGatewayResponse returns trimmed text and rejects unusable bodies", () => {
    expect(parseGatewayResponse({ choices: [{ message: { content: "  שלום  " } }] })).toBe("שלום");
    expect(parseGatewayResponse({ choices: [] })).toBeNull();
    expect(parseGatewayResponse({ choices: [{ message: { content: "" } }] })).toBeNull();
    expect(parseGatewayResponse(null)).toBeNull();
    expect(parseGatewayResponse({ choices: [{ message: { content: "x".repeat(7000) } }] })).toBeNull();
  });

  it("normalizeGatewayPayload validates, caps lengths, and defaults language", () => {
    expect(normalizeGatewayPayload(null)).toBeNull();
    expect(normalizeGatewayPayload({ question: "  ", answer: "a" })).toBeNull();
    expect(normalizeGatewayPayload({ question: "q" })).toBeNull();
    const normalized = normalizeGatewayPayload({
      question: " q ",
      answer: "a".repeat(MAX_ANSWER_LENGTH + 50),
      language: "fr",
    });
    expect(normalized).not.toBeNull();
    expect(normalized!.question).toBe("q");
    expect(normalized!.answer).toHaveLength(MAX_ANSWER_LENGTH);
    expect(normalized!.language).toBe("mixed");
  });
});
