import { describe, expect, it, vi } from "vitest";
import type { MarketAsset } from "@/types";
import { processAIMessage, type AIConversationDependencies } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";

function asset(symbol: string, price: number, currency: string): MarketAsset {
  return { symbol, name: symbol, price, changePercent: 1, currency, history: [price - 1, price].map((p, i) => ({ date: `2026-01-0${i + 1}`, price: p, open: p, high: p, low: p, close: p })), dataSource: "yahoo_finance", timestamp: "2026-09-30T20:00:00Z", freshness: "current", isMock: false };
}
const deps = (): AIConversationDependencies => ({ fetchAsset: vi.fn(async (s: string) => (s === "TSLA" ? asset("TSLA", 354.81, "USD") : s === "USDILS=X" ? asset("USDILS=X", 3.2, "ILS") : null)), enhance: vi.fn(async () => null) });

describe("holding value asked in shekels", () => {
  it("converts to ILS using the live FX rate or says plainly that it cannot", async () => {
    const turn = await processAIMessage(createConversationSession(), "How much is 10 shares of TSLA worth in shekels?", "en", deps());
    const text = turn.response.text;
    expect(/ILS|NIS|shekel|₪/i.test(text)).toBe(true);
  });
});

describe("holding value in shekels - details", () => {
  it("shows the converted number with the rate", async () => {
    const turn = await processAIMessage(createConversationSession(), "How much is 10 shares of TSLA worth in shekels?", "en", deps());
    expect(turn.response.text).toContain("3,548.1 USD");
    expect(turn.response.text).toContain("11,353"); // 3548.1 x 3.2
  });
  it("says so when no real rate exists", async () => {
    const d = deps(); (d.fetchAsset as ReturnType<typeof vi.fn>).mockImplementation(async (s: string) => (s === "TSLA" ? asset("TSLA", 354.81, "USD") : null));
    const turn = await processAIMessage(createConversationSession(), "How much is 10 shares of TSLA worth in shekels?", "en", d);
    expect(turn.response.text).toMatch(/exchange rate is unavailable/);
  });
});

describe("holding value in shekels - Hebrew", () => {
  it("converts for a Hebrew question", async () => {
    const turn = await processAIMessage(createConversationSession(), "כמה שווה 10 מניות של TSLA בשקלים?", "he", deps());
    expect(turn.response.text).toContain("11,353");
  });
});

describe("retirement withdrawal and assumed defaults", () => {
  const d = () => ({ fetchAsset: vi.fn(async () => null), enhance: vi.fn(async () => null) }) as AIConversationDependencies;
  it("applies the labeled 4% rule", async () => {
    const turn = await processAIMessage(createConversationSession(), "I have 3,000,000 shekels saved for retirement, what monthly income can that give me?", "en", d());
    expect(turn.response.text).toContain("120,000");
    expect(turn.response.text).toContain("10,000");
    expect(turn.response.text).toMatch(/rule of thumb, not a guarantee/);
  });
  it("says which inputs were defaults", async () => {
    const turn = await processAIMessage(createConversationSession(), "If I invest 1000 per month at 7% how much will I have?", "en", d());
    if (/projected final balance/.test(turn.response.text)) expect(turn.response.text).toMatch(/You did not give a horizon/);
  });
});
