// ---------------------------------------------------------------------------
// InvestED - educational scenario brief for the asset research page
//
// Three sections (positives / concerns / outlook scenarios) written from REAL
// fetched data only: price moves from the grounded history, the indicators the
// research engine already computed, and the /news headlines that name the
// symbol. Basic financials have no provider, so they are listed as
// unavailable, never filled in.
//
// The wording is an AI estimate ("AI estimate" label in the UI). It is
// scenario analysis, never a price prediction: any text with a forecast
// phrase, advice phrase or a number that is not in the facts is rejected.
//
// Structure inspired by FinGPT-Forecaster
// (https://github.com/AI4Finance-Foundation/FinGPT, MIT License). The idea of
// positives / concerns / outlook is used; no code, prompt text or weights were
// copied, and no price prediction is made.
// ---------------------------------------------------------------------------

import type { AssetResearch } from "./assetResearchEngine";

export interface BriefHeadline { title: string; publishedAt: string; source?: string }
export interface BriefFacts { symbol: string; name: string; lines: string[]; unavailable: string[] }
export interface ScenarioBrief { positives: string[]; concerns: string[]; outlook: string[] }

const pct = (a: number, b: number) => ((a / b - 1) * 100);
const fmt = (n: number) => n.toFixed(2);
const closeOf = (c: { close?: number }) => (typeof c.close === "number" && Number.isFinite(c.close) ? c.close : null);

/** Percent move over the last `n` observations, or null when history is too short. */
export function moveOver(history: AssetResearch["history"], n: number): number | null {
  if (history.length <= n) return null;
  const last = closeOf(history[history.length - 1]), first = closeOf(history[history.length - 1 - n]);
  return last !== null && first !== null && first > 0 ? pct(last, first) : null;
}

/** The only facts the brief may use. Every line is computed from fetched data; missing inputs are listed, not filled. */
export function buildBriefFacts(research: AssetResearch, headlines: BriefHeadline[]): BriefFacts {
  const lines: string[] = [];
  const unavailable: string[] = ["basic financials (no reliable provider)"];
  lines.push(`Last price ${fmt(research.quote.price)} ${research.quote.currency ?? ""}, daily change ${fmt(research.quote.changePercent)}%.`.replace("  ", " "));
  for (const [n, label] of [[5, "5 observations"], [20, "20 observations"], [60, "60 observations"]] as const) {
    const m = moveOver(research.history, n);
    if (m === null) unavailable.push(`move over ${label} (history too short)`); else lines.push(`Move over the last ${label}: ${fmt(m)}%.`);
  }
  const i = research.indicators;
  if (i.rsi14.status === "available") lines.push(`RSI(14) is ${fmt(i.rsi14.value as number)}.`); else unavailable.push("RSI(14)");
  if (i.volatilityPct.status === "available") lines.push(`Volatility is ${fmt(i.volatilityPct.value as number)}%.`); else unavailable.push("volatility");
  for (const [k, label] of [["sma20", "SMA20"], ["sma50", "SMA50"]] as const) {
    const v = i[k];
    if (v.status === "available") lines.push(`${label} is ${fmt(v.value as number)} (price is ${research.quote.price >= (v.value as number) ? "above" : "below"} it).`); else unavailable.push(label);
  }
  const hl = headlines.slice(0, 5);
  if (hl.length === 0) unavailable.push("news (no recent headline names this symbol)");
  hl.forEach((h) => lines.push(`Headline (${h.publishedAt.slice(0, 10)}): ${h.title}`));
  return { symbol: research.symbol, name: research.name, lines, unavailable };
}

export const BRIEF_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    positives: { type: "ARRAY", items: { type: "STRING" } },
    concerns: { type: "ARRAY", items: { type: "STRING" } },
    outlook: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["positives", "concerns", "outlook"],
};

export function buildBriefSystemPrompt(language: "he" | "en"): string {
  return [
    "You write a short educational scenario brief about one asset for InvestED+, using ONLY the facts listed by the user.",
    "Return three lists: positives (up to 3), concerns (up to 3), outlook (up to 2).",
    "Every item is one plain sentence of at most 25 words. Use only numbers and names from the facts.",
    "Outlook items are conditional scenarios in the form 'if X continues, Y may follow', never a forecast, price target or probability.",
    "Never say buy, sell, hold, or that the price will rise or fall. Never mention data that is not in the facts. Items about unavailable data must say it is unavailable.",
    `Write in ${language === "he" ? "Hebrew" : "English"}.`,
  ].join("\n");
}

export function buildBriefUserText(f: BriefFacts): string {
  return `Asset: ${f.name} (${f.symbol})\nFacts:\n${f.lines.map((l) => `- ${l}`).join("\n")}\nUnavailable (do not guess): ${f.unavailable.join("; ")}`;
}

const FORBIDDEN = /\b(price target|will (rise|fall|go up|go down|double|crash|surge|drop)|guaranteed?|buy now|should (buy|sell)|strong (buy|sell)|sell now|undervalued|overvalued)\b|(?:^|\s)(קנה|מכור|יעד מחיר|בטוח שיעלה|בטוח שירד|יעלה ל|ירד ל)(?:\s|$|[.,])/i;
const FOREIGN = /[\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF]/;

function cleanList(raw: unknown, max: number, factsText: string): string[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set((factsText.replace(/,/g, "").match(/\d+(\.\d+)?/g) ?? []));
  const symbols = new Set(factsText.match(/\b[A-Z]{2,6}\b/g) ?? []);
  const out: string[] = [];
  for (const r of raw) {
    if (typeof r !== "string") continue;
    const s = r.trim();
    if (!s || s.length > 220 || FORBIDDEN.test(s)) continue;
    if (FOREIGN.test(s) && !FOREIGN.test(factsText)) continue;
    if (!(s.replace(/,/g, "").match(/\d+(\.\d+)?/g) ?? []).every((n) => allowed.has(n))) continue;
    if (!(s.match(/\b[A-Z]{2,6}\b/g) ?? []).every((t) => symbols.has(t))) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Validate model output against the facts. Returns null when nothing usable remains (the UI then shows only the facts). */
export function validateBrief(raw: unknown, facts: BriefFacts): ScenarioBrief | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const text = `${facts.name} ${facts.symbol} ${facts.lines.join(" ")}`;
  const brief = { positives: cleanList(r.positives, 3, text), concerns: cleanList(r.concerns, 3, text), outlook: cleanList(r.outlook, 2, text) };
  return brief.positives.length + brief.concerns.length + brief.outlook.length === 0 ? null : brief;
}

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export async function fetchScenarioBrief(facts: BriefFacts, language: "he" | "en", fetcher: FetchLike = fetch as unknown as FetchLike): Promise<ScenarioBrief | null> {
  try {
    const r = await fetcher("/api/research-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts, language }) });
    if (!r.ok) return null;
    const j = (await r.json()) as { fallback?: boolean; brief?: unknown };
    return j.fallback ? null : validateBrief(j.brief, facts);
  } catch { return null; }
}
