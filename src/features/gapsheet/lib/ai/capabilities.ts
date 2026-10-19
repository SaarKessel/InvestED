import { pick, type Lang } from '@/features/gapsheet/lib/i18n';
/** Creation is not an existing-table operation. Never let a provider reinterpret it as one. */
export function requestsNewTable(text: string): boolean {
  return /(?:טבלה|גיליון)\s+חדש[הא]?|\bnew\s+(?:table|sheet|spreadsheet|workbook)\b/i.test(text);
}
export function newTableMessage(lang: Lang): string {
  return pick(lang,
    'יצירת טבלה או גיליון חדש מתוך בקשה עדיין לא נתמכת. לא יצרתי טבלה ולא שיניתי את הנתונים. אפשר לייבא קובץ CSV או XLSX דרך "יבוא", או לבקש חישוב, מיון, סינון ועיצוב על הטבלה הקיימת.',
    'Creating a new table or sheet from a request is not supported yet. No table was created and your data did not change. Import a CSV or XLSX with Import, or ask for calculations, sorting, filtering and formatting on the existing table.');
}
