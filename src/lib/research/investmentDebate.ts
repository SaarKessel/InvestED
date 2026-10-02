// ---------------------------------------------------------------------------
// InvestED - investment-committee debate card (educational)
//
// One schema-constrained model call writes a bull case, a bear case, one risk
// note and a "what would change my mind" list for a single asset, from the
// engine's facts only. The idea of opposing analyst roles comes from
// TradingAgents (https://github.com/TauricResearch/TradingAgents, Apache-2.0);
// only the concept is used, no code or prompt text.
//
// The model never decides. Output is rejected line by line when it:
//  - uses a number that is not in the facts (a bull/bear argument must also cite one),
//  - names a ticker that is not in the facts,
//  - contains advice, forecast or verdict language (buy / sell / hold / target / will rise ...),
//  - is not in the requested script.
// A card with no usable bull and bear argument is not shown at all.
// The advice-guard below is deliberately small and self-contained; swap it for the shared guard when that lands.
// ---------------------------------------------------------------------------
import type { BriefFacts } from "./scenarioBrief.js";

export interface Debate { bull: string[]; bear: string[]; risk: string; changeMyMind: string[] }

export const DEBATE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    bull: { type: "ARRAY", items: { type: "STRING" } },
    bear: { type: "ARRAY", items: { type: "STRING" } },
    risk: { type: "STRING" },
    changeMyMind: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["bull", "bear", "risk", "changeMyMind"],
};

export function buildDebateSystemPrompt(language: "he" | "en"): string {
  return [
    "You run a short educational investment-committee debate about one asset for InvestED+, using ONLY the facts listed by the user.",
    "Return: bull (up to 3 arguments for the optimistic side), bear (up to 3 arguments for the cautious side), risk (one sentence on the main risk), changeMyMind (up to 3 things that would change the picture).",
    "Every bull and bear argument is one plain sentence of at most 25 words and cites at least one number exactly as written in the facts.",
    "Use no number that is not in the facts. Do not invent thresholds, targets, percentages, probabilities or dates.",
    "changeMyMind items are conditions such as 'if the price falls below its SMA50' or 'if new headlines change the story', phrased without new numbers.",
    "Never give a verdict. Never say buy, sell, hold, recommend, target, undervalued, overvalued, or that the price will rise or fall.",
    "Data listed as unavailable must be called unavailable, never guessed.",
    `Write in ${language === "he" ? "Hebrew" : "English"}.`,
  ].join("\n");
}

export function buildDebateUserText(f: BriefFacts): string {
  return `Asset: ${f.name} (${f.symbol})\nFacts:\n${f.lines.map((l) => `- ${l}`).join("\n")}\nUnavailable (do not guess): ${f.unavailable.join("; ")}`;
}

const ADVICE = /\b(buy|sell|hold|accumulate|short it|recommend(?:ed|s|ation)?|price target|target price|will (?:rise|fall|go up|go down|double|crash|surge|drop|rally|beat|outperform)|guaranteed?|undervalued|overvalued|can't lose|sure thing|must (?:buy|sell))\b/i;
// Hebrew has prefixes and conjugations, so these are substring matches: a false positive only drops a line.
const ADVICE_HE = /לקנות|קנה|קנו|למכור|מכור|מכרו|להחזיק|החזק|מומלץ|ממליצ|המלצ|כדאי|יעד מחיר|יעלה|יירד|ירד ל|יזנק|ייפול|יתרסק|בטוח ש|מובטח/;
const FOREIGN_SCRIPT = /[\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF]/;
const HEBREW = /[\u0590-\u05FF]/;
const numbersIn = (s: string) => s.replace(/(\d),(?=\d{3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? [];

export interface GuardContext { allowedNumbers: Set<string>; symbols: Set<string>; factsText: string; language: "he" | "en" }
export function guardContext(facts: BriefFacts, language: "he" | "en"): GuardContext {
  const factsText = `${facts.name} ${facts.symbol} ${facts.lines.join(" ")}`;
  return { allowedNumbers: new Set(numbersIn(factsText)), symbols: new Set(factsText.match(/\b[A-Z]{2,6}\b/g) ?? []), factsText, language };
}
/** True when one line may be shown. `needsFact` demands at least one cited fact number. */
export function lineIsSafe(raw: unknown, ctx: GuardContext, needsFact: boolean): raw is string {
  if (typeof raw !== "string") return false;
  const s = raw.trim();
  if (!s || s.length > 240 || ADVICE.test(s) || ADVICE_HE.test(s)) return false;
  if (FOREIGN_SCRIPT.test(s) && !FOREIGN_SCRIPT.test(ctx.factsText)) return false;
  if (ctx.language === "he" && !HEBREW.test(s)) return false;
  if (ctx.language === "en" && HEBREW.test(s)) return false;
  const nums = numbersIn(s);
  if (!nums.every((n) => ctx.allowedNumbers.has(n))) return false;
  if (needsFact && nums.length === 0) return false;
  if (!(s.match(/\b[A-Z]{2,6}\b/g) ?? []).every((t) => ctx.symbols.has(t) || ["RSI", "SMA", "AI"].includes(t))) return false;
  return true;
}

const take = (raw: unknown, max: number, ctx: GuardContext, needsFact: boolean) =>
  (Array.isArray(raw) ? raw : []).filter((x): x is string => lineIsSafe(x, ctx, needsFact)).map((x) => x.trim()).slice(0, max);

/** Returns null unless there is at least one safe bull AND one safe bear argument and at least one "change my mind" item. */
export function validateDebate(raw: unknown, facts: BriefFacts, language: "he" | "en"): Debate | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const ctx = guardContext(facts, language);
  const bull = take(r.bull, 3, ctx, true);
  const bear = take(r.bear, 3, ctx, true);
  const changeMyMind = take(r.changeMyMind, 3, ctx, false);
  const risk = lineIsSafe(r.risk, ctx, false) ? (r.risk as string).trim() : "";
  if (bull.length === 0 || bear.length === 0 || changeMyMind.length === 0) return null;
  return { bull, bear, risk, changeMyMind };
}

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
export async function fetchDebate(facts: BriefFacts, language: "he" | "en", fetcher: FetchLike = fetch as unknown as FetchLike): Promise<Debate | null> {
  try {
    const r = await fetcher("/api/research-debate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts, language }) });
    if (!r.ok) return null;
    const j = (await r.json()) as { fallback?: boolean; debate?: unknown };
    return j.fallback ? null : validateDebate(j.debate, facts, language);
  } catch { return null; }
}
