import { describe, it, expect } from "vitest";
import { formatCurrencyCapped } from "./format";
describe("formatCurrencyCapped", () => {
  it("shows normal values exactly", () => {
    expect(formatCurrencyCapped(1475521, "ILS", "en")).toBe("₪1,475,521");
  });
  it("caps absurd values in the sentence language, no long digit run", () => {
    const en = formatCurrencyCapped(1.0774777952879047e37, "ILS", "en");
    const he = formatCurrencyCapped(1.0774777952879047e37, "ILS", "he");
    expect(en).toBe("over 1 trillion ₪");
    expect(he).toBe("מעל טריליון ₪");
    expect(en).not.toMatch(/\d{6}/);
  });
  it("is not capped just below the threshold", () => {
    expect(formatCurrencyCapped(9.99e11, "ILS", "en")).toMatch(/999/);
  });
});
