// ---------------------------------------------------------------------------
// InvestED - news-literacy evidence worksheet
//
// A deterministic checklist that helps a learner read ONE headline: which parts
// are checkable statements, which are opinions or forecasts, which are things
// somebody says, which primary source would settle each claim, and what stays
// unverified. It is media literacy, not a verdict: it never says a headline is
// true, false, real or fake, and it never scores one.
//
// Concept credit: the Fake-News-Detector project (MIT) inspired the idea of
// teaching evidence-reading. No classifier, model, labels or code were imported;
// this is an original rule-based checklist plus curated synthetic examples.
// ---------------------------------------------------------------------------
import { bi, type Bi, type Lang } from "./bilingual";

export type StatementKind = "fact" | "opinion" | "attributed" | "unclear";

export interface SourceHint { id: string; text: Bi }
export interface Statement {
  text: string;
  kind: StatementKind;
  hasNumber: boolean;
  source: SourceHint;
  unverified: Bi[];
}
export interface Worksheet {
  headline: string;
  statements: Statement[];
  loudSignals: string[];
  /** Always true: a worksheet reads only the headline text, never the article. */
  headlineOnly: true;
}

export const MAX_HEADLINE_CHARS = 300;

const SPLIT = /\s*[:;|]\s+|\s+[-–—]\s+|,\s+(?=(?:but|while|as|after|with|and|although|says?|said)\s)|\s+(?:but|while|although|as)\s+|\s+אבל\s+|\s+בעוד\s+/i;

const OPINION_EN = /\b(could|may|might|should|must|likely|expected to|set to|poised|bullish|bearish|best|worst|great|terrible|amazing|disaster|smart|risky|overvalued|undervalued|cheap|expensive|top pick|will (?:double|soar|crash|rise|fall|surge|plunge)|is (?:a )?(?:buy|sell))\b/i;
const OPINION_HE = /(עשוי|עשויה|צפוי|צפויה|כנראה|אולי|ייתכן|הכי טוב|הכי גרוע|מדהים|אסון|הזדמנות|מומלץ|כדאי|יזנק|ינחת|יקרוס|תזנק|תקרוס)/;
const ATTRIB_EN = /\b(says?|said|according to|reportedly|reports?|told|claims?|alleged(?:ly)?|sources?|insiders?|rumou?rs?|analysts?)\b/i;
const ATTRIB_HE = /(אומר|אומרת|אמר|אמרה|לדברי|לפי|דיווח|דווח|טוען|טוענת|מקורות|גורמים|שמועה|אנליסטים)/;
const FACT_EN = /\b(rose|rises?|fell|falls?|beat|beats|missed|misses|raised|raises|cut|cuts|filed|files|announced?|announces|acquires?|acquired|sues?|sued|posts?|posted|holds?|held|launch(?:es|ed)?|hires?|fired|approves?|approved|reports?|reported|jumps?|jumped|drops?|dropped|gains?|gained|loses|lost|pays?|paid|plunges?|plunged|soars?|soared)\b/i;
const FACT_HE = /(עלה|עלתה|ירד|ירדה|הכריז|הכריזה|הודיע|הודיעה|רכשה|רכש|תבע|תבעה|פרסמה|פרסם|הותיר|השאיר|אישר|אישרה|זינק|זינקה|קרס|קרסה|הגישה|הגיש)/;

const LOUD_WORDS_EN = ["shock", "shocking", "bombshell", "stunning", "explosive", "massive", "huge", "plunge", "plunges", "crash", "crashes", "collapse", "skyrocket", "skyrockets", "soar", "soars", "slam", "slams", "panic", "secret", "urgent", "warning", "devastating", "unbelievable", "must see", "you won't believe", "breaking"];
const LOUD_WORDS_HE = ["הלם", "מטלטל", "פצצה", "דרמטי", "קורס", "קריסה", "מזנק", "מתרסק", "בהלה", "סודי", "דחוף", "אזהרה", "מטורף", "לא תאמינו", "חשיפה"];

interface TopicRule { id: string; en: RegExp; he: RegExp; text: Bi }
const TOPICS: TopicRule[] = [
  { id: "earnings", en: /\b(earnings|revenue|profit|loss(?:es)?|guidance|quarter(?:ly)?|eps|sales|margin)\b/i, he: /(רווח|הכנסות|הפסד|הפסדים|רבעון|דוח כספי|תחזית חברה)/,
    text: bi("The company's own quarterly or annual report (10-Q, 10-K) or earnings release, on its investor page or on SEC EDGAR.", "הדוח הרבעוני או השנתי של החברה (10-Q, 10-K) או הודעת התוצאות שלה, באתר משקיעים או ב-SEC EDGAR.") },
  { id: "macro", en: /\b(rate|rates|fed|inflation|cpi|gdp|jobs|unemployment|central bank|ecb|boe|treasury)\b/i, he: /(ריבית|בנק ישראל|אינפלציה|מדד המחירים|תמ"ג|אבטלה|הפד|בנק מרכזי)/,
    text: bi("The central bank's own statement or the statistics office release (for example the Federal Reserve, BLS, Bank of Israel, CBS).", "ההודעה של הבנק המרכזי או פרסום לשכת הסטטיסטיקה (למשל הפד, BLS, בנק ישראל, הלמ\"ס).") },
  { id: "deal", en: /\b(merger|acquires?|acquired|acquisition|buyout|takeover|deal|stake)\b/i, he: /(מיזוג|רכישה|רוכשת|רכשה|השתלטות|עסקה|אחזקה)/,
    text: bi("The company's 8-K or press release about the deal, and the regulator filing for large deals.", "דיווח 8-K או הודעה לעיתונות של החברה על העסקה, ובעסקאות גדולות גם הדיווח לרגולטור.") },
  { id: "legal", en: /\b(sues?|sued|lawsuit|court|probe|investigation|fine[sd]?|sec|charges?|settle(?:s|ment)?)\b/i, he: /(תביעה|תבע|תבעה|בית משפט|חקירה|קנס|הרשות לניירות ערך|כתב אישום|פשרה)/,
    text: bi("The court docket or the regulator's own press release.", "תיק בית המשפט או ההודעה של הרגולטור עצמו.") },
  { id: "ipo", en: /\b(ipo|listing|lists|going public|prospectus)\b/i, he: /(הנפקה|רישום למסחר|תשקיף)/,
    text: bi("The prospectus (S-1 or local equivalent) or the exchange's listing notice.", "התשקיף (S-1 או מקבילו המקומי) או הודעת הבורסה על הרישום.") },
  { id: "payout", en: /\b(dividend|buyback|repurchase|split)\b/i, he: /(דיבידנד|רכישה חוזרת|פיצול מניות)/,
    text: bi("The board announcement, usually an 8-K or an exchange filing.", "הודעת הדירקטוריון, בדרך כלל דיווח 8-K או דיווח לבורסה.") },
  { id: "price", en: /\b(stock|shares?|price|index|s&p|nasdaq|dow|rose|fell|jumps?|drops?|gains?|plunges?|soars?)\b|%/i, he: /(מניה|מניית|מדד|נפל|עלה|ירד|זינק|קרס|%)/,
    text: bi("Price history from the exchange or a data provider, for that exact date and time.", "היסטוריית מחירים מהבורסה או מספק נתונים, לתאריך ולשעה המדויקים.") },
];
const DEFAULT_SOURCE: SourceHint = { id: "original", text: bi("The original statement, document or data release the claim comes from.", "ההצהרה, המסמך או פרסום הנתונים המקוריים שממנם נלקח הטענה.") };

const hasHebrew = (s: string) => /[\u0590-\u05FF]/.test(s);
const NUMBER = /\d/;

export function classifyKind(text: string): StatementKind {
  if (OPINION_EN.test(text) || OPINION_HE.test(text)) return "opinion";
  if (ATTRIB_EN.test(text) || ATTRIB_HE.test(text)) return "attributed";
  if (NUMBER.test(text) || FACT_EN.test(text) || FACT_HE.test(text)) return "fact";
  return "unclear";
}

export function sourceFor(text: string): SourceHint {
  for (const t of TOPICS) if (t.en.test(text) || t.he.test(text)) return { id: t.id, text: t.text };
  return DEFAULT_SOURCE;
}

function unverifiedFor(kind: StatementKind, hasNumber: boolean): Bi[] {
  const out: Bi[] = [];
  if (kind === "fact") out.push(bi("That it happened exactly as worded.", "שזה קרה בדיוק כפי שנוסח."));
  if (kind === "attributed") out.push(bi("What was actually said, in the speaker's own words.", "מה נאמר בפועל, במילים של הדובר עצמו."), bi("Who the source is, and whether they can know.", "מי המקור, והאם הוא יכול לדעת."));
  if (kind === "opinion") out.push(bi("A view or forecast is not something a document can confirm. Look for the evidence behind it.", "דעה או תחזית אי אפשר לאשר במסמך. חפשו את הראיות שמאחוריה."));
  if (kind === "unclear") out.push(bi("There is no claim here you can check yet.", "אין כאן טענה שאפשר לבדוק עדיין."));
  if (hasNumber) out.push(bi("What the number compares to (which period, which base).", "למה המספר מושווה (איזו תקופה, איזה בסיס)."));
  return out;
}

export function findLoudSignals(headline: string): string[] {
  const found: string[] = [];
  const lower = headline.toLowerCase();
  for (const w of LOUD_WORDS_EN) if (new RegExp(`(?:^|[^a-z])${w.replace(/'/g, "'")}(?:$|[^a-z])`, "i").test(lower)) found.push(w);
  for (const w of LOUD_WORDS_HE) if (headline.includes(w)) found.push(w);
  if (/!/.test(headline)) found.push("!");
  if (/\b[A-Z]{5,}\b/.test(headline)) found.push("ALL CAPS");
  return [...new Set(found)];
}

export function splitStatements(headline: string): string[] {
  return headline.split(SPLIT).map((s) => s.trim().replace(/^["'“”]+|["'“”]+$/g, "")).filter((s) => s.length >= 3);
}

/** Reads the headline text only. Returns null for empty input. */
export function buildWorksheet(raw: string): Worksheet | null {
  const headline = raw.replace(/\s+/g, " ").trim().slice(0, MAX_HEADLINE_CHARS);
  if (headline.length < 3) return null;
  const parts = splitStatements(headline);
  const statements = (parts.length ? parts : [headline]).map((text): Statement => {
    const kind = classifyKind(text);
    const hasNumber = NUMBER.test(text);
    return { text, kind, hasNumber, source: sourceFor(text), unverified: unverifiedFor(kind, hasNumber) };
  });
  return { headline, statements, loudSignals: findLoudSignals(headline), headlineOnly: true };
}

export const KIND_LABEL: Record<StatementKind, Bi> = {
  fact: bi("Checkable statement", "טענה שאפשר לבדוק"),
  opinion: bi("Opinion or forecast", "דעה או תחזית"),
  attributed: bi("Somebody says it", "מישהו אומר את זה"),
  unclear: bi("Nothing to check yet", "אין עדיין מה לבדוק"),
};

export const LOUD_NOTE: Bi = bi(
  "Loud wording is a reason to slow down, not proof that a story is false. True stories can be dramatic and false ones can sound calm. Check the source, not the volume.",
  "ניסוח צעקני הוא סיבה להאט, לא הוכחה שהסיפור שקרי. סיפורים אמיתיים יכולים להיות דרמטיים וסיפורים שקריים יכולים להישמע רגועים. בדקו את המקור, לא את עוצמת הקול."
);
export const QUIET_NOTE: Bi = bi(
  "No loud wording found. Calm wording does not make a headline true either.",
  "לא נמצא ניסוח צעקני. גם ניסוח רגוע לא הופך כותרת לנכונה."
);
export const HEADLINE_ONLY_NOTE: Bi = bi(
  "This worksheet reads the headline text only. It did not read the article and it gives no verdict. It is a way to practise reading evidence.",
  "הדף הזה קורא את טקסט הכותרת בלבד. הוא לא קרא את הכתבה ולא נותן פסק דין. זו דרך לתרגל קריאה של ראיות."
);
export const EDU_NOTE: Bi = bi("Educational media-literacy tool. Not a fact-check and not investment advice.", "כלי חינוכי לאוריינות מדיה. זו לא בדיקת עובדות ולא ייעוץ השקעות.");

export interface Example { id: string; headline: Bi }
/** Synthetic headlines with invented company names, labeled as such in the UI. */
export const EXAMPLES: Example[] = [
  { id: "loud", headline: bi("SHOCK: Acme Corp stock plunges 40% as CEO says losses are 'temporary'", "הלם: מניית אקמי קורסת ב-40% והמנכ\"ל אומר שההפסדים זמניים") },
  { id: "forecast", headline: bi("Analysts say Globex shares could double after record quarter", "אנליסטים אומרים שמניית גלובקס עשויה להכפיל את עצמה אחרי רבעון שיא") },
  { id: "calm", headline: bi("Central bank holds rate at 4.5%, says inflation is easing", "הבנק המרכזי השאיר את הריבית על 4.5% ואומר שהאינפלציה מתמתנת") },
];
export const pickLang = (hl: string): Lang => (hasHebrew(hl) ? "he" : "en");
