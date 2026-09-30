/**
 * Phase 3 (H1): the Copilot's site map. Every route the site offers is a
 * capability the chat can name, explain and open. Deterministic keyword
 * routing only - no model involved, no facts invented.
 */
export interface SiteCapability { id: string; route: string; en: string[]; he: string[]; }

export const SITE_CAPABILITIES: SiteCapability[] = [
  { id: "dashboard", route: "/dashboard", en: ["dashboard", "my results", "analysis results"], he: ["דשבורד", "לוח בקרה", "התוצאות שלי"] },
  { id: "calculator", route: "/calculator", en: ["calculator", "compound", "growth calculator"], he: ["מחשבון", "ריבית דריבית"] },
  { id: "insurance", route: "/insurance-reports", en: ["insurance report", "insurance reports", "insurance"], he: ["דוחות ביטוח", "ביטוח"] },
  { id: "loans", route: "/loans", en: ["loan", "loans", "mortgage"], he: ["הלוואה", "הלוואות", "משכנתא"] },
  { id: "research", route: "/research", en: ["asset research", "research desk", "research page"], he: ["מחקר נכסים", "דסק מחקר", "עמוד המחקר"] },
  { id: "trivia", route: "/trivia", en: ["trivia", "quiz"], he: ["טריוויה", "חידון"] },
  { id: "news", route: "/news", en: ["news", "headlines"], he: ["חדשות", "כותרות"] },
  { id: "simulation", route: "/simulation", en: ["simulation", "simulator", "paper trading"], he: ["סימולציה", "סימולטור", "מסחר וירטואלי"] },
  { id: "learn", route: "/learn", en: ["lessons", "curriculum", "learn page", "courses"], he: ["שיעורים", "לימוד", "קורסים", "תוכנית לימודים"] },
  { id: "career", route: "/career-lab", en: ["career lab", "career games"], he: ["מעבדת קריירה", "מעבדת הקריירה"] },
  { id: "portfolio-game", route: "/career-lab/portfolio-game", en: ["portfolio game", "portfolio manager game"], he: ["משחק תיק", "משחק תיק השקעות"] },
  { id: "analyst-game", route: "/career-lab/analyst-game", en: ["analyst game", "analyst simulation"], he: ["משחק אנליסט", "אנליסט השקעות"] },
  { id: "operations-game", route: "/career-lab/operations-game", en: ["operations game", "operations simulation"], he: ["משחק תפעול", "סימולציית תפעול"] },
  { id: "accountant-game", route: "/career-lab/accountant-game", en: ["accountant game", "accounting simulation"], he: ["משחק רואה חשבון", "סימולציית חשבונאות"] },
  { id: "strategy", route: "/strategy-lab", en: ["strategy lab", "strategies lab"], he: ["מעבדת אסטרטגיות", "מעבדת האסטרטגיה"] },
  { id: "data", route: "/data-controls", en: ["data controls", "my data", "delete my data", "privacy controls"], he: ["בקרת נתונים", "הנתונים שלי", "מחיקת נתונים"] },
];

const OPEN_EN = /\b(open|show me|take me|go to|where (?:is|can i find)|launch|navigate|bring up)\b/i;
const OPEN_HE = /(פתח|תפתח|תפתחי|הראה|תראה|תראי|קח אותי|קחי אותי|לך ל|איפה|היכן|הפעל)/;
const OVERVIEW_EN = /\bwhat can you (?:do|help)|what do you do|what(?:'s| is) on (?:the )?site|site map|list (?:all )?(?:the )?(?:tools|features|pages)|what features\b/i;
const OVERVIEW_HE = /מה (?:אתה|את|אפשר|אתם) (?:יכול|יכולה|יכולים|לעשות)|מה יש באתר|אילו כלים|אילו דפים|רשימת (?:הכלים|הדפים)/;

export type SiteIntent = { kind: "overview" } | { kind: "open"; matches: SiteCapability[] } | null;

export function resolveSiteIntent(text: string): SiteIntent {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (OVERVIEW_EN.test(t) || OVERVIEW_HE.test(t)) return { kind: "overview" };
  if (!OPEN_EN.test(t) && !OPEN_HE.test(t)) return null;
  const hits = SITE_CAPABILITIES.map((cap) => {
    const best = [...cap.en, ...cap.he].reduce((len, kw) => (t.includes(kw.toLowerCase()) ? Math.max(len, kw.length) : len), 0);
    return { cap, best };
  }).filter((h) => h.best > 0).sort((a, b) => b.best - a.best);
  if (!hits.length) return null;
  const top = hits[0].best;
  // Only the most specific keyword family wins ("career lab" beats "lab"-like generic hits).
  return { kind: "open", matches: hits.filter((h) => h.best === top).map((h) => h.cap).slice(0, 3) };
}
