import type { Chart, Sheet } from "@/features/gapsheet/types/workbook";
import { expandRange, parseAddress, parseRange } from "./ranges";
import { displayValue, hiddenRows } from "./engine";

export interface ChartPoint { label: string; value: number }
/** Chart data is derived from the live cells on every render. Rows hidden by the active filter are left out, so filter and chart stay consistent. */
export function chartPoints(sheet: Sheet, chart: Chart): ChartPoint[] {
  const lab = parseRange(chart.labelRange); const val = parseRange(chart.valueRange);
  if (!lab || !val) return [];
  const hidden = hiddenRows(sheet);
  const labels = expandRange(lab); const values = expandRange(val);
  const out: ChartPoint[] = [];
  values.forEach((a, i) => {
    const row = parseAddress(a)!.row; if (hidden.has(row)) return;
    const v = sheet.cells[a]?.computedValue;
    if (typeof v === "number") out.push({ label: displayValue(sheet.cells[labels[i]]) || labels[i], value: v });
  });
  return out;
}
