/**
 * Currency conversion from one sentence. The rate is the European Central Bank daily
 * reference rate, served by Frankfurter (free, no key). It is a reference rate for a
 * working day, not a live trading quote, and the card says so with its date.
 */
import { isNegatedAsk } from "./negatedAsk";

export interface FxRequest { amount: number; from: string; to: string }
export interface FxResult extends FxRequest { rate: number; date: string; result: number }

const NAMES: [RegExp, string][] = [
  [/\b(?:cad|canadian dollars?)\b|דולר קנדי/i, "CAD"], [/\b(?:aud|australian dollars?)\b|דולר אוסטרלי/i, "AUD"],
  [/\b(?:usd|us dollars?|dollars?)\b|\$|דולר(?:ים)?|(?<![א-ת])דולר/i, "USD"],
  [/\b(?:ils|nis|shekels?|sheqels?)\b|₪|שקל(?:ים)?|ש"ח|שח(?![א-ת])/i, "ILS"],
  [/\b(?:eur|euros?)\b|€|יורו|אירו/i, "EUR"],
  [/\b(?:gbp|pounds?|sterling)\b|£|לירה שטרלינג|פאונד/i, "GBP"],
  [/\b(?:jpy|yen)\b|¥|ין(?![א-ת])/i, "JPY"],
  [/\b(?:chf|swiss francs?)\b|פרנק(?:ים)?(?: שוויצרי(?:ם)?)?/i, "CHF"],
];
const CODES = ["USD", "ILS", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD"];

function order(text: string): string[] {
  const found: { code: string; at: number }[] = [];
  // Compound names (Canadian dollars) come first and are blanked out so their "dollars" is not also read as USD.
  let work = text;
  for (const [re, code] of NAMES) {
    const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
    for (const m of work.matchAll(new RegExp(re.source, flags))) {
      found.push({ code, at: m.index ?? 0 });
      work = work.slice(0, m.index) + " ".repeat(m[0].length) + work.slice(m.index! + m[0].length);
    }
  }
  for (const c of CODES) { const i = text.toUpperCase().search(new RegExp(`\\b${c}\\b`)); if (i >= 0) found.push({ code: c, at: i }); }
  found.sort((a, b) => a.at - b.at);
  const out: string[] = [];
  for (const f of found) if (!out.includes(f.code)) out.push(f.code);
  return out;
}

/** Fires on "100 USD to ILS", "convert 500 euros to dollars", "כמה זה 100 דולר בשקלים", "דולר שקל". Needs two different currencies. */
export function parseFxRequest(text: string): FxRequest | null {
  const t = text.trim();
  if (t.length > 120 || isNegatedAsk(t)) return null;
  const hasCue = /\b(?:to|in|into|convert|exchange|rate|how much)\b|→|=|ל-?|ב(?=[א-ת])|ב-|בשקל|בדולר|ביורו|שער|המר|המרה|כמה/i.test(t);
  if (!hasCue) return null;
  const codes = order(t);
  if (codes.length < 2) return null;
  // Amounts written in words ("one hundred dollars", "half a million") are not read: guessing would convert 1 unit.
  if (!/\d/.test(t) && (/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|half|quarter|dozen)\b/i.test(t) || /(?<![א-ת])(?:חצי|מאה|מאתיים|עשרים|שלושים|ארבעים|חמישים|שישים|שבעים|שמונים|תשעים)(?![א-ת])/.test(t))) return null;
  const n = /(\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:\.\d+)?|\d[\d,]*(?:\.\d+)?)\s*(k\b|m\b|bn\b|billion|thousand|million|אלף|מיליון|מיליארד)?/i.exec(t);
  const bare = n ? null : /\b(billion|million|thousand)\b|מיליארד|מיליון|אלף/i.exec(t);
  const unit = (n?.[2] ?? bare?.[0])?.toLowerCase();
  const scale = unit === "bn" || unit === "billion" || unit === "מיליארד" ? 1_000_000_000 : unit === "m" || unit === "million" || unit === "מיליון" ? 1_000_000 : unit ? 1000 : 1;
  const digits = n ? (/^\d+,\d{1,2}$/.test(n[1]) ? n[1].replace(",", ".") : n[1].replace(/[,\u00a0\u202f ]/g, "")) : "";
  const amount = n ? Number(digits) * scale : scale;
  if (!(amount > 0) || !Number.isFinite(amount)) return null;
  // "X to Y": first mentioned is the source. A trailing Hebrew "ב" form ("100 דולר בשקלים") also reads left to right.
  return { amount, from: codes[0], to: codes[1] };
}

export async function loadFx(req: FxRequest, fetcher: typeof fetch = fetch): Promise<FxResult | null> {
  try {
    const r = await fetcher(`https://api.frankfurter.dev/v1/latest?base=${req.from}&symbols=${req.to}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { date?: string; rates?: Record<string, number> };
    const rate = j.rates?.[req.to];
    if (typeof rate !== "number" || !j.date) return null;
    return { ...req, rate, date: j.date, result: req.amount * rate };
  } catch { return null; }
}
