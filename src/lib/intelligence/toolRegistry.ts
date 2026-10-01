/** Typed registry of the existing engines. Wraps nothing yet; lets the planner and the trace name tools consistently. */
import type { EngineId } from "./orchestrator";
import type { TrustClass } from "./verificationEngine";
export interface ToolSpec { id: EngineId; title: { en: string; he: string }; trust: TrustClass; live: boolean }
export const TOOLS: Record<EngineId, ToolSpec> = {
  financial: { id: "financial", title: { en: "Financial engine", he: "מנוע פיננסי" }, trust: "CALCULATION", live: false },
  market: { id: "market", title: { en: "Market data", he: "נתוני שוק" }, trust: "DATA", live: true },
  strategy: { id: "strategy", title: { en: "Strategy engine", he: "מנוע אסטרטגיות" }, trust: "ANALYSIS", live: false },
  profile: { id: "profile", title: { en: "Investor profile", he: "פרופיל משקיע" }, trust: "ANALYSIS", live: false },
  portfolio: { id: "portfolio", title: { en: "Portfolio engine", he: "מנוע תיק" }, trust: "ANALYSIS", live: false },
  backtesting: { id: "backtesting", title: { en: "Backtesting", he: "בדיקה היסטורית" }, trust: "SIMULATION", live: false },
  news: { id: "news", title: { en: "News", he: "חדשות" }, trust: "DATA", live: true },
  education: { id: "education", title: { en: "Knowledge base", he: "מאגר ידע" }, trust: "EDUCATIONAL", live: false },
};
export const toolFor = (id: EngineId): ToolSpec => TOOLS[id];
