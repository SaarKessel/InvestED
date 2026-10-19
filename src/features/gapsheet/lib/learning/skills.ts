import type { SkillId } from "@/features/gapsheet/types/ai";
export interface Skill { id: SkillId; name: string; category: string; description: string; descriptionEn: string }
/** Skill registry (BUILD_SPEC 29, continuation spec 36). Scoring lives in mastery.ts and is shared by every skill. */
export const SKILLS: Skill[] = [
  { id: "sum", name: "SUM", category: "basic-formulas", description: "חיבור טווח תאים", descriptionEn: "Add up a range of cells" },
  { id: "average", name: "AVERAGE", category: "basic-formulas", description: "ממוצע של טווח תאים", descriptionEn: "Average of a range of cells" },
  { id: "sorting", name: "Sorting", category: "data", description: "מיון טבלה לפי עמודה", descriptionEn: "Sort a table by a column" },
  { id: "filtering", name: "Filtering", category: "data", description: "הצגת שורות לפי תנאי", descriptionEn: "Show rows that meet a condition" },
  { id: "min", name: "MIN", category: "basic-formulas", description: "הערך הקטן ביותר בטווח", descriptionEn: "The smallest value in a range" },
  { id: "max", name: "MAX", category: "basic-formulas", description: "הערך הגדול ביותר בטווח", descriptionEn: "The largest value in a range" },
  { id: "count", name: "COUNT", category: "basic-formulas", description: "ספירת תאים", descriptionEn: "Count cells" },
  { id: "sumif", name: "SUMIF", category: "conditional", description: "סכום לפי תנאי", descriptionEn: "Sum by a condition" },
  { id: "countif", name: "COUNTIF", category: "conditional", description: "ספירה לפי תנאי", descriptionEn: "Count by a condition" },
  { id: "dedupe", name: "Remove Duplicates", category: "data", description: "הסרת שורות כפולות מטבלה", descriptionEn: "Remove repeated rows from a table" },
  { id: "dates", name: "DATEDIF", category: "dates", description: "חישובי תאריכים ופערי זמן", descriptionEn: "Date calculations and time gaps" },
  { id: "sumifs", name: "SUMIFS", category: "conditional", description: "סכום לפי כמה תנאים יחד", descriptionEn: "Add up values that meet several conditions" },
  { id: "iferror", name: "IFERROR", category: "logic", description: "טיפול בשגיאות בנוסחה", descriptionEn: "Handle formula errors" },
  { id: "text", name: "TRIM/LEN", category: "text", description: "ניקוי ומדידה של טקסט", descriptionEn: "Clean and measure text" },
  { id: "pivot", name: "Pivot Table", category: "analysis", description: "סיכום נתונים לפי קבוצות", descriptionEn: "Summarize data by groups" },
  { id: "xlookup", name: "XLOOKUP", category: "lookup", description: "חיפוש ערך בטבלה והחזרת ערך מתאים", descriptionEn: "Find a value in a table and return a matching one" },
  { id: "indexmatch", name: "INDEX/MATCH", category: "lookup", description: "חיפוש גמיש עם INDEX ו-MATCH", descriptionEn: "Flexible lookup with INDEX and MATCH" },
  { id: "if", name: "IF", category: "logic", description: "תנאי: אם... אז... אחרת", descriptionEn: "Condition: if... then... otherwise" },
];
export const SKILL_IDS = SKILLS.map((s) => s.id);
export type SkillStatus = "NOT_STARTED" | "INTRODUCED" | "PRACTICING" | "PROFICIENT" | "MASTERED";
