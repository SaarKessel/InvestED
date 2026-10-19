import type { Action, RiskLevel } from "@/features/gapsheet/types/actions";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import { getSheet } from "@/features/gapsheet/lib/workbook/engine";
import { expandRange, parseRange } from "@/features/gapsheet/lib/workbook/ranges";

/** BUILD_SPEC 21: overwrite existing cells / sort populated range = MEDIUM; formula into empty cells, filter(view only) = LOW. */
export function evaluateRisk(action: Action, state: WorkbookState): RiskLevel {
  const sheet = getSheet(state, action.sheetId);
  if (!sheet) return "LOW";
  if (action.type === "REMOVE_DUPLICATES") return "HIGH";
  if (action.type === "RENAME_SHEET") return "MEDIUM"; // rewrites formulas on every sheet that points here
  if (action.type === "CREATE_PIVOT") return "LOW"; // writes only to a brand-new sheet
  if (action.type === "SORT") return "MEDIUM";
  if (action.type === "FILTER") return "LOW";
  if (action.type === "CLEAR_RANGE") return expandRange(parseRange(action.range)!).some((a) => sheet.cells[a] && sheet.cells[a].type !== "empty") ? "HIGH" : "LOW";
  if (action.type === "FORMAT_RANGE" || action.type === "CREATE_CHART" || action.type === "REMOVE_CHARTS") return "LOW";
  if (action.type === "SET_RANGE") return expandRange(parseRange(action.range)!).some((a) => sheet.cells[a] && sheet.cells[a].type !== "empty") ? "MEDIUM" : "LOW";
  const cells = action.type === "ADD_FORMULA" ? expandRange(parseRange(action.targetRange)!) : [action.address];
  return cells.some((a) => sheet.cells[a] && sheet.cells[a].type !== "empty") ? "MEDIUM" : "LOW";
}
export const requiresConfirmation = (r: RiskLevel) => r === "HIGH";
