/**
 * Domain interfaces: the seven areas the blueprint names, each as a boundary over what already exists.
 * "wired" domains list the runnable tools behind them. "boundary" domains only name the existing
 * module that serves them today (no adapter yet), so nothing is faked and nothing is duplicated.
 */
import { runTool, isToolId, type ToolId, type ToolOutcome } from "./tools";
import type { Bi } from "./envelope";

export type DomainId = "financial" | "market" | "research" | "news" | "portfolio" | "risk" | "learning";
export interface DomainSpec { id: DomainId; title: Bi; status: "wired" | "boundary"; tools: ToolId[]; servedBy: string }
const b = (en: string, he: string): Bi => ({ en, he });

export const DOMAINS: Record<DomainId, DomainSpec> = {
  financial: { id: "financial", title: b("Financial", "פיננסי"), status: "wired", tools: ["calc", "math", "scenario"], servedBy: "copilot calc, math and scenario desks" },
  market: { id: "market", title: b("Market", "שוק"), status: "wired", tools: ["fx", "wb", "symbol"], servedBy: "FX, World Bank and symbol desks" },
  research: { id: "research", title: b("Research", "מחקר"), status: "boundary", tools: [], servedBy: "Deep Research (bounded, not web research)" },
  news: { id: "news", title: b("News", "חדשות"), status: "boundary", tools: [], servedBy: "news cards in the market window" },
  portfolio: { id: "portfolio", title: b("Portfolio", "תיק"), status: "boundary", tools: [], servedBy: "read-only market panels; no portfolio engine yet" },
  risk: { id: "risk", title: b("Risk", "סיכון"), status: "wired", tools: ["risk"], servedBy: "risk metrics engine: volatility, worst drop and beta from real daily closes, plus the risk agent" },
  learning: { id: "learning", title: b("Learning", "למידה"), status: "boundary", tools: [], servedBy: "level tracks and learn paths" },
};

export const domainOf = (tool: string): DomainId | null =>
  isToolId(tool) ? (Object.values(DOMAINS).find((d) => d.tools.includes(tool))?.id ?? null) : null;

/** Run a tool through its domain. A tool outside the domain, or a boundary-only domain, is refused. */
export async function runInDomain<T = unknown>(domain: DomainId, tool: string, input: unknown, ctx: { agentId?: string | null } = {}): Promise<ToolOutcome<T>> {
  if (!isToolId(tool) || !DOMAINS[domain].tools.includes(tool)) return { ok: false, reason: "unknown_tool" };
  return runTool<T>(tool, input, ctx);
}
