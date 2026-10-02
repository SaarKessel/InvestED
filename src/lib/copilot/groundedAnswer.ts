// ---------------------------------------------------------------------------
// InvestED - grounded retrieval over the stored concept library
//
// When the engines have no answer ("outside what I can reliably answer"), the
// copilot looks in the stored concept explanations (BM25 word matching, on the
// device, no embeddings). A strong match is answered with the stored text and
// a source line. No match means a plain "not known": nothing is invented.
// ---------------------------------------------------------------------------

import { UNKNOWN_ANSWER } from "../copilotResponse";
import { retrieve } from "../search/retrieve";

/** Weakest BM25 score that still counts as "this explanation answers the question". */
export const GROUNDED_MIN_SCORE = 3;
/** Intents where a stored explanation can stand in for a missing engine answer. */
const KNOWLEDGE_INTENTS = new Set(["general", "educational_question", "strategy_question"]);

export interface GroundedSource { id: string; label: string }
export interface GroundedAnswer { kind: "grounded" | "unknown"; text: string; sources: GroundedSource[] }

const SOURCE_NAME = { he: "ספריית המושגים של InvestED", en: "InvestED concept library" };
const NOT_KNOWN = {
  he: "אין לי על זה מידע במאגר הידע של InvestED, ולכן אני לא מנחשת. אפשר לנסות לשאול על מושג פיננסי, חישוב או נכס מסוים.",
  en: "I don't have this in the InvestED knowledge base, so I won't guess. Try asking about a financial concept, a calculation or a specific asset.",
};

export function isUnknownAnswer(text: string): boolean {
  return text === UNKNOWN_ANSWER.he || text === UNKNOWN_ANSWER.en;
}

/** Returns a grounded or "not known" answer, or null when the engine already answered (it keeps ownership). */
export function groundAnswer(question: string, lang: "he" | "en", intent: string, engineText: string): GroundedAnswer | null {
  if (!KNOWLEDGE_INTENTS.has(intent) || !isUnknownAnswer(engineText)) return null;
  const top = retrieve(question, lang, 2).filter((p) => p.score >= GROUNDED_MIN_SCORE)[0];
  if (!top) return { kind: "unknown", text: NOT_KNOWN[lang], sources: [] };
  const cite = lang === "he" ? `מקור: ${SOURCE_NAME.he}, "${top.label}".` : `Source: ${SOURCE_NAME.en}, "${top.label}".`;
  return { kind: "grounded", text: `${top.text}\n\n${cite}`, sources: [{ id: top.id, label: top.label }] };
}

/** Plain "not known" text, used when no stored explanation or knowledge note matched. */
export function notKnownText(lang: "he" | "en"): string { return NOT_KNOWN[lang]; }
