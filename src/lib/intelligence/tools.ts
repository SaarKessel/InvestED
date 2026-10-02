/**
 * Runnable tool registry. Each adapter wraps an existing deterministic desk without changing it and
 * returns a ToolResult (value + trust + provenance). The orchestrator and the chat call tools only
 * through runTool, which also enforces the per-agent allow-list.
 */
import { agentMayUse } from "@/lib/agents";
import { loadFx, type FxRequest, type FxResult } from "@/lib/copilot/fxDesk";
import { loadWb, type WbRequest, type WbResult } from "@/lib/copilot/worldBankDesk";
import { loadFilings, type FilingsRequest, type FilingsResult } from "@/lib/copilot/filingsDesk";
import { loadEtf, type EtfRequest, type EtfResult } from "@/lib/copilot/etfDesk";
import { lookupSymbol, type SymbolInfo } from "@/lib/copilot/symbolDesk";
import { runMathDesk, type MathDeskResult } from "@/lib/copilot/mathDesk";
import { runCalcDesk, type CalcDeskResult } from "@/lib/copilot/calcDesk";
import { simulateMarketEvent, MARKET_SIM_LABEL, type MarketEventInput, type MarketEventResult } from "@/lib/simulator/marketEvents";
import { fetchRssNews, type RssNewsResult } from "@/lib/news/rssClient";
import { runScenario, type ScenarioPart } from "@/lib/copilot/scenarioDesk";
import { loadRisk, type RiskDeskResult } from "@/lib/risk/riskDesk";
import { TOOLS as ENGINES } from "./toolRegistry";
import type { Bi, ToolResult } from "./envelope";
import type { TrustClass } from "./verificationEngine";

export type ToolId = "calc" | "math" | "fx" | "wb" | "filings" | "etf" | "symbol" | "scenario" | "risk" | "rssnews" | "marketsim";
export type Domain = "finance" | "market" | "knowledge" | "news";
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
  filings: { id: "filings", domain: "market", title: b("Institutional holdings (SEC 13F)", "החזקות מוסדיות (SEC 13F)"), trust: "DATA", network: true },
  etf: { id: "etf", domain: "market", title: b("ETF holdings (SEC N-PORT)", "החזקות קרן סל (SEC N-PORT)"), trust: "DATA", network: true },
  risk: { id: "risk", domain: "market", title: b("Risk metrics", "מדדי סיכון"), trust: "CALCULATION", network: true },
  marketsim: { id: "marketsim", domain: "finance", title: b("Market event simulator (invented)", "סימולטור אירועי שוק (מומצא)"), trust: "SIMULATION", network: false },
  rssnews: { id: "rssnews", domain: "news", title: b("Public RSS headlines", "כותרות מ-RSS ציבורי"), trust: "DATA", network: true },
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
  filings: (async (req: FilingsRequest) => {
    const v: FilingsResult | null = await loadFilings(req);
    return v && wrap("filings", v, { source: b("SEC EDGAR: Form 13F-HR information table", "SEC EDGAR: טבלת המידע של טופס 13F-HR"), asOf: v.reportDate, state: "live",
      note: b("As reported by the manager, up to 45 days after quarter end. Long positions in US-listed securities only. Not a live portfolio and not advice.", "כפי שדווח על ידי המנהל, עד 45 יום אחרי סוף הרבעון. רק פוזיציות לונג בניירות אמריקאיים. לא תיק חי ולא ייעוץ.") });
  }) as Adapter,
  etf: (async (req: EtfRequest) => {
    const v: EtfResult | null = await loadEtf(req);
    return v && wrap("etf", v, { source: b("SEC EDGAR: fund Form N-PORT", "SEC EDGAR: טופס N-PORT של הקרן"), asOf: v.reportDate, state: "live",
      note: b("As reported by the fund. Only quarter-end reports are public, about 60 days after quarter end, so the holdings can be months old. Not advice.", "כפי שדווח על ידי הקרן. רק דוחות סוף רבעון פומביים, כ-60 יום אחרי הרבעון, ולכן ההחזקות עשויות להיות בנות חודשים. לא ייעוץ.") });
  }) as Adapter,
  marketsim: (async (req: MarketEventInput) => {
    const v: MarketEventResult = simulateMarketEvent(req);
    return wrap("marketsim", v, { source: b("Fixed teaching simulator on a fictional index", "סימולטור לימודי קבוע על מדד דמיוני"), state: "synthetic",
      note: b(`${MARKET_SIM_LABEL.en}. The path is invented and deterministic. It is not a forecast and not market data.`, `${MARKET_SIM_LABEL.he}. המסלול מומצא ודטרמיניסטי. זו לא תחזית ולא נתוני שוק.`) });
  }) as Adapter,
  rssnews: (async () => {
    const v: RssNewsResult | null = await fetchRssNews();
    return v && v.available && wrap("rssnews", v, { source: b("Public RSS feeds: Federal Reserve, SEC, ECB, Bank of England", "הזנות RSS ציבוריות: הפדרל ריזרב, ה-SEC, הבנק המרכזי האירופי, בנק אנגליה"), asOf: v.fetchedAt, state: "live",
      note: b("Headlines and links only, each with its publisher and publication time. Feed text is treated as data and never run. Official announcements, not market prices.", "כותרות וקישורים בלבד, כל אחת עם המפרסם ושעת הפרסום. טקסט ההזנה מטופל כנתונים ולא מורץ. הודעות רשמיות, לא מחירי שוק.") });
  }) as Adapter,
  symbol: (async (sym: string) => {
    const v: SymbolInfo | null = await lookupSymbol(sym);
    return v && wrap("symbol", v, { source: b("FinanceDatabase (MIT license), static list", "FinanceDatabase (רישיון MIT), רשימה סטטית"), license: "MIT", state: "static",
      note: b("Names and types only, no prices. The list can lag the real company.", "שמות וסוגים בלבד, בלי מחירים. הרשימה יכולה לפגר אחרי החברה האמיתית.") });
  }) as Adapter,
  risk: (async (symbols: string[]) => {
    const v: RiskDeskResult = await loadRisk(symbols);
    const ok = v.items.filter((i) => !i.unavailable);
    if (ok.length === 0) return null;
    const allLive = ok.every((i) => !i.unavailable && i.state === "live");
    return wrap("risk", v, { source: b("Yahoo Finance daily closes via the site's market-quote server", "מחירי סגירה יומיים של Yahoo Finance דרך שרת הנתונים של האתר"), asOf: ok[0].unavailable ? undefined : ok[0].asOf ?? undefined, state: allLive ? "live" : "cached",
      note: b("Computed from about a year of past prices. Describes the past, not the future. Tickers without real price data are listed as unavailable, never estimated.", "מחושב מכשנה של מחירי עבר. מתאר את העבר, לא את העתיד. סימולים בלי נתוני מחיר אמיתיים מסומנים כלא זמינים, לא מוערכים.") });
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

export interface CatalogEntry { id: string; kind: "desk" | "engine"; runnable: boolean; title: Bi; trust: TrustClass }
/**
 * One list of everything the intelligence layer can name: the runnable desks above and the
 * engine catalogue the intent stage (aiConversationService) plans with. Same vocabulary, one place.
 */
export function toolCatalog(): CatalogEntry[] {
  const desks = Object.values(TOOL_SPECS).map((t) => ({ id: t.id, kind: "desk" as const, runnable: true, title: t.title, trust: t.trust }));
  const engines = Object.values(ENGINES).map((t) => ({ id: t.id, kind: "engine" as const, runnable: false, title: t.title, trust: t.trust }));
  return [...desks, ...engines];
}
