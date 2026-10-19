import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import type { Action } from "@/features/gapsheet/types/actions";
import type { PracticeTask } from "./generator";
import { functionsUsed, parseFormula, referencedAddresses, shiftFormulaRows } from "@/features/gapsheet/lib/workbook/formulas";
import { expandRange, parseAddress, parseRange } from "@/features/gapsheet/lib/workbook/ranges";
import { executeAction } from "@/features/gapsheet/lib/actions/executor";
import { pick } from "@/features/gapsheet/lib/i18n";
import { getSheet, hiddenRows, setCell } from "@/features/gapsheet/lib/workbook/engine";

export type PracticeVerdict = { correct: boolean; reason: string; message: string };
export type Submission = { state?: WorkbookState; action?: unknown };
const M = (task: PracticeTask, he: string, en: string) => pick(task.lang ?? "he", he, en);
const no = (reason: string, message: string): PracticeVerdict => ({ correct: false, reason, message });
const yes = (message: string): PracticeVerdict => ({ correct: true, reason: "ok", message });

/**
 * Semantic validation (BUILD_SPEC 34), per mode. Never an exact string match.
 * formula mode: the target cell must hold a real formula that evaluates to the expected result from the data.
 * dialog modes: the submitted action is executed through the real executor on a fresh copy; the outcome is checked.
 */
export function validatePractice(task: PracticeTask, submission: Submission | WorkbookState): PracticeVerdict {
  const sub: Submission = "sheets" in submission ? { state: submission } : submission;
  const NEED: Record<string, string[]> = { sumifs: ["SUMIFS"], iferror: ["IFERROR"], text: ["TRIM", "LEN"], dates: ["DATEDIF"] };
  if (task.mode === "formula" && NEED[task.skillId]) {
    const f = sub.state?.sheets[0].cells[task.targetCell]?.formula; let used: string[] = [];
    try { used = f ? functionsUsed(parseFormula(f)) : []; } catch { /* reported below */ }
    if (f && !NEED[task.skillId].every((n) => used.includes(n))) return no("wrong_function", M(task, `המשימה מבקשת להשתמש ב-${NEED[task.skillId].join(" וב-")}.`, `The task asks you to use ${NEED[task.skillId].join(" and ")}.`));
  }
  if (task.mode === "formula" && (task.skillId === "xlookup" || task.skillId === "indexmatch")) {
    const f = sub.state?.sheets[0].cells[task.targetCell]?.formula; let used: string[] = [];
    try { used = f ? functionsUsed(parseFormula(f)) : []; } catch { /* the aggregate check reports the error */ }
    const ok = task.skillId === "xlookup" ? used.includes("XLOOKUP") : used.includes("INDEX") && used.includes("MATCH");
    if (f && !ok) return no("wrong_function", M(task, task.skillId === "xlookup" ? "המשימה מבקשת XLOOKUP. נסו להשתמש בה." : "המשימה מבקשת INDEX ו-MATCH ביחד. נסו להשתמש בשתיהן.", task.skillId === "xlookup" ? "The task asks for XLOOKUP. Try using it." : "The task asks for INDEX and MATCH together. Try using both."));
  }
  if (task.mode === "formula") return task.skillId === "if" ? validateIf(task, sub.state) : validateAggregate(task, sub.state);
  if (task.mode === "dialog-dedupe") return validateDedupe(task, sub.action);
  return task.mode === "dialog-sort" ? validateSort(task, sub.action) : validateFilter(task, sub.action);
}

function validateAggregate(task: PracticeTask, state?: WorkbookState): PracticeVerdict {
  const cell = state?.sheets[0].cells[task.targetCell];
  if (!cell || !cell.formula) return no("no_formula", M(task, "הקלידו נוסחה (שמתחילה ב-=) ולא מספר מוכן.", "Enter a formula (starting with =), not a ready-made number."));
  if (cell.type === "error") return no("error", M(task, "הנוסחה לא מחושבת. בדקו את הסוגריים והטווח.", "The formula cannot be calculated. Check the parentheses and the range."));
  if (typeof cell.computedValue !== "number" || Math.abs(cell.computedValue - (task.expected.value as number)) > 1e-9) return no("wrong_value", M(task, "התוצאה לא נכונה. בדקו שהטווח כולל את כל השורות.", "The result is not correct. Check that the range includes all the rows."));
  const refs = new Set(referencedAddresses(parseFormula(cell.formula)));
  if (!expandRange(parseRange(task.dataRange)!).every((a) => refs.has(a))) return no("not_dependent_on_data", M(task, "הנוסחה צריכה להתבסס על כל התאים בטווח.", "The formula must be based on every cell in the range."));
  return yes(M(task, "נכון! הנוסחה מחשבת את התוצאה מהנתונים.", "Correct! The formula calculates the result from the data."));
}

function validateIf(task: PracticeTask, state?: WorkbookState): PracticeVerdict {
  const cell = state?.sheets[0].cells[task.targetCell];
  if (!cell || !cell.formula) return no("no_formula", M(task, "הקלידו נוסחה (שמתחילה ב-=) ולא טקסט מוכן.", "Enter a formula (starting with =), not ready-made text."));
  let node;
  try { node = parseFormula(cell.formula); } catch { return no("error", M(task, "לא הצלחתי להבין את הנוסחה. בדקו סוגריים וגרשיים.", "I could not understand the formula. Check the parentheses and quotation marks.")); }
  if (!functionsUsed(node).includes("IF")) return no("no_if", M(task, "המשימה דורשת תנאי. נסו להשתמש ב-IF.", "The task needs a condition. Try using IF."));
  // semantic check: fill the formula down every data row on a fresh copy and compare with the expected outcomes
  const first = parseAddress(task.targetCell)!;
  let s = task.workbook;
  const expected = task.expected.values as string[];
  for (let i = 0; i < expected.length; i++) s = setCell(s, "p1", `C${first.row + i}`, { value: null, formula: shiftFormulaRows(cell.formula, i) });
  const sheet = s.sheets[0];
  const got = expected.map((_, i) => sheet.cells[`C${first.row + i}`]?.computedValue);
  if (got.some((g, i) => g !== expected[i])) return no("wrong_value", M(task, "התוצאות לא נכונות בכל השורות. בדקו את התנאי (גדול מ / גדול או שווה) ואת הטקסטים.", "The results are not correct in every row. Check the condition (greater than vs. at least) and the texts."));
  return yes(M(task, "נכון! התנאי עובד על כל השורות.", "Correct! The condition works on every row."));
}

function runAction(task: PracticeTask, action: unknown, type: "SORT" | "FILTER"): { err?: PracticeVerdict; after?: WorkbookState } {
  const a = action as Partial<Action> | undefined;
  if (!a || a.type !== type) return { err: no("no_action", M(task, "בחרו את הפעולה והגדרות ולחצו \"החל\".", "Choose the action and its settings, then press \"Apply\".")) };
  const res = executeAction({ ...a, sheetId: "p1" }, task.workbook, { source: "user" });
  if (res.status !== "success") return { err: no("rejected", M(task, "ההגדרות לא תקינות. בדקו את העמודה והטווח.", "The settings are not valid. Check the column and the range.")) };
  return { after: res.after };
}

function validateDedupe(task: PracticeTask, action: unknown): PracticeVerdict {
  const a = action as Partial<Action> | undefined;
  if (!a || a.type !== "REMOVE_DUPLICATES") return no("no_action", M(task, "לחצו על \"הסרת כפילויות\".", "Press \"Remove duplicates\"."));
  const res = executeAction({ ...a, sheetId: "p1" }, task.workbook, { source: "user", confirmed: true });
  if (res.status !== "success") return no("rejected", M(task, "הפעולה לא הצליחה. ודאו שנבחרה כל הטבלה כולל הכותרת.", "The action did not work. Make sure the whole table including the header is selected."));
  const sheet = getSheet(res.after, "p1")!; const orig = task.workbook.sheets[0]; const last = parseRange(task.dataRange)!.end.row;
  const row = (s: typeof sheet, r: number) => ["A", "B", "C"].map((c) => String(s.cells[`${c}${r}`]?.value ?? "")).join("|");
  const kept: string[] = []; for (let r = 2; r <= last; r++) { const k = row(sheet, r); if (k !== "||") kept.push(k); }
  const want = [...new Set(Array.from({ length: last - 1 }, (_, i) => row(orig, i + 2)))];
  if (kept.length === want.length && kept.every((k, i) => k === want[i])) return yes(M(task, "נכון! כל שורה מופיעה פעם אחת, והשורה הראשונה מכל כפילות נשארה.", "Correct! Every row appears once, and the first copy of each duplicate stayed."));
  return no("wrong_result", M(task, "התוצאה לא נכונה. בדקו שכל השורות הייחודיות נשארו.", "The result is not correct. Check that every unique row stayed."));
}

function validateSort(task: PracticeTask, action: unknown): PracticeVerdict {
  const r = runAction(task, action, "SORT");
  if (r.err) return r.err;
  const sheet = getSheet(r.after!, "p1")!; const orig = task.workbook.sheets[0];
  const last = parseRange(task.dataRange)!.end.row;
  const keys: number[] = []; const pairs = new Set<string>(); const origPairs = new Set<string>();
  for (let row = 2; row <= last; row++) {
    keys.push(sheet.cells[`B${row}`]?.value as number);
    pairs.add(`${sheet.cells[`A${row}`]?.value}|${sheet.cells[`B${row}`]?.value}|${sheet.cells[`C${row}`]?.value}`);
    origPairs.add(`${orig.cells[`A${row}`]?.value}|${orig.cells[`B${row}`]?.value}|${orig.cells[`C${row}`]?.value}`);
  }
  if ([...origPairs].some((p) => !pairs.has(p))) return no("rows_broken", M(task, "השורות התפרקו: כל שורה צריכה להישאר שלמה. מיין את כל הטווח.", "The rows were broken apart: every row must stay intact. Sort the whole range."));
  const exp = task.expected.sortedKey!;
  if (keys.every((k, i) => k === exp[i])) return yes(M(task, "נכון! הטבלה ממוינת לפי מחיר, וכל שורה נשארה שלמה.", "Correct! The table is sorted by price, and every row stayed intact."));
  const asc = [...exp].reverse();
  if (keys.every((k, i) => k === asc[i])) return no("wrong_direction", M(task, "הכיוון הפוך. המשימה: מהיקר לזול.", "The direction is reversed. The task is: from most to least expensive."));
  return no("wrong_column", M(task, "הטבלה לא ממוינת לפי מחיר. בחר את העמודה Price.", "The table is not sorted by price. Choose the Price column."));
}

function validateFilter(task: PracticeTask, action: unknown): PracticeVerdict {
  const r = runAction(task, action, "FILTER");
  if (r.err) return r.err;
  const sheet = getSheet(r.after!, "p1")!; const hidden = hiddenRows(sheet);
  const last = parseRange(task.dataRange)!.end.row;
  const visible: number[] = [];
  for (let row = 2; row <= last; row++) if (!hidden.has(row)) visible.push(sheet.cells[`B${row}`]?.value as number);
  visible.sort((a, b) => a - b);
  const exp = task.expected.visibleKeys!;
  if (visible.length === exp.length && visible.every((v, i) => v === exp[i])) return yes(M(task, "נכון! מוצגים רק המוצרים שהתנאי מתקיים בהם, והנתונים נשארו.", "Correct! Only the products that meet the condition are shown, and the data is still there."));
  return no("wrong_rows", M(task, "השורות שמוצגות לא תואמות את המשימה. בדקו את העמודה, התנאי והערך.", "The visible rows do not match the task. Check the column, the condition and the value."));
}
