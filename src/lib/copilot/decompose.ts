/** Task decomposition: splits a long question into ordered sub-questions and plans each with the existing planner. Planning only; the chat pipeline still runs every route. */
import { planQuestion, type Plan, type Route } from "./planner";

export const MAX_TASKS = 5;
export interface SubTask { index: number; text: string; route: Route; tools: Plan["tools"] }
export interface Decomposition { tasks: SubTask[]; /** true when the question had more than one part */ multi: boolean; /** parts dropped by the cap */ dropped: number }

const SPLIT = /(?<=[.?!؟])\s+|\s*;\s*|\n+|\s+(?:and then|then|after that|also|ואז|אחר כך|וגם)\s+|\s*\b\d\)\s+|^\s*\d\.\s+/i;
export function splitParts(text: string): string[] {
  return text.split(SPLIT).map((s) => s?.trim().replace(/^(?:and then|then|after that|also|and|ואז|אחר כך|וגם)\s+/i, "")).filter((s): s is string => !!s && s.replace(/[^A-Za-z0-9א-ת]/g, "").length >= 3);
}
export function decompose(question: string): Decomposition {
  const parts = splitParts(question);
  const kept = parts.slice(0, MAX_TASKS);
  const tasks = kept.map((text, index) => { const p = planQuestion(text); return { index, text, route: p.route, tools: p.tools }; });
  return { tasks, multi: tasks.length > 1, dropped: parts.length - kept.length };
}
/** Plain one-line summary of the plan, for the trace. Fixed wording. */
export function describePlan(d: Decomposition, lang: "he" | "en"): string {
  if (!d.multi) return lang === "he" ? "השאלה היא משימה אחת." : "The question is a single task.";
  const n = d.tasks.length;
  return lang === "he" ? `פיצלתי את השאלה ל-${n} משימות והרצתי אותן לפי הסדר${d.dropped ? ` (${d.dropped} נוספות לא נכללו)` : ""}.` : `Split the question into ${n} tasks and ran them in order${d.dropped ? ` (${d.dropped} more were left out)` : ""}.`;
}
