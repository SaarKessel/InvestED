/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { processAIMessage } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";
const aapl = { symbol: "AAPL", name: "AAPL", price: 103, changePercent: 2, currency: "USD", history: [100, 101, 100, 103].map((p, i) => ({ date: `2026-01-0${i + 1}`, price: p, open: p, high: p, low: p, close: p })), dataSource: "yahoo_finance", timestamp: "2026-09-21T07:00:00Z", freshness: "current", isMock: false };
const deps: any = { fetchAsset: async (s: string) => (s === "AAPL" ? aapl : null), enhance: async () => null };
describe("B198 comparing a known and an unknown asset names the unknown one", () => {
  it("EN", async () => {
    const t = await processAIMessage(createConversationSession(), "compare ZZZQ and AAPL", "en", deps);
    expect(t.response.text).toMatch(/No market data is available for ZZZQ/);
  });
  it("HE", async () => {
    const t = await processAIMessage(createConversationSession(), "השווה ZZZQ ו-AAPL", "he", deps);
    expect(t.response.text).toMatch(/ZZZQ/);
  });
});
