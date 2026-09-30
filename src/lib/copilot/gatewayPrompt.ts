// ---------------------------------------------------------------------------
// InvestED — AI Gateway prompt plumbing (facelift Phase 1)
//
// The deterministic engines stay the ONLY source of facts. These helpers
// build a strict rephrase-only request for the Vercel AI Gateway and
// validate what comes back. The model may rephrase the validated answer;
// it must never add numbers, assets, or claims of its own.
// ---------------------------------------------------------------------------

import type { ConversationLanguage, ConversationIntent } from "../conversationContext";
import type { CopilotResponse } from "../copilotResponse";

export interface GatewayAssetFact {
  symbol: string;
  price: number;
  changePercent: number;
  volatilityPct: number;
  rsi: number | null;
  isMock: boolean;
}

export interface GatewayFacts {
  intent: ConversationIntent;
  assets: GatewayAssetFact[];
  calculation: unknown;
  holdingValuation: unknown;
  purchasePower: unknown;
  strategies: string[];
  clarification: string | null;
}

export interface GatewayRequestPayload {
  question: string;
  language: ConversationLanguage;
  answer: string;
  facts: GatewayFacts;
}

export const MAX_QUESTION_LENGTH = 1000;
export const MAX_ANSWER_LENGTH = 4000;
export const MAX_REPHRASED_LENGTH = 6000;

/** Extract the compact fact set the model may rely on. Nothing else exists. */
export function buildGatewayFacts(response: CopilotResponse): GatewayFacts {
  return {
    intent: response.intent,
    assets: response.assets.map((asset) => ({
      symbol: asset.symbol,
      price: asset.price,
      changePercent: asset.changePercent,
      volatilityPct: asset.volatilityPct,
      rsi: asset.rsi,
      isMock: asset.isMock === true,
    })),
    calculation: response.calculation,
    holdingValuation: response.holdingValuation,
    purchasePower: response.purchasePower,
    strategies: response.strategies,
    clarification: response.clarification ? response.clarification.question : null,
  };
}

export function buildSystemPrompt(language: ConversationLanguage): string {
  const languageRule =
    language === "en"
      ? "Answer in English only."
      : language === "he"
        ? "Answer in Hebrew only (עברית בלבד)."
        : "Answer in the dominant language of the validated answer text.";
  return [
    "You are the voice of InvestED, a financial-education product.",
    "You receive a user question and a VALIDATED ANSWER produced by InvestED's deterministic engines, plus the exact fact set those engines used.",
    "Your only job: rephrase the validated answer so it reads naturally, warmly, and concisely.",
    "Hard rules:",
    "- Never add, remove, or alter any number, symbol, date, or claim. Every fact in your reply must come from the validated answer or the provided fact set.",
    "- Never give investment advice, predictions, or guarantees. Keep every disclaimer and uncertainty the validated answer carries.",
    "- Keep invented teaching numbers labeled as invented if the validated answer labels them.",
    "- Keep the same structure and roughly the same length as the validated answer; do not add sections, lists, or follow-up offers.",
    `- ${languageRule}`,
    "Return only the rephrased answer text. No preamble, no notes, no markdown fences.",
  ].join("\n");
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export function buildGatewayMessages(payload: GatewayRequestPayload): ChatMessage[] {
  return [
    { role: "system", content: buildSystemPrompt(payload.language) },
    {
      role: "user",
      content: [
        `USER QUESTION:\n${payload.question}`,
        `VALIDATED ANSWER (rephrase this):\n${payload.answer}`,
        `FACT SET (the only facts that exist):\n${JSON.stringify(payload.facts)}`,
      ].join("\n\n"),
    },
  ];
}

interface GatewayCompletionChoice {
  message?: { content?: unknown };
}

/** Pull the rephrased text out of an OpenAI-shaped response; null = keep the deterministic answer. */
export function parseGatewayResponse(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const content = (choices[0] as GatewayCompletionChoice).message?.content;
  if (typeof content !== "string") return null;
  const text = content.trim();
  if (!text || text.length > MAX_REPHRASED_LENGTH) return null;
  return text;
}

/** Validate and normalize an inbound payload; null = malformed. */
export function normalizeGatewayPayload(body: unknown): GatewayRequestPayload | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  if (typeof raw.question !== "string" || typeof raw.answer !== "string") return null;
  const question = raw.question.trim().slice(0, MAX_QUESTION_LENGTH);
  const answer = raw.answer.trim().slice(0, MAX_ANSWER_LENGTH);
  if (!question || !answer) return null;
  const language: ConversationLanguage =
    raw.language === "en" || raw.language === "he" || raw.language === "mixed" ? raw.language : "mixed";
  const facts = (raw.facts ?? {}) as GatewayFacts;
  return { question, answer, language, facts };
}
