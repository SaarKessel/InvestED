// ---------------------------------------------------------------------------
// InvestED — /api/copilot-chat (facelift Phase 1)
//
// Rephrase-only bridge to Gemini (generateContent). The browser sends the
// deterministic engines' validated answer plus the exact fact set; this
// endpoint asks the model to rephrase it under a strict no-new-facts
// system prompt and returns the rephrased text.
//
// The endpoint NEVER invents content: any failure — missing config,
// Gemini 403/429 (free-tier quota/rate limit), timeout, malformed
// response — returns { fallback: true } and the client keeps the
// deterministic answer unchanged. The site works with the AI layer off.
//
// Auth: GEMINI_API_KEY (a Google AI Studio key, server-side env only,
// never logged). Model: GEMINI_MODEL, defaulting to the free-tier
// DEFAULT_GEMINI_MODEL. No key = ships dark (auth_not_configured).
//
// Rate limiting: Hobby plans get ONE WAF rate-limit rule (already used by
// market-api-rate-limit), so this endpoint carries a best-effort
// per-instance limiter (20 req/60s/client IP). Per-region, same caveat as
// Vercel's own counters. POST /api/copilot-chat
// ---------------------------------------------------------------------------

import {
  buildGeminiRequest,
  GEMINI_API_BASE,
  normalizeGatewayPayload,
  parseGeminiResponse,
  rephrasePreservesFacts,
  resolveGeminiConfig,
} from "../src/lib/copilot/gatewayPrompt.js";

interface CopilotChatRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface CopilotChatResponse {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
}

const GATEWAY_TIMEOUT_MS = 10_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

// Best-effort per-instance bucket; cold starts simply reset it.
const ipHits = new Map<string, { windowStart: number; count: number }>();

function clientIp(req: CopilotChatRequest): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (first ?? "").split(",")[0].trim() || "unknown";
}

function isRateLimited(ip: string, now: number): boolean {
  const hit = ipHits.get(ip);
  if (!hit || now - hit.windowStart >= RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { windowStart: now, count: 1 });
    if (ipHits.size > 5000) ipHits.clear();
    return false;
  }
  hit.count += 1;
  return hit.count > RATE_LIMIT_MAX;
}

export default async function handler(req: CopilotChatRequest, res: CopilotChatResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  if (isRateLimited(clientIp(req), Date.now())) {
    return res.status(429).json({ fallback: true, reason: "rate_limited" });
  }

  const payload = normalizeGatewayPayload(req.body);
  if (!payload) return res.status(400).json({ error: "invalid_payload" });

  const config = resolveGeminiConfig(process.env);
  if (!config) return res.status(200).json({ fallback: true, reason: "auth_not_configured" });

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${config.model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(buildGeminiRequest(payload)),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
    if (!response.ok) {
      // 403 = key/quota problem, 429 = free-tier rate limit. Both are
      // expected operating states, not errors: the deterministic answer stands.
      return res.status(200).json({ fallback: true, reason: `gemini_${response.status}` });
    }
    const text = parseGeminiResponse(await response.json());
    if (!text) return res.status(200).json({ fallback: true, reason: "empty_completion" });
    // The model ASKED to preserve facts is not enough: verify every symbol
    // and number survived; any drift keeps the deterministic answer.
    if (!rephrasePreservesFacts(payload.facts, text)) {
      return res.status(200).json({ fallback: true, reason: "fact_mismatch" });
    }
    return res.status(200).json({ text });
  } catch {
    return res.status(200).json({ fallback: true, reason: "gemini_unreachable" });
  }
}
