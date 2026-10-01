/** Deep research: a bounded, sequential pass over the site's own stored knowledge. Facts come only from stored explanations; the free Gemini model may only reword the joined brief (the server rejects any new number or ticker). */
import { findConceptsInText } from "@/lib/knowledge/concepts/registry";
import { conceptAnswerByLabel } from "@/lib/financialEducation";
import { toolHints } from "./multiPart";
import { MAX_ANSWER_LENGTH } from "./gatewayPrompt";

export const MAX_STEPS = 4;
const TRIGGER = /^\s*(?:deep\s+research|מחקר\s+מעמיק)\s*[:\-–]?\s*/i;
export const isDeepRequest = (text: string): boolean => TRIGGER.test(text) && text.replace(TRIGGER, "").trim().length > 2;
export const stripTrigger = (text: string): string => text.replace(TRIGGER, "").trim();

export interface ResearchStep { id: string; label: string; text: string }
export function planResearch(question: string, lang: "he" | "en"): ResearchStep[] {
  const out: ResearchStep[] = [];
  for (const c of findConceptsInText(question, 8)) {
    if (!c.explain) continue;
    const text = conceptAnswerByLabel(c.explain, lang);
    if (text) out.push({ id: c.id, label: lang === "he" ? c.he : c.en, text });
    if (out.length >= MAX_STEPS) break;
  }
  return out;
}
export function buildBrief(steps: ResearchStep[], question: string, lang: "he" | "en"): string {
  const hints = toolHints(question).map((h) => (lang === "he" ? h.he : h.en));
  const body = [...steps.map((s) => `${s.label}: ${s.text}`), ...hints].join("\n\n");
  return body.slice(0, MAX_ANSWER_LENGTH - 50);
}
/** Topics named in the question that have no stored explanation yet. Said plainly, never filled in. */
export function missingTopics(question: string, lang: "he" | "en"): string[] {
  return findConceptsInText(question, 8).filter((c) => !c.explain).slice(0, 4).map((c) => (lang === "he" ? c.he : c.en));
}
export interface DeepResult { text: string; steps: ResearchStep[]; reworded: boolean; missing: string[] }
export async function runDeepResearch(
  question: string, lang: "he" | "en", onStep: (done: number, total: number, label: string) => void,
  rephrase: (q: string, brief: string) => Promise<string | null> = defaultRephrase(lang),
): Promise<DeepResult> {
  const steps = planResearch(question, lang);
  const missing = missingTopics(question, lang);
  for (let i = 0; i < steps.length; i++) onStep(i + 1, steps.length, steps[i].label);
  if (!steps.length) return { text: "", steps, reworded: false, missing };
  const brief = buildBrief(steps, question, lang);
  const text = await rephrase(question, brief);
  return text ? { text, steps, reworded: true, missing } : { text: brief, steps, reworded: false, missing };
}
function defaultRephrase(lang: "he" | "en") {
  return async (question: string, brief: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/copilot-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, language: lang, answer: brief, facts: {} }), signal: AbortSignal.timeout(20_000) });
      if (!res.ok) return null;
      const b = (await res.json()) as { text?: unknown; fallback?: unknown };
      return !b.fallback && typeof b.text === "string" && b.text.trim() ? b.text.trim() : null;
    } catch { return null; }
  };
}
