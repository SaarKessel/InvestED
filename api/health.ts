// InvestED — /api/health
// Read-only provider health: each upstream is probed once with a short timeout and reported as
// ok / down with latency. No secrets are used or returned. The daily_feed check reads the public
// table with the public key and reports the newest feed date, so a stalled cron is visible.

interface Res { setHeader(n: string, v: string): void; status(c: number): { json(b: unknown): void } }

const TIMEOUT_MS = 5000;
const SUPABASE = process.env.VITE_SUPABASE_URL || "https://yltbcsmkpjosyovsvtmn.supabase.co";

async function probe(name: string, url: string, headers: Record<string, string> = {}, verify?: (t: string) => string | null) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { "User-Agent": "InvestED-health/1.0", ...headers }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = await r.text();
    const bad = !r.ok ? `http ${r.status}` : verify ? verify(body) : null;
    return { name, ok: !bad, ms: Date.now() - t0, ...(bad ? { detail: bad } : {}) };
  } catch (e) {
    return { name, ok: false, ms: Date.now() - t0, detail: e instanceof Error ? e.name : "error" };
  }
}

export default async function handler(_req: unknown, res: Res) {
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_mmnIVK2ZxZ79gcqSrER-Aw_UxV5WF9q"; // public publishable key, already in the client bundle;
  const checks = await Promise.all([
    probe("yahoo_finance", "https://query1.finance.yahoo.com/v8/finance/chart/SPY?range=5d&interval=1d", {}, (t) => (t.includes('"regularMarketPrice"') ? null : "no price")),
    probe("frankfurter", "https://api.frankfurter.app/latest?from=USD&to=ILS", {}, (t) => (t.includes('"ILS"') ? null : "no rate")),
    probe("world_bank", "https://api.worldbank.org/v2/country/ISR/indicator/NY.GDP.MKTP.CD?format=json&per_page=1", {}, (t) => (t.startsWith("[") ? null : "bad body")),
    probe("rss_federal_reserve", "https://www.federalreserve.gov/feeds/press_all.xml", {}, (t) => (t.includes("<item") ? null : "no items")),
    key
      ? probe("daily_feed", `${SUPABASE}/rest/v1/daily_feed?select=feed_date&order=feed_date.desc&limit=1`, { apikey: key, Authorization: `Bearer ${key}` }, (t) => {
          const d = /"feed_date":"(\d{4}-\d{2}-\d{2})"/.exec(t)?.[1];
          if (!d) return "no rows";
          const age = (Date.now() - Date.parse(d)) / 86_400_000;
          return age > 3 ? `stale ${Math.floor(age)}d (${d})` : null;
        })
      : Promise.resolve({ name: "daily_feed", ok: false, ms: 0, detail: "public key not configured" }),
  ]);
  res.setHeader("Cache-Control", "public, max-age=30");
  res.status(200).json({ checkedAt: new Date().toISOString(), allOk: checks.every((c) => c.ok), checks });
}
