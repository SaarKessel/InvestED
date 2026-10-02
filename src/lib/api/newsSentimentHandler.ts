// POST /api/news-sentiment: AI tone estimate for up to 12 headlines in one Gemini call (free key, structured JSON output).
// Headline text only (no article is fetched). Every rating is validated; invalid ones are dropped. Any failure returns
// { fallback: true } and the news page shows nothing extra. Served through /api/system (function cap), public URL by rewrite.
import { GEMINI_API_BASE, resolveGeminiConfig } from "../copilot/gatewayPrompt.js";
import { parseFileResponse } from "../copilot/fileAnalysis.js";
import { createTtlCache } from "../market/cache.js";
import { buildSentimentSystemPrompt, buildSentimentUserText, MAX_HEADLINES, SENTIMENT_RESPONSE_SCHEMA, validateSentiment, type SentimentInput, type SentimentItem } from "../news/sentiment.js";

interface Req { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }
interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }

const hits = new Map<string, { start: number; count: number }>();
function limited(key: string, now: number): boolean {
  const h = hits.get(key);
  if (!h || now - h.start >= 60_000) { hits.set(key, { start: now, count: 1 }); if (hits.size > 5000) hits.clear(); return false; }
  h.count += 1; return h.count > 6;
}
const cache = createTtlCache<SentimentItem>({ ttlMs: 6 * 60 * 60 * 1000 });
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const f = req.headers?.["x-forwarded-for"]; const ip = ((Array.isArray(f) ? f[0] : f) ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip, Date.now())) return res.status(429).json({ fallback: true, reason: "rate_limited" });

  const b = (req.body ?? {}) as { items?: unknown; language?: unknown };
  const language = b.language === "he" ? "he" : "en";
  const inputs: SentimentInput[] = (Array.isArray(b.items) ? b.items : []).slice(0, MAX_HEADLINES)
    .map((x) => ({ id: str((x as SentimentInput)?.id, 80), title: str((x as SentimentInput)?.title, 300), source: str((x as SentimentInput)?.source, 80) }))
    .filter((x) => x.id && x.title);
  if (inputs.length === 0) return res.status(400).json({ error: "invalid_payload" });

  const key = (i: SentimentInput) => `${language}:${i.title}`;
  const done: SentimentItem[] = [];
  const todo: SentimentInput[] = [];
  for (const i of inputs) { const c = cache.get(key(i)); if (c) done.push({ ...c, id: i.id }); else todo.push(i); }
  if (todo.length === 0) return res.status(200).json({ items: done });

  const config = resolveGeminiConfig(process.env);
  if (!config) return res.status(200).json({ fallback: true, reason: "auth_not_configured" });
  try {
    const r = await fetch(`${GEMINI_API_BASE}/${config.model}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSentimentSystemPrompt(language) }] },
        contents: [{ role: "user", parts: [{ text: buildSentimentUserText(todo) }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: SENTIMENT_RESPONSE_SCHEMA },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return res.status(200).json({ fallback: true, reason: `gemini_${r.status}` });
    const text = parseFileResponse(await r.json());
    if (!text) return res.status(200).json({ fallback: true, reason: "empty_completion" });
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return res.status(200).json({ fallback: true, reason: "bad_json" }); }
    const valid = validateSentiment(parsed, todo);
    for (const v of valid) { const input = todo.find((t) => t.id === v.id); if (input) cache.set(key(input), v); }
    const items = [...done, ...valid];
    if (items.length === 0) return res.status(200).json({ fallback: true, reason: "no_valid_ratings" });
    return res.status(200).json({ items });
  } catch { return res.status(200).json({ fallback: true, reason: "gemini_unreachable" }); }
}
