import { describe, it, expect } from "vitest";
import { parseCsv, csvToWorkbook, gridToSheet, safeText, sheetToCsv, sheetToGrid, ImportError, LIMITS } from "./io";

describe("parseCsv RFC 4180", () => {
  it("strips a BOM and parses simple rows", () => {
    expect(parseCsv("﻿a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("handles quoted fields with commas, escaped quotes and newlines", () => {
    expect(parseCsv('name,note\n"Smith, John","he said ""hi""\ntwice"')).toEqual([["name", "note"], ["Smith, John", 'he said "hi"\ntwice']]);
  });
  it("handles CRLF and lone CR line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r3,4")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
  });
  it("auto-detects semicolon and tab delimiters from the header", () => {
    expect(parseCsv("a;b;c\n1;2;3")).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("keeps Hebrew and unicode intact", () => {
    expect(parseCsv("שם,סכום\nדירה,₪5000\nקרן,📈")).toEqual([["שם", "סכום"], ["דירה", "₪5000"], ["קרן", "📈"]]);
  });
  it("drops trailing all-empty rows", () => {
    expect(parseCsv("a,,c\n,,\n\n")).toEqual([["a", "", "c"]]);
    expect(parseCsv("a,b\n\n\n")).toEqual([["a", "b"]]);
  });
  it("an unclosed quote swallows the rest of the file as one field", () => {
    expect(parseCsv('a,b\n"oops,2')).toEqual([["a", "b"], ["oops,2"]]);
  });
});

describe("csvToWorkbook cell typing and injection guard", () => {
  const cellsOf = (csv: string) => csvToWorkbook(csv, "t.csv").sheets[0].cells;
  it("a leading = stays text, never a formula", () => {
    const c = cellsOf("x\n=1+1\n=HYPERLINK(\"http://evil\")");
    expect(c.A2.value).toBe("=1+1"); expect(c.A2.formula).toBeNull();
    expect(c.A3.formula).toBeNull();
  });
  it("numbers and booleans are typed; padded numbers stay text via parseInput", () => {
    const c = cellsOf("x\n42\n-3.5\ntrue\nFALSE");
    expect(c.A2.value).toBe(42); expect(c.A3.value).toBe(-3.5);
    expect(c.A4.value).toBe(true); expect(c.A5.value).toBe(false);
  });
  it("Hebrew headers land as strings", () => {
    const wb = csvToWorkbook("שם,סכום\nדירה,5000", "נתונים.csv");
    expect(wb.sheets[0].cells.A1.value).toBe("שם");
    expect(wb.name).toBe("נתונים");
  });
  it("rejects files over the byte limit", () => {
    expect(() => csvToWorkbook("x".repeat(LIMITS.maxBytes + 1), "big.csv")).toThrowError(ImportError);
  });
  it("rejects more than maxRows rows", () => {
    const huge = Array.from({ length: LIMITS.maxRows + 1 }, () => "1").join("\n");
    try { csvToWorkbook(huge, "rows.csv"); expect.unreachable(); } catch (e) { expect((e as ImportError).code).toBe("too_many_rows"); }
  });
  it("rejects more than maxCols columns", () => {
    const wide = Array.from({ length: LIMITS.maxCols + 1 }, (_, i) => `c${i}`).join(",");
    try { csvToWorkbook(wide, "cols.csv"); expect.unreachable(); } catch (e) { expect((e as ImportError).code).toBe("too_many_cols"); }
  });
  it("rejects an empty file", () => {
    expect(() => csvToWorkbook("", "empty.csv")).toThrowError(ImportError);
  });
  it("sheet name is the file name without extension, capped at 31 chars", () => {
    expect(csvToWorkbook("a\n1", "my budget 2026 final FINAL v2.csv").name.length).toBeLessThanOrEqual(31);
    expect(csvToWorkbook("a\n1", ".csv").name).toBe("Sheet1");
  });
});

describe("gridToSheet", () => {
  it("throws on an empty grid", () => { expect(() => gridToSheet([], "x")).toThrowError(ImportError); });
  it("skips null cells and infers types", () => {
    const s = gridToSheet([["a", null], [1, true]], "x");
    expect(Object.keys(s.cells)).not.toContain("B1");
    expect(s.cells.A2.type).toBe("number"); expect(s.cells.B2.type).toBe("boolean");
  });
  it("allowFormulas marks formula cells explicitly, only there", () => {
    const s = gridToSheet([[1, 2]], "x", "sheet_1", 0, [["=A1*2", null]]);
    expect(s.cells.A1.type).toBe("formula"); expect(s.cells.A1.formula).toBe("=A1*2");
    expect(s.cells.B1.formula).toBeNull();
  });
});

describe("safeText spreadsheet-injection guard", () => {
  it("prefixes =, +, @, tab and bare - text with an apostrophe", () => {
    expect(safeText("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(safeText("+cmd")).toBe("'+cmd");
    expect(safeText("@mention")).toBe("'@mention");
    expect(safeText("\tTabbed")).toBe("'\tTabbed");
    expect(safeText("- not a number")).toBe("'- not a number");
  });
  it("leaves real numbers and plain text alone", () => {
    expect(safeText("-42")).toBe("-42"); expect(safeText("3.14")).toBe("3.14"); expect(safeText("שלום")).toBe("שלום");
  });
});

describe("sheetToCsv roundtrip", () => {
  it("starts with a BOM, quotes special fields and escapes quotes", () => {
    const s = gridToSheet([['he said "hi"', "a,b", "line\nbreak"]], "x");
    const csv = sheetToCsv(s);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"he said ""hi"""'); expect(csv).toContain('"a,b"'); expect(csv).toContain('"line\nbreak"');
  });
  it("a csv -> workbook -> csv roundtrip preserves Hebrew data", () => {
    const wb = csvToWorkbook("שם,סכום\nדירה,5000", "x.csv");
    const back = sheetToCsv(wb.sheets[0]);
    expect(parseCsv(back)).toEqual([["שם", "סכום"], ["דירה", "5000"]]);
  });
  it("sheetToGrid exports computed values, not formula text", () => {
    const s = gridToSheet([[1]], "x", "sheet_1", 0, [["=1+1"]]);
    s.cells.A1.computedValue = 2;
    expect(sheetToGrid(s)).toEqual([["2"]]);
  });
});
