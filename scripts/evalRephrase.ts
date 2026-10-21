// Model A/B for the rephrase gateway: fixed he/en eval set, real Gemini calls.
// Run: GEMINI_API_KEY=... npx tsx scripts/evalRephrase.ts [modelA] [modelB]
import { buildStructuredRequest, parseStructuredResponse, verifyStructuredAnswer } from "../src/lib/copilot/structuredAnswer.js";
import { GEMINI_API_BASE, normalizeGatewayPayload } from "../src/lib/copilot/gatewayPrompt.js";

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("GEMINI_API_KEY required"); process.exit(1); }
const MODELS = process.argv.slice(2).length ? process.argv.slice(2) : ["gemini-3.5-flash-lite", "gemini-3.5-flash"];

const SET: unknown[] = [
  { question: "מה זה ETF?", language: "he", answer: "קרן סל (ETF) היא קרן נאמנות הנסחרת בבורסה. היא עוקבת אחר מדד ומאפשרת פיזור רחב בעלות נמוכה.", facts: { intent: "explain" } },
  { question: "מה זה פיזור?", language: "he", answer: "פיזור הוא פתיחת השקעות במספר נכסים שונים כדי להקטין את הסיכון שמכשיר אחד יפגע בכל התיק.", facts: { intent: "explain" } },
  { question: "מה מחיר VOO?", language: "he", answer: "המחיר הנוכחי של VOO הוא 612.5 דולר, עלייה של 0.8% היום.", facts: { intent: "quote", assets: [{ symbol: "VOO", price: 612.5, changePercent: 0.8 }] } },
  { question: "כמה אצבור ב-10 שנים?", language: "he", answer: "הפקדה חודשית של 1,000 ש״ח בתשואה שנתית של 7% תצבור כ-173,084 ש״ח בעוד 10 שנים.", facts: { intent: "calc", calculation: { monthly: 1000, years: 10, rate: 7, future: 173084 } } },
  { question: "מה היתרונות של קרן השתלמות?", language: "he", answer: "קרן השתלמות היא מכשיר חיסכון עם פטור ממס רווחי הון עד תקרת ההפקדה, נזיל לאחר 6 שנים.", facts: { intent: "explain" } },
  { question: "מה ההבדל בין מניה לאג״ח?", language: "he", answer: "מניה היא חלק בעלות בחברה עם פוטנציאל תשואה וסיכון גבוהים. אג״ח היא הלוואה לחברה או למדינה עם תשלום קבוע וסיכון נמוך יחסית.", facts: { intent: "explain" } },
  { question: "ומה עם הדמי ניהול שלה?", language: "he", answer: "דמי הניהול של קרן מחקה מדד ממוצעת הם כ-0.03% עד 0.25% בשנה.", facts: { intent: "explain" }, context: [{ q: "מה זה ETF?", a: "קרן סל (ETF) היא קרן נאמנות הנסחרת בבורסה." }] },
  { question: "What is compound interest?", language: "en", answer: "Compound interest is interest earned on both the original amount and on previously accumulated interest, so growth accelerates over time.", facts: { intent: "explain" } },
  { question: "What is the current VOO price?", language: "en", answer: "VOO currently trades at 612.5 USD, up 0.8% today.", facts: { intent: "quote", assets: [{ symbol: "VOO", price: 612.5, changePercent: 0.8 }] } },
  { question: "How much will I save in 10 years?", language: "en", answer: "Saving 1,000 ILS monthly at a 7% annual return grows to about 173,084 ILS after 10 years.", facts: { intent: "calc", calculation: { monthly: 1000, years: 10, rate: 7, future: 173084 } } },
  { question: "What is diversification?", language: "en", answer: "Diversification means spreading investments across different assets so that one failing asset does not sink the whole portfolio.", facts: { intent: "explain" } },
  { question: "Is now a good time to invest?", language: "en", answer: "Nobody knows the right timing. A common approach is regular fixed-amount investing over a long horizon, which smooths entry prices.", facts: { intent: "explain" } },
  { question: "and its fees?", language: "en", answer: "An average index ETF charges about 0.03% to 0.25% per year.", facts: { intent: "explain" }, context: [{ q: "What is an ETF?", a: "An ETF is an exchange-traded fund that tracks an index." }] },
  { question: "מה זה תשואה?", language: "he", answer: "תשואה היא הרווח או ההפסד על השקעה לאורך זמן, באחוזים מהסכום המושקע.", facts: { intent: "explain" } },
  { question: "What is a dividend?", language: "en", answer: "A dividend is a portion of a company's profits paid to shareholders, usually quarterly.", facts: { intent: "explain" } },
  { question: "איך פועלת ריבית דריבית?", language: "he", answer: "ריבית דריבית היא ריבית שנצברת גם על הקרן וגם על הריבית שנצברה, ולכן הצמיחה מאיצה עם הזמן.", facts: { intent: "explain" } },
];

interface Row { model: string; i: number; ms: number; pass: boolean; promptTokens: number | null; outTokens: number | null; len: number }
const rows: Row[] = [];

for (const model of MODELS) {
  for (let i = 0; i < SET.length; i++) {
    const payload = normalizeGatewayPayload(SET[i])!;
    const started = Date.now();
    try {
      const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
        body: JSON.stringify(buildStructuredRequest(payload)),
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.json();
      const verdict = res.ok ? verifyStructuredAnswer(payload, parseStructuredResponse(body)) : { ok: false as const };
      const usage = (body as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }).usageMetadata;
      rows.push({ model, i, ms: Date.now() - started, pass: verdict.ok === true, promptTokens: usage?.promptTokenCount ?? null, outTokens: usage?.candidatesTokenCount ?? null, len: verdict.ok === true ? verdict.text.length : 0 });
    } catch {
      rows.push({ model, i, ms: Date.now() - started, pass: false, promptTokens: null, outTokens: null, len: 0 });
    }
  }
}

const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length));
for (const model of MODELS) {
  const mine = rows.filter((r) => r.model === model);
  console.log(JSON.stringify({
    model,
    passRate: `${mine.filter((r) => r.pass).length}/${mine.length}`,
    avgMs: avg(mine.map((r) => r.ms)),
    avgPromptTokens: avg(mine.map((r) => r.promptTokens ?? 0)),
    avgOutTokens: avg(mine.map((r) => r.outTokens ?? 0)),
    avgAnswerLen: avg(mine.filter((r) => r.pass).map((r) => r.len)),
  }));
}
console.log("detail:", JSON.stringify(rows));
