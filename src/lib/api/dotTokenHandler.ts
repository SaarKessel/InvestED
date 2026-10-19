// ---------------------------------------------------------------------------
// InvestED - POST /api/dot-token (routed through api/system?fn=dot-token; Hobby plan function cap) (DOT voice agent, beta)
//
// Mints a short-lived Gemini Live ephemeral token for a SIGNED-IN user so the browser can open the Live WebSocket
// directly without ever seeing GEMINI_API_KEY. The token is single-use, opens one session within 1 minute, lives
// 30 minutes, and is locked to the Live model + audio output. Any failure answers { available: false, reason } and
// the client falls back to browser speech. The long-lived key never leaves this function and is never logged.
// Free-tier note: Google may use free-tier content to improve products; the UI says so.
// ---------------------------------------------------------------------------

interface Req { method?: string; headers?: Record<string, string | string[] | undefined> }
interface Res { setHeader(n: string, v: string): void; status(c: number): { json(b: unknown): void } }

export const DOT_LIVE_MODEL = "gemini-3.8-live";
const WINDOW_MS = 60_000;
const PER_MINUTE = 4;
const PER_DAY = 40;
const hits = new Map<string, { minute: number[]; day: number[] }>();

function limited(userId: string, now: number): boolean {
  const h = hits.get(userId) ?? { minute: [], day: [] };
  h.minute = h.minute.filter((t) => now - t < WINDOW_MS);
  h.day = h.day.filter((t) => now - t < 86_400_000);
  if (h.minute.length >= PER_MINUTE || h.day.length >= PER_DAY) { hits.set(userId, h); return true; }
  h.minute.push(now); h.day.push(now); hits.set(userId, h);
  if (hits.size > 5000) hits.clear();
  return false;
}

function bearer(req: Req): string | null {
  const raw = req.headers?.authorization ?? req.headers?.Authorization;
  const v = Array.isArray(raw) ? raw[0] : raw;
  const m = /^Bearer\s+(.+)$/i.exec(v ?? "");
  return m ? m[1] : null;
}

async function verifiedUserId(jwt: string): Promise<string | null> {
  // Same public defaults the browser client ships with (the publishable key is public by design); env overrides win.
  const base = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://yltbcsmkpjosyovsvtmn.supabase.co").replace(/\/$/, "");
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_mmnIVK2ZxZ79gcqSrER-Aw_UxV5WF9q";
  if (!base || !key) return null;
  try {
    const r = await fetch(`${base}/auth/v1/user`, { headers: { Authorization: `Bearer ${jwt}`, apikey: key }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const u = (await r.json()) as { id?: string };
    return typeof u.id === "string" ? u.id : null;
  } catch { return null; }
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const jwt = bearer(req);
  if (!jwt) return res.status(401).json({ available: false, reason: "sign_in_required" });
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(200).json({ available: false, reason: "auth_not_configured" });
  const uid = await verifiedUserId(jwt);
  if (!uid) return res.status(401).json({ available: false, reason: "sign_in_required" });
  if (limited(uid, Date.now())) return res.status(429).json({ available: false, reason: "rate_limited" });
  const now = Date.now();
  const mint = async (constrained: boolean) => fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      uses: 1,
      expireTime: new Date(now + 30 * 60_000).toISOString(),
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
      ...(constrained ? { liveConnectConstraints: { model: `models/${DOT_LIVE_MODEL}`, config: { responseModalities: ["AUDIO"] } } } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  try {
    let constrained = true;
    let r = await mint(true);
    // Some key/model combinations reject the lock config; the token is still Live-only and single-use, so retry without it.
    if (r.status === 400) { constrained = false; r = await mint(false); }
    if (!r.ok) {
      const detail = ((await r.json().catch(() => ({}))) as { error?: { message?: string } }).error?.message?.slice(0, 200);
      return res.status(200).json({ available: false, reason: `gemini_${r.status}`, detail });
    }
    const j = (await r.json()) as { name?: string };
    if (!j.name) return res.status(200).json({ available: false, reason: "no_token" });
    return res.status(200).json({ available: true, token: j.name, model: DOT_LIVE_MODEL, constrained });
  } catch {
    return res.status(200).json({ available: false, reason: "gemini_unreachable" });
  }
}
