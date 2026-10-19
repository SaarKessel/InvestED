// DOT tool registry: ONE list of typed tools with a risk tier and a policy gate between the model and the handlers.
// Tiers: T0 read/navigate, T1 reversible local change, T2 consequential (spoken + on-screen confirmation), T3 never by voice.
// Handlers reuse the same functions the UI uses. Numbers always come from handlers, never from the model.
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import { resolveAssetSymbol } from "@/lib/market/symbolResolution";
import { buildSnapshot, newOrder, readLedger, recordOrder, positions, PaperLedgerConflictError } from "@/lib/career/paperLedger";
import { gridToSheet } from "@/features/gapsheet/lib/io";
import { recalc } from "@/features/gapsheet/lib/workbook/engine";
import type { WorkbookState } from "@/features/gapsheet/types/workbook";
import { executeActions } from "@/features/gapsheet/lib/actions/executor";
import { recalc as recalcWb } from "@/features/gapsheet/lib/workbook/engine";

export type RiskTier = 0 | 1 | 2 | 3;
export interface DotContext {
  navigate: (path: string) => void; language: "he" | "en"; askCopilot: (q: string) => Promise<string>;
  setLanguage?: (l: "he" | "en") => void; setTheme?: (t: "light" | "dark") => void;
  /** Set by the policy gate: lets a tool ask for confirmation only when its own risk check says so. */
  confirm?: (args: Record<string, unknown>) => Promise<boolean>;
}
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
export const GAPSHEET_RELOAD = "invested:gapsheet-reload";

function loadWorkbook(): WorkbookState | null {
  try { const w = JSON.parse(localStorage.getItem(GAPSHEET_STORE) ?? "null") as WorkbookState | null; return w && Array.isArray(w.sheets) && w.sheets.some((x) => x.id === w.activeSheetId) ? recalcWb(w) : null; } catch { return null; }
}
function saveWorkbook(wb: WorkbookState, prevRaw: string | null) {
  if (prevRaw) localStorage.setItem(GAPSHEET_PREV, prevRaw);
  localStorage.setItem(GAPSHEET_STORE, JSON.stringify(wb));
  window.dispatchEvent(new Event(GAPSHEET_RELOAD));
}
const ACTION_TYPES = ["SET_CELL", "ADD_FORMULA", "SORT", "FILTER", "SET_RANGE", "CLEAR_RANGE", "FORMAT_RANGE", "CREATE_CHART"] as const;

const WATCH_KEY = "invested-terminal-watchlist";
function readWatch(): string[] { try { const v = JSON.parse(localStorage.getItem(WATCH_KEY) ?? "null"); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 20) : ["SPY", "QQQ", "NVDA"]; } catch { return ["SPY", "QQQ", "NVDA"]; } }
function writeWatch(list: string[]) { localStorage.setItem(WATCH_KEY, JSON.stringify(list)); window.dispatchEvent(new Event("invested:watchlist-reload")); }
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
      window.dispatchEvent(new Event(GAPSHEET_RELOAD)); ctx.navigate("/gapsheet");
      return { ok: true, sheet: wb.name, columns: cols.length, rows: Math.min(rows.length, 200) };
    },
  },
  {
    name: "gapsheet_edit", tier: 1,
    description: "Edit the current GapSheet table with ONE action. type is one of " + ACTION_TYPES.join(", ") + ". SET_CELL: address, value. ADD_FORMULA: range, formula (starts with =). SORT: range (data rows only, WITHOUT the header row), keyColumn (letter), direction asc|desc. FILTER: range, keyColumn, op (>,>=,<,<=,=,!=,clear), value. SET_RANGE: range, value. CLEAR_RANGE (destructive, user must confirm). FORMAT_RANGE: range, bold, numberFormat (currency|percent|number|date|general). CREATE_CHART: range=labels, valueRange, chartType bar|line|pie. Reads existing data first via the table the user sees; never invent cells.",
    parameters: { type: "OBJECT", properties: {
      type: { type: "STRING", description: "action type" }, address: { type: "STRING", description: "cell like B2" }, range: { type: "STRING", description: "range like A1:C10 (or label range for charts)" },
      value: { type: "STRING", description: "text or number" }, formula: { type: "STRING", description: "formula starting with =" }, keyColumn: { type: "STRING", description: "column letter" },
      direction: { type: "STRING", description: "asc or desc" }, op: { type: "STRING", description: "filter operator" }, valueRange: { type: "STRING", description: "value range for charts" },
      chartType: { type: "STRING", description: "bar, line or pie" }, bold: { type: "BOOLEAN", description: "bold" }, numberFormat: { type: "STRING", description: "number format" },
    }, required: ["type"] },
    run: async (a, ctx) => {
      const wb = loadWorkbook(); if (!wb) return { ok: false, error: "no_table_open", note: "Create or open a GapSheet table first." };
      const type = str(a.type, 20).toUpperCase(); if (!(ACTION_TYPES as readonly string[]).includes(type)) return { ok: false, error: "unsupported_action" };
      const sheetId = wb.activeSheetId; const num = (v: unknown) => { const s = str(v, 200); return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s; };
      const act: Record<string, unknown> = { type, sheetId };
      if (type === "SET_CELL") Object.assign(act, { address: str(a.address, 8).toUpperCase(), value: num(a.value) });
      else if (type === "ADD_FORMULA") Object.assign(act, { targetRange: str(a.range, 20).toUpperCase(), formula: str(a.formula, 300) });
      else if (type === "SORT") Object.assign(act, { range: str(a.range, 20).toUpperCase(), keyColumn: str(a.keyColumn, 3).toUpperCase(), direction: str(a.direction, 4).toLowerCase() });
      else if (type === "FILTER") Object.assign(act, { range: str(a.range, 20).toUpperCase(), column: str(a.keyColumn, 3).toUpperCase(), op: str(a.op, 5), ...(a.value !== undefined ? { value: num(a.value) } : {}) });
      else if (type === "SET_RANGE") Object.assign(act, { range: str(a.range, 20).toUpperCase(), value: num(a.value) });
      else if (type === "CLEAR_RANGE") Object.assign(act, { range: str(a.range, 20).toUpperCase() });
      else if (type === "FORMAT_RANGE") Object.assign(act, { range: str(a.range, 20).toUpperCase(), format: { ...(typeof a.bold === "boolean" ? { bold: a.bold } : {}), ...(a.numberFormat ? { numberFormat: str(a.numberFormat, 10) } : {}) } });
      else if (type === "CREATE_CHART") Object.assign(act, { chartType: str(a.chartType, 5), labelRange: str(a.range, 20).toUpperCase(), valueRange: str(a.valueRange, 20).toUpperCase() });
      let res = executeActions([act], wb, { source: "ai", lang: ctx.language });
      if (res.status === "confirmation_required") {
        if (!(await (ctx.confirm ?? (async () => false))({ ...act, risk: res.riskLevel }))) return { ok: false, error: "user_declined" };
        res = executeActions([act], wb, { source: "ai", confirmed: true, lang: ctx.language });
      }
      if (res.status !== "success") return { ok: false, error: res.status === "rejected" ? res.error : "not_applied" };
      try { saveWorkbook(res.after, localStorage.getItem(GAPSHEET_STORE)); } catch { return { ok: false, error: "storage_blocked" }; }
      return { ok: true, applied: type };
    },
  },
  {
    name: "watchlist_get", tier: 0, description: "Read the user's market watchlist (symbols).",
    parameters: { type: "OBJECT", properties: {} },
    run: async () => ({ ok: true, symbols: readWatch() }),
  },
  {
    name: "watchlist_add", tier: 1, description: "Add a supported symbol (stock, ETF, index, crypto, FX) to the watchlist. Max 20.",
    parameters: { type: "OBJECT", properties: { symbol: { type: "STRING", description: "ticker or asset name" } }, required: ["symbol"] },
    run: async (a) => { const m = resolveAssetSymbol(str(a.symbol, 40)); if (!m) return { ok: false, error: "symbol_not_supported" }; const cur = readWatch(); if (cur.includes(m.symbol)) return { ok: true, symbol: m.symbol, already: true }; if (cur.length >= 20) return { ok: false, error: "watchlist_full" }; writeWatch([...cur, m.symbol]); return { ok: true, symbol: m.symbol }; },
  },
  {
    name: "watchlist_remove", tier: 1, description: "Remove a symbol from the watchlist.",
    parameters: { type: "OBJECT", properties: { symbol: { type: "STRING", description: "ticker" } }, required: ["symbol"] },
    run: async (a) => { const m = resolveAssetSymbol(str(a.symbol, 40)); const sym = m?.symbol ?? str(a.symbol, 20).toUpperCase(); const cur = readWatch(); if (!cur.includes(sym)) return { ok: false, error: "not_in_watchlist" }; writeWatch(cur.filter((x) => x !== sym)); return { ok: true, removed: sym }; },
  },
  {
    name: "paper_ledger_view", tier: 0, description: "Read the PAPER (practice, simulated) ledger: recent orders and net positions. No real money.",
    parameters: { type: "OBJECT", properties: {} },
    run: async () => { const o = readLedger(); return { ok: true, paperOnly: true, orders: o.slice(-10).map((x) => ({ side: x.side, qty: x.quantity, symbol: x.snapshot.symbol, price: x.snapshot.price, currency: x.snapshot.currency, at: x.recordedAt })), positions: positions(o) }; },
  },
  {
    name: "paper_order", tier: 2, description: "Record a PAPER (practice-only, simulated, no real money) buy or sell at the latest live quote. The user must confirm on screen. This never trades real money.",
    parameters: { type: "OBJECT", properties: { side: { type: "STRING", description: "buy or sell" }, quantity: { type: "NUMBER", description: "positive quantity" }, symbol: { type: "STRING", description: "ticker" } }, required: ["side", "quantity", "symbol"] },
    run: async (a) => {
      const side = str(a.side, 4).toLowerCase(); const q = Number(a.quantity); const m = resolveAssetSymbol(str(a.symbol, 40));
      if ((side !== "buy" && side !== "sell") || !Number.isFinite(q) || q <= 0 || q > 1_000_000 || !m) return { ok: false, error: "bad_order" };
      const asset = await fetchMarketAssetBySymbol(m.symbol, "1d", undefined, { allowSimulated: false }).catch(() => null);
      const snap = asset ? buildSnapshot(asset) : null; if (!snap) return { ok: false, error: "no_live_quote" };
      try { recordOrder(newOrder(side, q, snap), readLedger()); } catch (e) { return { ok: false, error: e instanceof PaperLedgerConflictError ? "ledger_conflict" : "failed" }; }
      return { ok: true, paperOnly: true, side, quantity: q, symbol: snap.symbol, price: snap.price, currency: snap.currency, source: "yahoo_finance", asOf: snap.sourceTimestamp };
    },
  },
  {
    name: "set_language", tier: 1, description: "Switch the site language between Hebrew (he) and English (en).",
    parameters: { type: "OBJECT", properties: { language: { type: "STRING", description: "he or en" } }, required: ["language"] },
    run: async (a, ctx) => { const l = str(a.language, 4).toLowerCase(); if (l !== "he" && l !== "en") return { ok: false, error: "bad_language" }; if (!ctx.setLanguage) return { ok: false, error: "unavailable" }; ctx.setLanguage(l); return { ok: true, language: l }; },
  },
  {
    name: "set_theme", tier: 1, description: "Switch the site theme to light or dark.",
    parameters: { type: "OBJECT", properties: { theme: { type: "STRING", description: "light or dark" } }, required: ["theme"] },
    run: async (a, ctx) => { const th = str(a.theme, 6).toLowerCase(); if (th !== "light" && th !== "dark") return { ok: false, error: "bad_theme" }; if (!ctx.setTheme) return { ok: false, error: "unavailable" }; ctx.setTheme(th); return { ok: true, theme: th }; },
  },
];

export const TIER3_NOTE = "Passwords, sign-in, payments and real-money actions are never done by voice. Ask the user to type them on screen.";

/** Policy gate. Unknown tools and T3 are refused; T2 needs confirm(); everything else runs. Always returns a result object for the model. */
export async function runTool(name: string, args: Record<string, unknown>, ctx: DotContext, confirm: (tool: DotTool, args: Record<string, unknown>) => Promise<boolean>): Promise<{ result: Record<string, unknown>; tool?: DotTool }> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { result: { ok: false, error: "unknown_tool" } };
  if (tool.tier >= 3) return { tool, result: { ok: false, error: "not_allowed_by_voice", note: TIER3_NOTE } };
  if (tool.tier === 2 && !(await confirm(tool, args))) return { tool, result: { ok: false, error: "user_declined" } };
  try { return { tool, result: await tool.run(args, { ...ctx, confirm: (x) => confirm(tool, x) }) }; } catch { return { tool, result: { ok: false, error: "failed" } }; }
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
