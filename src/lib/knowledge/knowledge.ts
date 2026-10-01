/**
 * Learning loop (pure part): tokenizing questions and deciding which stored
 * knowledge items really match. Retrieval is Postgres full-text OR-search;
 * this module then keeps only items sharing enough meaningful words with the
 * question, so a single common word never pulls in an unrelated note.
 */
export interface KnowledgeItem {
  id: string;
  title: string;
  body: string;
  lang: "he" | "en";
  source_label: string;
  source_url: string | null;
  published_at: string | null;
}

const STOP = new Set([
  "the", "and", "for", "are", "what", "how", "why", "when", "who", "does", "can", "you", "your", "with", "this", "that", "about", "from", "into", "have", "has", "was", "were", "will", "would", "should", "could", "tell", "explain", "please", "give", "show", "me", "is", "it", "of", "to", "in", "on", "a", "an", "do", "i", "my",
  "מה", "מי", "איך", "למה", "מתי", "האם", "זה", "זו", "את", "של", "על", "עם", "או", "גם", "אני", "אתה", "לי", "יש", "הוא", "היא", "כל", "לא", "כן", "אפשר", "תסביר", "תגיד", "ספר", "בבקשה",
]);

export function tokenizeQuestion(text: string): string[] {
  const words = text.toLowerCase().normalize("NFKC").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2 && !STOP.has(w));
  return [...new Set(words)].slice(0, 12);
}

export function relevantHits<T extends Pick<KnowledgeItem, "title" | "body">>(question: string, items: T[], max = 3): T[] {
  const tokens = tokenizeQuestion(question);
  if (!tokens.length) return [];
  const need = tokens.length >= 3 ? 2 : 1;
  return items
    .map((item) => {
      const hay = `${item.title} ${item.body}`.toLowerCase();
      return { item, score: tokens.filter((t) => hay.includes(t)).length };
    })
    .filter((x) => x.score >= need)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.item);
}

/** Questions the deterministic engines own are not knowledge lookups. */
export function wantsKnowledgeLookup(intent: string): boolean {
  return intent === "general" || intent === "educational_question" || intent === "strategy_question";
}

export const FIXED_CHECK_QUESTIONS: string[] = [
  "What is the Bank of Israel interest rate?",
  "How do pension fund yields work?",
  "What is a management fee?",
  "מה זה דמי ניהול בקרן פנסיה?",
  "מה ריבית בנק ישראל?",
];

/** A stored note older than this is shown with a "may be outdated" warning instead of silently. */
export const STALE_AFTER_DAYS = 90;

export function isStaleNote(publishedAt: string | null, now: Date = new Date()): boolean {
  if (!publishedAt || !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) return false;
  const published = Date.parse(`${publishedAt}T00:00:00Z`);
  if (!Number.isFinite(published)) return false;
  return (now.getTime() - published) / 86_400_000 > STALE_AFTER_DAYS;
}
