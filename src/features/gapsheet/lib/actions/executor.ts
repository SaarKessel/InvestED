import { pick, type Lang } from "@/features/gapsheet/lib/i18n";
import type { Action, ActionRecord, RiskLevel } from "@/features/gapsheet/types/actions";
import type { Cell, CellFormat, WorkbookState } from "@/features/gapsheet/types/workbook";
import { getSheet, parseInput, recalc, setCell } from "@/features/gapsheet/lib/workbook/engine";
import { renameSheetInFormula, shiftFormulaRows } from "@/features/gapsheet/lib/workbook/formulas";
import { expandRange, lettersToCol, parseAddress, parseRange, toAddress } from "@/features/gapsheet/lib/workbook/ranges";
import { findDuplicateRows, validateAction } from "./validator";
import { evaluateRisk, requiresConfirmation } from "./risk";

export type ExecResult =
  | { status: "success"; before: WorkbookState; after: WorkbookState; record: ActionRecord }
  | { status: "confirmation_required"; riskLevel: RiskLevel; actions: Action[] }
  | { status: "rejected"; error: string };

let counter = 0;
const newId = () => `act_${Date.now().toString(36)}_${(counter++).toString(36)}`;
const ORDER: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];

function sortRange(state: WorkbookState, a: Extract<Action, { type: "SORT" }>): WorkbookState {
  const next = structuredClone(state);
  const sheet = getSheet(next, a.sheetId)!;
  const r = parseRange(a.range)!;
  const keyCol = lettersToCol(a.keyColumn);
  const rows: Record<number, Cell | undefined>[] = [];
  for (let row = r.start.row; row <= r.end.row; row++) {
    const o: Record<number, Cell | undefined> = {};
    for (let col = r.start.col; col <= r.end.col; col++) o[col] = sheet.cells[toAddress({ col, row })];
    rows.push(o);
  }
  const keyOf = (o: Record<number, Cell | undefined>) => o[keyCol]?.value ?? null;
  const dir = a.direction === "asc" ? 1 : -1;
  const sorted = rows.map((o, i) => ({ o, i })).sort((x, y) => {
    const kx = keyOf(x.o), ky = keyOf(y.o);
    if ((kx === null || kx === "") && (ky === null || ky === "")) return x.i - y.i;
    if (kx === null || kx === "") return 1; // empties always last
    if (ky === null || ky === "") return -1;
    const c = typeof kx === "number" && typeof ky === "number" ? kx - ky : String(kx).localeCompare(String(ky), "he");
    return c === 0 ? x.i - y.i : c * dir; // stable
  }).map((x) => x.o);
  sorted.forEach((o, idx) => {
    for (let col = r.start.col; col <= r.end.col; col++) {
      const addr = toAddress({ col, row: r.start.row + idx });
      if (o[col]) sheet.cells[addr] = o[col]!; else delete sheet.cells[addr];
    }
  });
  next.version += 1;
  return next;
}

function applyOne(action: Action, state: WorkbookState): WorkbookState {
  if (action.type === "RENAME_SHEET") {
    const next = structuredClone(state); const sh = getSheet(next, action.sheetId)!; const from = sh.name; const to = action.newName.trim(); sh.name = to;
    for (const s of next.sheets) for (const c of Object.values(s.cells)) if (c.formula && c.formula.includes("!")) c.formula = renameSheetInFormula(c.formula, from, to);
    next.version += 1; return recalc(next);
  }
  if (action.type === "SET_CELL") return setCell(state, action.sheetId, action.address, typeof action.value === "string" ? parseInput(action.value) : { value: action.value, formula: null });
  if (action.type === "ADD_FORMULA") {
    const cells = expandRange(parseRange(action.targetRange)!);
    const first = parseAddress(cells[0])!;
    let s = state;
    for (const a of cells) s = setCell(s, action.sheetId, a, { value: null, formula: shiftFormulaRows(action.formula, parseAddress(a)!.row - first.row) });
    return s;
  }
  if (action.type === "FORMAT_RANGE") {
    const next = structuredClone(state);
    const sheet = getSheet(next, action.sheetId)!;
    for (const a of expandRange(parseRange(action.range)!)) {
      const c = sheet.cells[a]; if (!c || c.type === "empty") continue;
      const f: Record<string, unknown> = { ...(c.format ?? {}), ...action.format };
      if (f.numberFormat === "general") { delete f.numberFormat; delete f.decimals; }
      if (f.background === "none") delete f.background;
      if (f.color === "none") delete f.color;
      if (f.border === "none") delete f.border;
      if (f.bold === false) delete f.bold; if (f.italic === false) delete f.italic;
      if (Object.keys(f).length) c.format = f as CellFormat; else delete c.format;
    }
    next.version += 1;
    return next;
  }
  if (action.type === "REMOVE_DUPLICATES") {
    const next = structuredClone(state); const sh = getSheet(next, action.sheetId)!; const r = parseRange(action.range)!;
    const drop = new Set(findDuplicateRows(sh.cells, r));
    const keep: number[] = []; for (let row = r.start.row + 1; row <= r.end.row; row++) if (!drop.has(row)) keep.push(row);
    const snap = structuredClone(sh.cells);
    for (let row = r.start.row + 1; row <= r.end.row; row++) for (let col = r.start.col; col <= r.end.col; col++) delete sh.cells[toAddress({ col, row })];
    keep.forEach((src, i) => { for (let col = r.start.col; col <= r.end.col; col++) { const c = snap[toAddress({ col, row: src })]; if (c) sh.cells[toAddress({ col, row: r.start.row + 1 + i })] = c; } });
    next.version += 1;
    return recalc(next);
  }
  if (action.type === "CREATE_PIVOT") {
    const src = getSheet(state, action.sheetId)!; const r = parseRange(action.range)!;
    const rc = lettersToCol(action.rowColumn), vc = lettersToCol(action.valueColumn);
    const at = (col: number, row: number) => src.cells[toAddress({ col, row })];
    // Groups are case-insensitive like Excel; the first spelling seen is shown.
    const groups = new Map<string, { label: string | number; n: number; sum: number }>();
    for (let row = r.start.row + 1; row <= r.end.row; row++) {
      const raw = at(rc, row)?.computedValue ?? ""; const k = String(raw).toLowerCase(); const v = at(vc, row)?.computedValue;
      const g = groups.get(k) ?? { label: typeof raw === "boolean" ? String(raw) : raw, n: 0, sum: 0 }; g.n += 1; g.sum += typeof v === "number" ? v : 0; groups.set(k, g);
    }
    const list = [...groups.values()].sort((a, b) => String(a.label).localeCompare(String(b.label)));
    const hdr = (col: number) => String(at(col, r.start.row)?.computedValue ?? "");
    const label = action.agg === "count" ? `Count of ${hdr(vc)}` : `${action.agg === "sum" ? "Sum" : "Average"} of ${hdr(vc)}`;
    let n = 1; const names = new Set(state.sheets.map((s) => s.name)); let name = "Pivot"; while (names.has(name)) name = `Pivot ${++n}`;
    const id = `pivot_${state.sheets.length + 1}_${newId()}`;
    let s: WorkbookState = { ...structuredClone(state), sheets: [...state.sheets, { id, name, position: state.sheets.length, cells: {} }] };
    const put = (addr: string, value: string | number | null, formula: string | null = null) => { s = setCell(s, id, addr, { value, formula }); };
    // Live formulas that point back at the source sheet, unless the names make that unsafe (then a fixed value is written).
    const q = `'${src.name}'!`; const canLink = !src.name.includes("'");
    const kc = (i: number) => `A${i + 2}`;
    const col = (c: number) => { const l = String.fromCharCode(64 + c); return `${q}${l}${r.start.row + 1}:${l}${r.end.row}`; };
    put("A1", hdr(rc)); put("B1", label);
    list.forEach((g, i) => {
      put(kc(i), g.label);
      const safe = canLink && !(typeof g.label === "string" && /^[<>=]/.test(g.label.trim())) && String(g.label) !== "";
      const fixed = action.agg === "count" ? g.n : action.agg === "sum" ? g.sum : Math.round((g.sum / g.n) * 1e6) / 1e6;
      if (!safe) put(`B${i + 2}`, fixed);
      else put(`B${i + 2}`, null, action.agg === "sum" ? `=SUMIF(${col(rc)},${kc(i)},${col(vc)})` : action.agg === "count" ? `=COUNTIF(${col(rc)},${kc(i)})` : `=AVERAGEIF(${col(rc)},${kc(i)},${col(vc)})`);
    });
    if (action.agg !== "average") { put(`A${list.length + 2}`, "Total"); put(`B${list.length + 2}`, null, `=SUM(B2:B${list.length + 1})`); }
    s = { ...s, activeSheetId: id, version: s.version + 1 };
    return recalc(s);
  }
  if (action.type === "REMOVE_CHARTS") {
    const next = structuredClone(state); const sh = getSheet(next, action.sheetId)!; sh.charts = []; next.version += 1; return next;
  }
  if (action.type === "CREATE_CHART") {
    const next = structuredClone(state);
    const sheet = getSheet(next, action.sheetId)!;
    sheet.charts = [...(sheet.charts ?? []), { id: newId(), type: action.chartType, title: action.title ?? "", labelRange: action.labelRange, valueRange: action.valueRange }];
    next.version += 1;
    return next;
  }
  if (action.type === "SET_RANGE") {
    let s = state;
    for (const a of expandRange(parseRange(action.range)!)) s = setCell(s, action.sheetId, a, { value: action.value, formula: null });
    return s;
  }
  if (action.type === "CLEAR_RANGE") {
    const next = structuredClone(state);
    const sheet = getSheet(next, action.sheetId)!;
    for (const a of expandRange(parseRange(action.range)!)) delete sheet.cells[a];
    next.version += 1;
    return recalc(next);
  }
  if (action.type === "SORT") return recalc(sortRange(state, action));
  const next = structuredClone(state);
  const sheet = getSheet(next, action.sheetId)!;
  sheet.filter = action.op === "clear" ? null : { range: action.range, column: action.column, op: action.op, value: action.value as string | number };
  next.version += 1;
  return next;
}

/**
 * The executor is the authority, not the model (BUILD_SPEC 17, 23).
 * Pure and all-or-nothing: a multi-step proposal either fully applies or leaves `before` untouched (rollback by construction).
 */
export function executeActions(input: unknown[], before: WorkbookState, opts: { source: "user" | "ai"; confirmed?: boolean; lang?: Lang }): ExecResult {
  const lang = opts.lang ?? "he";
  if (!Array.isArray(input) || input.length === 0) return { status: "rejected", error: pick(lang, "לא הוצעה פעולה.", "No action was proposed.") };
  let draft = before;
  const validated: Action[] = [];
  let risk: RiskLevel = "LOW";
  for (const raw of input) {
    const v = validateAction(raw, draft, lang);
    if (!v.ok) return { status: "rejected", error: v.error };
    const r = evaluateRisk(v.action, draft);
    if (ORDER.indexOf(r) > ORDER.indexOf(risk)) risk = r;
    validated.push(v.action);
    draft = applyOne(v.action, draft);
  }
  if (requiresConfirmation(risk) && !opts.confirmed) return { status: "confirmation_required", riskLevel: risk, actions: validated };
  draft = recalc(draft);
  for (const a of validated) {
    if (a.type !== "ADD_FORMULA") continue;
    const sheet = getSheet(draft, a.sheetId)!;
    if (expandRange(parseRange(a.targetRange)!).some((x) => sheet.cells[x]?.type === "error")) return { status: "rejected", error: pick(lang, "לא הצלחתי לחשב את הנוסחה.", "I could not calculate the formula.") };
  }
  return { status: "success", before, after: draft, record: { id: newId(), actions: validated, source: opts.source, riskLevel: risk, createdAt: new Date().toISOString() } };
}

export const executeAction = (input: unknown, before: WorkbookState, opts: { source: "user" | "ai"; confirmed?: boolean; lang?: Lang }) => executeActions([input], before, opts);
