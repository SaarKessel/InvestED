// ---------------------------------------------------------------------------
// InvestED — server bot voice (single bot, Saar 2026-10-21: "רק בוט אחד").
//
// The multi-bot picker/levels idea was dropped by the owner. One bot voice
// for the rephrase model. resolveBot keeps accepting an id so older clients
// sending botId keep working; every id resolves to the single bot.
// ---------------------------------------------------------------------------

export interface BotDef {
  id: string;
  name: { en: string; he: string };
  /** One persona line appended to the system prompt, per reply language. */
  persona: { en: string; he: string };
  /** Server tool ids this bot may call; omitted means all tools. */
  tools?: string[];
}

export const DEFAULT_BOT_ID = "general";

export const BOTS: readonly BotDef[] = [
  { id: "general", name: { en: "InvestED", he: "InvestED" },
    persona: { en: "Voice: warm, plain-spoken financial educator.", he: "טון: מורה חמים לפיננסים, בשפה פשוטה." } },
];

/** Every id resolves to the single bot, never to silence. */
export function resolveBot(_id: unknown): BotDef {
  return BOTS[0];
}

/** Persona line for the model, in the reply language. */
export function botPersonaLine(bot: BotDef, language: "he" | "en"): string {
  return bot.persona[language];
}
