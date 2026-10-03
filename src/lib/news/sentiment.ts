import { safeSlice } from "../copilot/safeSlice.js";
// ---------------------------------------------------------------------------
// InvestED - AI headline tone estimate
//
// An AI model (the site's one Gemini layer) reads ONLY the headline text and
// rates its tone as positive, negative or neutral with a short reason. It is
// an ESTIMATE, labeled "AI estimate" in the UI, never market data and never
// a price signal. Anything the model returns that does not validate is
// dropped for that headline (no default to "neutral"): the UI then shows
// nothing for it.
//
// Inspired by the headline-sentiment idea of FinGPT
// (https://github.com/AI4Finance-Foundation/FinGPT, MIT License). No code or
// model weights copied.
// ---------------------------------------------------------------------------

import { rephraseIntroducesNoNewFacts } from "../copilot/gatewayPrompt.js";

export type Tone = "positive" | "negative" | "neutral";
export const TONES: Tone[] = ["positive", "negative", "neutral"];
export const MAX_HEADLINES = 12;

export interface SentimentInput { id: string; title: string; source: string }
export interface SentimentItem { id: string; tone: Tone; reason: string }

/** Keep only well-formed ratings for known headlines whose reason adds no number or ticker the headline lacks. */
export function validateSentiment(raw: unknown, inputs: SentimentInput[]): SentimentItem[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map(inputs.map((i) => [i.id, i]));
  const seen = new Set<string>();
  const out: SentimentItem[] = [];
  for (const r of raw) {
    const row = r as { id?: unknown; label?: unknown; tone?: unknown; reason?: unknown };
    const id = typeof row?.id === "string" ? row.id : "";
    const tone = (typeof row?.label === "string" ? row.label : row?.tone) as Tone;
    const reason = typeof row?.reason === "string" ? row.reason.trim() : "";
    const input = byId.get(id);
    if (!input || seen.has(id) || !TONES.includes(tone) || reason.length === 0 || reason.length > 200) continue;
    if (!rephraseIntroducesNoNewFacts(`${input.title} ${input.source}`, {} as never, reason)) continue;
    seen.add(id);
    out.push({ id, tone, reason });
  }
  return out;
}

export function buildSentimentSystemPrompt(language: "he" | "en"): string {
  return [
    "You rate the tone of news headlines for InvestED+, an educational finance site.",
    "For each headline decide whether its tone, for the company, market or economy it names, is positive, negative or neutral. Use only the headline text.",
    "Give one short reason of at most 15 words, using only words, names and numbers that appear in the headline. Do not add facts, causes, numbers or tickers.",
    "Never predict prices. Never give advice. Never use buy, sell or hold language. If the headline is unclear, say neutral.",
    `Write each reason in ${language === "he" ? "Hebrew" : "English"}.`,
  ].join("\n");
}

export const SENTIMENT_RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: { id: { type: "STRING" }, label: { type: "STRING", enum: TONES }, reason: { type: "STRING" } },
    required: ["id", "label", "reason"],
  },
};

export function buildSentimentUserText(inputs: SentimentInput[]): string {
  return inputs.map((i) => `id: ${i.id}\nsource: ${i.source}\nheadline: ${i.title}`).join("\n---\n");
}

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

/** Client call. Returns a map of id -> rating, or null when the AI layer is unavailable (the page then shows nothing). */
export async function fetchHeadlineSentiment(inputs: SentimentInput[], language: "he" | "en", fetcher: FetchLike = fetch as unknown as FetchLike): Promise<Map<string, SentimentItem> | null> {
  const items = inputs.slice(0, MAX_HEADLINES).map((i) => ({ id: i.id, title: safeSlice(i.title, 300), source: safeSlice(i.source, 80) }));
  if (items.length === 0) return null;
  try {
    const r = await fetcher("/api/news-sentiment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, language }) });
    if (!r.ok) return null;
    const j = (await r.json()) as { fallback?: boolean; items?: unknown };
    if (j.fallback) return null;
    const valid = validateSentiment(j.items, items);
    return valid.length ? new Map(valid.map((v) => [v.id, v])) : null;
  } catch { return null; }
}
