import enLocale from "@/locales/en.json";
import heLocale from "@/locales/he.json";

// Every tool in the "+" menu is also a keyword: typing it opens that tool
// inside the chat. Only a bare keyword (optionally with "open"/"פתח") counts,
// so real questions such as "what is the news about NVDA" still go to the answer engine.
const KEYWORDS: Record<string, { en: string[]; he: string[] }> = {
  "/start": { en: ["start", "start learning", "profile", "get started"], he: ["התחלה", "התחל", "התחלת לימוד", "פרופיל"] },
  "/learn": { en: ["learn", "learning", "lessons", "courses"], he: ["למידה", "לימוד", "שיעורים", "קורסים"] },
  "/career-lab": { en: ["career", "careers", "career lab"], he: ["קריירה", "מעבדת קריירה", "מעבדת הקריירה"] },
  "/strategy-lab": { en: ["strategy", "strategies", "strategy lab"], he: ["אסטרטגיה", "אסטרטגיות", "מעבדת אסטרטגיות"] },
  "/simulation": { en: ["simulation", "simulator", "paper trading"], he: ["סימולציה", "סימולטור"] },
  "/trivia": { en: ["trivia", "quiz"], he: ["טריוויה", "חידון"] },
  "/calculator": { en: ["calculator", "smart calculator"], he: ["מחשבון", "מחשבון חכם"] },
  "/loans": { en: ["loan", "loans", "loan learning", "mortgage"], he: ["הלוואה", "הלוואות", "משכנתא", "למידת הלוואות"] },
  "/insurance-reports": { en: ["insurance", "insurance reports"], he: ["ביטוח", "דוחות ביטוח"] },
  "/markets": { en: ["markets", "watchlist", "market overview"], he: ["שווקים", "רשימת מעקב", "מעקב מניות"] },
  "/research": { en: ["research", "asset research"], he: ["מחקר", "מחקר נכסים"] },
  "/news": { en: ["news", "headlines"], he: ["חדשות", "כותרות"] },
  "/link-lab": { en: ["link lab", "link sandbox", "suspicious link", "suspicious links", "phishing"], he: ["מעבדת קישורים", "קישור חשוד", "קישורים חשודים", "פישינג"] },
  "/dashboard": { en: ["dashboard", "my results"], he: ["דשבורד", "לוח בקרה", "התוצאות שלי"] },
  "/overview": { en: ["overview"], he: ["סקירה"] },
  "/data-controls": { en: ["my data", "data controls", "data"], he: ["הנתונים שלי", "בקרת נתונים"] },
  "/intelligence": { en: ["intelligence center", "intelligence dashboard", "super intelligence"], he: ["מרכז הבינה", "מרכז בינה"] },
  "/knowledge-map": { en: ["knowledge map", "concept map"], he: ["מפת ידע", "מפת מושגים"] },
  "/money-lessons": { en: ["money lessons", "rent vs buy", "money-weighted return", "brier score"], he: ["שיעורי כסף", "שכירות או קנייה", "תשואה משוקללת כסף", "ציון בריר"] },
  "/system-health": { en: ["system health", "observability"], he: ["בריאות המערכת", "ניטור המערכת"] },
  "/knowledge": { en: ["knowledge", "knowledge desk"], he: ["ידע", "מאגר ידע"] },
  "/about": { en: ["about"], he: ["אודות", "עלינו"] },
  "/faq": { en: ["faq", "questions"], he: ["שאלות נפוצות"] },
  "/contact": { en: ["contact"], he: ["צור קשר", "יצירת קשר"] },
  "/privacy": { en: ["privacy"], he: ["פרטיות"] },
  "/terms": { en: ["terms"], he: ["תנאים", "תנאי שימוש"] },
};

const OPEN_WORDS = /^(?:please\s+)?(?:open(?:\s+up)?|show(?:\s+me)?|go to|take me to|launch|bring up|תפתחי|תפתחו|תפתח|פתחי|פתחו|פתח|הראה|הראי|תראה|תראי|הצג|הציגי|עבור ל|(?:עבור|לך|כנס|גש)\s+(?:אל(?=\s)|ל))(?:\s+לי)?(?:\s+|(?<=ל))/i;
const TRAILING = /(?:\s+(?:please|בבקשה))+$/i;

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[!?.,"'״׳]+/g, "").replace(/\s+/g, " ").replace(OPEN_WORDS, "").replace(/^(?:the|ה)\s+/, "").replace(TRAILING, "").trim();
}

/** The tool path a bare keyword points to, or null when the text is a normal question. */
export function resolveToolKeyword(text: string): string | null {
  const t = normalize(text);
  // This named lab intent is often phrased as a full scenario with numbers;
  // route it before generic intent parsing can mistake "מול" / "vs" for asset comparison.
  const rentVsBuy = /\b(?:rent(?:ing)?\b.{0,60}\b(?:vs\.?|versus|or)\b.{0,60}\bbuy(?:ing)?\b|buy(?:ing)?\b.{0,60}\b(?:vs\.?|versus|or)\b.{0,60}\brent(?:ing)?\b)/i.test(text)
    || /שכירות.{0,40}(?:מול|או|לעומת).{0,40}קנ(?:ייה|יה)|לשכור.{0,24}(?:או|מול|לעומת).{0,24}לקנות/i.test(text);
  if (rentVsBuy) return "/money-lessons";
  if (!t) return null;
  const find = (w: string) => Object.entries(KEYWORDS).find(([, k]) => [...k.en, ...k.he].some((word) => word.toLowerCase() === w))?.[0] ?? null;
  const direct = find(t);
  if (direct) return direct;
  // Hebrew "the" is glued to the word (המחשבון), but some keywords start with ה themselves, so try the whole word first.
  return t.length > 3 && /^ה[א-ת]/.test(t) ? find(t.slice(1)) : null;
}

export const TOOL_KEYWORD_PATHS = Object.keys(KEYWORDS);

/** "Opening X right here" in the language of the question, not of the UI. */
export function openingLine(question: string, labelKey: string | undefined): string {
  const he = /[א-ת]/.test(question);
  const dict = (he ? heLocale : enLocale) as Record<string, string>;
  const label = labelKey ? dict[labelKey] ?? "" : "";
  return (dict.tool_opening ?? "").replace("{tool}", label);
}
