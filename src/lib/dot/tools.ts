// DOT tool registry: ONE list of typed tools with a risk tier and a policy gate between the model and the handlers.
// Tiers: T0 read/navigate, T1 reversible local change, T2 consequential (spoken + on-screen confirmation), T3 never by voice.
// Handlers reuse the same functions the UI uses. Numbers always come from handlers, never from the model.
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import { gridToSheet } from "@/features/gapsheet/lib/io";
import { recalc } from "@/features/gapsheet/lib/workbook/engine";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";

export type RiskTier = 0 | 1 | 2 | 3;
export interface DotContext { navigate: (path: string) => void; language: "he" | "en"; askCopilot: (q: string) => Promise<string> }
export interface DotTool {
  name: string; description: string; tier: RiskTier;
  parameters: { type: "OBJECT"; properties: Record<string, { type: string; description: string; items?: unknown }>; required?: string[] };
  run: (args: Record<string, unknown>, ctx: DotContext) => Promise<Record<string, unknown>>;
}

export const ROUTES: Record<string, string> = {
  home: "/start", start: "/start", learn: "/learn", career: "/career-lab", strategy: "/strategy-lab", simulation: "/simulation", trivia: "/trivia",
  calculator: "/calculator", gapsheet: "/gapsheet", loans: "/loans", insurance: "/insurance-reports", markets: "/markets", research: "/research",
  news: "/news", linklab: "/link-lab", dashboard: "/dashboard", lessons: "/money-lessons", overview: "/overview", data: "/data-controls",
  knowledge: "/knowledge", intelligence: "/intelligence", knowledgemap: "/knowledge-map", health: "/system-health", about: "/about", faq: "/faq",
  contact: "/contact", privacy: "/privacy", terms: "/terms",
};
export const GAPSHEET_STORE = "invested.gapsheet.workbook.v1";
export const GAPSHEET_PREV = "invested.gapsheet.workbook.prev";

const str = (v: unknown, max = 80) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Pure: build a workbook from a title, column names and rows (all text/number, formulas are never created from voice input). */
export function buildTable(title: string, columns: string[], rows: (string | number)[][]): WorkbookState {
  const cols = columns.slice(0, 12).map((c) => str(c, 40)).filter(Boolean);
  if (!cols.length) throw new Error("no_columns");
  const cell = (v: unknown): string | number => { if (typeof v === "number" && Number.isFinite(v)) return v; if (typeof v !== "string") return ""; const s = v.trim().slice(0, 200); return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s; };
  const grid = [cols, ...rows.slice(0, 200).map((r) => cols.map((_, i) => cell(r[i])))];
  const name = str(title, 31) || "Table";
  return recalc({ workbookId: "wb_local", name, version: 1, activeSheetId: "sheet_1", sheets: [gridToSheet(grid, name)] });
}

export const TOOLS: DotTool[] = [
  {
    name: "navigate", tier: 0, description: "Open a page of the site. page is one of: " + Object.keys(ROUTES).join(", "),
    parameters: { type: "OBJECT", properties: { page: { type: "STRING", description: "page key" } }, required: ["page"] },
    run: async (a, ctx) => { const p = ROUTES[str(a.page).toLowerCase().replace(/[^a-z]/g, "")]; if (!p) return { ok: false, error: "unknown_page" }; ctx.navigate(p); return { ok: true, opened: p }; },
  },
  {
    name: "get_quote", tier: 0, description: "Get the live price of a stock, ETF, index, crypto or currency pair by ticker symbol (e.g. AAPL, SPY, BTC-USD, USDILS=X). Returns the value with its source and timestamp. Never guess a price: if ok is false, say the data is unavailable.",
    parameters: { type: "OBJECT", properties: { symbol: { type: "STRING", description: "ticker symbol" } }, required: ["symbol"] },
    run: async (a) => {
      const sym = str(a.symbol, 20).toUpperCase();
      if (!/^[A-Z0-9.\-=^]{1,20}$/.test(sym)) return { ok: false, error: "bad_symbol" };
      const asset = await fetchMarketAssetBySymbol(sym, "1d", undefined, { allowSimulated: false }).catch(() => null);
      if (!asset || asset.isMock) return { ok: false, error: "unavailable", symbol: sym };
      return { ok: true, symbol: asset.symbol, name: asset.name, price: asset.price, currency: asset.currency ?? null, changePercent: asset.changePercent, source: asset.dataSource ?? "market data", asOf: asset.timestamp ?? null };
    },
  },
  {
    name: "ask_copilot", tier: 0, description: "Ask the InvestED copilot a finance-education question or run a calculation (compound interest, loans, dividends, FX, concepts). Returns the verified answer text; read it to the user without changing numbers.",
    parameters: { type: "OBJECT", properties: { question: { type: "STRING", description: "the question in the user's language" } }, required: ["question"] },
    run: async (a, ctx) => { const q = str(a.question, 500); if (!q) return { ok: false, error: "empty" }; try { return { ok: true, answer: (await ctx.askCopilot(q)).slice(0, 1500) }; } catch { return { ok: false, error: "unavailable" }; } },
  },
  {
    name: "create_gapsheet_table", tier: 2,
    description: "Create a GapSheet table (replaces the current GapSheet workbook after the user confirms; the previous one is kept for undo). Use only data the user dictated. Do not invent rows.",
    parameters: { type: "OBJECT", properties: {
      title: { type: "STRING", description: "table title" },
      columns: { type: "ARRAY", items: { type: "STRING" }, description: "column headers" },
      rows: { type: "ARRAY", items: { type: "ARRAY", items: { type: "STRING" } }, description: "rows, each an array of cell values in column order (may be empty)" },
    }, required: ["title", "columns"] },
    run: async (a, ctx) => {
      const cols = Array.isArray(a.columns) ? (a.columns as unknown[]).map((c) => str(c, 40)).filter(Boolean) : [];
      const rows = Array.isArray(a.rows) ? (a.rows as unknown[]).filter(Array.isArray) as (string | number)[][] : [];
      let wb: WorkbookState; try { wb = buildTable(str(a.title, 31), cols, rows); } catch { return { ok: false, error: "bad_table" }; }
      try { const prev = localStorage.getItem(GAPSHEET_STORE); if (prev) localStorage.setItem(GAPSHEET_PREV, prev); localStorage.setItem(GAPSHEET_STORE, JSON.stringify(wb)); } catch { return { ok: false, error: "storage_blocked" }; }
      ctx.navigate("/gapsheet");
      return { ok: true, sheet: wb.name, columns: cols.length, rows: Math.min(rows.length, 200) };
    },
  },
];

export const TIER3_NOTE = "Passwords, sign-in, payments and real-money actions are never done by voice. Ask the user to type them on screen.";

/** Policy gate. Unknown tools and T3 are refused; T2 needs confirm(); everything else runs. Always returns a result object for the model. */
export async function runTool(name: string, args: Record<string, unknown>, ctx: DotContext, confirm: (tool: DotTool, args: Record<string, unknown>) => Promise<boolean>): Promise<{ result: Record<string, unknown>; tool?: DotTool }> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { result: { ok: false, error: "unknown_tool" } };
  if (tool.tier >= 3) return { tool, result: { ok: false, error: "not_allowed_by_voice", note: TIER3_NOTE } };
  if (tool.tier === 2 && !(await confirm(tool, args))) return { tool, result: { ok: false, error: "user_declined" } };
  try { return { tool, result: await tool.run(args, ctx) }; } catch { return { tool, result: { ok: false, error: "failed" } }; }
}

export function systemPrompt(lang: "he" | "en"): string {
  return [
    "You are DOT, the voice assistant of InvestED, a finance-education site. Speak briefly and naturally.",
    lang === "he" ? "Default language: Hebrew. Answer in the language the user speaks; if unsure, use Hebrew." : "Default language: English. Answer in the language the user speaks.",
    "You have tools. For any number, price, calculation or fact about markets or the site, call a tool and read back its result with the source and time. If a tool says data is unavailable, say so. Never invent prices or data.",
    "Educational only: no personal investment advice, no buy/sell calls, no guarantees.",
    "Never ask for or accept passwords, card numbers, or account credentials by voice; tell the user to type those on screen. No real-money actions.",
    "Before any action that changes the user's data, the app asks the user to confirm on screen; say what you are about to do. After a tool result, state only what actually happened.",
    "Do not repeat personal data back unless needed. Keep questions to what is required.",
  ].join(" ");
}
