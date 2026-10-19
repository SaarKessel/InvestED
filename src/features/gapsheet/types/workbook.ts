export type CellValue = string | number | boolean | null;
export type CellType = "empty" | "text" | "number" | "currency" | "percentage" | "date" | "boolean" | "formula" | "error";

export interface CellFormat { bold?: boolean; italic?: boolean; align?: "left" | "center" | "right"; numberFormat?: "currency" | "percent" | "number" | "date"; decimals?: number; background?: "yellow" | "green" | "red" | "blue" | "gray" | "orange" | "purple" | "pink" | "teal"; color?: "yellow" | "green" | "red" | "blue" | "gray" | "orange" | "purple" | "pink" | "teal"; border?: "all" }
export interface Cell {
  /** Presentation only. Never changes value, formula or computedValue, so learning and validation ignore it. */
  format?: CellFormat;
  /** Raw user input / literal value. For formulas this is null and `formula` is set. */
  value: CellValue;
  /** Formula text starting with "=", never only the computed value (BUILD_SPEC section 8). */
  formula: string | null;
  /** Result of evaluating `formula`. Derived, recomputed by the engine. */
  computedValue: CellValue;
  type: CellType;
}

export type ChartType = "bar" | "line" | "pie";
/** A chart is a view over cell ranges. It stores no data of its own, so it always reflects the current cells. */
export interface Chart { id: string; type: ChartType; title: string; labelRange: string; valueRange: string }

export interface Sheet {
  /** Layout chosen by the latest copilot request language, independent of cell text. */
  direction?: "rtl" | "ltr";
  id: string;
  name: string;
  position: number;
  /** Sparse map keyed by A1 address, e.g. "C2". */
  cells: Record<string, Cell>;
  /** Active filter (a view over rows; data is never deleted). */
  filter?: FilterSpec | null;
  charts?: Chart[];
}

export interface WorkbookState {
  workbookId: string;
  name: string;
  version: number;
  activeSheetId: string;
  sheets: Sheet[];
  /** Set when the workbook came from an XLSX file: what that file had that GapSheet cannot write back (G5). */
  importInfo?: { fileName: string; lost: { id: string; count: number }[]; unchecked: number };
}

export type FilterOp = ">" | ">=" | "<" | "<=" | "=" | "!=";
export interface FilterSpec { range: string; column: string; op: FilterOp; value: string | number }
