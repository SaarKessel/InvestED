/** Task decomposition: splits a long question into ordered sub-questions and plans each with the existing planner. Planning only; the chat pipeline still runs every route. */
import { planQuestion, type Plan, type Route } from "./planner";
import { parseFxRequest } from "./fxDesk";
import { parseWbRequest } from "./worldBankDesk";

export const MAX_TASKS = 5;
export interface SubTask { index: number; text: string; route: Route; tools: Plan["tools"] }
export interface Decomposition { tasks: SubTask[]; /** true when the question had more than one part */ multi: boolean; /** parts dropped by the cap */ dropped: number }

const SPLIT = /(?<=[.?!؟])(?<!\b(?:vs|e\.g|i\.e|u\.s|dr|mr|mrs|ms|inc|ltd|approx)\.)(?!(?<=\b(?:no|jan|feb|mar|apr|aug|sept?|oct|nov|dec)\.)\s+\d)\s+|\s+\d\.\s+(?=[A-Za-z\u05d0-\u05ea])|\s*;\s*|\n+|\s+(?:and then|and also|then|after that|afterwards|also|ואז|אחר כך|ואחר כך|וגם)\s+|\s*\(?\b\d\)\s+|^\s*\d\.\s+/i;
export function splitParts(text: string): string[] {
  return splitParts0(text).flatMap(splitDeskPairs);
}
/** "100 USD in EUR and 50 GBP in ILS" / "inflation in Germany and unemployment in France": a plain "and" splits only when both halves are, on their own, a currency conversion or a country statistic. */
function splitDeskPairs(part: string): string[] {
  // "what is 15% of 2400 and what is 2400 * 1.15": a second question word after "and" starts a new question, when both sides carry numbers.
  const q = /^(.*\d.*?)\s*,?\s+(?:and|ו-?)\s*((?:what|how much|how many|calculate|compute|convert|מה|כמה|חשב|חשבי)(?![א-ת]).*\d.*)$/is.exec(part);
  if (q && /^(?:what|how|calc|comp|conv|מה|כמה|חשב|חשבי)/i.test(q[1].trim())) return [q[1].trim(), ...splitDeskPairs(q[2].trim())];
  const m = /^(.+?)\s*,?\s+(?:and|ו-?)\s*(.+)$/is.exec(part);
  if (!m) return [part];
  const [a, b] = [m[1].trim(), m[2].trim()];
  const same = (f: (t: string) => unknown) => !!f(a) && !!f(b);
  const wbThenOther = !!parseWbRequest(a) && (!!parseWbRequest(b) || /inflation|unemployment|\bgdp\b|growth|אינפלציה|אבטלה|תמ["״']?ג|תוצר/i.test(b));
  return same(parseFxRequest) || wbThenOther ? [a, ...splitDeskPairs(b)] : [part];
}
function splitParts0(text: string): string[] {
  return text.split(SPLIT).map((s) => s?.trim().replace(/^(?:and then|then|after that|afterwards|also|and|ואז|אחר כך|ואחר כך|וגם)\s+/i, "")).filter((s): s is string => !!s && !/^(?:and|then|also|ו)$/i.test(s) && (s.replace(/[^A-Za-z0-9א-ת]/g, "").length >= 3 || /\d\s*[-+*/x×÷^]\s*\d/.test(s)));
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
