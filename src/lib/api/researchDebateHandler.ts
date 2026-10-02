// POST /api/research-debate: educational bull / bear / risk / "what would change my mind" card from the facts the page already fetched.
// Served through /api/system (function cap). One schema-constrained Gemini call; every line is validated; any failure returns { fallback: true }.
import { GEMINI_API_BASE, resolveGeminiConfig } from "../copilot/gatewayPrompt.js";
import { parseFileResponse } from "../copilot/fileAnalysis.js";
import { buildDebateSystemPrompt, buildDebateUserText, DEBATE_RESPONSE_SCHEMA, validateDebate } from "../research/investmentDebate.js";
import { parseFacts } from "./researchBriefHandler.js";

interface Req { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }

const hits = new Map<string, { start: number; count: number }>();
function limited(key: string, now: number): boolean {
  const h = hits.get(key);
  if (!h || now - h.start >= 60_000) { hits.set(key, { start: now, count: 1 }); if (hits.size > 5000) hits.clear(); return false; }
  h.count += 1; return h.count > 5;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const f = req.headers?.["x-forwarded-for"]; const ip = ((Array.isArray(f) ? f[0] : f) ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip, Date.now())) return res.status(429).json({ fallback: true, reason: "rate_limited" });
  const b = (req.body ?? {}) as { facts?: unknown; language?: unknown };
  const facts = parseFacts(b.facts);
  if (!facts) return res.status(400).json({ error: "invalid_payload" });
  const language = b.language === "he" ? "he" : "en";
  const config = resolveGeminiConfig(process.env);
  if (!config) return res.status(200).json({ fallback: true, reason: "auth_not_configured" });
  try {
    const r = await fetch(`${GEMINI_API_BASE}/${config.model}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildDebateSystemPrompt(language) }] },
        contents: [{ role: "user", parts: [{ text: buildDebateUserText(facts) }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: DEBATE_RESPONSE_SCHEMA },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return res.status(200).json({ fallback: true, reason: `gemini_${r.status}` });
    const text = parseFileResponse(await r.json());
    if (!text) return res.status(200).json({ fallback: true, reason: "empty_completion" });
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return res.status(200).json({ fallback: true, reason: "bad_json" }); }
    const debate = validateDebate(parsed, facts, language);
    return res.status(200).json(debate ? { debate } : { fallback: true, reason: "no_valid_items" });
  } catch { return res.status(200).json({ fallback: true, reason: "gemini_unreachable" }); }
}
