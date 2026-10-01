/**
 * One result envelope for every tool. A value never travels without its trust class and provenance,
 * so a card or the trace can say where a number came from. No model writes any field here.
 */
import type { TrustClass } from "./verificationEngine";

export type DataState = "live" | "cached" | "fallback" | "static" | "calculated";
export interface Bi { en: string; he: string }
export interface Provenance {
  source: Bi;
  /** license or terms, when the data is third party */
  license?: string;
  /** date the data refers to (ISO date or year), when known */
  asOf?: string;
  state: DataState;
  /** teaching assumptions or limits that apply to this result */
  assumptions?: Bi[];
  /** plain-language caveat shown with the result */
  note?: Bi;
}
export interface ToolResult<T = unknown> { toolId: string; value: T; trust: TrustClass; provenance: Provenance }

export const STATE_LABEL: Record<DataState, Bi> = {
  live: { en: "Live", he: "חי" },
  cached: { en: "Cached", he: "ממטמון" },
  fallback: { en: "Fallback", he: "גיבוי" },
  static: { en: "Stored list", he: "רשימה שמורה" },
  calculated: { en: "Calculated", he: "מחושב" },
};
