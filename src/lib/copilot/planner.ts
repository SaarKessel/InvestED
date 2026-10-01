/** Planner: picks the route for a question with the same fixed rules the chat uses, and writes the plain "What I did" trace. No model involved. */
import { isCareerLaunchRequest } from "@/lib/career/chatRoute";
import { resolveToolKeyword } from "./toolKeywords";
import { looksLikeLearningPathRequest } from "./learnDesk";
import { resolveSiteIntent } from "./siteCapabilities";
import { parseWbRequest, type WbRequest } from "./worldBankDesk";
import { parseFxRequest, type FxRequest } from "./fxDesk";
import { runMathDesk, type MathDeskResult } from "./mathDesk";
import { runCalcDesk, type CalcDeskResult } from "./calcDesk";
import { resolveDataDesk, type DataDeskKind } from "./dataDesk";
import { TRUST_LABEL } from "@/lib/intelligence/provenance";
import type { TrustClass } from "@/lib/intelligence/verificationEngine";

export type Route = "tool" | "career" | "learnpath" | "site" | "calc" | "math" | "fx" | "wb" | "desk" | "copilot";
export interface Bi { en: string; he: string }
export interface TraceStep { text: Bi; trust?: TrustClass }
export interface Plan { route: Route; toolPath?: string; calc?: CalcDeskResult; math?: MathDeskResult; fx?: FxRequest; wb?: WbRequest; desk?: DataDeskKind; trace: TraceStep[] }
const b = (en: string, he: string): Bi => ({ en, he });

export function planQuestion(text: string): Plan {
  const toolPath = resolveToolKeyword(text);
  if (toolPath) return { route: "tool", toolPath, trace: [
    { text: b("Recognized a request to open a page of the site.", "זיהיתי בקשה לפתוח עמוד באתר.") },
    { text: b("Opened it. Nothing was calculated and no model was used.", "פתחתי אותו. לא חושב דבר ולא נעשה שימוש במודל.") }] };
  if (isCareerLaunchRequest(text)) return { route: "career", trace: [{ text: b("Recognized a career-lab request and linked it.", "זיהיתי בקשה למעבדת הקריירה וקישרתי אליה.") }] };
  if (looksLikeLearningPathRequest(text)) return { route: "learnpath", trace: [{ text: b("Recognized a request for a learning path and built it from the lesson list.", "זיהיתי בקשה למסלול למידה ובניתי אותו מרשימת השיעורים.") }] };
  if (resolveSiteIntent(text)) return { route: "site", trace: [{ text: b("Matched your question to what the site can do and listed the matching tools.", "התאמתי את השאלה ליכולות האתר והצגתי את הכלים המתאימים.") }] };
  const fx = parseFxRequest(text);
  if (fx) return { route: "fx", fx, trace: [
    { text: b("Recognized a currency conversion.", "זיהיתי בקשה להמרת מטבע.") },
    { text: b("Loaded the European Central Bank daily reference rate and multiplied. It is a daily reference rate, not a live trading quote.", "טענתי את שער היחס היומי של הבנק המרכזי האירופי וכפלתי. זהו שער יחס יומי, לא שער מסחר חי."), trust: "DATA" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const wb = parseWbRequest(text);
  if (wb) return { route: "wb", wb, trace: [
    { text: b("Recognized a country statistic.", "זיהיתי בקשה לנתון כלכלי של מדינה.") },
    { text: b("Loaded the yearly values from World Bank open data and showed each with its year. Yearly data arrives with a delay.", "טענתי את הערכים השנתיים מהנתונים הפתוחים של הבנק העולמי והצגתי כל אחד עם שנתו. נתונים שנתיים מגיעים באיחור."), trust: "DATA" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const calc = runCalcDesk(text);
  if (calc) return { route: "calc", calc, trace: [
    { text: b("Found numbers and a calculation request in your question.", "מצאתי בשאלה מספרים ובקשה לחישוב.") },
    { text: b("Ran the fixed calculator on exactly those numbers. The formula is shown with the result.", "הרצתי מחשבון קבוע בדיוק על המספרים האלה. הנוסחה מוצגת עם התוצאה."), trust: "CALCULATION" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const math = runMathDesk(text);
  if (math) return { route: "math", math, trace: [
    { text: b("Recognized plain arithmetic in your question.", "זיהיתי בשאלה חישוב חשבוני רגיל.") },
    { text: b(math.ok ? "Worked it out with a fixed parser, step by step. The steps are shown." : "Could not read it safely, so nothing was calculated.", math.ok ? "חישבתי בעזרת מנתח קבוע, צעד אחר צעד. הצעדים מוצגים." : "לא הצלחתי לקרוא את זה בבטחה, ולכן לא חושב דבר."), trust: "CALCULATION" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const desk = resolveDataDesk(text);
  if (desk) return { route: "desk", desk, trace: [
    { text: b("Recognized a market-data question and loaded the live panel.", "זיהיתי שאלה על נתוני שוק וטענתי את הלוח החי."), trust: "DATA" },
    { text: b("The panel is read-only: real feed values with their time, never filled in.", "הלוח לקריאה בלבד: ערכים אמיתיים מהמקור עם זמנם, בלי השלמות.") }] };
  return { route: "copilot", trace: [
    { text: b("Worked out the topic and intent with fixed rules.", "זיהיתי את הנושא והכוונה בעזרת כללים קבועים.") },
    { text: b("Looked for a stored explanation in the knowledge base and showed it as written, with its source.", "חיפשתי הסבר שמור במאגר הידע והצגתי אותו כפי שנכתב, עם המקור."), trust: "EDUCATIONAL" },
    { text: b("The answer text comes from the rules engine. An AI model may only rephrase it, and a check rejects any new fact.", "נוסח התשובה בא ממנוע הכללים. מודל AI רשאי רק לנסח מחדש, ובדיקה פוסלת כל עובדה חדשה."), trust: "ANALYSIS" }] };
}
export const stepLabel = (s: TraceStep, lang: "he" | "en"): string => s.text[lang];
export const trustLabel = (c: TrustClass, lang: "he" | "en"): string => TRUST_LABEL[c][lang];
