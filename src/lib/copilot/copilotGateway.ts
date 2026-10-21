// ---------------------------------------------------------------------------
// InvestED — client bridge to /api/copilot-chat (facelift Phase 1)
//
// Best-effort rephrase of the deterministic copilot answer through the
// server-side Gemini bridge. Returns null on ANY failure — network, timeout,
// fallback flag, malformed body — so callers always keep the deterministic
// answer. The AI layer is an enhancement, never a dependency.
// ---------------------------------------------------------------------------

import type { CopilotResponse } from "../copilotResponse";
import type { ConversationLanguage } from "../conversationContext";
import { buildGatewayFacts, type GatewayTurn } from "./gatewayPrompt";

const DEFAULT_TIMEOUT_MS = 8_000;

interface RephraseSuccess {
  text?: unknown;
  fallback?: unknown;
}

export async function rephraseWithGateway(
  question: string,
  language: ConversationLanguage,
  response: CopilotResponse,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  context?: GatewayTurn[]
): Promise<string | null> {
  try {
    const res = await fetch("/api/copilot-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        language,
        answer: response.text,
        facts: buildGatewayFacts(response),
        ...(context?.length ? { context } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as RephraseSuccess;
    if (body.fallback || typeof body.text !== "string") return null;
    const text = body.text.trim();
    return text ? text : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Stream mode (phase 2): progressive rephrase through the same endpoint.
// The server streams plain-text chunks and ends with a verdict trailer.
// onChunk receives the visible text so far for progressive display; the
// returned value is committed only after the server-side no-new-facts
// verdict arrives ok. Any failure -> null -> deterministic answer stands.
// ---------------------------------------------------------------------------

import { splitStreamTrailer, visibleStreamText, type StreamedRephrase } from "./streamGateway";

export interface StreamRephraseOptions {
  botId?: string;
  onChunk?: (visibleTextSoFar: string) => void;
  timeoutMs?: number;
  context?: GatewayTurn[];
}

export async function rephraseWithGatewayStream(
  question: string,
  language: ConversationLanguage,
  response: CopilotResponse,
  options: StreamRephraseOptions = {}
): Promise<StreamedRephrase | null> {
  try {
    const res = await fetch("/api/copilot-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        language,
        answer: response.text,
        facts: buildGatewayFacts(response),
        stream: true,
        ...(options.botId ? { botId: options.botId } : {}),
        ...(options.context?.length ? { context: options.context } : {}),
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS + 7_000),
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let raw = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
      options.onChunk?.(visibleStreamText(raw));
    }
    raw += decoder.decode();
    const parsed = splitStreamTrailer(raw);
    return parsed.ok ? parsed : null;
  } catch {
    return null;
  }
}
