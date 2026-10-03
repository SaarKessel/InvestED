/** Long questions carry several parts. The main pipeline answers one intent; this finds the other parts and answers them from stored knowledge only. */
import { findConceptsInText } from "@/lib/knowledge/concepts/registry";
import { conceptAnswerByLabel } from "@/lib/financialEducation";

export interface AlsoItem { id: string; label: string; text: string }
export interface ToolHint { toolId: "simulation" | "calculator" | "loans"; he: string; en: string }

const isHebrew = (q: string) => /[א-ת]/.test(q);

const words = (t: string) => t.toLowerCase().split(/[^a-z0-9\u0590-\u05ff]+/).filter((w) => w.length > 2);
/** True when the main answer already says (nearly) the same thing, e.g. a rephrase of the same stored text. */
export function mostlyCovered(text: string, mainAnswer: string): boolean {
  const have = new Set(words(mainAnswer));
  const w = words(text);
  return w.length > 0 && w.filter((x) => have.has(x)).length / w.length >= 0.6;
}

/** Other concepts named in the question, each with its stored plain explanation, skipping any the main answer already says. */
export function alsoAnswered(question: string, mainAnswer: string, limit = 3): AlsoItem[] {
  const lang = isHebrew(question) ? "he" : "en";
  const out: AlsoItem[] = [];
  for (const c of findConceptsInText(question, 8)) {
    if (!c.explain) continue;
    const text = conceptAnswerByLabel(c.explain, lang);
    if (!text || mainAnswer.includes(text.slice(0, 30)) || mostlyCovered(text, mainAnswer)) continue;
    out.push({ id: c.id, label: lang === "he" ? c.he : c.en, text });
    if (out.length >= limit) break;
  }
  return out;
}

const HINTS: Array<{ re: RegExp; hint: ToolHint }> = [
  { re: /(market|stocks?|prices?)\s+(drop|fall|crash|decline)|\bcrash\b|drawdown|(?:market|stocks?|prices?)\s+(?:plunge|tumble)|sell-?off|(?<![א-ת])[ויהבלמשכ]{0,2}(?:ירד[הו]?|ירידה|ירידת|ירידות|קריסה|משבר|נפילה|נפילות)(?![א-ת])/i,
    hint: { toolId: "simulation", en: "Your question includes a market drop. The Simulation tool lets you try one with example numbers.", he: "בשאלה שלך יש ירידת שוק. בכלי הסימולציה אפשר לנסות תרחיש כזה עם מספרי דוגמה." } },
  { re: /per\s+month|monthly|each\s+month|every\s+month|\ba\s+month\b|(מדי\s+חודש|כל\s+חודש|חודשי|חודשית|בחודש)/i,
    hint: { toolId: "calculator", en: "Your question includes monthly deposits. The Smart Calculator can run those numbers.", he: "בשאלה שלך יש הפקדות חודשיות. במחשבון החכם אפשר להריץ את המספרים." } },
  { re: /mortgage|loan|amortiz|(משכנתא|הלוואה|הלוואות|הלוואת|לוח\s+סילוקין)/i,
    hint: { toolId: "loans", en: "Your question includes a loan. The Loans tool shows a full repayment schedule.", he: "בשאלה שלך יש הלוואה. בכלי ההלוואות רואים לוח החזר מלא." } },
];
/** Tool pointers for parts of the question that need a calculation tool. Wording is fixed text, no numbers. */
export function toolHints(question: string): ToolHint[] {
  return HINTS.filter((h) => h.re.test(question)).map((h) => h.hint);
}
export const hasExtraParts = (question: string, mainAnswer: string): boolean => alsoAnswered(question, mainAnswer).length > 0 || toolHints(question).length > 0;
