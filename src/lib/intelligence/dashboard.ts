/** Super Intelligence dashboard data: one read-only snapshot of what the system has, what is wired, and how recent answers went. Nothing here is computed by a model, and a boundary-only domain is reported as such. */
import { DOMAINS, type DomainSpec } from "./domains";
import { AGENTS } from "@/lib/agents";
import { graphStats } from "@/lib/knowledge/graph";
import { loadTraces, summarize, type TraceEntry } from "./traceStore";

export interface DashboardSnapshot {
  domains: DomainSpec[];
  wiredDomains: number;
  agents: Array<{ id: string; name: { en: string; he: string }; color: string }>;
  knowledge: { concepts: number; withText: number; withoutText: number; categories: number; isolated: number; brokenLinks: number };
  health: ReturnType<typeof summarize>;
  /** routes seen in the trace log, most used first */
  topRoutes: Array<{ route: string; count: number }>;
}

export function buildDashboard(traces: TraceEntry[] = loadTraces()): DashboardSnapshot {
  const domains = Object.values(DOMAINS);
  const g = graphStats();
  const health = summarize(traces);
  return {
    domains,
    wiredDomains: domains.filter((d) => d.status === "wired").length,
    agents: AGENTS.map((a) => ({ id: a.id, name: a.name, color: a.color })),
    knowledge: { concepts: g.nodes, withText: g.withText, withoutText: g.nodes - g.withText, categories: Object.keys(g.byCategory).length, isolated: g.isolated.length, brokenLinks: g.brokenLinks.length },
    health,
    topRoutes: Object.entries(health.byRoute).map(([route, count]) => ({ route, count })).sort((a, b) => b.count - a.count || a.route.localeCompare(b.route)).slice(0, 6),
  };
}
