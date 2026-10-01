/** Provenance: each answer block carries a trust class and where it came from. Labels only, never new facts. */
import type { TrustClass } from "./verificationEngine";
export interface ProvenanceStep { tool: string; trust: TrustClass; source?: string; asOf?: string; note?: string }
export const TRUST_LABEL: Record<TrustClass, { en: string; he: string }> = {
  DATA: { en: "Market data", he: "נתוני שוק" },
  KNOWLEDGE: { en: "Stored knowledge", he: "ידע שמור" },
  CALCULATION: { en: "Calculation", he: "חישוב" },
  ANALYSIS: { en: "Analysis", he: "ניתוח" },
  SIMULATION: { en: "Simulation (illustrative)", he: "סימולציה (להמחשה)" },
  EDUCATIONAL: { en: "Education", he: "לימוד" },
};
/** Human line for the "What I did" trace; only steps that really ran. */
export function describeStep(step: ProvenanceStep, lang: "en" | "he"): string {
  const label = TRUST_LABEL[step.trust][lang];
  const when = step.asOf ? ` · ${step.asOf}` : "";
  const src = step.source ? ` · ${step.source}` : "";
  return `${label}: ${step.tool}${src}${when}`;
}
