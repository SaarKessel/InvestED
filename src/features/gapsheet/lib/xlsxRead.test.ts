// @vitest-environment jsdom
import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { csvToWorkbook, ImportError } from "./io";
import { sheetToXlsx, crc32 } from "./xlsx";
import { xlsxToWorkbook } from "./xlsxRead";

const enc = new TextEncoder();

/** Re-pack entries with real DEFLATE compression, like Excel writes. */
function deflateZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const u16 = (v: number) => [v & 255, (v >>> 8) & 255];
  const u32 = (v: number) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  const parts: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const comp = new Uint8Array(deflateRawSync(f.data));
    const crc = crc32(f.data);
    parts.push(Uint8Array.from([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(8), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(comp.length), ...u32(f.data.length), ...u16(name.length), ...u16(0)]), name, comp);
    central.push(Uint8Array.from([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(8), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(comp.length), ...u32(f.data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += 30 + name.length + comp.length;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const end = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  const all = [...parts, ...central, end]; const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0)); let o = 0;
  for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}

/** Split a stored zip back into its entries (stored method only - test helper). */
function unzipStored(buf: Uint8Array): { name: string; data: Uint8Array }[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out: { name: string; data: Uint8Array }[] = [];
  let p = 0;
  while (dv.getUint32(p, true) === 0x04034b50) {
    const csize = dv.getUint32(p + 18, true);
    const nlen = dv.getUint16(p + 26, true);
    const elen = dv.getUint16(p + 28, true);
    const name = new TextDecoder().decode(buf.subarray(p + 30, p + 30 + nlen));
    out.push({ name, data: buf.slice(p + 30 + nlen + elen, p + 30 + nlen + elen + csize) });
    p += 30 + nlen + elen + csize;
  }
  return out;
}

const SAMPLE = "Symbol,Shares,Cost\nAAPL,10,150.25\nMSFT,5,410.8\nTeva,20,55.1";

function valuesOf(wb: ReturnType<typeof csvToWorkbook>) {
  const cells = wb.sheets[0].cells;
  return Object.fromEntries(Object.entries(cells).map(([k, v]) => [k, v.value]));
}

describe("xlsxToWorkbook", () => {
  it("round-trips an exported workbook (stored zip, inline strings)", async () => {
    const original = csvToWorkbook(SAMPLE, "qa-holdings.csv");
    const buf = sheetToXlsx(original.sheets[0]).slice().buffer;
    const back = await xlsxToWorkbook(buf, "qa-holdings.xlsx");
    expect(valuesOf(back)).toEqual(valuesOf(original));
  });

  it("reads DEFLATE-compressed entries with a shared strings table", async () => {
    const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const buf = deflateZip([
      { name: "xl/workbook.xml", data: enc.encode(`${H}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Holdings" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
      { name: "xl/_rels/workbook.xml.rels", data: enc.encode(`${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="t" Target="worksheets/sheet1.xml"/></Relationships>`) },
      { name: "xl/sharedStrings.xml", data: enc.encode(`${H}<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Symbol</t></si><si><r><t>AA</t></r><r><t>PL</t></r></si><si><t>Shares</t></si></sst>`) },
      { name: "xl/worksheets/sheet1.xml", data: enc.encode(`${H}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>2</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>10</v></c></row></sheetData></worksheet>`) },
    ]);
    const wb = await xlsxToWorkbook(buf.buffer as ArrayBuffer, "x.xlsx");
    const cells = wb.sheets[0].cells;
    expect(wb.sheets[0].name).toBe("Holdings");
    expect(cells["A1"].value).toBe("Symbol");
    expect(cells["B1"].value).toBe("Shares");
    expect(cells["A2"].value).toBe("AAPL"); // rich-text runs concatenated
    expect(cells["B2"].value).toBe(10);
  });

  it("rejects a non-xlsx file", async () => {
    await expect(xlsxToWorkbook(new TextEncoder().encode("not a zip").buffer as ArrayBuffer, "bad.xlsx")).rejects.toBeInstanceOf(ImportError);
  });
});
