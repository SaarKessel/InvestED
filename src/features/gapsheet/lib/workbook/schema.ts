import "@/features/gapsheet/lib/zod-config";
import { z } from "zod";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";

/** One runtime schema for WorkbookState, used by every API route, saved-data validation and backup import (SEC-04).
 *  Unknown keys are stripped. Older saved cells without computedValue/type get defaults, so existing data still loads. */
export const MAX_FORMULA_CHARS = 8192; // Excel's own limit
export const MAX_TEXT_CHARS = 32767;   // Excel's cell text limit
const color = z.enum(["yellow", "green", "red", "blue", "gray", "orange", "purple", "pink", "teal"]);
const CellValueS = z.union([z.string().max(MAX_TEXT_CHARS), z.number(), z.boolean(), z.null()]);
const Format = z.object({
  bold: z.boolean().optional(), italic: z.boolean().optional(), align: z.enum(["left", "center", "right"]).optional(),
  numberFormat: z.enum(["currency", "percent", "number", "date"]).optional(), decimals: z.number().int().min(0).max(20).optional(),
  background: color.optional(), color: color.optional(), border: z.literal("all").optional(),
});
const CellS = z.object({
  format: Format.optional(), value: CellValueS.default(null), formula: z.string().max(MAX_FORMULA_CHARS).nullable().default(null),
  computedValue: CellValueS.default(null),
  type: z.enum(["empty", "text", "number", "currency", "percentage", "date", "boolean", "formula", "error"]).default("text"),
});
const A1 = /^[A-Z]{1,3}[1-9][0-9]{0,6}$/;
const Filter = z.object({ range: z.string().max(40), column: z.string().max(4), op: z.enum([">", ">=", "<", "<=", "=", "!="]), value: z.union([z.string().max(500), z.number()]) });
const ChartS = z.object({ id: z.string().max(100), type: z.enum(["bar", "line", "pie"]), title: z.string().max(200), labelRange: z.string().max(40), valueRange: z.string().max(40) });
const SheetS = z.object({
  direction: z.enum(["rtl", "ltr"]).optional(),
  id: z.string().min(1).max(100), name: z.string().max(100), position: z.number().int().min(0).max(1000),
  cells: z.record(z.string().regex(A1), CellS), filter: Filter.nullable().optional(), charts: z.array(ChartS).max(100).optional(),
});
export const WorkbookStateSchema = z.object({
  workbookId: z.string().max(200), name: z.string().max(200), version: z.number().int().min(0), activeSheetId: z.string().max(100),
  sheets: z.array(SheetS).min(1).max(20),
  importInfo: z.object({ fileName: z.string().max(300), lost: z.array(z.object({ id: z.string().max(100), count: z.number() })).max(100), unchecked: z.number() }).optional(),
}) as unknown as z.ZodType<WorkbookState>;
