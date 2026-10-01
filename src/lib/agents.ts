/**
 * Declarative agent registry. Adding an agent is one entry: id, names, colour,
 * topic keywords (en + he) and starter prompts. Routing reads only this list.
 * Colours are HSL triplets used as accents; the defaults are editable and are
 * labelled as defaults in the product. No agent adds facts: answers still come
 * from the deterministic engines and stored knowledge.
 */
export interface AgentDef {
  id: string;
  name: { en: string; he: string };
  /** HSL triplet "h s% l%" */
  color: string;
  keywords: { en: string[]; he: string[] };
  starters: { en: string; he: string }[];
  /** tool ids this agent may call through the tool registry; omitted means all */
  tools?: string[];
}

export const AGENTS: AgentDef[] = [
  { id: "investing", name: { en: "Investing", he: "השקעות" }, color: "221 83% 53%",
    keywords: { en: ["invest", "stock", "etf", "index fund", "portfolio", "dividend", "bond", "diversif", "s&p", "nasdaq", "risk", "return", "market", "crypto", "compound"], he: ["השקע", "מניה", "מניות", "קרן מחקה", "תיק", "דיבידנד", "אג״ח", "אגח", "פיזור", "מדד", "סיכון", "תשואה", "שוק", "ריבית דריבית", "קריפטו"] },
    starters: [{ en: "How does an index fund work?", he: "איך עובדת קרן מחקה?" }, { en: "What is diversification?", he: "מה זה פיזור סיכונים?" }] },
  { id: "insurance", name: { en: "Insurance", he: "ביטוחים" }, color: "152 60% 38%",
    keywords: { en: ["insurance", "insure", "premium", "deductible", "policy", "coverage", "claim", "life insurance", "health insurance", "car insurance"], he: ["ביטוח", "ביטוחים", "פוליסה", "פרמיה", "השתתפות עצמית", "כיסוי", "תביעה", "ביטוח חיים", "ביטוח בריאות", "ביטוח רכב"] },
    starters: [{ en: "What is a deductible?", he: "מה זו השתתפות עצמית?" }, { en: "Do I need life insurance?", he: "האם אני צריך ביטוח חיים?" }] },
  { id: "credit", name: { en: "Loans and credit", he: "הלוואות ואשראי" }, color: "28 90% 52%",
    keywords: { en: ["loan", "mortgage", "credit", "debt", "interest rate", "apr", "refinance", "repay", "installment", "credit score"], he: ["הלוואה", "משכנתא", "אשראי", "חוב", "ריבית", "מימון מחדש", "החזר", "תשלומים", "דירוג אשראי"] },
    starters: [{ en: "How is a monthly loan payment calculated?", he: "איך מחשבים החזר חודשי להלוואה?" }, { en: "What affects my credit score?", he: "מה משפיע על דירוג האשראי?" }] },
  { id: "savings", name: { en: "Savings and pension", he: "חיסכון ופנסיה" }, color: "272 60% 56%",
    keywords: { en: ["saving", "savings", "pension", "retire", "emergency fund", "budget", "keren hishtalmut", "study fund", "provident"], he: ["חיסכון", "לחסוך", "פנסיה", "פרישה", "קרן חירום", "תקציב", "קרן השתלמות", "קופת גמל"] },
    starters: [{ en: "How big should an emergency fund be?", he: "כמה גדולה צריכה להיות קרן חירום?" }, { en: "How does a pension work?", he: "איך עובדת פנסיה?" }] },
];

export const GENERAL_AGENT_ID = "general";

const norm = (s: string) => s.toLowerCase();
function score(text: string, a: AgentDef): number {
  const t = norm(text);
  return [...a.keywords.en, ...a.keywords.he].reduce((n, k) => (t.includes(norm(k)) ? n + 1 : n), 0);
}

/** Best matching agent id, or null when no agent keyword appears or two agents tie. */
export function classifyAgent(text: string, agents: AgentDef[] = AGENTS): string | null {
  const scored = agents.map((a) => ({ id: a.id, s: score(text, a) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  if (!scored.length) return null;
  if (scored.length > 1 && scored[0].s === scored[1].s) return null;
  return scored[0].id;
}

export interface AgentRoute { agentId: string | null; /** set when the user picked an agent but the question clearly belongs to another one */ suggestSwitchTo?: string }

/** Auto mode (no pick): tag by topic. Picked agent: keep it, and suggest a switch only when another agent clearly owns the question. */
export function routeAgent(text: string, picked: string | null, agents: AgentDef[] = AGENTS): AgentRoute {
  const best = classifyAgent(text, agents);
  if (!picked) return { agentId: best };
  if (best && best !== picked) return { agentId: picked, suggestSwitchTo: best };
  return { agentId: picked };
}

export const getAgent = (id: string | null | undefined, agents: AgentDef[] = AGENTS): AgentDef | null => agents.find((a) => a.id === id) ?? null;

const KEY = (userId: string | null | undefined) => `invested.agent.${userId ?? "anon"}`;
export function readPickedAgent(userId: string | null | undefined, store: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): string | null {
  try { const v = store?.getItem(KEY(userId)) ?? null; return getAgent(v) ? v : null; } catch { return null; }
}
export function savePickedAgent(userId: string | null | undefined, id: string | null, store: Pick<Storage, "setItem" | "removeItem"> | null = typeof localStorage === "undefined" ? null : localStorage): void {
  try { if (id) store?.setItem(KEY(userId), id); else store?.removeItem(KEY(userId)); } catch { /* ignore */ }
}

/** Per-agent tool allow-list. No agent or the general agent may use every tool; an unknown agent id is denied nothing it did not declare. */
export function agentMayUse(agentId: string | null, toolId: string, agents: AgentDef[] = AGENTS): boolean {
  if (!agentId || agentId === GENERAL_AGENT_ID) return true;
  const a = agents.find((x) => x.id === agentId);
  return !a || !a.tools || a.tools.includes(toolId);
}
