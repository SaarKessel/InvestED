import { describe, expect, it } from "vitest";
import { verifyStructuredAnswer } from "./structuredAnswer";
import type { GatewayRequestPayload } from "./gatewayPrompt";
const values = [1, 7, 50, 1250, 1000000];
const rows = values.flatMap((value) => ["en", "he"].flatMap((language) => ["valid", "missing-declaration", "new-number", "new-ticker"].map((mode) => [value, language as "en" | "he", mode] as const)));
describe("[sweep] B152 structured verification cannot hide invented numbers or symbols", () => {
  it.each(rows)("value %s language %s mode %s", (value, language, mode) => {
    const answer = `VOO ${value} USD`;
    const payload: GatewayRequestPayload = { question: "VOO", language, answer, facts: { intent: "asset_analysis", assets: [{ symbol: "VOO", price: value, changePercent: 0, volatilityPct: 0, rsi: null, isMock: false }], calculation: null, holdingValuation: null, purchasePower: null, strategies: [], clarification: null } };
    const text = mode === "new-number" ? `VOO ${value + 2} USD` : mode === "new-ticker" ? `TSLA ${value} USD` : answer;
    const numbersUsed = mode === "missing-declaration" ? [] : [String(mode === "new-number" ? value + 2 : value)];
    expect(verifyStructuredAnswer(payload, { text, numbersUsed })).toEqual(mode === "valid" ? { ok: true, text } : { ok: false, reason: mode === "missing-declaration" ? "undeclared_number" : mode === "new-number" ? "number_mismatch" : "fact_mismatch" });
  });
});
describe("[hand] B152 structured declared extras still need source evidence", () => {
  it("rejects an invented declared value even when omitted from the visible text", () => {
    const payload: GatewayRequestPayload = { question: "VOO", language: "en", answer: "VOO moved today", facts: { intent: "asset_analysis", assets: [], calculation: null, holdingValuation: null, purchasePower: null, strategies: [], clarification: null } };
    expect(verifyStructuredAnswer(payload, { text: payload.answer, numbersUsed: ["12345"] })).toEqual({ ok: false, reason: "number_mismatch" });
    expect(verifyStructuredAnswer(payload, null)).toEqual({ ok: false, reason: "bad_structure" });
  });
});
