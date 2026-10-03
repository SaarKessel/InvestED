import { describe, expect, it } from "vitest";
import { buildCopilotResponse } from "./copilotResponse";
import { createConversationSession } from "./conversationContext";
import type { AssetAnalysis, MarketDataFreshness } from "../types";
const rows = (["en", "he"] as const).flatMap((lang) => (["current", "simulated", "unavailable"] as const).flatMap((freshness) => [true, false].flatMap((isMock) => [undefined, 0, 57.6].flatMap((rsi) => [undefined, "2026-10-03T12:00:00Z"].map((timestamp) => [lang, freshness, isMock, rsi, timestamp] as const)))));
describe("[sweep] B135 unsupported ratings preserve source freshness and missing metadata", () => {
  it.each(rows)("lang %s freshness %s mock %s RSI %s timestamp %s", (lang, freshness, isMock, rsi, timestamp) => {
    const asset: AssetAnalysis = { symbol: "TSLA", price: 370.59, changePercent: 1.2, volatilityPct: 22, rsi, dataSource: "yahoo_finance", freshness: freshness as MarketDataFreshness, isMock, timestamp, currency: "USD", marketStatus: "closed" };
    const q = lang === "en" ? "What is TSLA's score?" : "מה הציון של TSLA?";
    const response = buildCopilotResponse(q, createConversationSession().processTurn(q), null, [asset]);
    expect(response.text).toContain(lang === "en" ? "No supported overall asset score" : "אין כרגע ציון כולל נתמך");
    expect(response.text).toContain("370.59 USD");
    expect(response.text).toContain("22.00%");
    expect(response.text).toContain("yahoo_finance");
    expect(response.text).toContain(timestamp ?? (lang === "en" ? "date unavailable" : "תאריך לא זמין"));
    expect(response.text).toContain(`RSI ${rsi === undefined ? (lang === "en" ? "unavailable" : "לא זמין") : rsi.toFixed(1)}`);
    expect(response.text).toContain(isMock || freshness === "simulated" ? (lang === "en" ? "simulated value" : "ערך מדומה") : (lang === "en" ? "latest available price" : "מחיר זמין אחרון"));
    expect(response.assets).toEqual([asset]);
    expect(response.dataSources).toEqual(["yahoo_finance"]);
    expect(response.dataFreshness).toEqual([freshness]);
    expect(response.calculation).toBeNull();
    expect(response.text).not.toMatch(/\b[1-5]\s*\/\s*5\b/);
  });
});
describe("[hand] B135 rating source metadata deduplicates across a basket", () => {
  it("keeps each symbol line while structured source and freshness arrays are unique", () => {
    const assets = ["TSLA", "NVDA"].map((symbol): AssetAnalysis => ({ symbol, price: 100, changePercent: 0, volatilityPct: 10, dataSource: "yahoo_finance", freshness: "current", isMock: false }));
    const q = "What is the rating of TSLA and NVDA?";
    const response = buildCopilotResponse(q, createConversationSession().processTurn(q), null, assets);
    for (const asset of assets) expect(response.text).toContain(`${asset.symbol}:`);
    expect(response.dataSources).toEqual(["yahoo_finance"]);
    expect(response.dataFreshness).toEqual(["current"]);
  });
});
