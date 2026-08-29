import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatCompactCurrency,
} from "@/lib/format";
import {
  getCurrencyByCode,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from "@/lib/currencies";

describe("currency formatting", () => {
  it("formats ILS in Hebrew mode", () => {
    const result = formatCurrency(50000, "ILS", "he");
    expect(result).toContain("₪");
    expect(result).toContain("50,000");
  });

  it("formats USD in English mode", () => {
    const result = formatCurrency(50000, "USD", "en");
    expect(result).toContain("$");
    expect(result).toContain("50,000");
  });

  it("formats EUR in English mode", () => {
    const result = formatCurrency(50000, "EUR", "en");
    expect(result).toContain("€");
    expect(result).toContain("50,000");
  });

  it("formats GBP in English mode", () => {
    const result = formatCurrency(50000, "GBP", "en");
    expect(result).toContain("£");
    expect(result).toContain("50,000");
  });

  it("formats CAD in English mode", () => {
    const result = formatCurrency(50000, "CAD", "en");
    expect(result).toContain("CA$");
    expect(result).toContain("50,000");
  });

  it("formats JPY in English mode", () => {
    const result = formatCurrency(50000, "JPY", "en");
    expect(result).toContain("¥");
  });

  it("defaults to ILS when currency is missing", () => {
    const result = formatCurrency(1000);
    expect(result).toContain("₪");
  });

  it("formats compact currency correctly", () => {
    const result = formatCompactCurrency(1_500_000, "USD", "en");
    expect(result).toContain("$");
    expect(result).toContain("1.50M");
  });

  it("returns currency symbol for small values in compact format", () => {
    const result = formatCompactCurrency(500, "ILS", "he");
    expect(result).toContain("₪");
  });
});

describe("currency definitions", () => {
  it("has all required currencies", () => {
    const codes = CURRENCIES.map(c => c.code);
    expect(codes).toContain("ILS");
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("GBP");
    expect(codes).toContain("CAD");
    expect(codes).toContain("AUD");
    expect(codes).toContain("CHF");
    expect(codes).toContain("JPY");
  });

  it("defaults to ILS", () => {
    expect(DEFAULT_CURRENCY).toBe("ILS");
  });

  it("returns currency by code", () => {
    const usd = getCurrencyByCode("USD");
    expect(usd.code).toBe("USD");
    expect(usd.symbol).toBe("$");
  });
});
