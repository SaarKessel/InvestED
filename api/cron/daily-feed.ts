// ---------------------------------------------------------------------------
// InvestED - /api/cron/daily-feed
//
// Scheduled by Vercel Cron (see vercel.json). Reads the site's own market-movers and news endpoints
// and stores today's snapshot in the Supabase table daily_feed with the service-role key.
//
// Safety:
// - Requires "Authorization: Bearer <CRON_SECRET>" (Vercel adds it to cron calls). With no CRON_SECRET
//   configured the endpoint refuses everything.
// - The service-role key stays in server environment variables. It is never returned, logged or
//   sent to the browser.
// - Real data only. A source that is unavailable stores nothing and is reported as skipped.
// ---------------------------------------------------------------------------

import { feedDate, headlinesRow, moversRow, type FeedRow } from "../../src/lib/feed/dailyFeed.js";

interface Req { method?: string; headers: Record<string, string | string[] | undefined> }
interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }

const header = (req: Req, name: string): string => { const v = req.headers[name]; return Array.isArray(v) ? v[0] ?? "" : v ?? ""; };

async function getJson(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { accept: "application/json" } });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  const secret = process.env.CRON_SECRET;
  if (!secret) { res.status(500).json({ error: "cron_not_configured" }); return; }
  if (header(req, "authorization") !== `Bearer ${secret}`) { res.status(401).json({ error: "unauthorized" }); return; }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://yltbcsmkpjosyovsvtmn.supabase.co";
  if (!key) { res.status(500).json({ error: "service_key_missing" }); return; }

  const host = header(req, "host");
  if (!host) { res.status(400).json({ error: "no_host" }); return; }
  const origin = `https://${host}`;
  const now = new Date(), date = feedDate(now), iso = now.toISOString();
  const [movers, news] = await Promise.all([getJson(`${origin}/api/market-movers`), getJson(`${origin}/api/news`)]);
  const candidates: [string, FeedRow | null][] = [
    ["market_movers", moversRow(date, iso, movers as never)],
    ["headlines", headlinesRow(date, iso, news as never)],
  ];
  const rows = candidates.map(([, r]) => r).filter((r): r is FeedRow => !!r);
  const skipped = candidates.filter(([, r]) => !r).map(([k]) => k);
  if (rows.length === 0) { res.status(502).json({ ok: false, date, stored: [], skipped }); return; }

  const w = await fetch(`${base}/rest/v1/daily_feed?on_conflict=feed_date,kind`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!w || !w.ok) { res.status(502).json({ ok: false, date, error: "store_failed", status: w?.status ?? null }); return; }
  res.status(200).json({ ok: true, date, stored: rows.map((r) => r.kind), skipped, at: iso });
}
