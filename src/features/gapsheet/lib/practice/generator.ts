import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import type { SkillId } from "@/features/gapsheet/types/ai";
import { pick, type Lang } from "@/features/gapsheet/lib/i18n";
import { recalc, setCell } from "@/features/gapsheet/lib/workbook/engine";

export type PracticeMode = "formula" | "dialog-sort" | "dialog-filter" | "dialog-dedupe";

export interface PracticeTask {
  id: string; skillId: SkillId; mode: PracticeMode; instruction: string; workbook: WorkbookState;
  /** formula mode: the cell(s) to fill. dialog modes: unused. */
  targetCell: string; dataRange: string;
  expected: { value?: number | string; values?: (number | string)[]; sortedKey?: number[]; visibleKeys?: number[] };
  hints: [string, string, string]; solution: string;
  /** dialog modes: allowed columns for the form */
  columns?: { letter: string; header: string }[];
  lang?: Lang;
}

function build(id: string, name: string, headers: string[], rows: (string | number)[][]): WorkbookState {
  let wb: WorkbookState = { workbookId: "practice", name, version: 0, activeSheetId: "p1", sheets: [{ id: "p1", name, position: 0, cells: {} }] };
  headers.forEach((h, i) => { wb = setCell(wb, "p1", `${"ABCDEF"[i]}1`, { value: h, formula: null }); });
  rows.forEach((r, ri) => r.forEach((v, ci) => { wb = setCell(wb, "p1", `${"ABCDEF"[ci]}${ri + 2}`, { value: v, formula: null }); }));
  void id;
  return recalc(wb);
}
const jitter = (seed: number, i: number) => ((seed + i) % 3) * 10;

const EXPENSES_HE: [string, number][] = [["שכירות", 4200], ["חשמל", 380], ["אינטרנט", 120], ["מים", 150], ["אוכל", 1900], ["תחבורה", 650]];
const SCORES_HE: [string, number][] = [["נועה", 88], ["איתי", 72], ["מיכל", 95], ["יוסי", 61], ["דנה", 79], ["אורי", 84]];
const PRODUCTS_HE: [string, number, number][] = [["מקלדת", 120, 30], ["עכבר", 60, 80], ["מסך", 900, 12], ["אוזניות", 250, 45], ["מצלמה", 400, 20], ["כבל", 15, 200]];
const GRADES_HE: [string, number][] = [["נועה", 88], ["איתי", 54], ["מיכל", 95], ["יוסי", 60], ["דנה", 47], ["אורי", 70]];

const EXPENSES_EN: [string, number][] = [["Rent", 4200], ["Electricity", 380], ["Internet", 120], ["Water", 150], ["Food", 1900], ["Transport", 650]];
const SCORES_EN: [string, number][] = [["Noa", 88], ["Itai", 72], ["Michal", 95], ["Yossi", 61], ["Dana", 79], ["Uri", 84]];
const PRODUCTS_EN: [string, number, number][] = [["Keyboard", 120, 30], ["Mouse", 60, 80], ["Monitor", 900, 12], ["Headphones", 250, 45], ["Camera", 400, 20], ["Cable", 15, 200]];
const GRADES_EN: [string, number][] = [["Noa", 88], ["Itai", 54], ["Michal", 95], ["Yossi", 60], ["Dana", 47], ["Uri", 70]];

/** Analogous dataset, different scenario, same skill (BUILD_SPEC 31-32, 37). Expected outcomes are computed from the data, never hardcoded. */
export function generatePractice(skill: SkillId, seed = 0, lang: Lang = "he"): PracticeTask {
  const task = generateHe(skill, seed, lang);
  return { ...task, lang };
}

function generateHe(skill: SkillId, seed: number, lang: Lang): PracticeTask {
  const L = (he: string, en: string) => pick(lang, he, en);
  const EXPENSES = pick(lang, EXPENSES_HE, EXPENSES_EN); const SCORES = pick(lang, SCORES_HE, SCORES_EN); const PRODUCTS = pick(lang, PRODUCTS_HE, PRODUCTS_EN); const GRADES = pick(lang, GRADES_HE, GRADES_EN);
  if (skill === "sum") {
    const rows = EXPENSES.map(([n, v], i) => [n, v + jitter(seed, i)] as [string, number]);
    const last = rows.length + 1;
    return { id: `practice_sum_${seed}`, skillId: "sum", mode: "formula", workbook: build("sum", "Expenses", ["Category", "Amount"], rows),
      instruction: L(`לפניך טבלת הוצאות חודשיות. חשבו את סך ההוצאות בתא B${last + 1} באמצעות נוסחה.`, `Here is a table of monthly expenses. Calculate the total expenses in cell B${last + 1} using a formula.`), dataRange: `B2:B${last}`, targetCell: `B${last + 1}`,
      expected: { value: rows.reduce((s, [, v]) => s + v, 0) },
      hints: [L("איזו פעולה צריך לבצע על כל הערכים בעמודה?", "Which operation do you need to apply to all the values in the column?"), L("נסו להשתמש בפונקציה SUM.", "Try using the SUM function."), L(`המבנה הוא =SUM(...) והטווח הוא B2:B${last}.`, `The structure is =SUM(...) and the range is B2:B${last}.`)], solution: `=SUM(B2:B${last})` };
  }
  if (skill === "average") {
    const rows = SCORES.map(([n, v], i) => [n, v + jitter(seed, i)] as [string, number]);
    const last = rows.length + 1;
    return { id: `practice_average_${seed}`, skillId: "average", mode: "formula", workbook: build("avg", "Scores", ["Student", "Score"], rows),
      instruction: L(`לפניכם ציוני תלמידים. חשבו את הציון הממוצע בתא B${last + 1} באמצעות נוסחה.`, `Here are student scores. Calculate the average score in cell B${last + 1} using a formula.`), dataRange: `B2:B${last}`, targetCell: `B${last + 1}`,
      expected: { value: rows.reduce((s, [, v]) => s + v, 0) / rows.length },
      hints: [L("איזו פעולה נותנת את הערך \"הטיפוסי\" של כל הציונים?", "Which operation gives the \"typical\" value of all the scores?"), L("נסו להשתמש בפונקציה AVERAGE.", "Try using the AVERAGE function."), L(`המבנה הוא =AVERAGE(...) והטווח הוא B2:B${last}.`, `The structure is =AVERAGE(...) and the range is B2:B${last}.`)], solution: `=AVERAGE(B2:B${last})` };
  }
  if (skill === "sorting") {
    const rows = PRODUCTS.map(([n, p, q], i) => [n, p + jitter(seed, i), q] as [string, number, number]);
    return { id: `practice_sorting_${seed}`, skillId: "sorting", mode: "dialog-sort", workbook: build("sort", "Products", ["Product", "Price", "Stock"], rows),
      instruction: L("מיינו את טבלת המוצרים לפי המחיר, מהיקר לזול. הקפידו שכל שורה תישאר שלמה.", "Sort the products table by price, from most to least expensive. Keep every row intact."), dataRange: `A2:C${rows.length + 1}`, targetCell: "",
      columns: [{ letter: "A", header: "Product" }, { letter: "B", header: "Price" }, { letter: "C", header: "Stock" }],
      expected: { sortedKey: rows.map((r) => r[1]).sort((a, b) => b - a) },
      hints: [L("איזו עמודה קובעת את הסדר, ובאיזה כיוון?", "Which column sets the order, and in which direction?"), L("מיינו לפי Price מהגדול לקטן.", "Sort by Price from largest to smallest."), "Data > Sort > Sort by Price > Largest to Smallest."], solution: "Sort by Price, descending" };
  }
  if (skill === "filtering") {
    const rows = PRODUCTS.map(([n, p, q], i) => [n, p + jitter(seed, i), q] as [string, number, number]);
    const limit = 100;
    return { id: `practice_filtering_${seed}`, skillId: "filtering", mode: "dialog-filter", workbook: build("filter", "Products", ["Product", "Price", "Stock"], rows),
      instruction: L(`הציגו רק מוצרים שמחירם גדול מ-${limit}. אין למחוק את הנתונים.`, `Show only products whose price is greater than ${limit}. Do not delete the data.`), dataRange: `A2:C${rows.length + 1}`, targetCell: "",
      columns: [{ letter: "A", header: "Product" }, { letter: "B", header: "Price" }, { letter: "C", header: "Stock" }],
      expected: { visibleKeys: rows.map((r) => r[1]).filter((p) => p > limit).sort((a, b) => a - b), value: limit },
      hints: [L("לפי איזו עמודה מסננים, ומה התנאי?", "Which column do you filter by, and what is the condition?"), L("סננו את Price עם התנאי \"גדול מ\".", "Filter Price with the condition \"greater than\"."), `Data > Filter > Price > Number Filters > Greater Than ${limit}.`], solution: `Filter Price > ${limit}` };
  }
  if (skill === "min" || skill === "max") {
    const rows = PRODUCTS.map(([n, p], i) => [n, p + jitter(seed, i)] as [string, number]);
    const last = rows.length + 1; const isMin = skill === "min"; const fn = isMin ? "MIN" : "MAX";
    const vals = rows.map((r) => r[1]);
    return { id: `practice_${skill}_${seed}`, skillId: skill, mode: "formula", workbook: build(skill, "Products", ["Product", "Price"], rows),
      instruction: L(`לפניכם מחירי מוצרים. מצאו את המחיר ${isMin ? "הנמוך" : "הגבוה"} ביותר בתא B${last + 1} באמצעות נוסחה.`, `Here are product prices. Find the ${isMin ? "lowest" : "highest"} price in cell B${last + 1} using a formula.`), dataRange: `B2:B${last}`, targetCell: `B${last + 1}`,
      expected: { value: isMin ? Math.min(...vals) : Math.max(...vals) },
      hints: [L(`איזו פעולה מחפשת את הערך ${isMin ? "הקטן" : "הגדול"} ביותר?`, `Which operation looks for the ${isMin ? "smallest" : "largest"} value?`), L(`נסו להשתמש בפונקציה ${fn}.`, `Try using the ${fn} function.`), L(`המבנה הוא =${fn}(...) והטווח הוא B2:B${last}.`, `The structure is =${fn}(...) and the range is B2:B${last}.`)], solution: `=${fn}(B2:B${last})` };
  }
  if (skill === "count") {
    const rows = SCORES.map(([n, v], i) => [n, v + jitter(seed, i)] as [string, number]);
    const last = rows.length + 1;
    return { id: `practice_count_${seed}`, skillId: "count", mode: "formula", workbook: build("count", "Scores", ["Student", "Score"], rows),
      instruction: L(`לפניכם ציוני תלמידים. ספרו כמה ציונים יש בטבלה, בתא B${last + 1}, באמצעות נוסחה.`, `Here are student scores. Count how many scores are in the table, in cell B${last + 1}, using a formula.`), dataRange: `B2:B${last}`, targetCell: `B${last + 1}`,
      expected: { value: rows.length },
      hints: [L("איזו פעולה סופרת תאים ולא מחברת אותם?", "Which operation counts cells instead of adding them up?"), L("נסו להשתמש בפונקציה COUNT.", "Try using the COUNT function."), L(`המבנה הוא =COUNT(...) והטווח הוא B2:B${last}.`, `The structure is =COUNT(...) and the range is B2:B${last}.`)], solution: `=COUNT(B2:B${last})` };
  }
  if (skill === "sumifs") {
    const names = lang === "en" ? ["Dan", "Noa", "Dan", "Noa", "Dan", "Noa"] : ["דן", "נועה", "דן", "נועה", "דן", "נועה"];
    const months = lang === "en" ? ["Jan", "Jan", "Feb", "Feb", "Feb", "Mar"] : ["ינואר", "ינואר", "פברואר", "פברואר", "פברואר", "מרץ"];
    const rows = names.map((n, i) => [n, months[i], 100 + ((i * 41 + seed * 7) % 80)] as [string, string, number]); const last = rows.length + 1;
    const total = rows.filter((r) => r[0] === names[0] && r[1] === months[2]).reduce((s, r) => s + r[2], 0);
    const sol = `=SUMIFS(C2:C${last}, A2:A${last}, "${names[0]}", B2:B${last}, "${months[2]}")`;
    return { id: `practice_sumifs_${seed}`, skillId: "sumifs", mode: "formula", workbook: build("sumifs", "Sales", ["Rep", "Month", "Sales"], rows),
      instruction: L(`בתא C${last + 1} חשבו את סך המכירות של "${names[0]}" בחודש "${months[2]}" בלבד, בעזרת SUMIFS.`, `In cell C${last + 1}, use SUMIFS to add up the sales of "${names[0]}" in "${months[2]}" only.`),
      dataRange: `C2:C${last}`, targetCell: `C${last + 1}`, expected: { value: total },
      hints: [L("יש שני תנאים שצריכים להתקיים יחד.", "Two conditions must be true together."), L("SUMIFS מתחילה בטווח לסכום, ואחריו זוגות של טווח ותנאי.", "SUMIFS starts with the range to add up, then pairs of range and condition."), sol], solution: sol };
  }
  if (skill === "dedupe") {
    const base = PRODUCTS.slice(0, 6).map(([n, p, q]) => [n, p, q] as [string, number, number]);
    const a = seed % 6, b = (seed + 3) % 6; const rows = [...base, base[a], base[b === a ? (a + 1) % 6 : b]];
    const unique = new Set(rows.map((r) => r.join("|"))).size;
    return { id: `practice_dedupe_${seed}`, skillId: "dedupe", mode: "dialog-dedupe", workbook: build("dedupe", "Products", ["Product", "Price", "Stock"], rows),
      instruction: L("בטבלה יש שורות שחוזרות פעמיים. הסירו את הכפילויות כך שכל שורה תופיע פעם אחת.", "Some rows in the table appear twice. Remove the duplicates so every row appears once."), dataRange: `A1:C${rows.length + 1}`, targetCell: "",
      columns: [{ letter: "A", header: "Product" }, { letter: "B", header: "Price" }, { letter: "C", header: "Stock" }],
      expected: { value: unique },
      hints: [L("כפילות היא שורה שכל התאים בה זהים לשורה אחרת.", "A duplicate is a row where every cell matches another row."), L("בחרו את כל הטבלה כולל הכותרת ולחצו על הסרת כפילויות.", "Select the whole table including the header and press Remove duplicates."), "Select the table > Data > Remove Duplicates."], solution: "Data > Remove Duplicates" };
  }
  if (skill === "dates") {
    const serial = (y: number, m: number, d: number) => Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569;
    const a = serial(2025, 1 + (seed % 3), 10), b = serial(2026, 4, 25); const wb = build("dates", "Dates", ["Start", "End"], [[a, b]]);
    for (const addr of ["A2", "B2"]) { const c = wb.sheets[0].cells[addr]; c.format = { numberFormat: "date" }; }
    const sol = '=DATEDIF(A2, B2, "M")'; const m = (2026 - 2025) * 12 + 4 - (1 + (seed % 3));
    return { id: `practice_dates_${seed}`, skillId: "dates", mode: "formula", workbook: wb,
      instruction: L("בתא C2 חשבו כמה חודשים שלמים עברו בין תאריך ההתחלה בתא A2 לתאריך הסיום בתא B2. השתמשו ב-DATEDIF.", "In cell C2, calculate how many full months passed between the start date in A2 and the end date in B2. Use DATEDIF."),
      dataRange: "A2:B2", targetCell: "C2", expected: { value: m },
      hints: [L("DATEDIF מקבלת תאריך התחלה, תאריך סיום ויחידה.", "DATEDIF takes a start date, an end date and a unit."), L('היחידה "M" מחזירה חודשים שלמים.', 'The unit "M" returns full months.'), sol], solution: sol };
  }
  if (skill === "iferror") {
    const rows: [string, number, number][] = [["A", 120 + seed, 4], ["B", 90, 0], ["C", 60, 3]];
    const sol = `=IFERROR(B3/C3, 0)`;
    return { id: `practice_iferror_${seed}`, skillId: "iferror", mode: "formula", workbook: build("iferror", "Rates", ["Item", "Total", "Count"], rows),
      instruction: L("בתא D3 חלקו את B3 ב-C3, אבל אם החישוב נכשל הציגו 0 במקום שגיאה. השתמשו ב-IFERROR.", "In cell D3, divide B3 by C3, but show 0 instead of an error if the calculation fails. Use IFERROR."),
      dataRange: "B3:C3", targetCell: "D3", expected: { value: 0 },
      hints: [L("חלוקה באפס גורמת לשגיאה.", "Dividing by zero causes an error."), L("IFERROR מקבלת את החישוב, ואחריו מה להציג אם הוא נכשל.", "IFERROR takes the calculation, then what to show if it fails."), sol], solution: sol };
  }
  if (skill === "text") {
    const names = ["  Dana  Levi ", "  Omer Cohen", "Noa   Katz  "]; const nm = names[seed % 3];
    const sol = "=LEN(TRIM(A2))";
    return { id: `practice_text_${seed}`, skillId: "text", mode: "formula", workbook: build("text", "Names", ["Name"], [[nm]]),
      instruction: L("בתא B2 חשבו כמה תווים יש בשם שבתא A2 אחרי הסרת רווחים מיותרים. השתמשו ב-TRIM וב-LEN.", "In cell B2, count how many characters the name in A2 has after removing extra spaces. Use TRIM and LEN."),
      dataRange: "A2:A2", targetCell: "B2", expected: { value: nm.trim().replace(/\s+/g, " ").length },
      hints: [L("TRIM מסירה רווחים מיותרים, LEN סופרת תווים.", "TRIM removes extra spaces, LEN counts characters."), L("אפשר לשים את TRIM בתוך LEN.", "You can put TRIM inside LEN."), sol], solution: sol };
  }
  if (skill === "pivot") {
    const regions = ["צפון", "דרום", "מרכז"], regionsEn = ["North", "South", "Center"];
    const rows = Array.from({ length: 8 }, (_, i) => [lang === "en" ? regionsEn[i % 3] : regions[i % 3], 100 + ((i * 37 + seed * 11) % 90)] as [string, number]);
    const last = rows.length + 1; const key = rows[0][0];
    const total = rows.filter((r) => r[0] === key).reduce((s, r) => s + r[1], 0);
    const sol = `=SUMIF(A2:A${last}, "${key}", B2:B${last})`;
    return { id: `practice_pivot_${seed}`, skillId: "pivot", mode: "formula", workbook: build("pivot", "Sales", ["Region", "Sales"], rows),
      instruction: L(`טבלת ציר מסכמת נתונים לפי קבוצות. בתא B${last + 1} חשבו בעצמכם את סך המכירות של האזור "${key}".`, `A pivot table summarizes data by groups. In cell B${last + 1}, calculate the total sales of the "${key}" region yourself.`),
      dataRange: `B2:B${last}`, targetCell: `B${last + 1}`, expected: { value: total },
      hints: [L("צריך לסכום רק את השורות של אזור אחד.", "You need to add up only the rows of one region."), L("SUMIF מקבלת: איפה לבדוק, מה לבדוק, ומה לסכום.", "SUMIF takes: where to check, what to check, and what to add up."), sol], solution: sol };
  }
  if (skill === "xlookup" || skill === "indexmatch") {
    const rows = PRODUCTS.map(([n, p, q], i) => [n, p + jitter(seed, i), q] as [string, number, number]);
    const last = rows.length + 1; const pick1 = rows[seed % rows.length]; const isX = skill === "xlookup";
    return { id: `practice_${skill}_${seed}`, skillId: skill, mode: "formula", workbook: build(skill, "Products", ["Product", "Price", "Stock"], rows),
      instruction: L(`בתא B${last + 1} מצאו באמצעות ${isX ? "XLOOKUP" : "INDEX ו-MATCH"} את המחיר של "${pick1[0]}", לפי שם המוצר בעמודה A.`, `In cell B${last + 1}, use ${isX ? "XLOOKUP" : "INDEX and MATCH"} to find the price of "${pick1[0]}", looking the product name up in column A.`),
      dataRange: `A2:B${last}`, targetCell: `B${last + 1}`,
      expected: { value: pick1[1] },
      hints: [L("איזה ערך מחפשים, איפה, ומאיפה מחזירים את התשובה?", "What value do you look for, where, and where does the answer come from?"), isX ? L("XLOOKUP מקבלת: מה לחפש, איפה לחפש, ומאיפה להחזיר.", "XLOOKUP takes: what to find, where to look, and where to return from.") : L("MATCH מוצאת את מספר השורה, ו-INDEX מחזירה את הערך משורה זו.", "MATCH finds the row number, and INDEX returns the value from that row."), isX ? `=XLOOKUP("${pick1[0]}", A2:A${last}, B2:B${last})` : `=INDEX(B2:B${last}, MATCH("${pick1[0]}", A2:A${last}, 0))`],
      solution: isX ? `=XLOOKUP("${pick1[0]}", A2:A${last}, B2:B${last})` : `=INDEX(B2:B${last}, MATCH("${pick1[0]}", A2:A${last}, 0))` };
  }
  if (skill === "sumif" || skill === "countif") {
    const rows = PRODUCTS.map(([n, p, q], i) => [n, p + jitter(seed, i), q] as [string, number, number]);
    const last = rows.length + 1; const limit = 100; const isSum = skill === "sumif";
    const hit = rows.filter((r) => r[1] > limit);
    return { id: `practice_${skill}_${seed}`, skillId: skill, mode: "formula", workbook: build(skill, "Products", ["Product", "Price", "Stock"], rows),
      instruction: isSum ? L(`לפניכם מוצרים עם מחיר ומלאי. חשבו בתא B${last + 1} את סכום המחירים של המוצרים שמחירם גדול מ-${limit}.`, `Here are products with a price and stock. In cell B${last + 1}, add up the prices of the products whose price is greater than ${limit}.`) : L(`לפניכם מוצרים עם מחיר ומלאי. ספרו בתא B${last + 1} כמה מוצרים מחירם גדול מ-${limit}.`, `Here are products with a price and stock. In cell B${last + 1}, count how many products have a price greater than ${limit}.`),
      dataRange: `B2:B${last}`, targetCell: `B${last + 1}`,
      expected: { value: isSum ? hit.reduce((s, r) => s + r[1], 0) : hit.length },
      hints: [isSum ? L("צריך לחבר, אבל רק ערכים שעומדים בתנאי.", "You need to add up, but only the values that meet the condition.") : L("צריך לספור, אבל רק תאים שעומדים בתנאי.", "You need to count, but only the cells that meet the condition."), L(`נסו להשתמש בפונקציה ${isSum ? "SUMIF" : "COUNTIF"}.`, `Try using the ${isSum ? "SUMIF" : "COUNTIF"} function.`), L(`המבנה הוא =${isSum ? "SUMIF" : "COUNTIF"}(B2:B${last},">${limit}")`, `The structure is =${isSum ? "SUMIF" : "COUNTIF"}(B2:B${last},">${limit}")`)], solution: `=${isSum ? "SUMIF" : "COUNTIF"}(B2:B${last},">${limit}")` };
  }
  // if
  const rows = GRADES.map(([n, v], i) => [n, i === 3 ? v : v + jitter(seed, i)] as [string, number]); // row 4 stays exactly 60: the boundary case
  const last = rows.length + 1;
  const passT = L("עבר", "Pass"), failT = L("נכשל", "Fail");
  const pass = (v: number) => (v >= 60 ? passT : failT);
  return { id: `practice_if_${seed}`, skillId: "if", mode: "formula", workbook: build("if", "Grades", ["Student", "Grade"], rows),
    instruction: L(`בתא C2 כתבו נוסחה שמחזירה "עבר" אם הציון ב-B2 הוא 60 ומעלה, ו"נכשל" אחרת. הנוסחה תתמלא אוטומטית בכל השורות.`, `In cell C2, write a formula that returns "Pass" if the grade in B2 is 60 or higher, and "Fail" otherwise. The formula fills down to every row automatically.`), dataRange: `B2:B${last}`, targetCell: "C2",
    expected: { values: rows.map(([, v]) => pass(v)) },
    hints: [L("איזה תנאי צריך לבדוק, ומה קורה בכל אחד משני המקרים?", "Which condition do you need to test, and what happens in each of the two cases?"), L("נסו להשתמש בפונקציה IF.", "Try using the IF function."), L('=IF(תנאי, "ערך אם נכון", "ערך אם לא")', '=IF(condition, "value if true", "value if false")')], solution: `=IF(B2>=60,"${passT}","${failT}")` };
}

/** Kept for existing callers/tests. */
export const generateSumPractice = (seed = 0) => generatePractice("sum", seed);
