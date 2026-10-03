/**
 * Currency conversion from one sentence. The rate is the European Central Bank daily
 * reference rate, served by Frankfurter (free, no key). It is a reference rate for a
 * working day, not a live trading quote, and the card says so with its date.
 */
export interface FxRequest { amount: number; from: string; to: string }
export interface FxResult extends FxRequest { rate: number; date: string; result: number }

const NAMES: [RegExp, string][] = [
  [/\b(?:cad|canadian dollars?)\b|דולר קנדי/i, "CAD"], [/\b(?:aud|australian dollars?)\b|דולר אוסטרלי/i, "AUD"],
  [/\b(?:usd|us dollars?|dollars?)\b|\$|דולר(?:ים)?|(?<![א-ת])דולר/i, "USD"],
  [/\b(?:ils|nis|shekels?|sheqels?)\b|₪|שקל(?:ים)?|ש"ח|שח(?![א-ת])/i, "ILS"],
  [/\b(?:eur|euros?)\b|€|יורו|אירו/i, "EUR"],
  [/\b(?:gbp|pounds?|sterling)\b|£|לירה שטרלינג|פאונד/i, "GBP"],
  [/\b(?:jpy|yen)\b|¥|ין(?![א-ת])/i, "JPY"],
  [/\b(?:chf|swiss francs?)\b|פרנק שוויצרי/i, "CHF"],
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
  if (t.length > 120) return null;
  const hasCue = /\b(?:to|in|into|convert|exchange|rate|how much)\b|→|=|ל-?|ב(?=[א-ת])|בשקל|בדולר|ביורו|שער|המר|המרה|כמה/i.test(t);
  if (!hasCue) return null;
  const codes = order(t);
  if (codes.length < 2) return null;
  const n = /(\d[\d,]*(?:\.\d+)?)\s*(k\b|m\b|thousand|million|אלף|מיליון)?/i.exec(t);
  const unit = n?.[2]?.toLowerCase();
  const scale = unit === "m" || unit === "million" || unit === "מיליון" ? 1_000_000 : unit ? 1000 : 1;
  const amount = n ? Number(n[1].replace(/,/g, "")) * scale : 1;
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
