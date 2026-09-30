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

describe("resolveGatewayToken", () => {
  it("prefers the function request header, then API key, then build env", async () => {
    const { resolveGatewayToken } = await import("./gatewayPrompt");
    expect(resolveGatewayToken({ "x-vercel-oidc-token": "hdr" }, { AI_GATEWAY_API_KEY: "key" })).toBe("hdr");
    expect(resolveGatewayToken({}, { AI_GATEWAY_API_KEY: "key", VERCEL_OIDC_TOKEN: "env" })).toBe("key");
    expect(resolveGatewayToken({}, { VERCEL_OIDC_TOKEN: "env" })).toBe("env");
    expect(resolveGatewayToken({ "x-vercel-oidc-token": ["a", "b"] }, {})).toBe("a");
    expect(resolveGatewayToken({}, {})).toBe("");
  });
});

describe("geminiTransport", () => {
  const payload = normalizeGatewayPayload({
    question: "What is VOO's price?",
    language: "en",
    answer: "VOO trades at 706.07 USD, down 0.22% today. Educational data, not advice.",
    facts: { intent: "asset_analysis" },
  })!;

  it("resolveGeminiConfig stays dark without a key and defaults the model with one", async () => {
    const { resolveGeminiConfig, DEFAULT_GEMINI_MODEL } = await import("./gatewayPrompt");
    expect(resolveGeminiConfig({})).toBeNull();
    expect(resolveGeminiConfig({ GEMINI_API_KEY: "  " })).toBeNull();
    expect(resolveGeminiConfig({ GEMINI_API_KEY: "k" })).toEqual({ apiKey: "k", model: DEFAULT_GEMINI_MODEL });
    expect(resolveGeminiConfig({ GEMINI_API_KEY: "k", GEMINI_MODEL: "gemini-2.5-flash-lite" }).model).toBe(
      "gemini-2.5-flash-lite"
    );
  });

  it("buildGeminiRequest maps the system prompt and validated answer into generateContent shape", async () => {
    const { buildGeminiRequest } = await import("./gatewayPrompt");
    const body = buildGeminiRequest(payload);
    expect(body.systemInstruction.parts[0].text).toContain("Never add, remove, or alter any number");
    expect(body.contents).toHaveLength(1);
    expect(body.contents[0].role).toBe("user");
    expect(body.contents[0].parts[0].text).toContain("VALIDATED ANSWER");
    expect(body.contents[0].parts[0].text).toContain("706.07");
  });

  it("parseGeminiResponse extracts joined part text and rejects malformed bodies", async () => {
    const { parseGeminiResponse } = await import("./gatewayPrompt");
    expect(
      parseGeminiResponse({ candidates: [{ content: { parts: [{ text: "VOO trades at " }, { text: "706.07 USD." }] } }] })
    ).toBe("VOO trades at 706.07 USD.");
    expect(parseGeminiResponse(null)).toBeNull();
    expect(parseGeminiResponse({})).toBeNull();
    expect(parseGeminiResponse({ candidates: [] })).toBeNull();
    expect(parseGeminiResponse({ candidates: [{ content: { parts: [{ text: "   " }] } }] })).toBeNull();
    expect(parseGeminiResponse({ candidates: [{ content: { parts: [{ text: "x".repeat(6001) }] } }] })).toBeNull();
  });
});

describe("rephraseIntroducesNoNewFacts", () => {
  const answer = "VOO trades at 706.07 USD, down 0.22% today. Educational data, not advice.";
  const facts = {
    intent: "asset_analysis",
    assets: [{ symbol: "VOO", price: 706.07, changePercent: -0.22, volatilityPct: 14.2, rsi: 51, isMock: false }],
    calculation: null,
    holdingValuation: null,
    purchasePower: null,
    strategies: [],
    clarification: null,
  } as never;

  it("accepts a faithful rephrase that omits facts", async () => {
    const { rephraseIntroducesNoNewFacts } = await import("./gatewayPrompt");
    expect(
      rephraseIntroducesNoNewFacts(answer, facts, "VOO is trading at 706.07 USD, which is down 0.22% for the day.")
    ).toBe(true);
  });

  it("rejects a rephrase that corrupts the symbol", async () => {
    const { rephraseIntroducesNoNewFacts } = await import("./gatewayPrompt");
    expect(
      rephraseIntroducesNoNewFacts(answer, facts, "VVO trades at 706.07 USD, down 0.22% today.")
    ).toBe(false);
  });

  it("rejects a rephrase that invents a number", async () => {
    const { rephraseIntroducesNoNewFacts } = await import("./gatewayPrompt");
    expect(
      rephraseIntroducesNoNewFacts(answer, facts, "VOO trades at 706.07 USD, down 0.22%, up 5% this week.")
    ).toBe(false);
  });

  it("tolerates commas, percent signs, and a minus turned into a word", async () => {
    const { rephraseIntroducesNoNewFacts } = await import("./gatewayPrompt");
    const bigAnswer = "VOO trades at 1234.5 USD, down 0.22% today.";
    const bigFacts = {
      ...facts,
      assets: [{ symbol: "VOO", price: 1234.5, changePercent: -0.22, volatilityPct: 14.2, rsi: 51, isMock: false }],
    } as never;
    expect(
      rephraseIntroducesNoNewFacts(bigAnswer, bigFacts, "VOO trades at 1,234.5 USD, a decline of 0.22% today.")
    ).toBe(true);
  });
});
