// POST /api/describe-file: image/PDF question to the free Gemini tier. Only reached after the user's
// explicit in-app consent (the file goes to Google). Nothing is stored. Any failure returns { fallback: true }.
import { GEMINI_API_BASE, resolveGeminiConfig } from "../src/lib/copilot/gatewayPrompt.js";
import { buildFileRequest, normalizeFilePayload, parseFileResponse } from "../src/lib/copilot/fileAnalysis.js";

interface Req { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }

const TIMEOUT_MS = 25_000;
const WINDOW_MS = 60_000;
const MAX_HITS = 6;
const hits = new Map<string, { start: number; count: number }>();
function ip(req: Req): string { const f = req.headers?.["x-forwarded-for"]; const first = Array.isArray(f) ? f[0] : f; return (first ?? "").split(",")[0].trim() || "unknown"; }
function limited(key: string, now: number): boolean {
  const h = hits.get(key);
  if (!h || now - h.start >= WINDOW_MS) { hits.set(key, { start: now, count: 1 }); if (hits.size > 5000) hits.clear(); return false; }
  h.count += 1; return h.count > MAX_HITS;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (limited(ip(req), Date.now())) return res.status(429).json({ fallback: true, reason: "rate_limited" });
  const payload = normalizeFilePayload(req.body);
  if (!payload) return res.status(400).json({ error: "invalid_payload" });
  const config = resolveGeminiConfig(process.env);
  if (!config) return res.status(200).json({ fallback: true, reason: "auth_not_configured" });
  try {
    const r = await fetch(`${GEMINI_API_BASE}/${config.model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(buildFileRequest(payload)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!r.ok) return res.status(200).json({ fallback: true, reason: `gemini_${r.status}` });
    const text = parseFileResponse(await r.json());
    if (!text) return res.status(200).json({ fallback: true, reason: "empty_completion" });
    return res.status(200).json({ text });
  } catch {
    return res.status(200).json({ fallback: true, reason: "gemini_unreachable" });
  }
}
