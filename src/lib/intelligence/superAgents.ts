/** Specialist agents: runnable units over the stored concepts, the concept graph and the site's own tools. They add no data source, no web access and no model. Each states what it cannot do. */
import { findConceptsInText, getConcept, type ConceptEntry } from "@/lib/knowledge/concepts/registry";
import { conceptAnswerByLabel } from "@/lib/financialEducation";
import { neighbourhood } from "@/lib/knowledge/graph";

export interface Bi { en: string; he: string }
export type SuperAgentId = "risk" | "learning";
export interface AgentStep { id: string; label: string; text: string }
export interface AgentToolPointer { path: string; label: Bi }
export interface AgentResult { agent: SuperAgentId; steps: AgentStep[]; next: Array<{ id: string; label: string; ask: string }>; tools: AgentToolPointer[]; limits: Bi; /** true when no stored explanation matched, so nothing was answered */ empty: boolean }
export interface SuperAgent { id: SuperAgentId; title: Bi; triggers: RegExp; limits: Bi; run: (question: string, lang: "he" | "en") => AgentResult }

const RISK_IDS = new Set(["risk", "risk-tolerance", "volatility", "drawdown", "beta", "diversification", "hedging", "leverage", "stop-loss", "sharpe-ratio", "sortino-ratio", "correlation", "asset-allocation", "time-horizon", "credit-rating", "liquidity", "duration", "short-selling", "rebalancing", "investment-scam", "suitability"]);
const RISK_DEFAULT = ["risk", "volatility", "diversification"];
const text = (c: ConceptEntry, lang: "he" | "en"): string | null => (c.explain ? conceptAnswerByLabel(c.explain, lang) : null);
const label = (c: ConceptEntry, lang: "he" | "en") => (lang === "he" ? c.he : c.en);
const askFor = (c: ConceptEntry, lang: "he" | "en") => (lang === "he" ? `מה זה ${c.he}?` : `What is ${c.en}?`);
const step = (c: ConceptEntry, lang: "he" | "en"): AgentStep | null => { const t = text(c, lang); return t ? { id: c.id, label: label(c, lang), text: t } : null; };
const nextFrom = (ids: string[], keep: (c: ConceptEntry) => boolean, lang: "he" | "en", limit: number) => {
  const seen = new Set(ids);
  const out: AgentResult["next"] = [];
  for (const id of ids) for (const n of neighbourhood(id, 1, 20)) {
    const c = getConcept(n.node.id);
    if (!c || seen.has(c.id) || !c.explain || !keep(c)) continue;
    seen.add(c.id); out.push({ id: c.id, label: label(c, lang), ask: askFor(c, lang) });
    if (out.length >= limit) return out;
  }
  return out;
};

const RISK_LIMITS: Bi = { en: "I explain risk concepts from stored text. When you name a ticker, I calculate volatility, worst drop and beta from about a year of real daily closes. I do not measure your own portfolio, predict prices, or say what you should buy or sell.", he: "אני מסביר מושגי סיכון מטקסט שמור. כשנוקבים בסימול, אני מחשב תנודתיות, ירידה מקסימלית ובטא מכשנה של מחירי סגירה אמיתיים. אני לא מודד את התיק האישי שלך, לא מנבא מחירים ולא אומר מה כדאי לקנות או למכור." };
const LEARN_LIMITS: Bi = { en: "I pick the next topics from the links between stored concepts. I do not test you, track your progress or grade answers. The Learning Hub does that.", he: "אני בוחר את הנושאים הבאים לפי הקשרים בין מושגים שמורים. אני לא בוחן אותך, לא עוקב אחרי ההתקדמות ולא מדרג תשובות. מרכז הלמידה עושה את זה." };

const riskAgent: SuperAgent = {
  id: "risk", title: { en: "Risk agent", he: "סוכן סיכון" }, triggers: /^\s*(?:risk agent|סוכן סיכון(?:ים)?)\s*[:\-–]?\s*/i, limits: RISK_LIMITS,
  run(question, lang) {
    const named = findConceptsInText(question, 8).filter((c) => RISK_IDS.has(c.id));
    const picked = (named.length ? named : RISK_DEFAULT.map((id) => getConcept(id)).filter((c): c is ConceptEntry => !!c)).slice(0, 4);
    const steps = picked.map((c) => step(c, lang)).filter((s): s is AgentStep => !!s);
    return { agent: "risk", steps, next: nextFrom(picked.map((c) => c.id), (c) => RISK_IDS.has(c.id), lang, 3),
      tools: [{ path: "/simulation", label: { en: "Simulation: try a market drop with example numbers", he: "סימולציה: לנסות ירידת שוק עם מספרי דוגמה" } }, { path: "/calculator", label: { en: "Calculator: run your own numbers", he: "מחשבון: להריץ מספרים משלך" } }],
      limits: RISK_LIMITS, empty: steps.length === 0 };
  },
};
const learningAgent: SuperAgent = {
  id: "learning", title: { en: "Learning agent", he: "סוכן למידה" }, triggers: /^\s*(?:learning agent|סוכן למידה)\s*[:\-–]?\s*/i, limits: LEARN_LIMITS,
  run(question, lang) {
    const named = findConceptsInText(question, 3).filter((c) => c.explain);
    const steps = named.slice(0, 1).map((c) => step(c, lang)).filter((s): s is AgentStep => !!s);
    return { agent: "learning", steps, next: nextFrom(named.map((c) => c.id), () => true, lang, 4),
      tools: [{ path: "/learn", label: { en: "Learning Hub: lessons, practice and progress", he: "מרכז הלמידה: שיעורים, תרגול והתקדמות" } }, { path: "/trivia", label: { en: "Trivia: check what you know", he: "טריוויה: לבדוק מה אתה יודע" } }],
      limits: LEARN_LIMITS, empty: steps.length === 0 };
  },
};
export const SUPER_AGENTS: Record<SuperAgentId, SuperAgent> = { risk: riskAgent, learning: learningAgent };

/** "Risk agent: what is drawdown?" -> the agent and the question after the trigger. */
export function parseAgentRequest(textIn: string): { agent: SuperAgent; question: string } | null {
  for (const a of Object.values(SUPER_AGENTS)) {
    const m = a.triggers.exec(textIn);
    if (m && textIn.slice(m[0].length).trim().length > 0) return { agent: a, question: textIn.slice(m[0].length).trim() };
  }
  return null;
}

/** Fixed layout of the agent's answer as plain text. Stored explanations are copied as written. */
export function formatAgentResult(r: AgentResult, lang: "he" | "en"): string {
  const a = SUPER_AGENTS[r.agent];
  if (r.empty) return `${a.title[lang]}: ${lang === "he" ? "לא מצאתי בנושא הזה הסבר שמור, ולכן אין לי מה לענות. נסו לנקוב במושג, למשל סטיית תקן או פיזור." : "I found no stored explanation on this, so I have nothing to answer. Try naming a concept, for example volatility or diversification."}\n\n${r.limits[lang]}`;
  const parts = r.steps.map((s) => `${s.label}: ${s.text}`);
  if (r.next.length) parts.push(`${lang === "he" ? "הנושא הבא שכדאי ללמוד:" : "What to look at next:"} ${r.next.map((n) => n.label).join(", ")}.`);
  parts.push(r.tools.map((t) => t.label[lang]).join("\n"));
  parts.push(r.limits[lang]);
  return parts.join("\n\n");
}
