import { describe, expect, it } from "vitest";
import { buildStructuredRequest, parseStructuredResponse, STRUCTURED_RESPONSE_SCHEMA, verifyStructuredAnswer } from "./structuredAnswer";
import type { GatewayRequestPayload } from "./gatewayPrompt";

const payload: GatewayRequestPayload = {
  question: "How is VOO doing?",
  language: "en",
  answer: "VOO trades at 706.07 USD, down 0.22% today.",
  facts: { intent: "asset_analysis", assets: [{ symbol: "VOO", price: 706.07, changePercent: -0.22, volatilityPct: 14.2, rsi: 51, isMock: false }], calculation: null, holdingValuation: null, purchasePower: null, strategies: [], clarification: null },
};
const body = (obj: unknown) => ({ candidates: [{ content: { parts: [{ text: typeof obj === "string" ? obj : JSON.stringify(obj) }] } }] });

describe("structured Gemini output", () => {
  it("asks Gemini for JSON under a response schema", () => {
    const req = buildStructuredRequest(payload);
    expect(req.generationConfig.responseMimeType).toBe("application/json");
    expect(req.generationConfig.responseSchema).toBe(STRUCTURED_RESPONSE_SCHEMA);
    expect(req.systemInstruction.parts[0].text).toContain("numbersUsed");
    expect(req.systemInstruction.parts[0].text).toContain("Never add, remove, or alter any number");
  });
  it("parses valid JSON and rejects malformed bodies", () => {
    expect(parseStructuredResponse(body({ text: "Hi 5", numbersUsed: ["5"] }))).toEqual({ text: "Hi 5", numbersUsed: ["5"] });
    expect(parseStructuredResponse(body("not json"))).toBeNull();
    expect(parseStructuredResponse(body({ text: "x" }))).toBeNull();
    expect(parseStructuredResponse(body({ text: "", numbersUsed: [] }))).toBeNull();
    expect(parseStructuredResponse(body({ text: "x", numbersUsed: [{}] }))).toBeNull();
    expect(parseStructuredResponse(null)).toBeNull();
    expect(parseStructuredResponse({ candidates: [] })).toBeNull();
  });
  it("accepts a rephrase whose numbers all trace to the engine", () => {
    const v = verifyStructuredAnswer(payload, { text: "VOO is at 706.07 USD, 0.22% lower.", numbersUsed: ["706.07", "0.22"] });
    expect(v.ok).toBe(true);
  });
  it("rejects an invented number even when declared", () => {
    const v = verifyStructuredAnswer(payload, { text: "VOO is at 710.00 USD.", numbersUsed: ["710.00"] });
    expect(v).toEqual({ ok: false, reason: "number_mismatch" });
  });
  it("rejects a number in the text that the model did not declare", () => {
    const v = verifyStructuredAnswer(payload, { text: "VOO is at 706.07 USD.", numbersUsed: [] });
    expect(v).toEqual({ ok: false, reason: "undeclared_number" });
  });
  it("rejects unparseable output", () => {
    expect(verifyStructuredAnswer(payload, null)).toEqual({ ok: false, reason: "bad_structure" });
  });
  it("rejects a new ticker symbol", () => {
    const v = verifyStructuredAnswer(payload, { text: "SPY is at 706.07 USD.", numbersUsed: ["706.07"] });
    expect(v).toEqual({ ok: false, reason: "fact_mismatch" });
  });
  it("accepts a text with no numbers", () => {
    expect(verifyStructuredAnswer(payload, { text: "VOO moved a little today.", numbersUsed: [] }).ok).toBe(true);
  });
  it("normalizes thousands separators", () => {
    const p = { ...payload, answer: "You would have 12,500 USD." };
    expect(verifyStructuredAnswer(p, { text: "That comes to 12500 USD.", numbersUsed: ["12500"] }).ok).toBe(true);
  });
});
