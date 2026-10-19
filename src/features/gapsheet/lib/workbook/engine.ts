import type { Cell, CellValue, FilterSpec, Sheet, WorkbookState } from "@/features/gapsheet/types/workbook";
import { FormulaError, evaluate, parseFormula, referencedAddresses, splitRef } from "./formulas";
import { colToLetters, lettersToCol, parseAddress, parseRange } from "./ranges";

export function emptyCell(): Cell { return { value: null, formula: null, computedValue: null, type: "empty" }; }

export function inferType(v: CellValue): Cell["type"] {
  if (v === null || v === "") return "empty";
  if (typeof v === "number") return "number";
  if (typeof v === "boolean") return "boolean";
  return "text";
}

/** Parse what a user typed in a cell: "=..." is a formula, numeric strings become numbers. */
export function parseInput(raw: string): { value: CellValue; formula: string | null } {
  const t = raw.trim();
  if (t === "") return { value: null, formula: null };
  if (t.startsWith("=")) return { value: null, formula: t };
  if (/^-?\d+(\.\d+)?$/.test(t)) return { value: Number(t), formula: null };
  return { value: raw, formula: null };
}

export function getSheet(state: WorkbookState, sheetId: string): Sheet | undefined {
  return state.sheets.find((s) => s.id === sheetId);
}

/** Recompute every formula cell. Pure: returns a new state. Cycles yield an error cell. */
export function recalc(state: WorkbookState): WorkbookState {
  return recalcOwned(copyForRecalc(state));
}
/** Literal cells are immutable inputs. Only formula cells are written during recalculation. */
function copyForRecalc(state: WorkbookState): WorkbookState {
  return { ...state, sheets: state.sheets.map(sheet => ({ ...sheet, cells: copyCells(sheet.cells) })) };
}
/** Only freshly owned maps enter this set; no cache is kept for caller-owned mutable state. */
const ownedFormulaMaps = new WeakSet<Sheet["cells"]>();
function copyCells(cells: Sheet["cells"]): Sheet["cells"] {
  const next = { ...cells };
  for (const address in next) if (next[address].formula) { next[address] = { ...next[address] }; ownedFormulaMaps.add(next); }
  return next;
}
function recalcOwned(next: WorkbookState): WorkbookState {
  type R = { done: Map<string, CellValue>; visiting: Set<string>; errs: Map<string, string>; resolve: (addr: string) => CellValue };
  const resolvers = new Map<string, R>();
  const bySheetName = (name: string) => next.sheets.find((s) => s.name.toLowerCase() === name.toLowerCase());
  const resolverFor = (sheet: (typeof next.sheets)[number]): R => {
    const have = resolvers.get(sheet.id); if (have) return have;
    const done = new Map<string, CellValue>(); const errs = new Map<string, string>(); const visiting = new Set<string>();
    const lookup = (addr: string): CellValue => {
      const { sheet: sn, ref } = splitRef(addr);
      if (!sn) return resolve(addr);
      const other = bySheetName(sn); if (!other) throw new FormulaError("#REF!");
      return resolverFor(other).resolve(ref);
    };
    const resolve = (addr: string): CellValue => {
      const cell = sheet.cells[addr];
      if (!cell) return null;
      if (!cell.formula) return cell.value;
      if (errs.has(addr)) throw new FormulaError(errs.get(addr)!); // an error in a referenced cell travels on unchanged (Excel: #DIV/0! stays #DIV/0!)
      if (done.has(addr)) return done.get(addr)!;
      if (visiting.has(addr)) throw new FormulaError("#CIRCULAR!");
      visiting.add(addr);
      try {
        const v = evaluate(parseFormula(cell.formula), lookup);
        cell.computedValue = v; cell.type = "formula";
        done.set(addr, v);
        return v;
      } catch (e) {
        cell.computedValue = e instanceof FormulaError ? e.message : "#ERROR!";
        cell.type = "error";
        errs.set(addr, cell.computedValue as string);
        throw e instanceof FormulaError ? e : new FormulaError("#ERROR!");
      } finally { visiting.delete(addr); }
    };
    const r = { done, visiting, errs, resolve }; resolvers.set(sheet.id, r); return r;
  };
  for (const sheet of next.sheets) {
    if (!ownedFormulaMaps.has(sheet.cells)) continue;
    const r = resolverFor(sheet);
    // DAT-02: resolve same-sheet dependencies first, in an explicit stack (no deep recursion), so each resolve() below finds its inputs already computed.
    const depsOf = (addr: string): string[] => { const f = sheet.cells[addr]?.formula; if (!f) return []; try { return referencedAddresses(parseFormula(f)).filter((a) => !a.includes("!") && sheet.cells[a]?.formula); } catch { return []; } };
    const seen = new Set<string>(); const order: string[] = [];
    for (const root of Object.keys(sheet.cells)) {
      if (seen.has(root) || !sheet.cells[root].formula) continue;
      seen.add(root); const stack: { addr: string; deps: string[]; i: number }[] = [{ addr: root, deps: depsOf(root), i: 0 }];
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.i < top.deps.length) { const d = top.deps[top.i++]; const at = stack.findIndex((x) => x.addr === d);
          if (at >= 0) { for (const x of stack.slice(at)) { const c = sheet.cells[x.addr]; c.computedValue = "#CIRCULAR!"; c.type = "error"; r.errs.set(x.addr, "#CIRCULAR!"); } } // back edge: every cell on the loop is circular, as before
          else if (!seen.has(d)) { seen.add(d); stack.push({ addr: d, deps: depsOf(d), i: 0 }); } }
        else { order.push(top.addr); stack.pop(); }
      }
    }
    for (const addr of order) { try { r.resolve(addr); } catch { /* the error is already recorded on the cell */ } }
    for (const addr of Object.keys(sheet.cells)) { try { r.resolve(addr); } catch { /* the error is already recorded on the cell */ } }
  }
  return next;
}

/** Apply a validated batch once: clipboard operations cannot save half a range. */
export function setCells(state: WorkbookState, sheetId: string, edits: { address: string; raw: string }[]): WorkbookState {
  if (!getSheet(state, sheetId) || edits.some(e => !parseAddress(e.address) || e.raw.length > 8192)) return state;
  const next = copyForRecalc(state);
  const sheet = getSheet(next, sheetId)!;
  for (const edit of edits) writeInput(sheet, edit.address, parseInput(edit.raw));
  next.version += 1;
  return recalcOwned(next);
}
function writeInput(sheet: Sheet, address: string, input: { value: CellValue; formula: string | null }) {
  if (input.value === null && !input.formula) delete sheet.cells[address];
  else { if (input.formula) ownedFormulaMaps.add(sheet.cells); sheet.cells[address] = {
    ...(sheet.cells[address]?.format ? { format: sheet.cells[address]!.format } : {}),
    value: input.value, formula: input.formula, computedValue: input.formula ? null : input.value,
    type: input.formula ? "formula" : inferType(input.value),
  }; }
}
export function setCell(state: WorkbookState, sheetId: string, address: string, input: { value: CellValue; formula: string | null }): WorkbookState {
  if (!getSheet(state, sheetId) || !parseAddress(address)) return state;
  const next = copyForRecalc(state);
  writeInput(getSheet(next, sheetId)!, address, input);
  next.version += 1;
  return recalcOwned(next);
}

/** Display value of a cell (what the grid shows). */
export function displayValue(cell: Cell | undefined): string {
  if (!cell) return "";
  const v = cell.formula ? cell.computedValue : cell.value;
  if (v === null) return "";
  return typeof v === "number" ? String(round15(v)) : String(v);
}
/** Excel shows and compares numbers at 15 significant digits. The stored value is never changed. */
export const round15 = (v: number): number => (Number.isFinite(v) ? Number(v.toPrecision(15)) : v);

/** What the grid shows when a number format is set. Underlying values are untouched. */
export function formattedValue(cell: Cell | undefined): string {
  const raw = displayValue(cell);
  const v = cell ? (cell.formula ? cell.computedValue : cell.value) : null;
  const f = cell?.format;
  if (typeof v !== "number" || !f?.numberFormat) return raw;
  if (f.numberFormat === "date") return Number.isFinite(v) && v >= 1 && v < 2958466 ? new Date(Math.round((Math.floor(v) - 25569) * 86400000)).toISOString().slice(0, 10) : raw;
  const d = f.decimals ?? (f.numberFormat === "number" ? 2 : f.numberFormat === "currency" ? 0 : 0);
  if (f.numberFormat === "percent") return `${(v * 100).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
  const body = v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return f.numberFormat === "currency" ? `₪${body}` : body;
}

/** Highest populated row in a column (0 when empty). */
export function lastRowInColumn(sheet: Sheet, col: number, fromRow = 1): number {
  let last = 0;
  for (const addr of Object.keys(sheet.cells)) {
    const r = parseAddress(addr)!;
    if (r.col === col && r.row >= fromRow && sheet.cells[addr].type !== "empty") last = Math.max(last, r.row);
  }
  return last;
}

/** Last row of the contiguous block of constant (non-formula) data starting at `fromRow` in a column; 0 if none. */
export function dataLastRow(sheet: Sheet, col: number, fromRow = 2): number {
  let last = 0;
  for (let r = fromRow; ; r++) {
    const c = sheet.cells[`${colToLetters(col)}${r}`];
    if (!c || c.type === "empty" || c.formula) break;
    last = r;
  }
  return last;
}

export function matchesFilter(cell: Cell | undefined, f: FilterSpec): boolean {
  const v = cell ? (cell.formula ? cell.computedValue : cell.value) : null;
  const same = typeof v === "number" && typeof f.value === "number" ? v === f.value : String(v ?? "").toLowerCase() === String(f.value).toLowerCase();
  if (f.op === "=") return same;
  if (f.op === "!=") return !same;
  const n = typeof v === "number" ? v : Number(v);
  const x = Number(f.value);
  if (v === null || v === "" || Number.isNaN(n)) return false;
  if (f.op === ">") return n > x; if (f.op === ">=") return n >= x; if (f.op === "<") return n < x; return n <= x;
}

/** Rows (1-based) hidden by the sheet's active filter. Rows outside the filter range are never hidden. */
export function hiddenRows(sheet: Sheet): Set<number> {
  const out = new Set<number>();
  const f = sheet.filter;
  if (!f) return out;
  const r = parseRange(f.range);
  if (!r) return out;
  const col = lettersToCol(f.column);
  for (let row = r.start.row; row <= r.end.row; row++) if (!matchesFilter(sheet.cells[`${f.column}${row}`], f)) out.add(row);
  void col;
  return out;
}
