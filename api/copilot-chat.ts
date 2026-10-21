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

import { GEMINI_API_BASE, buildGatewayMessages, normalizeGatewayPayload, resolveGeminiConfig, type GatewayRequestPayload, type GeminiConfig } from "../src/lib/copilot/gatewayPrompt.js";
import { rephraseIntroducesNoNewFacts } from "../src/lib/copilot/gatewayPrompt.js";
import { buildStructuredRequest, parseStructuredResponse, verifyStructuredAnswer } from "../src/lib/copilot/structuredAnswer.js";
import { applyAdviceGuard } from "../src/lib/copilot/adviceGuard.js";
import { resolveBot, botPersonaLine } from "../src/lib/copilot/bots.js";
import { encodeFactsTrailer, VERDICT_OK, VERDICT_FALLBACK } from "../src/lib/copilot/streamGateway.js";
import { numbersIn, verifyNumbers } from "../src/lib/intelligence/verificationEngine.js";
import { streamText, tool, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

interface RawStreamResponse {
  write(chunk: string): void;
  end(): void;
}

const PUBLIC_ORIGIN = process.env.INVESTED_PUBLIC_ORIGIN ?? "https://investeducationai.vercel.app";

/** Server-side AI SDK tools: thin wrappers over our own deterministic data endpoints. Results are recorded as accepted facts for the number check. */
function buildCopilotTools(facts: string[]) {
  const record = (label: string, value: unknown) => {
    const text = `${label}: ${JSON.stringify(value)}`;
    facts.push(text.length > 800 ? `${text.slice(0, 800)}…` : text);
    return value;
  };
  const getJson = async (url: string) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) throw new Error(`tool_http_${res.status}`);
    return res.json() as Promise<unknown>;
  };
  return {
    get_market_quote: tool({
      description: "Get the latest verified quote for one ticker symbol from the InvestED market service.",
      inputSchema: z.object({ symbol: z.string().min(1).max(12).describe("Ticker symbol, e.g. VOO or AAPL") }),
      execute: async ({ symbol }) => record(`quote ${symbol.toUpperCase()}`, await getJson(`${PUBLIC_ORIGIN}/api/market-quote?symbols=${encodeURIComponent(symbol.toUpperCase())}&range=5d`)),
    }),
    get_market_movers: tool({
      description: "Get today's verified market movers from the InvestED market service.",
      inputSchema: z.object({}),
      execute: async () => record("market movers", await getJson(`${PUBLIC_ORIGIN}/api/market-movers`)),
    }),
    get_top_headlines: tool({
      description: "Get the latest verified financial headlines from the InvestED news service.",
      inputSchema: z.object({}),
      execute: async () => record("headlines", await getJson(`${PUBLIC_ORIGIN}/api/news-feeds?limit=5`)),
    }),
  };
}

/** Stream mode: AI SDK streamText with tool-calling, persona from the bot registry, then the same no-new-facts verdict as the JSON path, sent as a trailer. */
async function streamRephrase(payload: GatewayRequestPayload, config: GeminiConfig, res: CopilotChatResponse, botId: unknown): Promise<void> {
  const raw = res as unknown as RawStreamResponse;
  const facts: string[] = [];
  const bot = resolveBot(botId);
  const allTools = buildCopilotTools(facts);
  const tools = bot.tools ? Object.fromEntries(Object.entries(allTools).filter(([id]) => bot.tools!.includes(id))) : allTools;
  const finish = (verdict: string) => { raw.write(verdict); raw.end(); };
  try {
    const provider = createGoogleGenerativeAI({ apiKey: config.apiKey });
    const messages = buildGatewayMessages(payload);
    const lang = payload.language === "he" ? "he" : "en";
    const result = streamText({
      model: provider(config.model),
      system: `${messages[0].content}\n${botPersonaLine(bot, lang)}`,
      prompt: messages[1].content,
      temperature: 0.2,
      tools,
      stopWhen: stepCountIs(3),
    });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    let text = "";
    for await (const chunk of result.textStream) {
      text += chunk;
      raw.write(chunk);
    }
    const trimmed = text.trim();
    const numbersOk = verifyNumbers(numbersIn(trimmed).join(" "), [payload.answer, JSON.stringify(payload.facts ?? {}), payload.question, ...facts]).ok;
    const factsOk = rephraseIntroducesNoNewFacts(payload.answer, payload.facts, trimmed);
    const guard = applyAdviceGuard(trimmed);
    if (!trimmed || !numbersOk || !factsOk || guard.guarded) return finish(`${VERDICT_FALLBACK}`);
    return finish(`${encodeFactsTrailer(facts)}${VERDICT_OK}`);
  } catch {
    return finish(VERDICT_FALLBACK);
  }
}

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

  // Stream mode opt-in; requires a raw Node-style response (production). Test
  // doubles without write() keep the legacy JSON path.
  const wantsStream = (req.body as { stream?: unknown })?.stream === true;
  if (wantsStream && typeof (res as unknown as Partial<RawStreamResponse>).write === "function") {
    return streamRephrase(payload, config, res, (req.body as { botId?: unknown })?.botId);
  }

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${config.model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(buildStructuredRequest(payload)),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
    if (!response.ok) {
      // 403 = key/quota problem, 429 = free-tier rate limit. Both are
      // expected operating states, not errors: the deterministic answer stands.
      return res.status(200).json({ fallback: true, reason: `gemini_${response.status}` });
    }
    // Gemini is held to a JSON schema (text + numbers used). Every number it
    // quotes must trace to the validated answer or fact set, or we fall back.
    const verdict = verifyStructuredAnswer(payload, parseStructuredResponse(await response.json()));
    if (!verdict.ok) return res.status(200).json({ fallback: true, reason: verdict.reason });
    const text = verdict.text;
    // Deterministic advice guard: no buy/sell directives, personalized sizing or guaranteed returns.
    const guard = applyAdviceGuard(text);
    if (guard.guarded) {
      console.warn("advice_guard_rejection", JSON.stringify({ violations: guard.violations }));
      return res.status(200).json({ text: guard.text, guarded: true });
    }
    return res.status(200).json({ text });
  } catch {
    return res.status(200).json({ fallback: true, reason: "gemini_unreachable" });
  }
}
