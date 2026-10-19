import { Action } from "@/features/gapsheet/types/actions";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import { getSheet } from "@/features/gapsheet/lib/workbook/engine";
import { FormulaError, parseFormula, referencedAddresses } from "@/features/gapsheet/lib/workbook/formulas";
import { expandRange, lettersToCol, parseRange } from "@/features/gapsheet/lib/workbook/ranges";

/** Row numbers (not the first occurrence) whose every cell in the range equals an earlier row. Header row is never touched. */
export function findDuplicateRows(cells: Record<string, import("@/features/gapsheet/types/workbook").Cell>, r: { start: { col: number; row: number }; end: { col: number; row: number } }): number[] {
  const seen = new Set<string>(); const dup: number[] = [];
  for (let row = r.start.row + 1; row <= r.end.row; row++) {
    const key = JSON.stringify(Array.from({ length: r.end.col - r.start.col + 1 }, (_, i) => { const v = cells[`${String.fromCharCode(64 + r.start.col + i)}${row}`]?.value ?? null; return typeof v === "string" ? v.trim().toLowerCase() : v; }));
    if (seen.has(key)) dup.push(row); else seen.add(key);
  }
  return dup;
}

export type ValidationResult = { ok: true; action: Action } | { ok: false; error: string; stage: "schema" | "workbook" | "business" };
import { pick, type Lang } from "@/features/gapsheet/lib/i18n";
const L = pick<string>;
const fail = (stage: "schema" | "workbook" | "business", error: string): ValidationResult => ({ ok: false, stage, error });

/** Schema -> workbook -> business validation (BUILD_SPEC 19-20). */
export function validateAction(input: unknown, state: WorkbookState, lang: Lang = "he"): ValidationResult {
  const parsed = Action.safeParse(input);
  if (!parsed.success) return fail("schema", L(lang, "הפעולה שהוצעה אינה תקינה.", "The proposed action is not valid."));
  const action = parsed.data;
  const sheet = getSheet(state, action.sheetId);
  if (!sheet) return fail("workbook", L(lang, "הגיליון שצוין לא קיים.", "The specified sheet does not exist."));

  if (action.type === "ADD_FORMULA") {
    const target = parseRange(action.targetRange);
    if (!target) return fail("business", L(lang, "הטווח שבחרת לא קיים בטבלה.", "The selected range does not exist in the table."));
    if (target.start.col !== target.end.col) return fail("business", L(lang, "אפשר למלא נוסחה למטה בעמודה אחת בלבד.", "A formula can only be filled down a single column."));
    try {
      const node = parseFormula(action.formula);
      const refs = referencedAddresses(node);
      if (expandRange(target).some((a) => refs.includes(a))) return fail("business", L(lang, "הנוסחה מפנה לתא שבו היא נמצאת (הפניה מעגלית).", "The formula refers to the cell it is in (a circular reference)."));
      if (node.type === "function" && refs.length === 0) return fail("business", L(lang, "הנוסחה לא מפנה לאף תא.", "The formula does not refer to any cell."));
    } catch (e) {
      return fail("business", e instanceof FormulaError ? L(lang, "לא הצלחתי להבין את הנוסחה.", "I could not understand the formula.") : L(lang, "שגיאה בנוסחה.", "There is an error in the formula."));
    }
  }

  if (action.type === "SORT") {
    const r = parseRange(action.range);
    if (!r) return fail("business", L(lang, "הטווח שבחרת לא קיים בטבלה.", "The selected range does not exist in the table."));
    const keyCol = lettersToCol(action.keyColumn);
    if (keyCol < r.start.col || keyCol > r.end.col) return fail("business", L(lang, "עמודת המיון לא נמצאת בטווח.", "The sort column is not within the range."));
    if (r.end.row - r.start.row < 1) return fail("business", L(lang, "אין מספיק שורות למיון.", "There are not enough rows to sort."));
    if (expandRange(r).some((a) => sheet.cells[a]?.formula)) return fail("business", L(lang, "אי אפשר למיין טווח שמכיל נוסחאות, המיון היה מקלקל אותן.", "A range that contains formulas cannot be sorted, because sorting would break them."));
  }

  if (action.type === "SET_RANGE") {
    const r = parseRange(action.range);
    if (!r) return fail("business", L(lang, "הטווח שבחרת לא קיים בטבלה.", "The selected range does not exist in the table."));
    if (typeof action.value === "string" && action.value.trim().startsWith("=")) return fail("business", L(lang, "אי אפשר למלא טווח בנוסחה. אפשר להוסיף נוסחה בנפרד.", "A range cannot be filled with a formula. Add the formula separately."));
    if (expandRange(r).length > 500) return fail("business", L(lang, "הטווח גדול מדי לפעולה אחת.", "The range is too large for a single action."));
  }

  if (action.type === "RENAME_SHEET") {
    const n = action.newName.trim();
    if (!n || /[[\]:*?/\\']/.test(n)) return fail("business", L(lang, "שם הגיליון לא יכול להיות ריק או להכיל [ ] : * ? / \\ או גרש.", "A sheet name cannot be empty or contain [ ] : * ? / \\ or an apostrophe."));
    if (n === sheet.name) return fail("business", L(lang, "זה כבר שם הגיליון.", "That is already the sheet name."));
    if (state.sheets.some((s) => s.id !== sheet.id && s.name.toLowerCase() === n.toLowerCase())) return fail("business", L(lang, `כבר יש גיליון בשם ${n}. שם גיליון חייב להיות ייחודי.`, `A sheet named ${n} already exists. Sheet names must be unique.`));
  }
  if (action.type === "REMOVE_CHARTS" && !(sheet.charts && sheet.charts.length)) return fail("business", L(lang, "אין גרפים להסרה בגיליון.", "There are no charts to remove on this sheet."));

  if (action.type === "CREATE_CHART") {
    const lab = parseRange(action.labelRange); const val = parseRange(action.valueRange);
    if (!lab || !val) return fail("business", L(lang, "הטווח שבחרת לא קיים בטבלה.", "The selected range does not exist in the table."));
    if (lab.start.col !== lab.end.col || val.start.col !== val.end.col) return fail("business", L(lang, "גרף נבנה מעמודת תוויות אחת ועמודת ערכים אחת.", "A chart is built from one label column and one value column."));
    const n = val.end.row - val.start.row + 1;
    if (n !== lab.end.row - lab.start.row + 1) return fail("business", L(lang, "מספר התוויות והערכים חייב להיות זהה.", "The number of labels and values must match."));
    if (n < 2 || n > 50) return fail("business", L(lang, "גרף דורש בין 2 ל-50 נקודות.", "A chart needs between 2 and 50 points."));
    const vals = expandRange(val).map((a) => sheet.cells[a]);
    if (vals.some((c) => !c || typeof c.computedValue !== "number")) return fail("business", L(lang, "כל הערכים בגרף חייבים להיות מספרים.", "Every value in a chart must be a number."));
    if (action.chartType === "pie" && vals.some((c) => (c!.computedValue as number) < 0)) return fail("business", L(lang, "גרף עוגה לא יכול להציג ערכים שליליים.", "A pie chart cannot show negative values."));
    if (sheet.charts && sheet.charts.length >= 6) return fail("business", L(lang, "אפשר ליצור עד 6 גרפים בגיליון.", "A sheet can have up to 6 charts."));
  }

  if (action.type === "REMOVE_DUPLICATES") {
    const r = parseRange(action.range);
    if (!r || r.end.row - r.start.row < 1) return fail("business", L(lang, "צריך טווח עם כותרת ולפחות שורת נתונים אחת.", "A range with a header and at least one data row is needed."));
    if (expandRange(r).some((a) => sheet.cells[a]?.formula)) return fail("business", L(lang, "אי אפשר להסיר כפילויות בטווח שמכיל נוסחאות, השורות היו זזות והנוסחאות היו מתקלקלות.", "Duplicates cannot be removed from a range that contains formulas, because moving rows would break them."));
    if (findDuplicateRows(sheet.cells, r).length === 0) return fail("business", L(lang, "לא נמצאו שורות כפולות בטווח.", "No duplicate rows were found in the range."));
  }

  if (action.type === "CREATE_PIVOT") {
    const r = parseRange(action.range);
    if (!r) return fail("business", L(lang, "הטווח שבחרת לא קיים בטבלה.", "The selected range does not exist in the table."));
    const rc = lettersToCol(action.rowColumn), vc = lettersToCol(action.valueColumn);
    if ([rc, vc].some((c) => c < r.start.col || c > r.end.col)) return fail("business", L(lang, "עמודות הסיכום חייבות להיות בתוך הטווח.", "The summary columns must be inside the range."));
    if (r.end.row - r.start.row < 1) return fail("business", L(lang, "צריך כותרת ולפחות שורת נתונים אחת.", "A header and at least one data row are needed."));
    if (rc === vc) return fail("business", L(lang, "עמודת הקבוצות ועמודת הערכים חייבות להיות שונות.", "The group column and the value column must be different."));
    const rows = []; for (let row = r.start.row + 1; row <= r.end.row; row++) rows.push(row);
    const cellAt = (col: number, row: number) => sheet.cells[`${String.fromCharCode(64 + col)}${row}`];
    if (action.agg !== "count" && rows.some((row) => { const c = cellAt(vc, row); return !c || typeof c.computedValue !== "number"; })) return fail("business", L(lang, "סכום וממוצע דורשים שכל הערכים בעמודה יהיו מספרים.", "Sum and average need every value in the column to be a number."));
    if (new Set(rows.map((row) => String(cellAt(rc, row)?.computedValue ?? ""))).size > 100) return fail("business", L(lang, "יש יותר מדי קבוצות שונות (מעל 100).", "There are too many different groups (over 100)."));
    if (state.sheets.length >= 8) return fail("business", L(lang, "אפשר ליצור עד 8 גיליונות.", "A workbook can have up to 8 sheets."));
  }

  if (action.type === "FORMAT_RANGE") {
    if (!parseRange(action.range)) return fail("business", L(lang, "הטווח שבחרת לא קיים בטבלה.", "The selected range does not exist in the table."));
  }

  if (action.type === "CLEAR_RANGE") {
    if (!parseRange(action.range)) return fail("business", L(lang, "הטווח שבחרת לא קיים בטבלה.", "The selected range does not exist in the table."));
  }

  if (action.type === "FILTER") {
    const r = parseRange(action.range);
    if (!r) return fail("business", L(lang, "הטווח שבחרת לא קיים בטבלה.", "The selected range does not exist in the table."));
    const col = lettersToCol(action.column);
    if (col < r.start.col || col > r.end.col) return fail("business", L(lang, "עמודת הסינון לא נמצאת בטווח.", "The filter column is not within the range."));
    if (action.op !== "clear" && (action.value === undefined || action.value === "")) return fail("business", L(lang, "חסר ערך לסינון.", "The filter value is missing."));
    if ([">", ">=", "<", "<="].includes(action.op) && typeof action.value !== "number") return fail("business", L(lang, "סינון לפי גודל דורש מספר.", "Filtering by size requires a number."));
  }
  return { ok: true, action };
}
