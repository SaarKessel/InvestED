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
import { buildGatewayFacts } from "./gatewayPrompt";

const DEFAULT_TIMEOUT_MS = 8_000;

interface RephraseSuccess {
  text?: unknown;
  fallback?: unknown;
}

export async function rephraseWithGateway(
  question: string,
  language: ConversationLanguage,
  response: CopilotResponse,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
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
