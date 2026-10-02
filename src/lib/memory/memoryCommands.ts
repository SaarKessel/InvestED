/** Chat commands for consented memory. Deterministic: the user's own words are stored as a note, nothing is inferred or invented. */
export type MemoryCommand = { kind: "remember"; value: string } | { kind: "list" } | { kind: "forget" };

const REMEMBER = /^\s*(?:please\s+)?(?:remember|note)(?:\s+that)?\s*[:,-]?\s+(.{3,})$/i;
const REMEMBER_HE = /^\s*(?:בבקשה\s+)?(?:זכור|תזכור|תזכרי|שמור)(?:\s+ש)?\s*[:,-]?\s*(.{3,})$/;
const LIST = /^\s*(?:what do you (?:remember|know about me)|show (?:my )?(?:memory|notes)|list (?:my )?(?:memory|notes))\s*\??\s*$/i;
const LIST_HE = /^\s*(?:מה (?:אתה|את) זוכר(?:ת)?(?: עליי)?|הצג (?:את )?(?:הזיכרון|ההערות) שלי)\s*\??\s*$/;
const FORGET = /^\s*(?:forget (?:everything|all)|delete (?:my )?memory)\s*\.?\s*$/i;
const FORGET_HE = /^\s*(?:תשכח(?:י)? (?:הכול|הכל)|מחק(?:י)? (?:את )?(?:הזיכרון|כל הזיכרון)(?: שלי)?)\s*\.?\s*$/;

export function parseMemoryCommand(text: string): MemoryCommand | null {
  if (LIST.test(text) || LIST_HE.test(text)) return { kind: "list" };
  if (FORGET.test(text) || FORGET_HE.test(text)) return { kind: "forget" };
  const m = text.match(REMEMBER) ?? text.match(REMEMBER_HE);
  if (m) return { kind: "remember", value: m[1].trim().slice(0, 300) };
  return null;
}
