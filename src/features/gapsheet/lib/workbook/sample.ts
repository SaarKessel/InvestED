import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import { recalc, setCell } from "./engine";

export const SALES_ROWS: [string, string, number][] = [
  ["David", "Jan", 12000], ["Sarah", "Feb", 18000], ["David", "Mar", 15000], ["Sarah", "Apr", 14000],
  ["David", "May", 16500], ["Sarah", "Jun", 17200], ["David", "Jul", 13800], ["Sarah", "Aug", 19100],
  ["David", "Sep", 15400], ["Sarah", "Oct", 16800], ["David", "Nov", 18900], ["Sarah", "Dec", 21000],
];

export function newWorkbook(id = "wb_local"): WorkbookState {
  let s: WorkbookState = {
    workbookId: id, name: "Sales", version: 0, activeSheetId: "sheet_1",
    sheets: [{ id: "sheet_1", name: "Sales", position: 0, cells: {} }],
  };
  const header = ["Name", "Month", "Sales"];
  header.forEach((h, i) => { s = setCell(s, "sheet_1", `${"ABC"[i]}1`, { value: h, formula: null }); });
  SALES_ROWS.forEach((r, i) => r.forEach((v, j) => { s = setCell(s, "sheet_1", `${"ABC"[j]}${i + 2}`, { value: v, formula: null }); }));
  s.version = 1;
  return recalc(s);
}
