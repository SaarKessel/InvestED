// ---------------------------------------------------------------------------
// InvestED - schema-constrained rephrase + number verification
//
// Gemini is asked (responseSchema) to return JSON: the reworded text plus the
// list of every number that text quotes. Server side we then check that
//   1. the JSON parses and has the right shape,
//   2. the declared list matches the numbers really in the text (the model
//      cannot hide a number by leaving it off the list),
//   3. every declared number already exists in the engine's validated answer
//      or fact set (the same rule the engine applies everywhere).
// Any failure returns a reason and the caller keeps the engine answer.
// ---------------------------------------------------------------------------

import {
  buildGeminiRequest,
  MAX_REPHRASED_LENGTH,
  rephraseIntroducesNoNewFacts,
  type GatewayRequestPayload,
  type GeminiRequestBody,
} from "./gatewayPrompt.js";
import { numbersIn, verifyNumbers } from "../intelligence/verificationEngine.js";

export const STRUCTURED_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    text: { type: "STRING" },
    numbersUsed: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["text", "numbersUsed"],
};

const STRUCTURE_RULE =
  'Reply as JSON with two fields: "text" (the rephrased answer) and "numbersUsed" (every number that appears in "text", each written exactly as in the text; an empty list if there are none).';

export type StructuredRequestBody = GeminiRequestBody & {
  generationConfig: { temperature: number; responseMimeType: string; responseSchema: typeof STRUCTURED_RESPONSE_SCHEMA };
};

/** The normal rephrase request, plus a JSON-only response schema. */
export function buildStructuredRequest(payload: GatewayRequestPayload): StructuredRequestBody {
  const base = buildGeminiRequest(payload);
  const system = `${base.systemInstruction.parts[0].text}\n${STRUCTURE_RULE}`;
  return {
    ...base,
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: STRUCTURED_RESPONSE_SCHEMA },
  };
}

export interface StructuredAnswer { text: string; numbersUsed: string[] }

/** Read the JSON the model returned from a generateContent body; null = unusable. */
export function parseStructuredResponse(body: unknown): StructuredAnswer | null {
  if (!body || typeof body !== "object") return null;
  const candidates = (body as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const parts = (candidates[0] as { content?: { parts?: { text?: unknown }[] } }).content?.parts;
  if (!Array.isArray(parts)) return null;
  const raw = parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim();
  if (!raw) return null;
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return null; }
  if (!json || typeof json !== "object") return null;
  const { text, numbersUsed } = json as { text?: unknown; numbersUsed?: unknown };
  if (typeof text !== "string" || !Array.isArray(numbersUsed)) return null;
  if (!numbersUsed.every((n) => typeof n === "string" || typeof n === "number")) return null;
  const clean = text.trim();
  if (!clean || clean.length > MAX_REPHRASED_LENGTH) return null;
  return { text: clean, numbersUsed: numbersUsed.map(String) };
}

export type StructuredVerdict = { ok: true; text: string } | { ok: false; reason: "bad_structure" | "undeclared_number" | "number_mismatch" | "fact_mismatch" };

/** Accept the structured answer only when every quoted number traces to the engine's answer or facts. */
export function verifyStructuredAnswer(payload: GatewayRequestPayload, parsed: StructuredAnswer | null): StructuredVerdict {
  if (!parsed) return { ok: false, reason: "bad_structure" };
  const inText = new Set(numbersIn(parsed.text));
  const declared = new Set(parsed.numbersUsed.flatMap((n) => numbersIn(n)));
  for (const n of inText) if (!declared.has(n)) return { ok: false, reason: "undeclared_number" };
  const sources = [payload.answer, JSON.stringify(payload.facts ?? {}), payload.question];
  if (!verifyNumbers([...declared].join(" "), sources).ok) return { ok: false, reason: "number_mismatch" };
  if (!rephraseIntroducesNoNewFacts(payload.answer, payload.facts, parsed.text)) return { ok: false, reason: "fact_mismatch" };
  return { ok: true, text: parsed.text };
}
