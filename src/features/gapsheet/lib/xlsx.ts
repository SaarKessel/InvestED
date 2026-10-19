import type { Sheet } from "@/features/gapsheet/types/workbook";
import { colToLetters, parseAddress } from "@/features/gapsheet/lib/workbook/ranges";
import { round15 } from "@/features/gapsheet/lib/workbook/engine";

/**
 * Minimal dependency-free .xlsx writer (OOXML in an uncompressed zip).
 * Values only: formulas are exported as their computed result, and text is always
 * written as an inline string, so no cell can be read by Excel as a formula.
 */

const enc = new TextEncoder();
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(b: Uint8Array): number { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

export function esc(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const parts: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  const u16 = (v: number) => [v & 255, (v >>> 8) & 255];
  const u32 = (v: number) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  for (const f of files) {
    const name = enc.encode(f.name); const crc = crc32(f.data);
    const head = Uint8Array.from([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0)]);
    parts.push(head, name, f.data);
    central.push(Uint8Array.from([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += head.length + name.length + f.data.length;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const end = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  const all = [...parts, ...central, end]; const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0)); let o = 0;
  for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}

export function sheetXml(sheet: Sheet, rtl: boolean): string {
  const rows = new Map<number, string[]>();
  for (const addr of Object.keys(sheet.cells).sort()) {
    const p = parseAddress(addr); if (!p) continue;
    const cell = sheet.cells[addr]; const v = cell.formula ? cell.computedValue : cell.value;
    if (v === null || v === undefined || v === "") continue;
    const ref = `${colToLetters(p.col)}${p.row}`;
    const xml = typeof v === "number" ? (Number.isFinite(v) ? `<c r="${ref}"><v>${round15(v)}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>#NUM!</t></is></c>`)
      : typeof v === "boolean" ? `<c r="${ref}" t="b"><v>${v ? 1 : 0}</v></c>`
      : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
    if (!rows.has(p.row)) rows.set(p.row, []);
    rows.get(p.row)!.push(xml);
  }
  const body = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([r, cs]) => `<row r="${r}">${cs.join("")}</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView${rtl ? ' rightToLeft="1"' : ""} workbookViewId="0"/></sheetViews><sheetData>${body}</sheetData></worksheet>`;
}

export function sheetToXlsx(sheet: Sheet, opts: { rtl?: boolean } = {}): Uint8Array {
  const name = esc((sheet.name || "Sheet1").replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet1");
  const f = (n: string, s: string) => ({ name: n, data: enc.encode(s) });
  const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zipStore([
    f("[Content_Types].xml", `${H}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`),
    f("_rels/.rels", `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    f("xl/workbook.xml", `${H}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    f("xl/_rels/workbook.xml.rels", `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`),
    f("xl/worksheets/sheet1.xml", sheetXml(sheet, !!opts.rtl)),
  ]);
}
