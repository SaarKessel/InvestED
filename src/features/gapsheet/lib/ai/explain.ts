import { COLOR_HE } from "@/features/gapsheet/lib/workbook/palette";
import type { Action } from "@/features/gapsheet/types/actions";
import type { Explanation } from "@/features/gapsheet/types/ai";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import { displayValue, getSheet } from "@/features/gapsheet/lib/workbook/engine";
import { pick, type Lang } from "@/features/gapsheet/lib/i18n";
import { OP_EN, OP_HE } from "./intent";

/** Explanation contract (BUILD_SPEC 27): what changed, Excel equivalent, concept, why it works. Built from validated actions, not model text. Hebrew and English are written separately, not machine-translated. */
export function explainActions(actions: Action[], focus: string, after: WorkbookState, lang: Lang = "he"): Explanation {
  const L = (he: string, en: string) => pick(lang, he, en);
  const op = (o: string) => (lang === "en" ? `${OP_EN[o]} ` : OP_HE[o]);
  const formulaAction = actions.find((a) => a.type === "ADD_FORMULA");
  const sheet = getSheet(after, after.activeSheetId)!;
  if (formulaAction && formulaAction.type === "ADD_FORMULA") {
    const f = formulaAction.formula;
    const first = formulaAction.targetRange.split(":")[0];
    const result = displayValue(sheet.cells[first]);
    const added = (fn: string) => L(`נוספה נוסחת ${fn} בתא ${first}`, `A ${fn} formula was added in cell ${first}`);
    const res = L(`התוצאה: ${result}`, `Result: ${result}`);
    if (f.startsWith("=SUM(")) return { summary: L(`חישבתי את סך ${focus}.`, `I calculated the total of ${focus}.`), whatChanged: [added("SUM"), res], excelEquivalent: f, concept: "SUM", whyItWorks: L(`SUM מחברת את כל הערכים בטווח ${f.slice(5, -1)}.`, `SUM adds up all the values in the range ${f.slice(5, -1)}.`) };
    if (f.startsWith("=AVERAGE(")) return { summary: L(`חישבתי את הממוצע של ${focus}.`, `I calculated the average of ${focus}.`), whatChanged: [added("AVERAGE"), res], excelEquivalent: f, concept: "AVERAGE", whyItWorks: L(`AVERAGE מחברת את הערכים בטווח ${f.slice(9, -1)} ומחלקת במספר התאים שיש בהם מספר.`, `AVERAGE adds up the values in the range ${f.slice(9, -1)} and divides by the number of cells that contain a number.`) };
    const AGG: Record<string, [string, string, string, string]> = {
      MIN: ["מצאתי את הערך הקטן ביותר", "MIN מחזירה את המספר הקטן ביותר בטווח", "I found the smallest value", "MIN returns the smallest number in the range"],
      MAX: ["מצאתי את הערך הגדול ביותר", "MAX מחזירה את המספר הגדול ביותר בטווח", "I found the largest value", "MAX returns the largest number in the range"],
      COUNT: ["ספרתי כמה תאים מכילים מספר", "COUNT סופרת רק תאים שיש בהם מספר, ומתעלמת מטקסט ומתאים ריקים", "I counted how many cells contain a number", "COUNT counts only cells that contain a number and ignores text and empty cells"],
      COUNTA: ["ספרתי כמה תאים אינם ריקים", "COUNTA סופרת כל תא שיש בו תוכן, גם טקסט", "I counted how many cells are not empty", "COUNTA counts every cell that has content, including text"],
    };
    const fm = /^=([A-Z]+)\(/.exec(f)?.[1];
    const FN: Record<string, [string, string, string, string, string]> = {
      XLOOKUP: ["מצאתי ערך מתאים בטבלה", "I found a matching value in the table", "XLOOKUP מחפשת ערך בטווח אחד ומחזירה את הערך שבאותה שורה בטווח אחר. אם אין התאמה היא מחזירה #N/A.", "XLOOKUP looks for a value in one range and returns the value from the same row in another range. With no match it returns #N/A.", "XLOOKUP"],
      SUMIFS: ["חיברתי רק שורות שעומדות בכל התנאים", "I added up only the rows that meet every condition", "SUMIFS מתחילה בטווח לסכום, ואחריו זוגות של טווח ותנאי. שורה נכללת רק כשכל התנאים מתקיימים.", "SUMIFS starts with the range to add up, then pairs of range and condition. A row counts only when every condition is true.", "SUMIFS"],
      COUNTIFS: ["ספרתי שורות שעומדות בכל התנאים", "I counted the rows that meet every condition", "COUNTIFS סופרת שורות שבהן כל זוגות הטווח והתנאי מתקיימים.", "COUNTIFS counts the rows where every pair of range and condition is true.", "COUNTIFS"],
      AVERAGEIF: ["חישבתי ממוצע רק לשורות שעומדות בתנאי", "I averaged only the rows that meet the condition", "AVERAGEIF בודקת תנאי על טווח אחד ומחשבת ממוצע של הערכים התואמים בטווח אחר.", "AVERAGEIF tests a condition on one range and averages the matching values in another range.", "AVERAGEIF"],
      UPPER: ["הפכתי את הטקסט לאותיות גדולות", "I changed the text to capital letters", "UPPER מחזירה את הטקסט באותיות גדולות באנגלית, והתא המקורי נשאר כמו שהוא.", "UPPER returns the text in capital letters, and the original cell stays as it is.", "UPPER"],
      LOWER: ["הפכתי את הטקסט לאותיות קטנות", "I changed the text to small letters", "LOWER מחזירה את הטקסט באותיות קטנות באנגלית, והתא המקורי נשאר כמו שהוא.", "LOWER returns the text in small letters, and the original cell stays as it is.", "LOWER"],
      TRIM: ["הסרתי רווחים מיותרים", "I removed extra spaces", "TRIM מסירה רווחים בתחילת הטקסט ובסופו, ומשאירה רווח אחד בין מילים.", "TRIM removes spaces at the start and end of the text and leaves one space between words.", "TRIM"],
      LEN: ["ספרתי כמה תווים יש בכל תא", "I counted the characters in each cell", "LEN סופרת את כל התווים בתא, כולל רווחים.", "LEN counts every character in the cell, including spaces.", "LEN"],
      ROUND: ["עיגלתי את המספרים", "I rounded the numbers", "ROUND מעגלת מספר למספר הספרות אחרי הנקודה שנבחר. 5 ומעלה מעגל כלפי מעלה.", "ROUND rounds a number to the chosen number of decimals. A 5 or more rounds up.", "ROUND"],
    };
    if (fm && FN[fm]) { const e = FN[fm]; return { summary: L(`${e[0]} (${focus}).`, `${e[1]} (${focus}).`), whatChanged: [added(fm), res], excelEquivalent: f, concept: e[4], whyItWorks: L(e[2], e[3]) }; }
    const cm = /^=(SUMIF|COUNTIF)\(([^,]+),([^,)]+)(?:,([^)]+))?\)$/.exec(f);
    if (cm) {
      const isSum = cm[1] === "SUMIF";
      return { summary: L(`${isSum ? "חיברתי" : "ספרתי"} רק את מה שעומד בתנאי (${focus}).`, `I ${isSum ? "added up" : "counted"} only what meets the condition (${focus}).`), whatChanged: [added(cm[1]), res], excelEquivalent: f, concept: cm[1],
        whyItWorks: L(`${cm[1]} בודקת כל תא בטווח ${cm[2]} מול התנאי ${cm[3]}. ${isSum ? `היא מחברת את הערכים התואמים${cm[4] ? ` מהטווח ${cm[4]}` : ""}` : "היא סופרת את התאים התואמים"}.`,
          `${cm[1]} checks every cell in the range ${cm[2]} against the condition ${cm[3]}. ${isSum ? `It adds up the matching values${cm[4] ? ` from the range ${cm[4]}` : ""}` : "It counts the matching cells"}.`) };
    }
    const am = /^=(MIN|MAX|COUNTA|COUNT)\(([^)]*)\)$/.exec(f);
    if (am) { const a = AGG[am[1]]; return { summary: L(`${a[0]} ב${focus}.`, `${a[2]} in ${focus}.`), whatChanged: [added(am[1]), res], excelEquivalent: f, concept: am[1], whyItWorks: L(`${a[1]} ${am[2]}.`, `${a[3]} ${am[2]}.`) }; }
    if (f.startsWith("=IF(")) {
      const m = /^=IF\(([A-Z]+)(\d+)(>=|<=|<>|>|<|=)(-?[\d.]+),"([^"]*)","([^"]*)"\)$/.exec(f);
      const cond = m ? `${focus} ${op(m[3] === "<>" ? "!=" : m[3])}${m[4]}` : L("התנאי", "the condition");
      return {
        summary: L(`הוספתי עמודה שבודקת תנאי על ${focus}.`, `I added a column that tests a condition on ${focus}.`),
        whatChanged: [L(`נוספה עמודה ${first.replace(/\d+/, "")} עם נוסחת IF בכל שורה`, `Column ${first.replace(/\d+/, "")} was added with an IF formula in every row`), L(`הנוסחה הראשונה: ${f}`, `First formula: ${f}`), L(`התוצאה בשורה הראשונה: ${result}`, `Result in the first row: ${result}`)],
        excelEquivalent: f, concept: "IF",
        whyItWorks: m ? L(`IF בודקת תנאי. אם ${cond}, היא מחזירה "${m[5]}". אחרת היא מחזירה "${m[6]}".`, `IF tests a condition. If ${cond}, it returns "${m[5]}". Otherwise it returns "${m[6]}".`) : L("IF בודקת תנאי ומחזירה ערך אחד אם הוא מתקיים וערך אחר אם לא.", "IF tests a condition and returns one value if it is true and another if it is not."),
      };
    }
  }
  const fmt = actions.find((a) => a.type === "FORMAT_RANGE");
  if (fmt && fmt.type === "FORMAT_RANGE") {
    const f = fmt.format;
    const parts = [f.bold && L("מודגש", "bold"), f.italic && L("נטוי", "italic"), f.numberFormat && L(`פורמט ${f.numberFormat}`, `${f.numberFormat} format`), f.align && L(`יישור ${f.align}`, `${f.align} alignment`), f.background && (f.background === ("none" as string) ? L("הסרת צבע רקע", "removed the fill color") : L(`רקע ${COLOR_HE[f.background]}`, `${f.background} fill`)), f.color && L(`צבע גופן ${COLOR_HE[f.color]}`, `${f.color} font color`), f.border && L(f.border === ("none" as string) ? "הסרת מסגרות" : "מסגרות", f.border === ("none" as string) ? "borders removed" : "borders")].filter(Boolean).join(", ");
    return { summary: L(`עיצבתי את ${focus}: ${parts}.`, `I formatted ${focus}: ${parts}.`), whatChanged: [L(`העיצוב הוחל על ${fmt.range}`, `The formatting was applied to ${fmt.range}`), L("הערכים והנוסחאות לא השתנו, רק המראה", "Values and formulas did not change, only the appearance")], excelEquivalent: "Home > Font / Number / Alignment", concept: "Formatting", whyItWorks: L("עיצוב משנה רק את מה שמוצג בתא. הערך האמיתי נשאר, ולכן נוסחאות ממשיכות לעבוד כרגיל.", "Formatting only changes what a cell displays. The real value stays the same, so formulas keep working as usual.") };
  }
  const setr = actions.find((a) => a.type === "SET_RANGE");
  if (setr && setr.type === "SET_RANGE") return { summary: L(`כתבתי ${setr.value} בטווח ${setr.range}.`, `I wrote ${setr.value} in the range ${setr.range}.`), whatChanged: [L(`הטווח ${setr.range} מולא בערך ${setr.value}`, `The range ${setr.range} was filled with ${setr.value}`)], excelEquivalent: L(`סמנו את ${setr.range}, הקלידו ${setr.value} ולחצו Ctrl+Enter`, `Select ${setr.range}, type ${setr.value} and press Ctrl+Enter`), concept: "Range", whyItWorks: L("Ctrl+Enter ממלא את אותו ערך בכל התאים שסומנו. הערך נכתב כערך ולא כנוסחה.", "Ctrl+Enter fills the same value into every selected cell. It is entered as a value, not as a formula.") };
  if (actions.some((a) => a.type === "REMOVE_CHARTS")) return { summary: L("הסרתי את הגרפים מהגיליון.", "I removed the charts from the sheet."), whatChanged: [L("הנתונים והנוסחאות לא השתנו, רק התצוגה הגרפית הוסרה.", "Your data and formulas did not change; only the chart view was removed.")], whyItWorks: L("גרף הוא רק תצוגה של הנתונים, ולכן אפשר ליצור אותו מחדש בכל עת.", "A chart is only a view of your data, so you can create it again any time."), excelEquivalent: L("לחיצה על הגרף ואז מקש Delete.", "Select the chart and press Delete.") };
  const dd = actions.find((a) => a.type === "REMOVE_DUPLICATES");
  if (dd && dd.type === "REMOVE_DUPLICATES") return { summary: L(`הסרתי שורות כפולות מהטווח ${dd.range}.`, `I removed duplicate rows from ${dd.range}.`), whatChanged: [L("נשארה השורה הראשונה מכל קבוצת כפילויות, והשורות שאחריה זזו למעלה", "The first row of each duplicate group stayed, and the rows after it moved up"), L("שורת הכותרת לא השתנתה. אפשר לבטל עם \"בטל\".", "The header row did not change. You can undo with \"Undo\".")], excelEquivalent: `Select ${dd.range} > Data > Remove Duplicates`, concept: "Remove Duplicates", whyItWorks: L("שורה נחשבת כפולה כשכל התאים בה זהים לשורה קודמת. רווחים בקצוות ואותיות גדולות וקטנות לא משנים.", "A row is a duplicate when every cell matches an earlier row. Extra edge spaces and letter case do not matter.") };
  const piv = actions.find((a) => a.type === "CREATE_PIVOT");
  if (piv && piv.type === "CREATE_PIVOT") {
    const aggHe = { sum: "סכום", count: "ספירה", average: "ממוצע" }[piv.agg];
    return { summary: L(`יצרתי טבלת ציר (Pivot) בגיליון חדש: ${aggHe} לפי קבוצות מעמודה ${piv.rowColumn}.`, `I created a pivot table on a new sheet: ${piv.agg} by the groups in column ${piv.rowColumn}.`), whatChanged: [L(`גיליון חדש נוסף עם סיכום של עמודה ${piv.valueColumn} לפי עמודה ${piv.rowColumn}`, `A new sheet was added summarizing column ${piv.valueColumn} by column ${piv.rowColumn}`), L("גיליון המקור לא השתנה. הטבלה מחושבת בנוסחאות, ולכן היא מתעדכנת כשהנתונים משתנים.", "The source sheet was not changed. The table uses formulas, so it updates when the data changes.")], excelEquivalent: `Select ${piv.range} > Insert > PivotTable > Rows: ${piv.rowColumn}, Values: ${piv.agg} of ${piv.valueColumn}`, concept: "Pivot Table", whyItWorks: L("טבלת ציר מקבצת שורות לפי ערך בעמודה אחת ומסכמת עמודה אחרת לכל קבוצה.", "A pivot table groups rows by the value in one column and summarizes another column for each group.") };
  }
  const chart = actions.find((a) => a.type === "CREATE_CHART");
  if (chart && chart.type === "CREATE_CHART") {
    const kindHe = { bar: "עמודות", line: "קו", pie: "עוגה" }[chart.chartType]; const kindEn = chart.chartType;
    const why = { bar: L("גרף עמודות משווה בין קטגוריות: גובה כל עמודה הוא הערך שלה.", "A bar chart compares categories: the height of each bar is its value."), line: L("גרף קו מראה שינוי לאורך סדר, כמו חודשים: כל נקודה היא ערך, והקו מחבר ביניהן.", "A line chart shows change over an order, such as months: each point is a value and the line connects them."), pie: L("גרף עוגה מראה את החלק של כל ערך מהסך הכול. הוא מתאים כשיש מעט קטגוריות וכל הערכים חיוביים.", "A pie chart shows each value's share of the total. It works best with few categories and positive values.") }[chart.chartType];
    return { summary: L(`יצרתי גרף ${kindHe}: ${focus}.`, `I created a ${kindEn} chart: ${focus}.`), whatChanged: [L(`התוויות מ-${chart.labelRange}, הערכים מ-${chart.valueRange}`, `Labels from ${chart.labelRange}, values from ${chart.valueRange}`), L("הגרף הוא תצוגה בלבד. הנתונים בתאים לא השתנו, והגרף מתעדכן כשהם משתנים.", "The chart is a view only. The cell data did not change, and the chart updates when the data does.")], excelEquivalent: `Select ${chart.labelRange} and ${chart.valueRange} > Insert > Chart > ${chart.chartType === "bar" ? "Clustered Column" : chart.chartType === "line" ? "Line" : "Pie"}`, concept: "Charts", whyItWorks: why };
  }
  const clear = actions.find((a) => a.type === "CLEAR_RANGE");
  if (clear && clear.type === "CLEAR_RANGE") return { summary: L(`מחקתי את תוכן ${focus}.`, `I cleared the contents of ${focus}.`), whatChanged: [L(`התאים בטווח ${clear.range} נוקו`, `The cells in ${clear.range} were cleared`), L("אפשר ללחוץ על \"בטל\" כדי להחזיר אותם", "You can press \"Undo\" to bring them back")], excelEquivalent: `Right-click column > Clear Contents (${clear.range})`, concept: "Clear", whyItWorks: L("מחיקת תוכן מנקה את התאים בטווח. נוסחאות שתלויות בהם יתעדכנו בהתאם.", "Clearing contents empties the cells in the range. Formulas that depend on them update accordingly.") };
  const sort = actions.find((a) => a.type === "SORT");
  if (sort && sort.type === "SORT") {
    const desc = sort.direction === "desc";
    return {
      summary: L(`מיינתי את כל הטבלה לפי ${focus} ${desc ? "מהגבוה לנמוך" : "מהנמוך לגבוה"}.`, `I sorted the whole table by ${focus} from ${desc ? "high to low" : "low to high"}.`),
      whatChanged: [L(`הטווח ${sort.range} מוין לפי עמודה ${sort.keyColumn}`, `The range ${sort.range} was sorted by column ${sort.keyColumn}`), L("כל שורה נשארה שלמה, כך שהנתונים בכל שורה נשארים מחוברים", "Every row stayed intact, so the data in each row stays together")],
      excelEquivalent: `Data > Sort > Sort by "${focus}" > ${desc ? "Largest to Smallest (Z to A)" : "Smallest to Largest (A to Z)"}`,
      concept: "Sorting",
      whyItWorks: L("Excel ממיין את כל הטווח ולא רק את העמודה שנבחרה. מיון של עמודה אחת בלבד מנתק את הערכים מהשורה שלהם.", "Excel sorts the whole range, not only the selected column. Sorting a single column on its own would detach its values from their rows."),
    };
  }
  const filter = actions.find((a) => a.type === "FILTER");
  if (filter && filter.type === "FILTER") {
    if (filter.op === "clear") return { summary: L("הסרתי את הסינון. כל השורות מוצגות שוב.", "I removed the filter. All rows are visible again."), whatChanged: [L("הסינון הוסר, הנתונים לא השתנו", "The filter was removed; the data did not change")], excelEquivalent: "Data > Clear (Clear Filter)", concept: "Filtering", whyItWorks: L("סינון משנה רק מה שמוצג. הנתונים עצמם לא נמחקו.", "Filtering only changes what is shown. The data itself is never deleted.") };
    const heOp = OP_HE[filter.op]; const enOp = OP_EN[filter.op];
    return {
      summary: L(`הצגתי רק שורות ש${focus} ${heOp}${filter.value}.`, `I am showing only rows where ${focus} is ${enOp} ${filter.value}.`),
      whatChanged: [L(`הוחל סינון על עמודה ${filter.column}`, `A filter was applied to column ${filter.column}`), L("שורות שאינן עומדות בתנאי הוסתרו, לא נמחקו", "Rows that do not meet the condition were hidden, not deleted")],
      excelEquivalent: typeof filter.value === "number" ? `Data > Filter > ${focus} > Number Filters > ${enOp.replace(/^./, (c) => c.toUpperCase())} ${filter.value}` : `Data > Filter > ${focus} > select only "${filter.value}"`,
      concept: "Filtering",
      whyItWorks: L("הסינון מסתיר שורות שאינן עומדות בתנאי, בלי למחוק אותן. אפשר להסיר אותו בכל רגע.", "A filter hides rows that do not meet the condition without deleting them. You can remove it at any time."),
    };
  }
  return { summary: L("הפעולה בוצעה.", "The action was completed."), whatChanged: [] };
}
