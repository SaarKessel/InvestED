/** Planner: picks the route for a question with the same fixed rules the chat uses, and writes the plain "What I did" trace. No model involved. */
import { isCareerLaunchRequest } from "@/lib/career/chatRoute";
import { resolveToolKeyword } from "./toolKeywords";
import { looksLikeLearningPathRequest } from "./learnDesk";
import { resolveSiteIntent } from "./siteCapabilities";
import { parseMarketEventRequest } from "@/lib/simulator/marketEvents";
import type { MarketEventInput } from "@/lib/simulator/marketEvents";
import { runScenario, type ScenarioPart } from "./scenarioDesk";
import { parseWbRequest, type WbRequest } from "./worldBankDesk";
import { parseOosRequest, type OosRequest } from "./oosDesk";
import { parseMacroRequest, type MacroRequest } from "./macroDesk";
import { parseEtfRequest, type EtfRequest } from "./etfDesk";
import { parseCopyFundRequest, type CopyFundRequest } from "./copyFundDesk";
import { parseFilingsRequest, type FilingsRequest } from "./filingsDesk";
import { planLedgerRequest } from "@/lib/predictions/ledgerDesk";
import type { LedgerRequest } from "@/lib/predictions/ledger";
import { parseFxRequest, type FxRequest } from "./fxDesk";
import { runMathDesk, type MathDeskResult } from "./mathDesk";
import { runCalcDesk, type CalcDeskResult } from "./calcDesk";
import { resolveDataDesk, type DataDeskKind } from "./dataDesk";
import { TRUST_LABEL } from "@/lib/intelligence/provenance";
import type { TrustClass } from "@/lib/intelligence/verificationEngine";
import type { ToolId } from "@/lib/intelligence/tools";

export type Route = "tool" | "career" | "learnpath" | "site" | "calc" | "math" | "fx" | "wb" | "macro" | "filings" | "etf" | "scenario" | "marketsim" | "ledger" | "oos" | "copyfund" | "desk" | "copilot";
export interface Bi { en: string; he: string }
export interface TraceStep { text: Bi; trust?: TrustClass }
export interface Plan { /** registry tool ids this route runs, in order */ tools: ToolId[]; route: Route; toolPath?: string; calc?: CalcDeskResult; math?: MathDeskResult; fx?: FxRequest; wb?: WbRequest; macro?: MacroRequest; filings?: FilingsRequest; etf?: EtfRequest; ledger?: LedgerRequest; oos?: OosRequest; copyfund?: CopyFundRequest; scenario?: ScenarioPart[]; marketsim?: MarketEventInput; desk?: DataDeskKind; trace: TraceStep[] }
const b = (en: string, he: string): Bi => ({ en, he });

export function planQuestion(text: string): Plan {
  const toolPath = resolveToolKeyword(text);
  if (toolPath) return { tools: [], route: "tool", toolPath, trace: [
    { text: b("Recognized a request to open a page of the site.", "זיהיתי בקשה לפתוח עמוד באתר.") },
    { text: b("Opened it. Nothing was calculated and no model was used.", "פתחתי אותו. לא חושב דבר ולא נעשה שימוש במודל.") }] };
  if (isCareerLaunchRequest(text)) return { tools: [], route: "career", trace: [{ text: b("Recognized a career-lab request and linked it.", "זיהיתי בקשה למעבדת הקריירה וקישרתי אליה.") }] };
  if (looksLikeLearningPathRequest(text)) return { tools: [], route: "learnpath", trace: [{ text: b("Recognized a request for a learning path and built it from the lesson list.", "זיהיתי בקשה למסלול למידה ובניתי אותו מרשימת השיעורים.") }] };
  if (resolveSiteIntent(text)) return { tools: [], route: "site", trace: [{ text: b("Matched your question to what the site can do and listed the matching tools.", "התאמתי את השאלה ליכולות האתר והצגתי את הכלים המתאימים.") }] };
  const marketsim = parseMarketEventRequest(text);
  if (marketsim) return { tools: ["marketsim"], route: "marketsim", marketsim, trace: [
    { text: b("Recognized a request to simulate an invented market event.", "זיהיתי בקשה לדמות אירוע שוק מומצא.") },
    { text: b("Ran a fixed teaching simulator on a fictional index. Educational scenario, not real data: nothing here comes from a market feed.", "הרצתי סימולטור לימודי קבוע על מדד דמיוני. תרחיש לימודי, לא נתונים אמיתיים: דבר כאן לא בא מהזנת שוק."), trust: "SIMULATION" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const ledger = planLedgerRequest(text);
  if (ledger) return { tools: ["ledger"], route: "ledger", ledger, trace: [
    { text: b("Recognized a prediction call or a request for your calibration.", "זיהיתי תחזית או בקשה לצפות בכיול שלכם.") },
    { text: b("Saved the call with the last real closing price and settled due calls against real daily closes. Nothing was estimated or filled in.", "שמרתי את התחזית עם מחיר הסגירה האמיתי האחרון וסגרתי תחזיות שהגיע זמנן מול מחירי סגירה יומיים אמיתיים. דבר לא הוערך ולא הושלם."), trust: "DATA" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const fx = parseFxRequest(text);
  if (fx) return { tools: ["fx"], route: "fx", fx, trace: [
    { text: b("Recognized a currency conversion.", "זיהיתי בקשה להמרת מטבע.") },
    { text: b("Loaded the European Central Bank daily reference rate and multiplied. It is a daily reference rate, not a live trading quote.", "טענתי את שער היחס היומי של הבנק המרכזי האירופי וכפלתי. זהו שער יחס יומי, לא שער מסחר חי."), trust: "DATA" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const copyfund = parseCopyFundRequest(text);
  if (copyfund) return { tools: ["copyfund"], route: "copyfund", copyfund, trace: [
    { text: b("Recognized a question about copying an institutional manager's 13F.", "זיהיתי שאלה על העתקת 13F של מנהל מוסדי.") },
    { text: b("Loaded the latest 13F from SEC EDGAR, matched names to tickers only when exactly one fit, and priced them with real daily closes against SPY. The 45-day filing lag and the limits of 13F are shown. Educational simulation, not advice.", "טענתי את ה-13F האחרון מ-SEC EDGAR, התאמתי שמות לסימולים רק כשהתאים בדיוק אחד, ותמחרתי במחירי סגירה יומיים אמיתיים מול SPY. מוצגים עיכוב ההגשה של 45 יום ומגבלות ה-13F. סימולציה לימודית, לא ייעוץ."), trust: "SIMULATION" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const filings = parseFilingsRequest(text);
  if (filings) return { tools: ["filings"], route: "filings", filings, trace: [
    { text: b("Recognized a question about an institutional manager's holdings.", "זיהיתי שאלה על החזקות של מנהל מוסדי.") },
    { text: b("Loaded the manager's latest Form 13F from SEC EDGAR and showed the top holdings exactly as reported, with the report date. 13F is delayed and long-only.", "טענתי את טופס 13F האחרון של המנהל מ-SEC EDGAR והצגתי את ההחזקות הגדולות בדיוק כפי שדווחו, עם תאריך הדוח. 13F מתפרסם באיחור וכולל רק פוזיציות לונג."), trust: "DATA" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const etf = parseEtfRequest(text);
  if (etf) return { tools: ["etf"], route: "etf", etf, trace: [
    { text: b("Recognized a question about what an ETF or fund holds.", "זיהיתי שאלה על מה שקרן סל או קרן מחזיקה.") },
    { text: b("Loaded the fund's latest public N-PORT report from SEC EDGAR and showed the top holdings exactly as reported, with the report date. Reports are quarterly and published with a delay.", "טענתי את דוח N-PORT הפומבי האחרון של הקרן מ-SEC EDGAR והצגתי את ההחזקות הגדולות בדיוק כפי שדווחו, עם תאריך הדוח. הדוחות רבעוניים ומתפרסמים באיחור."), trust: "DATA" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const scenario = runScenario(text);
  if (scenario) return { tools: ["scenario"], route: "scenario", scenario, trace: [
    { text: b("Found several calculations in one question and split them into parts.", "מצאתי בשאלה כמה חישובים וחילקתי אותם לחלקים.") },
    { text: b("Ran each part through the fixed calculator, loan formula or math parser, in order. A part that cannot be read safely is named and not guessed.", "הרצתי כל חלק במחשבון הקבוע, בנוסחת ההלוואה או במנתח החשבון, לפי הסדר. חלק שאי אפשר לקרוא בבטחה מסומן ולא מנוחש."), trust: "CALCULATION" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const oos = parseOosRequest(text);
  if (oos) return { tools: ["oos"], route: "oos", oos, trace: [
    { text: b("Recognized an out-of-sample portfolio check.", "זיהיתי בקשה לבדיקת תיק מחוץ למדגם.") },
    { text: b("Loaded real daily closes, learned the weights on the first 70% only, and judged them on the last 30% next to equal weight and SPY. Educational simulation, not advice.", "טענתי מחירי סגירה יומיים אמיתיים, למדתי את המשקלים מ-70% הראשונים בלבד ובדקתי אותם על 30% האחרונים לצד משקל שווה ו-SPY. סימולציה לימודית, לא ייעוץ."), trust: "SIMULATION" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const macro = parseMacroRequest(text);
  if (macro) return { tools: ["macro"], route: "macro", macro, trace: [
    { text: b("Recognized a question about the ECB rate or an IMF economic figure.", "זיהיתי שאלה על ריבית ה-ECB או על נתון כלכלי של ה-IMF.") },
    { text: b("Loaded the figures directly from the ECB Data Portal or the IMF DataMapper, free official sources, and showed each with its date. IMF estimates and projections are labeled.", "טענתי את הנתונים ישירות מ-ECB Data Portal או מ-IMF DataMapper, מקורות רשמיים וחינמיים, והצגתי כל אחד עם תאריכו. הערכות והקרנות של ה-IMF מסומנות."), trust: "DATA" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const wb = parseWbRequest(text);
  if (wb) return { tools: ["wb"], route: "wb", wb, trace: [
    { text: b("Recognized a country statistic.", "זיהיתי בקשה לנתון כלכלי של מדינה.") },
    { text: b("Loaded the yearly values from World Bank open data and showed each with its year. Yearly data arrives with a delay.", "טענתי את הערכים השנתיים מהנתונים הפתוחים של הבנק העולמי והצגתי כל אחד עם שנתו. נתונים שנתיים מגיעים באיחור."), trust: "DATA" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const calc = runCalcDesk(text);
  if (calc) return { tools: ["calc"], route: "calc", calc, trace: [
    { text: b("Found numbers and a calculation request in your question.", "מצאתי בשאלה מספרים ובקשה לחישוב.") },
    { text: b("Ran the fixed calculator on exactly those numbers. The formula is shown with the result.", "הרצתי מחשבון קבוע בדיוק על המספרים האלה. הנוסחה מוצגת עם התוצאה."), trust: "CALCULATION" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const math = runMathDesk(text);
  if (math) return { tools: ["math"], route: "math", math, trace: [
    { text: b("Recognized plain arithmetic in your question.", "זיהיתי בשאלה חישוב חשבוני רגיל.") },
    { text: b(math.ok ? "Worked it out with a fixed parser, step by step. The steps are shown." : "Could not read it safely, so nothing was calculated.", math.ok ? "חישבתי בעזרת מנתח קבוע, צעד אחר צעד. הצעדים מוצגים." : "לא הצלחתי לקרוא את זה בבטחה, ולכן לא חושב דבר."), trust: "CALCULATION" },
    { text: b("No model chose or changed any number.", "אף מודל לא בחר או שינה מספר.") }] };
  const desk = resolveDataDesk(text);
  if (desk) return { tools: [], route: "desk", desk, trace: [
    { text: b("Recognized a market-data question and loaded the live panel.", "זיהיתי שאלה על נתוני שוק וטענתי את הלוח החי."), trust: "DATA" },
    { text: b("The panel is read-only: real feed values with their time, never filled in.", "הלוח לקריאה בלבד: ערכים אמיתיים מהמקור עם זמנם, בלי השלמות.") }] };
  return { tools: [], route: "copilot", trace: [
    { text: b("Worked out the topic and intent with fixed rules.", "זיהיתי את הנושא והכוונה בעזרת כללים קבועים.") },
    { text: b("Looked for a stored explanation in the knowledge base and showed it as written, with its source.", "חיפשתי הסבר שמור במאגר הידע והצגתי אותו כפי שנכתב, עם המקור."), trust: "EDUCATIONAL" },
    { text: b("The answer text comes from the rules engine. An AI model may only rephrase it, and a check rejects any new fact.", "נוסח התשובה בא ממנוע הכללים. מודל AI רשאי רק לנסח מחדש, ובדיקה פוסלת כל עובדה חדשה."), trust: "ANALYSIS" }] };
}
export const stepLabel = (s: TraceStep, lang: "he" | "en"): string => s.text[lang];
export const trustLabel = (c: TrustClass, lang: "he" | "en"): string => TRUST_LABEL[c][lang];
