import type { Sheet, WorkbookState, CellValue } from "@/features/gapsheet/types/workbook";
import { parseInput, recalc, inferType, round15 } from "@/features/gapsheet/lib/workbook/engine";
import { parseFormula } from "@/features/gapsheet/lib/workbook/formulas";
import { colToLetters, parseAddress } from "@/features/gapsheet/lib/workbook/ranges";

export const LIMITS = { maxBytes: 5_000_000, maxRows: 5000, maxCols: 100 };
export class ImportError extends Error { constructor(public code: "too_big" | "too_many_rows" | "too_many_cols" | "empty" | "bad_type" | "bad_file" | "too_big_unpacked", msg: string) { super(msg); } }

/** RFC 4180 parser: quotes, escaped quotes, newlines in fields, CRLF, BOM, ; or tab delimiter auto-detected. */
export function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const first = text.split(/\r?\n/)[0] ?? "";
  const count = (c: string) => first.split(c).length - 1;
  const delim = [",", ";", "\t"].reduce((a, b) => (count(b) > count(a) ? b : a), ",");
  const rows: string[][] = []; let row: string[] = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"' && f === "") q = true;
    else if (c === delim) { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); f = ""; rows.push(row); row = []; }
    else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  while (rows.length && rows[rows.length - 1].every((x) => x === "")) rows.pop();
  return rows;
}

function cellFrom(raw: string) {
  // Imported text is data, never a formula: a leading "=" stays text so a file cannot inject formulas.
  const t = raw.trim();
  if (t === "") return { value: null as CellValue, formula: null };
  if (t.startsWith("=")) return { value: raw, formula: null };
  if (/^-?\d+(\.\d+)?$/.test(t)) return { value: Number(t), formula: null };
  if (/^(true|false)$/i.test(t)) return { value: t.toLowerCase() === "true", formula: null };
  return parseInput(raw);
}

export function gridToSheet(rows: CellValue[][], name: string, id = "sheet_1", position = 0, allowFormulas?: (string | null)[][]): Sheet {
  if (!rows.length) throw new ImportError("empty", "empty");
  if (rows.length > LIMITS.maxRows) throw new ImportError("too_many_rows", String(rows.length));
  const w = Math.max(...rows.map((r) => r.length));
  if (w > LIMITS.maxCols) throw new ImportError("too_many_cols", String(w));
  const sheet: Sheet = { id, name, position, cells: {} };
  rows.forEach((r, i) => r.forEach((v, j) => {
    const addr = `${colToLetters(j + 1)}${i + 1}`;
    const fx = allowFormulas?.[i]?.[j] ?? null;
    if (fx) { sheet.cells[addr] = { value: null, formula: fx, computedValue: null, type: "formula" }; return; }
    if (v === null || v === "") return;
    sheet.cells[addr] = { value: v, formula: null, computedValue: v, type: inferType(v) };
  }));
  return sheet;
}

export function csvToWorkbook(text: string, fileName: string): WorkbookState {
  if (text.length > LIMITS.maxBytes) throw new ImportError("too_big", "size");
  const raw = parseCsv(text);
  const grid = raw.map((r) => r.map((x) => cellFrom(x).value));
  const name = fileName.replace(/\.[^.]+$/, "").slice(0, 31) || "Sheet1";
  return recalc({ workbookId: "wb_local", name, version: 1, activeSheetId: "sheet_1", sheets: [gridToSheet(grid, name)] });
}

/** Spreadsheet-injection guard: text that would be read as a formula by Excel gets a leading apostrophe. */
export function safeText(s: string): string { return /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s; }

export function sheetToGrid(sheet: Sheet): string[][] {
  let maxR = 0, maxC = 0;
  for (const a of Object.keys(sheet.cells)) { const p = parseAddress(a)!; maxR = Math.max(maxR, p.row); maxC = Math.max(maxC, p.col); }
  const out: string[][] = [];
  for (let r = 1; r <= maxR; r++) { const row: string[] = []; for (let c = 1; c <= maxC; c++) { const cell = sheet.cells[`${colToLetters(c)}${r}`]; const v = cell ? (cell.formula ? cell.computedValue : cell.value) : null; row.push(v === null || v === undefined ? "" : typeof v === "string" ? safeText(v) : String(typeof v === "number" ? round15(v) : v)); } out.push(row); }
  return out;
}

export function sheetToCsv(sheet: Sheet): string {
  const q = (s: string) => (/[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return "\ufeff" + sheetToGrid(sheet).map((r) => r.map(q).join(",")).join("\r\n");
}
export { parseFormula };
