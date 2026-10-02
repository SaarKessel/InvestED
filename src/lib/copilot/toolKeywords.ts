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
  "/system-health": { en: ["system health", "observability"], he: ["בריאות המערכת", "ניטור המערכת"] },
  "/knowledge": { en: ["knowledge", "knowledge desk"], he: ["ידע", "מאגר ידע"] },
  "/about": { en: ["about"], he: ["אודות", "עלינו"] },
  "/faq": { en: ["faq", "questions"], he: ["שאלות נפוצות"] },
  "/contact": { en: ["contact"], he: ["צור קשר", "יצירת קשר"] },
  "/privacy": { en: ["privacy"], he: ["פרטיות"] },
  "/terms": { en: ["terms"], he: ["תנאים", "תנאי שימוש"] },
};

const OPEN_WORDS = /^(?:open|show|show me|go to|take me to|launch|פתח|תפתח|תפתחי|הראה|תראה|תראי|הצג|עבור ל|לך ל)\s+/i;

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[!?.,"'״׳]+/g, "").replace(/\s+/g, " ").replace(OPEN_WORDS, "").replace(/^(?:the|ה)\s+/, "").trim();
}

/** The tool path a bare keyword points to, or null when the text is a normal question. */
export function resolveToolKeyword(text: string): string | null {
  const t = normalize(text);
  if (!t) return null;
  for (const [path, k] of Object.entries(KEYWORDS)) {
    if ([...k.en, ...k.he].some((word) => word.toLowerCase() === t)) return path;
  }
  return null;
}

export const TOOL_KEYWORD_PATHS = Object.keys(KEYWORDS);

/** "Opening X right here" in the language of the question, not of the UI. */
export function openingLine(question: string, labelKey: string | undefined): string {
  const he = /[א-ת]/.test(question);
  const dict = (he ? heLocale : enLocale) as Record<string, string>;
  const label = labelKey ? dict[labelKey] ?? "" : "";
  return (dict.tool_opening ?? "").replace("{tool}", label);
}
