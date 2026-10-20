import type { CellValue, WorkbookState } from "@/features/gapsheet/types/workbook";
import { recalc } from "@/features/gapsheet/lib/workbook/engine";
import { parseAddress } from "@/features/gapsheet/lib/workbook/ranges";
import { gridToSheet, ImportError, LIMITS } from "@/features/gapsheet/lib/io";

/**
 * Minimal dependency-free .xlsx reader (values only, first sheet).
 * Mirrors the writer in xlsx.ts: formulas are imported as their cached value,
 * never as a formula, so a file cannot inject formulas. Handles both stored
 * and DEFLATE-compressed zip entries via DecompressionStream.
 */

const dec = new TextDecoder();
const MAX_UNPACKED = 50_000_000;

interface ZipEntry { name: string; method: number; csize: number; usize: number; offset: number; }

function centralDirectory(buf: Uint8Array): ZipEntry[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65536); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new ImportError("bad_file", "not a zip");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const out: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || dv.getUint32(p, true) !== 0x02014b50) throw new ImportError("bad_file", "bad central directory");
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const usize = dv.getUint32(p + 24, true);
    const nlen = dv.getUint16(p + 28, true);
    const elen = dv.getUint16(p + 30, true);
    const clen = dv.getUint16(p + 32, true);
    const offset = dv.getUint32(p + 42, true);
    if (usize > MAX_UNPACKED) throw new ImportError("too_big_unpacked", String(usize));
    out.push({ name: dec.decode(buf.subarray(p + 46, p + 46 + nlen)), method, csize, usize, offset });
    p += 46 + nlen + elen + clen;
  }
  return out;
}

async function readEntry(buf: Uint8Array, e: ZipEntry): Promise<Uint8Array> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(e.offset, true) !== 0x04034b50) throw new ImportError("bad_file", "bad local header");
  const nlen = dv.getUint16(e.offset + 26, true);
  const elen = dv.getUint16(e.offset + 28, true);
  const raw = buf.subarray(e.offset + 30 + nlen + elen, e.offset + 30 + nlen + elen + e.csize);
  if (e.method === 0) return new Uint8Array(raw);
  if (e.method !== 8 || typeof DecompressionStream === "undefined") throw new ImportError("bad_file", "unsupported compression");
  const source = new ReadableStream({ start(c) { c.enqueue(raw); c.close(); } });
  const stream = source.pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function parseXml(text: string): Document {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new ImportError("bad_file", "bad xml");
  return doc;
}

function cellValue(c: Element, shared: string[]): CellValue {
  const t = c.getAttribute("t");
  const v = c.getElementsByTagName("v")[0]?.textContent ?? null;
  if (t === "s") return v === null ? null : shared[Number(v)] ?? null;
  if (t === "inlineStr") { const is = c.getElementsByTagName("is")[0]; return is ? is.textContent ?? "" : null; }
  if (v === null) return null;
  if (t === "b") return v === "1";
  if (t === "str" || t === "e") return v;
  if (t === "d") return v;
  return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(v) ? Number(v) : v;
}

export async function xlsxToWorkbook(buf: ArrayBuffer, fileName: string): Promise<WorkbookState> {
  if (buf.byteLength > LIMITS.maxBytes) throw new ImportError("too_big", "size");
  const bytes = new Uint8Array(buf);
  const entries = centralDirectory(bytes);
  const get = async (name: string) => { const e = entries.find((x) => x.name === name); return e ? dec.decode(await readEntry(bytes, e)) : null; };

  const wbText = await get("xl/workbook.xml");
  if (!wbText) throw new ImportError("bad_file", "no workbook.xml");
  const wb = parseXml(wbText);
  const sheetEl = wb.getElementsByTagName("sheet")[0];
  if (!sheetEl) throw new ImportError("empty", "no sheets");
  const rid = sheetEl.getAttribute("r:id") ?? sheetEl.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
  const sheetName = (sheetEl.getAttribute("name") || fileName.replace(/\.[^.]+$/, "")).slice(0, 31) || "Sheet1";

  const relsText = await get("xl/_rels/workbook.xml.rels");
  if (!relsText || !rid) throw new ImportError("bad_file", "no rels");
  const rels = parseXml(relsText);
  let target: string | null = null;
  for (const rel of Array.from(rels.getElementsByTagName("Relationship"))) {
    if (rel.getAttribute("Id") === rid) { target = rel.getAttribute("Target"); break; }
  }
  if (!target) throw new ImportError("bad_file", "sheet rel missing");
  const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target}`;

  const shared: string[] = [];
  const ssText = await get("xl/sharedStrings.xml");
  if (ssText) {
    const ss = parseXml(ssText);
    for (const si of Array.from(ss.getElementsByTagName("si"))) shared.push(Array.from(si.getElementsByTagName("t")).map((x) => x.textContent ?? "").join(""));
  }

  const sheetText = await get(sheetPath);
  if (!sheetText) throw new ImportError("bad_file", "no sheet xml");
  const doc = parseXml(sheetText);
  const sparse = new Map<string, CellValue>();
  let maxRow = 0, maxCol = 0;
  for (const row of Array.from(doc.getElementsByTagName("row"))) {
    let colCursor = 0;
    for (const c of Array.from(row.getElementsByTagName("c"))) {
      colCursor++;
      let addr = c.getAttribute("r");
      if (!addr) addr = `${String.fromCharCode(64 + Math.min(colCursor, 26))}${row.getAttribute("r") ?? "1"}`;
      const p = parseAddress(addr);
      if (!p) continue;
      if (p.row > LIMITS.maxRows) throw new ImportError("too_many_rows", String(p.row));
      if (p.col > LIMITS.maxCols) throw new ImportError("too_many_cols", String(p.col));
      const v = cellValue(c, shared);
      if (v === null || v === "") continue;
      sparse.set(`${p.col}:${p.row}`, v);
      maxRow = Math.max(maxRow, p.row); maxCol = Math.max(maxCol, p.col);
    }
  }
  const grid: CellValue[][] = [];
  for (let r = 1; r <= maxRow; r++) { const row: CellValue[] = []; for (let c = 1; c <= maxCol; c++) row.push(sparse.get(`${c}:${r}`) ?? null); grid.push(row); }
  return recalc({ workbookId: "wb_local", name: sheetName, version: 1, activeSheetId: "sheet_1", sheets: [gridToSheet(grid, sheetName)] });
}
