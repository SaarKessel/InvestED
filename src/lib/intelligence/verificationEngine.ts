/** Verification: every number in a draft answer must trace to a tool result. Deterministic, no model. */
export type TrustClass = "DATA" | "KNOWLEDGE" | "CALCULATION" | "ANALYSIS" | "SIMULATION" | "EDUCATIONAL";
export interface VerificationResult { ok: boolean; unsupported: string[] }
const NUM = /\d[\d,]*(?:\.\d+)?/g;
const norm = (s: string) => s.replace(/,/g, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
export function numbersIn(text: string): string[] {
  return (text.match(NUM) ?? []).map(norm);
}
export function verifyNumbers(draft: string, sources: string[]): VerificationResult {
  const allowed = new Set(sources.flatMap(numbersIn));
  const unsupported = [...new Set(numbersIn(draft).filter((n) => !allowed.has(n)))];
  return { ok: unsupported.length === 0, unsupported };
}
