import { describe, it, expect } from "vitest";
import { PALETTE, BG_HEX, FG_HEX, COLOR_HE, excelNumberFormat } from "./palette";

describe("palette registry", () => {
  it("every palette color has a background, foreground and Hebrew name", () => {
    for (const c of PALETTE) {
      expect(BG_HEX[c]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(FG_HEX[c]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(COLOR_HE[c]).toBeTruthy();
    }
  });
});
describe("excelNumberFormat", () => {
  it("maps date, percent, currency and number formats", () => {
    expect(excelNumberFormat({ numberFormat: "date" })).toBe("yyyy-mm-dd");
    expect(excelNumberFormat({ numberFormat: "percent" })).toBe("0%");
    expect(excelNumberFormat({ numberFormat: "percent", decimals: 2 })).toBe("0.00%");
    expect(excelNumberFormat({ numberFormat: "currency" })).toBe('"₪"#,##0');
    expect(excelNumberFormat({ numberFormat: "currency", decimals: 1 })).toBe('"₪"#,##0.0');
    expect(excelNumberFormat({ numberFormat: "number" })).toBe("#,##0.00");
    expect(excelNumberFormat({ numberFormat: "number", decimals: 0 })).toBe("#,##0.");
  });
  it("returns undefined for unknown or missing formats", () => {
    expect(excelNumberFormat({})).toBeUndefined();
    expect(excelNumberFormat({ numberFormat: "text" })).toBeUndefined();
  });
});
