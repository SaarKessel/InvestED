// POST /api/news-summary: short educational summary of ONE headline via free Gemini. Headline text only (no article is fetched).
// The reply may not contain any number or ticker that is not in the headline; otherwise { fallback: true }.
import { GEMINI_API_BASE, rephraseIntroducesNoNewFacts, resolveGeminiConfig } from "../src/lib/copilot/gatewayPrompt.js";
import { parseFileResponse } from "../src/lib/copilot/fileAnalysis.js";

interface Req { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }
const hits = new Map<string, { start: number; count: number }>();
function limited(key: string, now: number): boolean {
  const h = hits.get(key);
  if (!h || now - h.start >= 60_000) { hits.set(key, { start: now, count: 1 }); if (hits.size > 5000) hits.clear(); return false; }
  h.count += 1; return h.count > 8;
}
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const f = req.headers?.["x-forwarded-for"]; const ip = ((Array.isArray(f) ? f[0] : f) ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip, Date.now())) return res.status(429).json({ fallback: true, reason: "rate_limited" });
  const b = (req.body ?? {}) as Record<string, unknown>;
  const title = str(b.title, 300), source = str(b.source, 80), label = str(b.eventLabel, 60);
  const language = b.language === "he" ? "he" : "en";
  if (!title) return res.status(400).json({ error: "invalid_payload" });
  const config = resolveGeminiConfig(process.env);
  if (!config) return res.status(200).json({ fallback: true, reason: "auth_not_configured" });
  const system = ["You write a two-sentence educational note about ONE news headline for InvestED+.",
    "Use only the words of the headline and the source. Do not add numbers, names, causes or predictions that are not in the headline.",
    "Say what happened in plain words, then one sentence on why investors usually watch this kind of event. No advice. No buy or sell language.",
    `Reply in ${language === "he" ? "Hebrew" : "English"}.`].join("\n");
  try {
    const r = await fetch(`${GEMINI_API_BASE}/${config.model}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: `Headline: ${title}\nSource: ${source}\nEvent type: ${label}` }] }] }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!r.ok) return res.status(200).json({ fallback: true, reason: `gemini_${r.status}` });
    const text = parseFileResponse(await r.json());
    if (!text) return res.status(200).json({ fallback: true, reason: "empty_completion" });
    if (!rephraseIntroducesNoNewFacts(`${title} ${source} ${label}`, {} as never, text)) return res.status(200).json({ fallback: true, reason: "fact_mismatch" });
    return res.status(200).json({ text });
  } catch { return res.status(200).json({ fallback: true, reason: "gemini_unreachable" }); }
}
