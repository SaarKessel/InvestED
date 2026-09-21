import { describe, expect, it } from "vitest";
import { calculatePurchasePower, explainFinancialConcept, parseHoldingRequest, parsePurchasePowerRequest, valueHolding } from "./financialEducation";
import type { AssetAnalysis } from "@/types";

const tsla: AssetAnalysis = { symbol: "TSLA", price: 250.25, changePercent: 1, volatilityPct: 3, rsi: 55, dataSource: "yahoo_finance", isMock: false, timestamp: "2026-09-21T12:00:00Z", freshness: "current", currency: "USD", marketStatus: "open" };

describe("financial education and holdings", () => {
  it("explains mutual funds in Hebrew and English", () => {
    expect(explainFinancialConcept("מה זה קרן נאמנות?", "he")).toContain("כלי השקעה");
    expect(explainFinancialConcept("What is a mutual fund?", "en")).toContain("pools money");
  });
  it.each([
    ["אם יש לי 199 מניות של TSLA מה השווי של זה", 199, "TSLA"],
    ["I own 12.5 shares of NVDA - what are they worth?", 12.5, "NVDA"],
    ["מחזיק 1,200 מניות ב-AAPL", 1200, "AAPL"],
  ])("parses holdings across Hebrew and English: %s", (text, quantity, symbol) => {
    expect(parseHoldingRequest(text)).toEqual({ quantity, symbol });
  });
  it("uses deterministic multiplication with real provenance", () => {
    const valuation = valueHolding({ quantity: 199, symbol: "TSLA" }, tsla);
    expect(valuation.available).toBe(true);
    expect(valuation.total).toBeCloseTo(49_799.75, 8);
    expect(valuation.timestamp).toBe("2026-09-21T12:00:00Z");
  });
  it("refuses a simulated valuation", () => {
    const valuation = valueHolding({ quantity: 199, symbol: "TSLA" }, { ...tsla, dataSource: "mock", freshness: "simulated", isMock: true });
    expect(valuation.available).toBe(false);
    expect(valuation.reason).toBe("simulated");
  });
  it("recognizes the Hebrew ETF synonym", () => {
    expect(explainFinancialConcept("מה זה תעודת סל?", "he")).toContain("נסחרת בבורסה");
  });
  it("parses and calculates cross-currency whole-share buying power", () => {
    const request = parsePurchasePowerRequest("יש לי 300 אלף שקל, לפי שער עדכני כמה מניות של VYM אוכל לקנות?");
    expect(request).toEqual({ amount: 300000, sourceCurrency: "ILS", symbol: "VYM" });
    const vym = { ...tsla, symbol: "VYM", price: 140, currency: "USD" };
    const fx = { ...tsla, symbol: "USDILS=X", price: 3.5, currency: "ILS" };
    const result = calculatePurchasePower(request!, vym, fx);
    expect(result.available).toBe(true);
    expect(result.wholeShares).toBe(612);
    expect(result.residualAssetCurrency).toBeCloseTo(34.2857143, 6);
  });

});
