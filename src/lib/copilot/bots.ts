// ---------------------------------------------------------------------------
// InvestED — server-side bot registry (multi-bot architecture, phase 1)
//
// Mirrors the client AGENTS registry (src/lib/agents.ts): every bot the
// router can pick has a matching server entry with a persona line for the
// rephrase model and a tool allowlist. Adding a bot is one entry here plus
// one entry in agents.ts. `minLevel` is RESERVED for the levels idea Saar
// is still describing - stored, never enforced, until he finishes.
// No bot adds facts: the no-new-facts verification runs unchanged.
// ---------------------------------------------------------------------------

export type BotLevel = "beginner" | "intermediate" | "advanced";

export interface BotDef {
  id: string;
  name: { en: string; he: string };
  /** One persona line appended to the system prompt, per reply language. */
  persona: { en: string; he: string };
  /** Server tool ids this bot may call; omitted means all tools. */
  tools?: string[];
  /** RESERVED (not enforced): minimum level gate for the future picker. */
  minLevel?: BotLevel;
}

export const DEFAULT_BOT_ID = "general";

export const BOTS: readonly BotDef[] = [
  { id: "general", name: { en: "InvestED", he: "InvestED" },
    persona: { en: "Voice: warm, plain-spoken financial educator.", he: "טון: מורה חמים לפיננסים, בשפה פשוטה." } },
  { id: "investing", name: { en: "Investing", he: "השקעות" },
    persona: { en: "Voice: a calm investing coach; keep market framing exact.", he: "טון: מאמן השקעות רגוע; ניסוח שוק מדויק." } },
  { id: "insurance", name: { en: "Insurance", he: "ביטוחים" },
    persona: { en: "Voice: an insurance explainer; precise about coverage terms.", he: "טון: מסביר ביטוחים; דיוק במונחי כיסוי." } },
  { id: "credit", name: { en: "Loans and credit", he: "הלוואות ואשראי" },
    persona: { en: "Voice: a loans and credit coach; careful with rates and payments.", he: "טון: מאמן הלוואות ואשראי; זהירות בריביות והחזרים." } },
  { id: "savings", name: { en: "Savings and pension", he: "חיסכון ופנסיה" },
    persona: { en: "Voice: a savings and pension guide; long-term framing.", he: "טון: מדריך חיסכון ופנסיה; מסגרת ארוכת טווח." } },
];

/** Unknown or missing ids resolve to the default bot, never to silence. */
export function resolveBot(id: unknown): BotDef {
  const wanted = typeof id === "string" ? id : "";
  return BOTS.find((b) => b.id === wanted) ?? BOTS.find((b) => b.id === DEFAULT_BOT_ID)!;
}

/** Persona line for the model, in the reply language. */
export function botPersonaLine(bot: BotDef, language: "he" | "en"): string {
  return bot.persona[language];
}
