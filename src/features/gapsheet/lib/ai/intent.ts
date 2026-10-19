import { requestsNewTable, newTableMessage } from "./capabilities";
import type { Action } from "@/features/gapsheet/types/actions";
import type { IntentResult, SkillId } from "@/features/gapsheet/types/ai";
import type { FilterOp } from "@/features/gapsheet/types/workbook";
import { firstEmptyBelow, type AiContext, type ColumnInfo } from "./context";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import { pick, type Lang } from "@/features/gapsheet/lib/i18n";

/**
 * Rules-based intent provider (the deterministic default; no API key, no cost).
 * One implementation of IntentProvider. An LLM provider can be swapped in via lib/ai/provider.ts
 * and must return the same IntentResult, which the executor validates identically.
 */
const SYNONYMS: string[][] = [
  ["sales", "מכירות", "מכירה", "הכנסות"], ["expenses", "expense", "הוצאות", "הוצאה"], ["name", "names", "שם", "שמות"], ["rep", "reps", "נציג", "נציגים", "איש מכירות"], ["month", "חודש"],
  ["score", "scores", "ציון", "ציונים"], ["price", "prices", "מחיר", "מחירים"], ["grade", "grades"],
];
const SUM_WORDS = /(סך|סכום|תחבר|חבר|חיבור|\bsum\b|total|add up)/i;
const AVG_WORDS = /(ממוצע|average|\bmean\b|\bavg\b)/i;
const MIN_WORDS = /(מינימום|המינימלי|הכי נמוכ|הכי קטנ|הנמוך ביותר|הנמוכות ביותר|הקטן ביותר|\bmin\b|minimum|lowest|smallest)/i;
const MAX_WORDS = /(מקסימום|המקסימלי|הכי גבוה|הכי גדול|הגבוה ביותר|הגבוהות ביותר|הגדול ביותר|\bmax\b|maximum|highest|largest|biggest)/i;
const COUNTA_WORDS = /(לא ריק|counta|non-?empty|not empty)/i;
const COUNT_WORDS = /(כמה|ספור|תספור|מספר ה|\bcount\b|how many)/i;
const SORT_WORDS = /(מיין|מיון|תמיין|סדר לפי|תסדר לפי|\bsort\b|order by)/i;
const FILTER_WORDS = /(סנן|סינון|הצג רק|תציג רק|תראה רק|תראה לי רק|הראה לי רק|\bfilter\b|show only|only show)/i;
const CLEAR_FILTER = /(נקה סינון|בטל סינון|הצג הכל|הצג הכול|תציג הכל|תציג הכול|clear (the )?filter|show all|remove filter)/i;
const IF_WORDS = /((^|\s)אם(\s|$)|\bif\b)/i;
const RANGE_RE = /\b([A-Za-z]{1,2}[1-9]\d{0,3}(?::[A-Za-z]{1,2}[1-9]\d{0,3})?)\b/;
const FILL_WORDS = /(תכתוב|תמלא|מלא|תשים|fill|write|set)/i;
const FMT_WORDS = /(מודגש|בולד|הדגש|\bbold\b|נטוי|italic|מטבע|שקל|currency|תאריך|\bdate\b|אחוז|percent|ממורכז|למרכז|מרכז|center|עשרוני|decimal|רקע|background|highlight|צבע|צבוע|תצבע|מילוי|\bfill\b|colou?r|shade|מסגרת|גבולות|border|פסים|banded|alternating|צהוב|ירוק|אדום|כחול|אפור|כתום|סגול|ורוד|טורקיז|yellow|green|red|blue|gray|grey|orange|purple|pink|teal)/i;
const DESTRUCTIVE = /(תמחק|מחק|תנקה|נקה את|תרוקן|תסיר|delete|remove|clear)/i;
const CHART_WORDS = /(גרף|תרשים|\bchart\b|\bgraph\b|\bplot\b)/i;
const VAGUE = /(יפה|תסדר|תשפר|make it (nice|pretty)|clean (it )?up|fix it)/i;
const FROM_HIGH = /(מה?גבוה|מה?גדול|from (the )?(high|large|big)|high to low|largest first|highest first)/i;
const FROM_LOW = /(מה?נמוך|מה?קטן|from (the )?(low|small)|low to high|smallest first|lowest first)/i;
const DESC = /(גבוה|יורד|הגדול|גדול לקטן|מהגדול|desc|highest|largest|biggest|descending|high to low)/i;
const ASC = /(נמוך|עולה|הקטן|קטן לגדול|מהקטן|\basc|lowest|smallest|ascending|low to high|א-ב)/i;

export interface IntentProvider { parse(message: string, ctx: AiContext): IntentResult; }

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
const tokens = (s: string) => normalize(s).split(/\s+/).filter(Boolean);
const stripPrefix = (t: string) => t.replace(/^[והבלמש]/, "");

function findColumn(message: string, ctx: AiContext, numericOnly = false, strict = false): ColumnInfo | null {
  const toks = tokens(message);
  const pool = numericOnly ? ctx.columns.filter((c) => c.numeric) : ctx.columns;
  for (const c of pool) {
    const h = c.header.toLowerCase();
    const syn = SYNONYMS.find((list) => list.includes(h)) ?? [h];
    if (syn.some((w) => toks.some((t) => t === w || stripPrefix(t) === w))) return c;
  }
  // the column the user explicitly selected counts as a deliberate reference
  if (ctx.selectedColumn && (!numericOnly || ctx.selectedColumn.numeric)) return ctx.selectedColumn;
  if (strict) return null;
  const numeric = ctx.columns.filter((c) => c.numeric);
  return numeric.length === 1 ? numeric[0] : null;
}

function colOptions(ctx: AiContext, numericOnly: boolean) {
  const o = ctx.columns.filter((c) => !numericOnly || c.numeric).map((c) => c.header);
  return o.length ? o : [L("לא נמצאה עמודה מתאימה", "No suitable column found")];
}

function parseNumber(s: string): number | null {
  const m = /-?\d[\d,]*(\.\d+)?/.exec(s.replace(/(\p{L})-(\d)/gu, "$1 $2")); // Hebrew prefix like ל-15000 is not a minus sign
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

function parseCondition(s: string): { op: FilterOp; value: number } | null {
  const n = parseNumber(s);
  if (n === null) return null;
  let op: FilterOp | null = null;
  if (/(לפחות|at least|>=|שווה או גדול|גדול או שווה|גבוה או שווה)/i.test(s)) op = ">=";
  else if (/(לכל היותר|at most|<=|קטן או שווה)/i.test(s)) op = "<=";
  else if (/(שונה מ|לא שווה|!=|<>|not equal)/i.test(s)) op = "!=";
  else if (/(מעל|גדול מ|גדולים מ|יותר מ|above|over|greater|more than|bigger than|>)/i.test(s)) op = ">";
  else if (/(מתחת|קטן מ|קטנים מ|פחות מ|below|under|less than|smaller than|<)/i.test(s)) op = "<";
  else if (/(שווה|equals?|equal to|==|=)/i.test(s)) op = "=";
  return op ? { op, value: n } : null;
}

export const OP_HE: Record<string, string> = { ">": "גדול מ", ">=": "גדול או שווה ל", "<": "קטן מ", "<=": "קטן או שווה ל", "=": "שווה ל", "!=": "שונה מ" };
export const OP_EN: Record<string, string> = { ">": "greater than", ">=": "at least", "<": "less than", "<=": "at most", "=": "equal to", "!=": "not equal to" };
const opText = (op: string) => (CURRENT_LANG === "en" ? OP_EN[op] : OP_HE[op]);
const opSep = () => (CURRENT_LANG === "en" ? " " : "");
const OP_FORMULA: Record<string, string> = { ">": ">", ">=": ">=", "<": "<", "<=": "<=", "=": "=", "!=": "<>" };

function quoted(s: string): string[] {
  const out: string[] = [];
  const re = /["“”'׳״‘’]([^"“”'׳״‘’]+)["“”'׳״‘’]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[1].trim());
  return out;
}

let CURRENT_LANG: Lang = "he";
const L = (he: string, en: string) => pick(CURRENT_LANG, he, en);
const STAGES = (what: string) => [L("ניתוח הטבלה...", "Analyzing the table..."), L(`זיהוי ${what}...`, `Identifying ${what}...`), L("ביצוע הפעולה...", "Running the action..."), L("בדיקת התוצאה...", "Checking the result...")];
const dataRange = (c: ColumnInfo, ctx: AiContext) => {
  const first = ctx.columns[0]?.letter ?? "A";
  const lastLetter = ctx.columns[ctx.columns.length - 1]?.letter ?? c.letter;
  return `${first}${c.firstRow}:${lastLetter}${c.lastRow}`;
};

function formulaIntent(fn: "SUM" | "AVERAGE" | "MIN" | "MAX" | "COUNT" | "COUNTA", skillId: "sum" | "average" | "min" | "max" | "count", col: ColumnInfo, state: WorkbookState): IntentResult {
  const target = firstEmptyBelow(state, col.letter, col.lastRow + 1);
  const range = `${col.letter}${col.firstRow}:${col.letter}${col.lastRow}`;
  return { kind: "action", skillId, confidence: 0.95, stages: STAGES(L(`עמודת ${col.header}`, `column ${col.header}`)), focus: col.header,
    actions: [{ type: "ADD_FORMULA", sheetId: state.activeSheetId, targetRange: target, formula: `=${fn}(${range})` }] };
}


/** A text cell value (e.g. "Sarah") named in the message, with its column. Strict: only exact tokens. */
function textMatch(message: string, ctx: AiContext | null): { col: ColumnInfo; value: string } | null {
  if (!ctx) return null;
  const toks = tokens(message); const all = toks.concat(toks.map(stripPrefix));
  for (const c of ctx.columns) for (const v of c.textValues) if (all.includes(v.toLowerCase())) return { col: c, value: v };
  return null;
}
let CURRENT_CTX: AiContext | null = null;
const ctxOf = (_m: string) => CURRENT_CTX;

type Handler = { id: string; matches: (m: string) => boolean; resolve: (m: string, ctx: AiContext, state: WorkbookState) => IntentResult };
const noTable = (): IntentResult => ({ kind: "unsupported", message: L("אין טבלה לעבוד עליה.", "There is no table to work on.") });

/** Intent handler registry (priority order). Each capability registers one handler; no scattered branching. */
const REMOVE_CHART_WORDS = /((הסר|הסרי|הסירו|מחק|מחקי|מחקו|תסיר|תמחק)\s.*(גרף|גרפים|תרשים|תרשימים)|\b(remove|delete|clear)\b.*\b(charts?|graphs?)\b)/i;
function textMatches(message: string, ctx: AiContext): { col: ColumnInfo; value: string }[] {
  const toks = tokens(message); const all = toks.concat(toks.map(stripPrefix)); const out: { col: ColumnInfo; value: string }[] = [];
  for (const c of ctx.columns) { const v = c.textValues.find((x) => all.includes(x.toLowerCase())); if (v) out.push({ col: c, value: v }); }
  return out;
}
const rangeOfCol = (c: ColumnInfo) => `${c.letter}${c.firstRow}:${c.letter}${c.lastRow}`;
const UPPER_W = /(אותיות גדולות|\bupper ?case\b|\bcapital letters\b|\bupper\b)/i, LOWER_W = /(אותיות קטנות|\blower ?case\b|\blower\b)/i;
const TRIM_W = /(רווחים מיותרים|הסר רווחים|נקה רווחים|\btrim\b|extra spaces)/i, LEN_W = /(אורך|כמה תווים|\blength\b|\bhow many characters\b)/i, ROUND_W = /(עגל|עיגול|\bround\b)/i;
const LOOKUP_W = /(חפש|חפשי|חפשו|\blook ?up\b|\bxlookup\b|\bvlookup\b|\bfind the\b)/i;
function fillDownIntent(ctx: AiContext, col: ColumnInfo, fn: string, skillId: SkillId, header: string, extra = ""): IntentResult {
  const n = ctx.nextFreeColumn;
  return { kind: "action", skillId, confidence: 0.9, stages: STAGES(L(`העמודה ${col.header}`, `column ${col.header}`)), focus: col.header, header,
    actions: [{ type: "SET_CELL", sheetId: ctx.sheetId, address: `${n}1`, value: header }, { type: "ADD_FORMULA", sheetId: ctx.sheetId, targetRange: `${n}${col.firstRow}:${n}${col.lastRow}`, formula: `=${fn}(${col.letter}${col.firstRow}${extra})` }] };
}
const textHandler = (id: string, re: RegExp, fn: string, skillId: SkillId, header: string, numeric = false, extra = (_m: string) => ""): Handler => ({ id, matches: (m) => re.test(m) && !FILTER_WORDS.test(m), resolve: (m, ctx) => {
  if (ctx.columns.length === 0) return noTable();
  const col = findColumn(m, ctx, numeric) ?? (ctx.columns.filter((c) => c.numeric === numeric).length === 1 ? ctx.columns.find((c) => c.numeric === numeric)! : null);
  if (!col || col.numeric !== numeric) return { kind: "clarification", question: L("על איזו עמודה להחיל את זה?", "Which column should this apply to?"), options: colOptions(ctx, numeric) };
  return fillDownIntent(ctx, col, fn, skillId, `${header} ${col.header}`.trim(), extra(m));
} });
const HANDLERS: Handler[] = [
  { id: "SUMIFS", matches: (m) => (SUM_WORDS.test(m) || COUNT_WORDS.test(m)) && !FILTER_WORDS.test(m) && textMatches(m, ctxOf(m) ?? ({ columns: [] } as unknown as AiContext)).length >= 2, resolve: (m, ctx, state) => {
      const ms = textMatches(m, ctx); const valueCol = findColumn(m, ctx, true) ?? (ctx.columns.filter((c) => c.numeric).length === 1 ? ctx.columns.find((c) => c.numeric)! : null);
      const isCount = COUNT_WORDS.test(m) && !SUM_WORDS.test(m);
      if (!valueCol && !isCount) return { kind: "clarification", question: L("איזו עמודה לחבר לפי התנאים?", "Which column should I add up by the conditions?"), options: colOptions(ctx, true) };
      const target = firstEmptyBelow(state, (valueCol ?? ctx.columns[0]).letter, (valueCol ?? ctx.columns[0]).lastRow + 1);
      const pairs = ms.slice(0, 2).map((x) => `${rangeOfCol(x.col)},"${x.value}"`).join(",");
      const what = ms.slice(0, 2).map((x) => `${x.col.header} = ${x.value}`).join(L(" וגם ", " and "));
      return { kind: "action", skillId: "sumifs", confidence: 0.9, stages: STAGES(L(`שני התנאים (${what})`, `the two conditions (${what})`)), focus: what,
        actions: [{ type: "ADD_FORMULA", sheetId: ctx.sheetId, targetRange: target, formula: isCount ? `=COUNTIFS(${pairs})` : `=SUMIFS(${rangeOfCol(valueCol!)},${pairs})` }] };
    } },
  { id: "AVERAGEIF", matches: (m) => AVG_WORDS.test(m) && !FILTER_WORDS.test(m) && (ctxOf(m)?.columns ? textMatches(m, ctxOf(m)!).length >= 1 : false), resolve: (m, ctx, state) => {
      const t = textMatches(m, ctx)[0]; const valueCol = findColumn(m, ctx, true) ?? (ctx.columns.filter((c) => c.numeric).length === 1 ? ctx.columns.find((c) => c.numeric)! : null);
      if (!valueCol) return { kind: "clarification", question: L("איזו עמודה לחשב לה ממוצע?", "Which column should I average?"), options: colOptions(ctx, true) };
      const target = firstEmptyBelow(state, valueCol.letter, valueCol.lastRow + 1); const what = `${t.col.header} = ${t.value}`;
      return { kind: "action", skillId: "average", confidence: 0.9, stages: STAGES(L(`התנאי (${what})`, `the condition (${what})`)), focus: what,
        actions: [{ type: "ADD_FORMULA", sheetId: ctx.sheetId, targetRange: target, formula: `=AVERAGEIF(${rangeOfCol(t.col)},"${t.value}",${rangeOfCol(valueCol)})` }] };
    } },
  { id: "XLOOKUP", matches: (m) => LOOKUP_W.test(m) && !FILTER_WORDS.test(m) && (ctxOf(m)?.columns ? textMatches(m, ctxOf(m)!).length >= 1 : false), resolve: (m, ctx, state) => {
      const t = textMatches(m, ctx)[0]; const valueCol = findColumn(m, ctx, true) ?? (ctx.columns.filter((c) => c.numeric).length === 1 ? ctx.columns.find((c) => c.numeric)! : null);
      if (!valueCol) return { kind: "clarification", question: L("איזה ערך להחזיר מהטבלה?", "Which value should I return from the table?"), options: colOptions(ctx, true) };
      const target = firstEmptyBelow(state, valueCol.letter, valueCol.lastRow + 1); const what = `${valueCol.header} (${t.value})`;
      return { kind: "action", skillId: "xlookup", confidence: 0.9, stages: STAGES(L(`החיפוש של ${t.value}`, `the lookup of ${t.value}`)), focus: what,
        actions: [{ type: "ADD_FORMULA", sheetId: ctx.sheetId, targetRange: target, formula: `=XLOOKUP("${t.value}",${rangeOfCol(t.col)},${rangeOfCol(valueCol)})` }] };
    } },
  textHandler("UPPER", UPPER_W, "UPPER", "text", L("גדולות", "Upper")),
  textHandler("LOWER", LOWER_W, "LOWER", "text", L("קטנות", "Lower")),
  textHandler("TRIM", TRIM_W, "TRIM", "text", L("נקי", "Clean")),
  textHandler("LEN", LEN_W, "LEN", "text", L("אורך", "Length")),
  textHandler("ROUND", ROUND_W, "ROUND", "none", L("מעוגל", "Rounded"), true, (m) => { const n = parseNumber(m.replace(/[A-Za-z]+\d+/g, " ")); return `,${n !== null && Number.isInteger(n) && n >= 0 && n <= 6 ? n : 0}`; }),
  { id: "REMOVE_CHARTS", matches: (m) => REMOVE_CHART_WORDS.test(m), resolve: (_m, ctx) => ({ kind: "action", skillId: "none", confidence: 0.9, stages: STAGES(L("הסרת הגרפים", "removing the charts")), focus: L("הגרפים", "the charts"), actions: [{ type: "REMOVE_CHARTS", sheetId: ctx.sheetId }] }) },
  { id: "REMOVE_DUPLICATES", matches: (m) => /(כפילויות|כפולות|כפולים|כפילות|\bduplicates?\b|\bdedupe\b)/i.test(m), resolve: (_m, ctx) => {
      if (ctx.columns.length === 0) return noTable();
      const first = Math.min(...ctx.columns.map((c) => c.firstRow)) - 1; const lastRow = Math.max(...ctx.columns.map((c) => c.lastRow));
      const letters = ctx.columns.map((c) => c.letter).sort();
      const range = `${letters[0]}${first}:${letters[letters.length - 1]}${lastRow}`;
      return { kind: "action", skillId: "dedupe", confidence: 0.9, stages: STAGES(L("הסרת הכפילויות", "removing the duplicates")), focus: range, actions: [{ type: "REMOVE_DUPLICATES", sheetId: ctx.sheetId, range }] };
    } },
  { id: "CREATE_PIVOT", matches: (m) => /(\bpivot\b|טבלת ציר|טבלה מסכמת|טבלאות ציר|פיבוט|פיווט)/i.test(m), resolve: (m, ctx) => {
      if (ctx.columns.length === 0) return noTable();
      const numeric = ctx.columns.filter((c) => c.numeric); const labels = ctx.columns.filter((c) => !c.numeric);
      const named = (pool: ColumnInfo[]) => { const toks = tokens(m); return pool.find((c) => { const h = c.header.toLowerCase(); const syn = SYNONYMS.find((l) => l.includes(h)) ?? [h]; return syn.some((w) => toks.some((t) => t === w || stripPrefix(t) === w)); }); };
      const val = named(numeric) ?? (ctx.selectedColumn?.numeric ? ctx.selectedColumn : null) ?? (numeric.length === 1 ? numeric[0] : null);
      const lab = named(labels) ?? (labels.length === 1 ? labels[0] : null);
      if (!lab) return { kind: "clarification", question: L("לפי איזו עמודה לקבץ את הטבלה?", "Which column should the table be grouped by?"), options: labels.map((c) => L(`צור טבלת ציר לפי ${c.header}`, `Create a pivot table by ${c.header}`)) };
      if (!val) return { kind: "clarification", question: L(`איזו עמודה לסכם לפי ${lab.header}?`, `Which column should be summarized by ${lab.header}?`), options: numeric.map((c) => L(`צור טבלת ציר של ${c.header} לפי ${lab.header}`, `Create a pivot table of ${c.header} by ${lab.header}`)) };
      const agg = /(ממוצע|\baverage\b|\bavg\b)/i.test(m) ? "average" : /(ספור|ספירה|כמה|\bcount\b)/i.test(m) ? "count" : "sum";
      const first = Math.min(...ctx.columns.map((c) => c.firstRow)) - 1; const lastRow = Math.max(...ctx.columns.map((c) => c.lastRow));
      const colsAll = ctx.columns.map((c) => c.letter).sort();
      return { kind: "action", skillId: "pivot", confidence: 0.9, stages: STAGES(L(`טבלת הציר של ${val.header}`, `the pivot table of ${val.header}`)), focus: L(`${val.header} לפי ${lab.header}`, `${val.header} by ${lab.header}`),
        actions: [{ type: "CREATE_PIVOT", sheetId: ctx.sheetId, range: `${colsAll[0]}${first}:${colsAll[colsAll.length - 1]}${lastRow}`, rowColumn: lab.letter, valueColumn: val.letter, agg }] };
    } },
  { id: "CREATE_CHART", matches: (m) => CHART_WORDS.test(m), resolve: (m, ctx) => {
      if (ctx.columns.length === 0) return noTable();
      const numeric = ctx.columns.filter((c) => c.numeric); const labels = ctx.columns.filter((c) => !c.numeric);
      const named = (pool: ColumnInfo[]) => { const toks = tokens(m); return pool.find((c) => { const h = c.header.toLowerCase(); const syn = SYNONYMS.find((l) => l.includes(h)) ?? [h]; return syn.some((w) => toks.some((t) => t === w || stripPrefix(t) === w)); }) ?? null; };
      const val = named(numeric) ?? (ctx.selectedColumn?.numeric ? ctx.selectedColumn : null) ?? (numeric.length === 1 ? numeric[0] : null);
      if (!val) return { kind: "clarification", question: L("איזו עמודה להציג בגרף?", "Which column should the chart show?"), options: numeric.length ? numeric.map((c) => L(`צור גרף של ${c.header}`, `Create a chart of ${c.header}`)) : [L("לא נמצאה עמודה מספרית", "No numeric column found")] };
      const lab = named(labels) ?? (labels.length === 1 ? labels[0] : null);
      if (!lab) return { kind: "clarification", question: L(`לפי איזו עמודה לסדר את הגרף של ${val.header}?`, `Which column should label the chart of ${val.header}?`), options: labels.length ? labels.map((c) => L(`צור גרף של ${val.header} לפי ${c.header}`, `Create a chart of ${val.header} by ${c.header}`)) : [L("לא נמצאה עמודת תוויות", "No label column found")] };
      const chartType = /(עוגה|\bpie\b)/i.test(m) ? "pie" : /(קו|קווי|מגמה|\bline\b|\btrend\b)/i.test(m) ? "line" : "bar";
      const rg = (c: ColumnInfo) => `${c.letter}${c.firstRow}:${c.letter}${c.lastRow}`;
      const title = L(`${val.header} לפי ${lab.header}`, `${val.header} by ${lab.header}`);
      return { kind: "action", skillId: "none", confidence: 0.9, stages: STAGES(L(`הגרף של ${val.header}`, `the chart of ${val.header}`)), focus: title,
        actions: [{ type: "CREATE_CHART", sheetId: ctx.sheetId, chartType, labelRange: rg(lab), valueRange: rg(val) }] };
    } },
  { id: "CLEAR_FILTER", matches: (m) => CLEAR_FILTER.test(m), resolve: (_m, ctx) => {
      const c = ctx.columns[0]; if (!c) return noTable();
      return { kind: "action", skillId: "filtering", confidence: 0.95, stages: STAGES(L("הסינון", "the filter")), focus: "clear",
        actions: [{ type: "FILTER", sheetId: ctx.sheetId, range: dataRange(c, ctx), column: c.letter, op: "clear" }] };
    } },
  { id: "FORMAT_RANGE", matches: (m) => FMT_WORDS.test(m) && !FILTER_WORDS.test(m) && !SORT_WORDS.test(m), resolve: (m, ctx) => {
      const format: Record<string, unknown> = {};
      if (/(מודגש|בולד|הדגש|\bbold\b)/i.test(m)) format.bold = true;
      if (/(נטוי|italic)/i.test(m)) format.italic = true;
      if (/(מטבע|שקל|currency)/i.test(m)) format.numberFormat = "currency";
      if (/(תאריך|\bdate\b)/i.test(m)) format.numberFormat = "date";
      else if (/(אחוז|percent)/i.test(m)) format.numberFormat = "percent";
      if (/(ממורכז|למרכז|מרכז|center)/i.test(m)) format.align = "center";
      const COLORS: [string, RegExp][] = [["yellow", /(צהוב|yellow)/i], ["green", /(ירוק|green)/i], ["red", /(אדום|red)/i], ["blue", /(כחול|blue)/i], ["gray", /(אפור|gray|grey)/i], ["orange", /(כתום|orange)/i], ["purple", /(סגול|purple|violet)/i], ["pink", /(ורוד|pink)/i], ["teal", /(טורקיז|teal|turquoise)/i]];
      const bg = COLORS.find(([, re]) => re.test(m))?.[0] ?? null;
      const fontWords = /(גופן|פונט|טקסט|כתב|אותיות|font|text colou?r|text)/i.test(m);
      const noColor = /(בלי צבע|ללא צבע|בטל צבע|הסר צבע|נקה צבע|בטל את הצבע|ללא רקע|בלי רקע|no fill|no colou?r|remove (the )?(colou?r|fill|background)|clear (the )?(colou?r|fill|background))/i.test(m);
      if (noColor) { if (fontWords) format.color = "none"; else format.background = "none"; }
      else if (bg) { if (fontWords) format.color = bg; else format.background = bg; }
      if (/(בלי מסגרת|ללא מסגרת|בטל מסגרת|הסר מסגרת|no border|remove (the )?border)/i.test(m)) format.border = "none";
      else if (/(מסגרת|גבולות|border)/i.test(m)) format.border = "all";
      const dec = /(\d)\s*(ספרות|decimal)/i.exec(m); if (dec) format.decimals = Number(dec[1]);
      if (Object.keys(format).length === 0) return { kind: "clarification", question: L("איזה עיצוב להחיל? למשל: מודגש, מטבע, אחוזים או רקע צהוב.", "Which formatting should I apply? For example: bold, currency, percent or a yellow background."), options: [L("הפוך את הכותרות למודגשות", "Make the headers bold"), L("עצב את המכירות כמטבע", "Format Sales as currency")] };
      const lastCol = ctx.columns[ctx.columns.length - 1]?.letter ?? "A";
      const lastRow = Math.max(1, ...ctx.columns.map((c) => c.lastRow));
      const rg = RANGE_RE.exec(m);
      const rowM = /(?:שורה|שורות|row)\s*(\d{1,4})/i.exec(m) ?? /(?:^|\s)(\d{1,4})\s*(?:שורה)/.exec(m);
      const banded = /(פסים|שורות לסירוגין|לסירוגין|banded|alternating|zebra|stripe)/i.test(m);
      const wholeTable = /(כל הטבלה|הטבלה כולה|כל הנתונים|whole table|entire table|all (the )?(table|data|cells)|the table)/i.test(m);
      let range: string; let what: string; const extra: string[] = [];
      if (rg) { range = rg[1].toUpperCase(); what = range; }
      else if (banded) {
        range = `A2:${lastCol}2`; what = L("שורות לסירוגין", "alternating rows");
        for (let r = 4; r <= lastRow; r += 2) extra.push(`A${r}:${lastCol}${r}`);
      }
      else if (/(כותרות|כותרת|header)/i.test(m)) { range = `A1:${lastCol}1`; what = L("הכותרות", "the headers"); }
      else if (rowM) { const r = Number(rowM[1]); range = `A${r}:${lastCol}${r}`; what = L(`שורה ${r}`, `row ${r}`); }
      else if (wholeTable) { range = `A1:${lastCol}${lastRow}`; what = L("הטבלה", "the table"); }
      else {
        const col = findColumn(m, ctx, false, true);
        if (!col) return { kind: "clarification", question: L("על איזו עמודה או איזה טווח להחיל את העיצוב?", "Which column or range should the formatting apply to?"), options: ctx.columns.map((c) => L(`עצב את עמודה ${c.header}`, `Format column ${c.header}`)) };
        range = `${col.letter}${col.firstRow}:${col.letter}${col.lastRow}`; what = col.header;
      }
      const ranges = [range, ...extra];
      return { kind: "action", skillId: "none", confidence: 0.9, stages: STAGES(L(`העיצוב של ${what}`, `the formatting of ${what}`)), focus: what, actions: ranges.map((r) => ({ type: "FORMAT_RANGE" as const, sheetId: ctx.sheetId, range: r, format })) };
    } },
  { id: "SET_RANGE", matches: (m) => FILL_WORDS.test(m) && RANGE_RE.test(m) && !IF_WORDS.test(m), resolve: (m, ctx) => {
      const range = RANGE_RE.exec(m)![1].toUpperCase();
      const rest = m.replace(RANGE_RE, " ");
      const q = quoted(rest); const n = parseNumber(rest);
      const value = q[0] ?? n;
      if (value === null || value === undefined) return { kind: "clarification", question: L("מה לכתוב בטווח? לדוגמה: \"כתוב 0 ב-B2:B5\"", "What should I write in the range? For example: \"Write 0 in B2:B5\""), options: [L(`כתוב 0 ב-${range}`, `Write 0 in ${range}`)] };
      return { kind: "action", skillId: "none", confidence: 0.9, stages: STAGES(L(`הטווח ${range}`, `range ${range}`)), focus: range, actions: [{ type: "SET_RANGE", sheetId: ctx.sheetId, range, value }] };
    } },
  { id: "DESTRUCTIVE", matches: (m) => DESTRUCTIVE.test(m), resolve: (m, ctx) => {
      const rg = RANGE_RE.exec(m);
      if (rg) return { kind: "action", skillId: "none", confidence: 0.9, stages: STAGES(L(`הטווח ${rg[1].toUpperCase()}`, `range ${rg[1].toUpperCase()}`)), focus: rg[1].toUpperCase(), actions: [{ type: "CLEAR_RANGE", sheetId: ctx.sheetId, range: rg[1].toUpperCase() }] };
      const col = findColumn(m, ctx, false, true);
      if (!col) return { kind: "clarification", question: L("איזו עמודה למחוק? המחיקה מתבצעת רק על עמודה שצוינה בשמה.", "Which column should I delete? I only delete a column that is named explicitly."), options: ctx.columns.map((c) => L(`מחק את העמודה ${c.header}`, `Delete column ${c.header}`)) };
      const lastLetter = col.letter;
      return { kind: "action", skillId: "none", confidence: 0.9, stages: STAGES(L(`עמודה ${col.header}`, `column ${col.header}`)), focus: col.header,
        actions: [{ type: "CLEAR_RANGE", sheetId: ctx.sheetId, range: `${lastLetter}1:${lastLetter}${col.lastRow}` }] };
    } },
  { id: "ADD_IF_FORMULA", matches: (m) => IF_WORDS.test(m) && (!!parseCondition(m) || quoted(m).length > 0), resolve: (m, ctx) => {
      const col = findColumn(m, ctx, true); const cond = parseCondition(m); const labels = quoted(m);
      if (!col) return { kind: "clarification", question: L("על איזו עמודה להחיל את התנאי?", "Which column should the condition apply to?"), options: colOptions(ctx, true) };
      if (!cond) return { kind: "clarification", question: L("מה התנאי? לדוגמה: \"אם המכירות מעל 15000\"", "What is the condition? For example: \"If Sales is over 15000\""), options: [L(`אם ${col.header} מעל 15000 כתוב "גבוה", אחרת "נמוך"`, `If ${col.header} is over 15000 write "High", otherwise "Low"`)] };
      if (labels.length < 2) return { kind: "clarification", question: L("מה לכתוב כשהתנאי מתקיים, ומה כשהוא לא מתקיים? יש לכתוב שני טקסטים בין גרשיים.", "What should I write when the condition is true, and what when it is not? Put the two texts in quotation marks."), options: [L(`אם ${col.header} מעל ${cond.value} כתוב "גבוה", אחרת "נמוך"`, `If ${col.header} is over ${cond.value} write "High", otherwise "Low"`)] };
      const newCol = ctx.nextFreeColumn;
      const formula = `=IF(${col.letter}${col.firstRow}${OP_FORMULA[cond.op]}${cond.value},"${labels[0]}","${labels[1]}")`;
      return { kind: "action", skillId: "if", confidence: 0.9, stages: STAGES(L(`התנאי על ${col.header}`, `the condition on ${col.header}`)), focus: col.header, header: "Status",
        actions: [
          { type: "SET_CELL", sheetId: ctx.sheetId, address: `${newCol}1`, value: "Status" },
          { type: "ADD_FORMULA", sheetId: ctx.sheetId, targetRange: `${newCol}${col.firstRow}:${newCol}${col.lastRow}`, formula },
        ] };
    } },
  { id: "FILTER_RANGE", matches: (m) => FILTER_WORDS.test(m), resolve: (m, ctx) => {
      const cond = parseCondition(m);
      if (cond) {
        const col = findColumn(m, ctx, true);
        if (!col) return { kind: "clarification", question: L("לפי איזו עמודה לסנן?", "Which column should I filter by?"), options: colOptions(ctx, true) };
        return { kind: "action", skillId: "filtering", confidence: 0.9, stages: STAGES(L(`השורות לפי ${col.header}`, `the rows by ${col.header}`)), focus: col.header,
          actions: [{ type: "FILTER", sheetId: ctx.sheetId, range: dataRange(col, ctx), column: col.letter, op: cond.op, value: cond.value }] };
      }
      const toks = tokens(m); const all = toks.concat(toks.map(stripPrefix));
      for (const c of ctx.columns) for (const v of c.textValues) if (all.includes(v.toLowerCase())) {
        return { kind: "action", skillId: "filtering", confidence: 0.85, stages: STAGES(L(`השורות של ${v}`, `the rows for ${v}`)), focus: c.header,
          actions: [{ type: "FILTER", sheetId: ctx.sheetId, range: dataRange(c, ctx), column: c.letter, op: "=", value: v }] };
      }
      return { kind: "clarification", question: L("איך לסנן? לדוגמה: \"סנן מכירות מעל 15000\".", "How should I filter? For example: \"Filter Sales over 15000\"."), options: ctx.columns.filter((c) => c.numeric).map((c) => L(`סנן ${c.header} מעל 15000`, `Filter ${c.header} over 15000`)) };
    } },
  { id: "SORT_RANGE", matches: (m) => SORT_WORDS.test(m), resolve: (m, ctx) => {
      const col = findColumn(m, ctx, false, true); // sorting never guesses the column
      if (!col) return { kind: "clarification", question: L("לפי איזו עמודה למיין?", "Which column should I sort by?"), options: ctx.columns.map((c) => L(`מיין לפי ${c.header}`, `Sort by ${c.header}`)) };
      const fh = FROM_HIGH.exec(m), fl = FROM_LOW.exec(m);
      const desc = fh && fl ? fh.index < fl.index : fh ? true : fl ? false : DESC.test(m) && !ASC.test(m);
      const asc = fh && fl ? !desc : fl ? true : fh ? false : ASC.test(m) && !DESC.test(m);
      if (desc === asc) return { kind: "clarification", question: L(`באיזה סדר למיין לפי ${col.header}?`, `In which order should I sort by ${col.header}?`), options: [L(`מיין ${col.header} מהגבוה לנמוך`, `Sort ${col.header} from high to low`), L(`מיין ${col.header} מהנמוך לגבוה`, `Sort ${col.header} from low to high`)] };
      return { kind: "action", skillId: "sorting", confidence: 0.9, stages: STAGES(L(`עמודת ${col.header}`, `column ${col.header}`)), focus: col.header,
        actions: [{ type: "SORT", sheetId: ctx.sheetId, range: dataRange(col, ctx), keyColumn: col.letter, direction: desc ? "desc" : "asc" }] };
    } },
  { id: "CONDITIONAL_AGGREGATE", matches: (m) => (SUM_WORDS.test(m) || COUNT_WORDS.test(m)) && !FILTER_WORDS.test(m) && (parseCondition(m) !== null || textMatch(m, ctxOf(m)) !== null), resolve: (m, ctx, state) => {
      const isCount = COUNT_WORDS.test(m) && !SUM_WORDS.test(m);
      const cond = parseCondition(m);
      const valueCol = findColumn(m, ctx, true);
      if (!valueCol) return { kind: "clarification", question: isCount ? L("איזו עמודה לספור לפי התנאי?", "Which column should I count by the condition?") : L("איזו עמודה לחבר לפי התנאי?", "Which column should I add up by the condition?"), options: colOptions(ctx, true) };
      const rangeOf = (c: ColumnInfo) => `${c.letter}${c.firstRow}:${c.letter}${c.lastRow}`;
      const target = firstEmptyBelow(state, valueCol.letter, valueCol.lastRow + 1);
      let formula: string; let what: string;
      if (cond) {
        const crit = `"${cond.op === "!=" ? "<>" : cond.op === "=" ? "" : cond.op}${cond.value}"`;
        formula = isCount ? `=COUNTIF(${rangeOf(valueCol)},${crit})` : `=SUMIF(${rangeOf(valueCol)},${crit})`; what = `${valueCol.header} ${opText(cond.op)}${opSep()}${cond.value}`;
      } else {
        const t = textMatch(m, ctx)!;
        formula = isCount ? `=COUNTIF(${rangeOf(t.col)},"${t.value}")` : `=SUMIF(${rangeOf(t.col)},"${t.value}",${rangeOf(valueCol)})`; what = `${t.col.header} = ${t.value}`;
      }
      return { kind: "action", skillId: isCount ? "countif" : "sumif", confidence: 0.9, stages: STAGES(L(`התנאי (${what})`, `the condition (${what})`)), focus: what,
        actions: [{ type: "ADD_FORMULA", sheetId: ctx.sheetId, targetRange: target, formula }] };
    } },
  { id: "CALCULATE_MIN", matches: (m) => MIN_WORDS.test(m), resolve: (m, ctx, state) => {
      const col = findColumn(m, ctx, true);
      if (!col) return { kind: "clarification", question: L("באיזו עמודה לחפש את הערך הקטן ביותר?", "Which column should I search for the smallest value?"), options: colOptions(ctx, true) };
      return formulaIntent("MIN", "min", col, state);
    } },
  { id: "CALCULATE_MAX", matches: (m) => MAX_WORDS.test(m), resolve: (m, ctx, state) => {
      const col = findColumn(m, ctx, true);
      if (!col) return { kind: "clarification", question: L("באיזו עמודה לחפש את הערך הגדול ביותר?", "Which column should I search for the largest value?"), options: colOptions(ctx, true) };
      return formulaIntent("MAX", "max", col, state);
    } },
  { id: "CALCULATE_COUNT", matches: (m) => COUNT_WORDS.test(m), resolve: (m, ctx, state) => {
      const col = findColumn(m, ctx, !COUNTA_WORDS.test(m)) ?? (COUNTA_WORDS.test(m) ? ctx.columns[0] : null);
      if (!col) return { kind: "clarification", question: L("איזו עמודה לספור?", "Which column should I count?"), options: colOptions(ctx, true) };
      return formulaIntent(COUNTA_WORDS.test(m) ? "COUNTA" : "COUNT", "count", col, state);
    } },
  { id: "CALCULATE_AVERAGE", matches: (m) => AVG_WORDS.test(m), resolve: (m, ctx, state) => {
      const col = findColumn(m, ctx, true);
      if (!col) return { kind: "clarification", question: L("על איזו עמודה לחשב ממוצע?", "Which column should I calculate the average of?"), options: colOptions(ctx, true) };
      return formulaIntent("AVERAGE", "average", col, state);
    } },
  { id: "CALCULATE_SUM", matches: (m) => SUM_WORDS.test(m), resolve: (m, ctx, state) => {
      const col = findColumn(m, ctx, true);
      if (!col) return { kind: "clarification", question: L("איזו עמודה לחבר?", "Which column should I add up?"), options: colOptions(ctx, true) };
      return formulaIntent("SUM", "sum", col, state);
    } },
  { id: "VAGUE", matches: (m) => VAGUE.test(m), resolve: () => ({ kind: "clarification", question: L("למה הכוונה ב\"שיהיה יפה\"? אפשר למשל:", "What do you mean by \"make it nice\"? For example:"), options: [L("הפוך את הכותרות למודגשות", "Make the headers bold"), L("עצב את עמודת המספרים כמטבע", "Format the number column as currency"), L("מיין לפי עמודה", "Sort by a column")] }) },
];

export function parseIntent(message: string, ctx: AiContext, state: WorkbookState, lang: Lang = "he"): IntentResult {
  CURRENT_CTX = ctx; CURRENT_LANG = lang;
  if (requestsNewTable(message)) return { kind: "unsupported", message: newTableMessage(lang) };
  const h = HANDLERS.find((x) => x.matches(message));
  if (h) return h.resolve(message, ctx, state);
  return { kind: "clarification", notUnderstood: true, question: L("לא הבנתי בדיוק מה לעשות. אפשר לנסח את הבקשה אחרת?", "I did not quite understand what to do. Could you rephrase the request?"), options: [L("חשב סך מכירות", "Add up Sales"), L("חשב ממוצע מכירות", "Calculate the average of Sales"), L("מיין מהגבוה לנמוך", "Sort from high to low")] };
}
export type { Action };
