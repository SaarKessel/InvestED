import type { RssNewsItem, RssNewsResult } from "./rssClient";

/** Questions about official announcements or the latest headlines (not about one named company). */
const EN = /\b(official (news|announcements?|statements?)|central bank (news|announcements?)|latest (market |financial |official )?(news|headlines|announcements?)|(fed|federal reserve|ecb|sec|bank of england) (news|announcements?|statements?|press)|what('?s| is) new (at|from|with) the (fed|ecb|sec))\b/i;
const HE = /(הודעות\s+ה?רשמיות|הודעה\s+ה?רשמית|חדשות\s+ה?רשמיות|חדשות הבנק המרכזי|חדשות מהפד|הודעות הפד|הודעות הבנק המרכזי|כותרות אחרונות|חדשות אחרונות|מה חדש בפד)/;

const PUB = "(?:the\\s+)?(?:fed|federal reserve|ecb|european central bank|sec|bank of england|central bank)";
const EN_MORE = new RegExp(
  `\\b(?:(?:news|announcements?|statements?|press releases?|headlines)\\s+(?:from|by|of)\\s+${PUB}|what\\s+did\\s+${PUB}\\s+(?:announce|say|publish|release)|central bank\\s+(?:statements?|headlines|press releases?)|official\\s+(?:headlines|updates))\\b`,
  "i",
);
const HE_PUB = "(?:ה?פד|ה?-?(?:ecb|sec)|ה?בנק האירופי|ה?רשות לניירות ערך)";
const HE_MORE = new RegExp(
  `(?:(?:חדשות|הודעות|הודעה|ההודעות(?:\\s+האחרונות)?|הודעה אחרונה|הודעות לעיתונות)\\s+(?:של\\s+|מ)?${HE_PUB}|מה\\s+${HE_PUB}\\s+(?:אמר|הודיע|פרסם))`,
  "i",
);

export function isOfficialNewsQuestion(text: string): boolean {
  return EN.test(text) || HE.test(text) || EN_MORE.test(text) || HE_MORE.test(text);
}

const day = (iso: string) => (/^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : iso);

export function formatRssNews(r: RssNewsResult | null, lang: "he" | "en", n = 5): string {
  if (!r || !r.available || r.items.length === 0) {
    return lang === "he"
      ? "לא הצלחתי לטעון עכשיו הודעות רשמיות מהמקורות הציבוריים. לא אמציא כותרות - נסו שוב בעוד רגע."
      : "I could not load official announcements from the public sources right now. I will not make up headlines - try again in a moment.";
  }
  const top: RssNewsItem[] = r.items.slice(0, n);
  const lead = lang === "he"
    ? `הנה ${top.length} ההודעות הרשמיות האחרונות מהמקורות הציבוריים (כותרות וקישורים בלבד):`
    : `Here are the ${top.length} latest official announcements from the public sources (headlines and links only):`;
  return [lead, ...top.map((i) => `• ${i.title} - ${i.source}, ${day(i.publishedAt)}\n  ${i.url}`)].join("\n");
}
