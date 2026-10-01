/**
 * Runnable tool registry. Each adapter wraps an existing deterministic desk without changing it and
 * returns a ToolResult (value + trust + provenance). The orchestrator and the chat call tools only
 * through runTool, which also enforces the per-agent allow-list.
 */
import { agentMayUse } from "@/lib/agents";
import { loadFx, type FxRequest, type FxResult } from "@/lib/copilot/fxDesk";
import { loadWb, type WbRequest, type WbResult } from "@/lib/copilot/worldBankDesk";
import { lookupSymbol, type SymbolInfo } from "@/lib/copilot/symbolDesk";
import { runMathDesk, type MathDeskResult } from "@/lib/copilot/mathDesk";
import { runCalcDesk, type CalcDeskResult } from "@/lib/copilot/calcDesk";
import { runScenario, type ScenarioPart } from "@/lib/copilot/scenarioDesk";
import type { Bi, ToolResult } from "./envelope";
import type { TrustClass } from "./verificationEngine";

export type ToolId = "calc" | "math" | "fx" | "wb" | "symbol" | "scenario";
export type Domain = "finance" | "market" | "knowledge";
export interface ToolSpec { id: ToolId; domain: Domain; title: Bi; trust: TrustClass; network: boolean }
export type ToolOutcome<T = unknown> = { ok: true; result: ToolResult<T> } | { ok: false; reason: "denied" | "unavailable" | "unknown_tool" };

const b = (en: string, he: string): Bi => ({ en, he });
const TEACHING = b("Rates in these examples are teaching assumptions, not forecasts.", "השיעורים בדוגמאות הם הנחות לימוד, לא תחזיות.");

export const TOOL_SPECS: Record<ToolId, ToolSpec> = {
  calc: { id: "calc", domain: "finance", title: b("Growth calculator", "מחשבון צמיחה"), trust: "CALCULATION", network: false },
  math: { id: "math", domain: "finance", title: b("Math parser", "מנתח חשבון"), trust: "CALCULATION", network: false },
  scenario: { id: "scenario", domain: "finance", title: b("Scenario splitter", "מפצל תרחישים"), trust: "CALCULATION", network: false },
  fx: { id: "fx", domain: "market", title: b("Currency conversion", "המרת מטבע"), trust: "DATA", network: true },
  wb: { id: "wb", domain: "market", title: b("Country statistics", "נתוני מדינה"), trust: "DATA", network: true },
  symbol: { id: "symbol", domain: "knowledge", title: b("Symbol lookup", "חיפוש סימול"), trust: "KNOWLEDGE", network: false },
};

type Adapter = (input: never) => Promise<ToolResult | null>;
const wrap = <T>(id: ToolId, value: T, prov: ToolResult["provenance"]): ToolResult<T> => ({ toolId: id, value, trust: TOOL_SPECS[id].trust, provenance: prov });

const ADAPTERS: Record<ToolId, Adapter> = {
  fx: (async (req: FxRequest) => {
    const v: FxResult | null = await loadFx(req);
    return v && wrap("fx", v, { source: b("European Central Bank via Frankfurter", "הבנק המרכזי האירופי דרך Frankfurter"), asOf: v.date, state: "live",
      note: b(`Daily reference rate for ${v.date}, not a live trading quote. Banks and exchanges offer other rates.`, `שער יחס יומי לתאריך ${v.date}, לא שער מסחר חי. בנקים ובורסאות מציעים שערים אחרים.`) });
  }) as Adapter,
  wb: (async (req: WbRequest) => {
    const v: WbResult | null = await loadWb(req);
    return v && wrap("wb", v, { source: b("The World Bank: World Development Indicators", "הבנק העולמי: World Development Indicators"), license: "CC BY 4.0", asOf: v.lastUpdated || undefined, state: "live",
      note: b("Yearly data, published with a delay.", "נתונים שנתיים שמתפרסמים באיחור.") });
  }) as Adapter,
  symbol: (async (sym: string) => {
    const v: SymbolInfo | null = await lookupSymbol(sym);
    return v && wrap("symbol", v, { source: b("FinanceDatabase (MIT license), static list", "FinanceDatabase (רישיון MIT), רשימה סטטית"), license: "MIT", state: "static",
      note: b("Names and types only, no prices. The list can lag the real company.", "שמות וסוגים בלבד, בלי מחירים. הרשימה יכולה לפגר אחרי החברה האמיתית.") });
  }) as Adapter,
  math: (async (text: string) => {
    const v: MathDeskResult | null = runMathDesk(text);
    return v && wrap("math", v, { source: b("Fixed math parser", "מנתח חשבון קבוע"), state: "calculated" });
  }) as Adapter,
  calc: (async (text: string) => {
    const v: CalcDeskResult | null = runCalcDesk(text);
    return v && wrap("calc", v, { source: b("Fixed growth calculator", "מחשבון צמיחה קבוע"), state: "calculated", assumptions: [TEACHING] });
  }) as Adapter,
  scenario: (async (text: string) => {
    const v: ScenarioPart[] | null = runScenario(text);
    return v && wrap("scenario", v, { source: b("Fixed calculator, loan formula and math parser", "מחשבון קבוע, נוסחת הלוואה ומנתח חשבון"), state: "calculated", assumptions: [TEACHING] });
  }) as Adapter,
};

export const isToolId = (id: string): id is ToolId => id in TOOL_SPECS;

/** The only way to run a tool. Checks the agent allow-list first; a missing result is "unavailable", never a guess. */
export async function runTool<T = unknown>(id: string, input: unknown, ctx: { agentId?: string | null } = {}): Promise<ToolOutcome<T>> {
  if (!isToolId(id)) return { ok: false, reason: "unknown_tool" };
  if (!agentMayUse(ctx.agentId ?? null, id)) return { ok: false, reason: "denied" };
  const result = await (ADAPTERS[id] as (i: unknown) => Promise<ToolResult | null>)(input);
  return result ? { ok: true, result: result as ToolResult<T> } : { ok: false, reason: "unavailable" };
}
