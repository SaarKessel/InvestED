import { describe, expect, it } from "vitest";
import { formatCurrency, formatMoney, formatCompactCurrency, formatCompactMoney } from "./format";
import { CURRENCIES } from "./currencies";
const values = [-1000, -0.5, -0.499, -0, 0, 0.499, 0.5, 999, 1000, 999999, 1000000, 1234567, NaN, Infinity, -Infinity];
const rows = CURRENCIES.flatMap((currency) => ["en", "he"].flatMap((lang) => values.map((value) => [currency.code, lang, value, currency.symbol] as const)));
describe("[sweep] B147 currency rounding and compact threshold source contract", () => {
  it.each(rows)("currency %s language %s value %s symbol %s", (code, lang, value, symbol) => {
    const locale = lang === "he" ? "he-IL" : "en-US";
    const safe = Number.isFinite(value) && Math.abs(value) >= 0.5 ? value : 0;
    const expected = new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 0 }).format(safe);
    expect(formatCurrency(value, code, lang)).toBe(expected);
    expect(formatMoney(value, locale, code)).toBe(expected);
    const positive = Number.isFinite(value) ? Math.max(value, 0) : 0;
    if (positive >= 1000000) {
      expect(formatCompactCurrency(value, code, lang)).toBe(`${(positive / 1000000).toFixed(2)}M ${symbol}`);
      expect(formatCompactMoney(value, locale, code)).toBe(`${(positive / 1000000).toFixed(2)}${symbol}`);
    } else if (positive >= 1000) {
      expect(formatCompactCurrency(value, code, lang)).toBe(`${Math.round(positive / 1000)}K ${symbol}`);
      expect(formatCompactMoney(value, locale, code)).toBe(`${Math.round(positive / 1000)}K ${symbol}`);
    } else {
      expect(formatCompactCurrency(value, code, lang)).toBe(formatCurrency(positive, code, lang));
      expect(formatCompactMoney(value, locale, code)).toBe(formatMoney(positive, locale, code));
    }
  });
});
describe("[hand] B147 unknown app currency falls back to the declared default", () => {
  it("uses shekels rather than an invented currency symbol", () => {
    expect(formatCurrency(100, "not-a-currency", "en")).toBe(formatCurrency(100, "ILS", "en"));
    expect(formatCompactCurrency(1000000, "not-a-currency", "he")).toBe(formatCompactCurrency(1000000, "ILS", "he"));
  });
});
