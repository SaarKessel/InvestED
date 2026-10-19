import "@/features/gapsheet/lib/zod-config";
import { z } from "zod";
import { PALETTE } from "@/features/gapsheet/lib/workbook/palette";

export const RiskLevel = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

const cellValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const addr = z.string().regex(/^[A-Z]{1,3}[1-9][0-9]{0,4}$/);
const range = z.string().regex(/^[A-Z]{1,3}[1-9][0-9]{0,4}(:[A-Z]{1,3}[1-9][0-9]{0,4})?$/);

export const SetCellAction = z.object({ type: z.literal("SET_CELL"), sheetId: z.string().min(1), address: addr, value: cellValue });

/** targetRange may be a single cell or a range. For a range, `formula` is the first cell's formula and is filled down. */
export const AddFormulaAction = z.object({ type: z.literal("ADD_FORMULA"), sheetId: z.string().min(1), targetRange: range, formula: z.string().regex(/^=/) });

export const SortAction = z.object({
  type: z.literal("SORT"), sheetId: z.string().min(1),
  range: range, keyColumn: z.string().regex(/^[A-Z]{1,3}$/), direction: z.enum(["asc", "desc"]),
});

export const FilterAction = z.object({
  type: z.literal("FILTER"), sheetId: z.string().min(1),
  range: range, column: z.string().regex(/^[A-Z]{1,3}$/),
  op: z.enum([">", ">=", "<", "<=", "=", "!=", "clear"]),
  value: z.union([z.string(), z.number()]).optional(),
});

/** Destructive: empties every cell in the range (header included). Always HIGH risk, so it needs explicit confirmation. */
export const ClearRangeAction = z.object({ type: z.literal("CLEAR_RANGE"), sheetId: z.string().min(1), range: range });

/** Writes one literal value (text or number, never a formula) into every cell of the range. */
export const SetRangeAction = z.object({ type: z.literal("SET_RANGE"), sheetId: z.string().min(1), range: range, value: z.union([z.string(), z.number()]) });

/** Presentation-only. Applies to non-empty cells in the range. numberFormat "general" removes number formatting. */
export const FormatRangeAction = z.object({
  type: z.literal("FORMAT_RANGE"), sheetId: z.string().min(1), range: range,
  format: z.object({
    bold: z.boolean().optional(), italic: z.boolean().optional(), align: z.enum(["left", "center", "right"]).optional(),
    numberFormat: z.enum(["currency", "percent", "number", "date", "general"]).optional(), decimals: z.number().int().min(0).max(6).optional(),
    background: z.enum([...PALETTE, "none"]).optional(), color: z.enum([...PALETTE, "none"]).optional(), border: z.enum(["all", "none"]).optional(),
  }).strict().refine((f) => Object.keys(f).length > 0, "empty format"),
});

/** Adds a chart view over two single-column ranges (labels, values). Never changes cell data, so it is LOW risk. */
export const CreateChartAction = z.object({
  type: z.literal("CREATE_CHART"), sheetId: z.string().min(1), chartType: z.enum(["bar", "line", "pie"]),
  labelRange: range, valueRange: range, title: z.string().max(80).optional(),
});

/** Removes every chart on the sheet. Charts are a view over cell data, so no cell value or formula is touched. */
export const RemoveChartsAction = z.object({ type: z.literal("REMOVE_CHARTS"), sheetId: z.string().min(1) });

/** Builds a summary table on a NEW sheet (never touches the source). Values are live formulas that point back at the source sheet (the list of groups is fixed at creation). */
export const CreatePivotAction = z.object({
  type: z.literal("CREATE_PIVOT"), sheetId: z.string().min(1), range: range,
  rowColumn: z.string().regex(/^[A-Z]{1,3}$/), valueColumn: z.string().regex(/^[A-Z]{1,3}$/), agg: z.enum(["sum", "count", "average"]),
});

/** Destructive: removes rows that repeat an earlier row across every column of the range (first one is kept, header row excluded). Always HIGH risk. */
export const RemoveDuplicatesAction = z.object({ type: z.literal("REMOVE_DUPLICATES"), sheetId: z.string().min(1), range: range });

/** Renames a sheet and rewrites every reference to it (parse-aware, never a blind text replace). */
export const RenameSheetAction = z.object({ type: z.literal("RENAME_SHEET"), sheetId: z.string().min(1), newName: z.string().min(1).max(31) });

export const Action = z.discriminatedUnion("type", [RenameSheetAction, RemoveDuplicatesAction, CreatePivotAction, SetCellAction, AddFormulaAction, SortAction, FilterAction, ClearRangeAction, SetRangeAction, FormatRangeAction, CreateChartAction, RemoveChartsAction]);
export type Action = z.infer<typeof Action>;

export interface ActionRecord { id: string; actions: Action[]; source: "user" | "ai"; riskLevel: RiskLevel; createdAt: string }
