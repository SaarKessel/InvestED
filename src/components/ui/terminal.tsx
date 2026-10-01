import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/languageContext";

export type Density = "comfortable" | "compact" | "terminal";
export type ProvenanceKind = "data" | "calculation" | "analysis" | "knowledge" | "simulation" | "assumption" | "user-input";
const labels: Record<ProvenanceKind, [string, string]> = {
  data: ["Data", "נתונים"], calculation: ["Calculation", "חישוב"], analysis: ["Analysis", "ניתוח"],
  knowledge: ["Knowledge", "ידע"], simulation: ["Simulation", "סימולציה"], assumption: ["Assumption", "הנחה"], "user-input": ["User input", "קלט משתמש"],
};
export function ProvenanceBadge({ kind }: { kind: ProvenanceKind }) {
  const { language } = useLanguage();
  return <span className="terminal-badge" data-kind={kind}>{labels[kind][language === "he" ? 1 : 0]}</span>;
}
export function Panel({ title, actions, children, className, ...props }: HTMLAttributes<HTMLElement> & { title: string; actions?: ReactNode }) {
  return <section className={cn("terminal-panel", className)} aria-label={title} {...props}><div className="terminal-panel-heading"><h2>{title}</h2>{actions}</div><div className="terminal-panel-body">{children}</div></section>;
}
export function Metric({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return <dl className="terminal-metric"><dt>{label}</dt><dd><bdi dir="ltr">{value}</bdi></dd>{note && <small>{note}</small>}</dl>;
}
/** Caller supplies a verified state. A green connection dot is never a default. */
export function StatusIndicator({ state, label }: { state: "live" | "recent" | "stale" | "simulated" | "unavailable"; label: string }) {
  return <span className="terminal-status" data-state={state}><span className="terminal-status-dot" aria-hidden="true" />{label}</span>;
}
export function ChartContainer({ label, children }: { label: string; children: ReactNode }) {
  return <figure className="terminal-chart"><figcaption>{label}</figcaption><div dir="ltr">{children}</div></figure>;
}
