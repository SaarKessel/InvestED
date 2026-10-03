/** Conversational exam: asks a question from the stored quiz bank, grades a reply of 1-3 deterministically. No model involved. */
import type { QuizQuestion } from "../quizBank";

/** missed: ids of questions answered wrong and not yet answered right. since: fresh questions asked since the last review question. */
export interface ExamState { next: number; current: QuizQuestion | null; asked: number; right: number; missed: string[]; since: number }
export const newExamState = (missed: string[] = []): ExamState => ({ next: 0, current: null, asked: 0, right: 0, missed, since: 0 });
/** A missed question comes back after this many fresh ones. */
export const REVIEW_AFTER = 2;

const START = /^\s*(?:quiz|(?:can|could|would) you quiz me|quiz me again|(?:give|ask) me a question|test my knowledge|quiz me|test me|give me a quiz|exam mode|start (?:a )?quiz|next question|let'?s (?:do|have) a quiz|i want (?:a quiz|to be quizzed))(?:\s*,?\s*(?:please|pls))?\s*[.!?]*\s*$/i;
const START_HE = /^\s*(?:אפשר חידון|אני רוצה (?:חידון|להיבחן)|תשאל(?:י)? אותי שאלה|בחן אותי|בחני אותי|תבחן אותי|תבחני אותי|חידון|מבחן|שאלה הבאה|תן לי חידון|תני לי חידון|בוא נעשה חידון|בואי נעשה חידון)(?:\s+בבקשה)?\s*[.!?]*\s*$/;
export const isExamStart = (text: string): boolean => START.test(text) || START_HE.test(text);

/** A bare option number, or "answer 2" / "תשובה 2". Returns the 0-based index. */
export function parseExamAnswer(text: string, optionCount: number): number | null {
  const m = text.match(/^\s*(?:(?:answer|option|choice|number|תשובה|אפשרות)\s*:?\s*)?\(?([1-9])\)?\s*[.)]?(?:\s*,?\s*(?:please|pls|thanks|thank you|בבקשה|תודה))?\s*[.!]*\s*$/i);
  if (!m) return null;
  const i = Number(m[1]) - 1;
  return i < optionCount ? i : null;
}

export function askNext(state: ExamState, bank: QuizQuestion[], lang: "en" | "he"): { state: ExamState; text: string } {
  const due = state.since >= REVIEW_AFTER ? bank.find((b) => state.missed.includes(b.id)) : undefined;
  const q = due ?? bank[state.next % bank.length];
  const label = due ? (lang === "he" ? "חזרה על שאלה שפספסתם. " : "Back to one you missed. ") : "";
  const head = `${label}${lang === "he" ? `שאלה ${state.asked + 1}:` : `Question ${state.asked + 1}:`}`;
  const tail = lang === "he" ? "ענו במספר האפשרות (1, 2 או 3)." : "Reply with the option number (1, 2 or 3).";
  const opts = q.options.map((o, i) => `${i + 1}. ${o}`).join("\n");
  return { state: { ...state, current: q, next: due ? state.next : state.next + 1, since: due ? 0 : state.since + 1 }, text: `${head} ${q.question}\n${opts}\n${tail}` };
}

export function gradeAnswer(state: ExamState, pick: number, lang: "en" | "he"): { state: ExamState; text: string } {
  const q = state.current!;
  const ok = pick === q.correctIndex;
  const asked = state.asked + 1, right = state.right + (ok ? 1 : 0);
  const verdict = ok ? (lang === "he" ? "נכון." : "Correct.") : lang === "he" ? `לא מדויק. התשובה הנכונה: ${q.correctIndex + 1}. ${q.options[q.correctIndex]}` : `Not quite. The correct answer is ${q.correctIndex + 1}. ${q.options[q.correctIndex]}`;
  const score = lang === "he" ? `ניקוד: ${right} מתוך ${asked}.` : `Score: ${right} of ${asked}.`;
  const more = lang === "he" ? 'כתבו "שאלה הבאה" להמשך.' : 'Say "next question" to continue.';
  const missed = ok ? state.missed.filter((id) => id !== q.id) : state.missed.includes(q.id) ? state.missed : [...state.missed, q.id];
  const back = ok ? "" : lang === "he" ? "\nאחזור לשאלה הזו בהמשך." : "\nI will bring this one back later.";
  return { state: { ...state, current: null, asked, right, missed }, text: `${verdict}\n${q.explanation}${back}\n${score} ${more}` };
}
