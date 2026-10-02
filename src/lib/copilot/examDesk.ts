/** Conversational exam: asks a question from the stored quiz bank, grades a reply of 1-3 deterministically. No model involved. */
import type { QuizQuestion } from "../quizBank";

export interface ExamState { next: number; current: QuizQuestion | null; asked: number; right: number }
export const newExamState = (): ExamState => ({ next: 0, current: null, asked: 0, right: 0 });

const START = /^\s*(?:quiz me|test me|give me a quiz|exam mode|start (?:a )?quiz|next question)\s*[.!?]*\s*$/i;
const START_HE = /^\s*(?:בחן אותי|בחני אותי|תבחן אותי|תבחני אותי|חידון|מבחן|שאלה הבאה)\s*[.!?]*\s*$/;
export const isExamStart = (text: string): boolean => START.test(text) || START_HE.test(text);

/** A bare option number, or "answer 2" / "תשובה 2". Returns the 0-based index. */
export function parseExamAnswer(text: string, optionCount: number): number | null {
  const m = text.match(/^\s*(?:answer\s*|תשובה\s*)?([1-9])\s*[.)]?\s*$/i);
  if (!m) return null;
  const i = Number(m[1]) - 1;
  return i < optionCount ? i : null;
}

export function askNext(state: ExamState, bank: QuizQuestion[], lang: "en" | "he"): { state: ExamState; text: string } {
  const q = bank[state.next % bank.length];
  const head = lang === "he" ? `שאלה ${state.asked + 1}:` : `Question ${state.asked + 1}:`;
  const tail = lang === "he" ? "ענו במספר האפשרות (1, 2 או 3)." : "Reply with the option number (1, 2 or 3).";
  const opts = q.options.map((o, i) => `${i + 1}. ${o}`).join("\n");
  return { state: { ...state, current: q, next: state.next + 1 }, text: `${head} ${q.question}\n${opts}\n${tail}` };
}

export function gradeAnswer(state: ExamState, pick: number, lang: "en" | "he"): { state: ExamState; text: string } {
  const q = state.current!;
  const ok = pick === q.correctIndex;
  const asked = state.asked + 1, right = state.right + (ok ? 1 : 0);
  const verdict = ok ? (lang === "he" ? "נכון." : "Correct.") : lang === "he" ? `לא מדויק. התשובה הנכונה: ${q.correctIndex + 1}. ${q.options[q.correctIndex]}` : `Not quite. The correct answer is ${q.correctIndex + 1}. ${q.options[q.correctIndex]}`;
  const score = lang === "he" ? `ניקוד: ${right} מתוך ${asked}.` : `Score: ${right} of ${asked}.`;
  const more = lang === "he" ? 'כתבו "שאלה הבאה" להמשך.' : 'Say "next question" to continue.';
  return { state: { ...state, current: null, asked, right }, text: `${verdict}\n${q.explanation}\n${score} ${more}` };
}
