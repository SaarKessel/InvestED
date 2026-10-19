import { describe, it, expect } from "vitest";
import { sheetToXlsx, crc32, esc, sheetXml } from "@/features/gapsheet/lib/xlsx";
import type { Sheet } from "@/features/gapsheet/types/workbook";

const sheet: Sheet = { id: "s", name: "Test/Sheet", position: 0, cells: {
  A1: { value: "=HYPERLINK(\"x\")", formula: null, computedValue: "=HYPERLINK(\"x\")", type: "text" },
  B1: { value: 12.5, formula: null, computedValue: 12.5, type: "number" },
  A2: { value: null, formula: "=B1*2", computedValue: 25, type: "formula" },
  C3: { value: "a<b&c", formula: null, computedValue: "a<b&c", type: "text" },
} } as unknown as Sheet;

describe("xlsx writer", () => {
  it("crc32 matches known value", () => expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926));
  it("escapes xml", () => expect(esc('<a&"b">')).toBe("&lt;a&amp;&quot;b&quot;&gt;"));
  it("writes text as inline strings, never formulas", () => {
    const x = sheetXml(sheet, false);
    expect(x).not.toContain("<f>");
    expect(x).toContain('t="inlineStr"');
    expect(x).toContain("<v>25</v>");
    expect(x).toContain("a&lt;b&amp;c");
  });
  it("sets right-to-left view", () => expect(sheetXml(sheet, true)).toContain('rightToLeft="1"'));
  it("produces a zip with the expected parts", () => {
    const z = sheetToXlsx(sheet);
    expect(z[0]).toBe(0x50); expect(z[1]).toBe(0x4b);
    const txt = new TextDecoder().decode(z);
    for (const n of ["[Content_Types].xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml"]) expect(txt).toContain(n);
    expect(txt).toContain('name="Test Sheet"');
  });
});
