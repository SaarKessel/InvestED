// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { crc32 } from "./xlsx";
import { xlsxToWorkbook } from "./xlsxRead";

const enc = new TextEncoder();

/** Minimal stored (method 0) zip builder; fakeUsize lies in the central directory. */
function storedZip(files: { name: string; data: Uint8Array }[], fakeUsize?: number): Uint8Array {
  const u16 = (v: number) => [v & 255, (v >>> 8) & 255];
  const u32 = (v: number) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  const parts: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const usize = fakeUsize ?? f.data.length;
    parts.push(Uint8Array.from([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc32(f.data)), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0)]), name, f.data);
    central.push(Uint8Array.from([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc32(f.data)), ...u32(f.data.length), ...u32(usize), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += 30 + name.length + f.data.length;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const end = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  const all = [...parts, ...central, end]; const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0)); let o = 0;
  for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}

const NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const workbookXml = `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_R}"><sheets><sheet name="S" sheetId="1" r:id="rId1"/></sheets></workbook>`;
const relsXml = `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${NS_R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
const sheet = (rows: string) => `<worksheet xmlns="${NS_MAIN}"><sheetData>${rows}</sheetData></worksheet>`;

function xlsxWith(sheetXml: string, sharedXml?: string, fakeUsize?: number): ArrayBuffer {
  const files = [
    { name: "xl/workbook.xml", data: enc.encode(workbookXml) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(relsXml) },
    { name: "xl/worksheets/sheet1.xml", data: enc.encode(sheetXml) },
  ];
  if (sharedXml) files.push({ name: "xl/sharedStrings.xml", data: enc.encode(sharedXml) });
  return storedZip(files, fakeUsize).slice().buffer;
}

function valuesOf(wb: Awaited<ReturnType<typeof xlsxToWorkbook>>) {
  const cells = wb.sheets[0].cells;
  return Object.fromEntries(Object.entries(cells).map(([k, v]) => [k, v.value]));
}

describe("xlsxToWorkbook adversarial", () => {
  it("imports a formula cell as its cached value, never as a formula", async () => {
    const buf = xlsxWith(sheet(`<row r="1"><c r="A1"><f>SUM(B1:C1)*HYPERLINK("http://evil")</f><v>42</v></c><c r="B1" t="inlineStr"><is><t>hi</t></is></c></row>`));
    const wb = await xlsxToWorkbook(buf, "f.xlsx");
    const values = valuesOf(wb);
    expect(values["A1"]).toBe(42);
    expect(values["B1"]).toBe("hi");
    expect(JSON.stringify(wb.sheets[0].cells)).not.toContain("HYPERLINK");
  });
  it("rejects a sheet with a row past the limit", async () => {
    const buf = xlsxWith(sheet(`<row r="5001"><c r="A5001"><v>1</v></c></row>`));
    await expect(xlsxToWorkbook(buf, "rows.xlsx")).rejects.toMatchObject({ code: "too_many_rows" });
  });
  it("rejects a central directory claiming a huge unpacked entry", async () => {
    const buf = xlsxWith(sheet(`<row r="1"/>`), undefined, 60_000_000);
    await expect(xlsxToWorkbook(buf, "bomb.xlsx")).rejects.toMatchObject({ code: "too_big_unpacked" });
  });
  it("skips a shared-string index that is out of range instead of crashing", async () => {
    const ss = `<sst xmlns="${NS_MAIN}"><si><t>only</t></si></sst>`;
    const buf = xlsxWith(sheet(`<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>7</v></c></row>`), ss);
    const values = valuesOf(await xlsxToWorkbook(buf, "ss.xlsx"));
    expect(values["A1"]).toBe("only");
    expect(values["B1"]).toBeUndefined();
  });
  it("concatenates rich-text runs inside one shared string", async () => {
    const ss = `<sst xmlns="${NS_MAIN}"><si><r><t>Hello</t></r><r><t> World</t></r></si></sst>`;
    const buf = xlsxWith(sheet(`<row r="1"><c r="A1" t="s"><v>0</v></c></row>`), ss);
    expect(valuesOf(await xlsxToWorkbook(buf, "rich.xlsx"))["A1"]).toBe("Hello World");
  });
});
