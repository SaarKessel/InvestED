// ---------------------------------------------------------------------------
// InvestED — /api/copilot-chat (facelift Phase 1)
//
// Rephrase-only bridge to the Vercel AI Gateway. The browser sends the
// deterministic engines' validated answer plus the exact fact set; this
// endpoint asks the gateway model to rephrase it under a strict
// no-new-facts system prompt and returns the rephrased text.
//
// The endpoint NEVER invents content: any failure — missing config,
// gateway 403/429 (free-tier quota/rate limit), timeout, malformed
// response — returns { fallback: true } and the client keeps the
// deterministic answer unchanged. The site works with the gateway off.
//
// Auth: AI_GATEWAY_API_KEY when set (local dev / explicit key), else the
// deployment's VERCEL_OIDC_TOKEN. Model: AI_GATEWAY_MODEL; leave unset to
// ship dark until the free-tier model is confirmed in the dashboard.
//
// Rate limiting: Hobby plans get ONE WAF rate-limit rule (already used by
// market-api-rate-limit), so this endpoint carries a best-effort
// per-instance limiter (20 req/60s/client IP). Per-region, same caveat as
// Vercel's own counters. POST /api/copilot-chat
// ---------------------------------------------------------------------------

import {
  buildGatewayMessages,
  normalizeGatewayPayload,
  parseGatewayResponse,
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

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
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

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || "";
  const model = process.env.AI_GATEWAY_MODEL || "";
  if (!token || !model) return res.status(200).json({ fallback: true, reason: "not_configured" });

  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: buildGatewayMessages(payload) }),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
    if (!response.ok) {
      // 403 = model outside the free tier, 429 = quota/rate limit. Both are
      // expected operating states, not errors: the deterministic answer stands.
      return res.status(200).json({ fallback: true, reason: `gateway_${response.status}` });
    }
    const text = parseGatewayResponse(await response.json());
    if (!text) return res.status(200).json({ fallback: true, reason: "empty_completion" });
    return res.status(200).json({ text });
  } catch {
    return res.status(200).json({ fallback: true, reason: "gateway_unreachable" });
  }
}
