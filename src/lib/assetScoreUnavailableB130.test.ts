import { describe, expect, it } from "vitest";
import { buildCopilotResponse } from "./copilotResponse";
import { createConversationSession } from "./conversationContext";
import type { AssetAnalysis } from "../types";
const asset: AssetAnalysis = { symbol: "TSLA", price: 370.59, changePercent: 1.2, volatilityPct: 22, rsi: 57.6, dataSource: "yahoo_finance", freshness: "current", isMock: false, timestamp: "2026-10-03T12:00:00Z", currency: "USD", marketStatus: "closed" };
const questions = ["מה הציון של TSLA ולמה? תראה לי את המקורות", "מה הדירוג של TSLA?", "What is TSLA's score and why? Show sources", "What is the rating of TSLA?"];
describe("[sweep] B130 asset rating requests disclose unsupported overall score", () => {
  it.each(questions)("question %s", (q) => {
    const resolution = createConversationSession().processTurn(q);
    const r = buildCopilotResponse(q, resolution, null, [asset]);
    expect(r.text).toContain(/[א-ת]/.test(q) ? "אין כרגע ציון כולל נתמך" : "No supported overall asset score");
    expect(r.text).toContain("370.59"); expect(r.text).toContain("57.6");
    expect(r.text).toContain("yahoo_finance"); expect(r.text).toContain("2026-10-03T12:00:00Z");
    expect(r.dataSources).toEqual(["yahoo_finance"]);
    expect(r.text).not.toMatch(/\b[1-5]\s*\/\s*5\b/);
  });
});
describe("[hand] B130 ordinary price requests retain their existing metrics response", () => {
  it("does not add a rating caveat when no rating was requested", () => {
    const q = "What is TSLA's price?";
    expect(buildCopilotResponse(q, createConversationSession().processTurn(q), null, [asset]).text).not.toContain("overall asset score");
  });
});
