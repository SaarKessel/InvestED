import { describe, expect, it } from "vitest";
import { csvCell, toCsv, toPrintHtml } from "./exportChat";

describe("export chat", () => {
  it("escapes quotes and neutralises spreadsheet formulas", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvCell("-5% today")).toBe(`"'-5% today"`);
  });
  it("builds a CSV with header and both roles", () => {
    const csv = toCsv([{ role: "user", text: "a,b" }, { role: "copilot", text: "line1\nline2" }], "en");
    expect(csv).toContain('"n","who","text"');
    expect(csv).toContain('"1","me","a,b"');
    expect(csv).toContain('"2","InvestED+","line1\nline2"');
  });
  it("print page escapes html and sets direction", () => {
    const h = toPrintHtml([{ role: "user", text: "<script>x</script>" }], "he", "t", "n");
    expect(h).toContain('dir="rtl"');
    expect(h).not.toContain("<script>x");
    expect(h).toContain("&lt;script&gt;");
  });
});
