// ---------------------------------------------------------------------------
// InvestED — /api/news-feeds
//
// Real-news engine: fetches an allow-listed set of public RSS feeds from
// central banks and regulators, treats the response as untrusted data and
// serves only sanitized headline + link + publisher + timestamp.
//
// - GET only, https only, fixed feed list (no user-supplied URLs), so this
//   endpoint cannot be used to fetch arbitrary addresses.
// - 8s timeout, 1 MB cap, content-type must be XML, final host must still be
//   the feed host after redirects.
// - Nothing is executed or rendered as HTML; no keys, no accounts, no paid
//   sources. Any failure shows as an unavailable feed, never as mock news.
// ---------------------------------------------------------------------------
import { createTtlCache } from "../src/lib/market/cache.js";
import { MAX_FEED_BYTES, RSS_FEEDS, parseFeed, type RssFeedSpec } from "../src/lib/news/rssFeeds.js";
import { normalizeNewsFeed, eventTypeLabel, type NewsEvent } from "../src/lib/newsIntelligence.js";

interface Res { setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }

const CACHE_TTL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 8000;
const SERVED = 16;
const USER_AGENT = "InvestED-NewsReader/1.0 (educational site; headlines and links only; https://investeducationai.vercel.app/)";

export type FeedStatus = { id: string; publisher: string; ok: boolean; count: number; reason?: string };
export interface RssNewsPayload {
  available: boolean;
  feedProvider: "public_rss";
  items: Array<NewsEvent & { eventLabel: { he: string; en: string } }>;
  feeds: FeedStatus[];
  fetchedAt: string;
}

const cache = createTtlCache<RssNewsPayload>({ ttlMs: CACHE_TTL_MS });

async function readCapped(response: Response): Promise<string | null> {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_FEED_BYTES) return null;
  const reader = response.body?.getReader();
  if (!reader) { const t = await response.text(); return t.length > MAX_FEED_BYTES ? null : t; }
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_FEED_BYTES) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

async function loadFeed(spec: RssFeedSpec) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(spec.url, { headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml" }, signal: controller.signal, redirect: "follow" });
    if (!response.ok) return { status: { id: spec.id, publisher: spec.publisher, ok: false, count: 0, reason: `http_${response.status}` }, items: [] };
    const finalHost = new URL(response.url || spec.url).hostname.toLowerCase();
    if (!spec.linkHosts.some((h) => finalHost === h || finalHost.endsWith(`.${h}`))) return { status: { id: spec.id, publisher: spec.publisher, ok: false, count: 0, reason: "redirected_off_host" }, items: [] };
    if (!/xml/i.test(response.headers.get("content-type") ?? "")) return { status: { id: spec.id, publisher: spec.publisher, ok: false, count: 0, reason: "not_xml" }, items: [] };
    const text = await readCapped(response);
    if (text === null) return { status: { id: spec.id, publisher: spec.publisher, ok: false, count: 0, reason: "too_large" }, items: [] };
    const parsed = parseFeed(text, spec);
    if (!parsed.ok) return { status: { id: spec.id, publisher: spec.publisher, ok: false, count: 0, reason: parsed.reason }, items: [] };
    return { status: { id: spec.id, publisher: spec.publisher, ok: parsed.items.length > 0, count: parsed.items.length, ...(parsed.items.length ? {} : { reason: "no_usable_items" }) }, items: parsed.items };
  } catch {
    return { status: { id: spec.id, publisher: spec.publisher, ok: false, count: 0, reason: "fetch_failed" }, items: [] };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: { method?: string }, res: Res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
  if (req.method && req.method !== "GET") { res.status(405).json({ available: false, error: "method_not_allowed" }); return; }
  const cached = cache.get("rss");
  if (cached) { res.status(200).json(cached); return; }
  const loaded = await Promise.all(RSS_FEEDS.map(loadFeed));
  const events = normalizeNewsFeed(loaded.flatMap((l) => l.items), []).slice(0, SERVED);
  const payload: RssNewsPayload = {
    available: events.length > 0,
    feedProvider: "public_rss",
    items: events.map((e) => ({ ...e, eventLabel: { he: eventTypeLabel(e.eventType, "he"), en: eventTypeLabel(e.eventType, "en") } })),
    feeds: loaded.map((l) => l.status),
    fetchedAt: new Date().toISOString(),
  };
  cache.set("rss", payload);
  res.status(200).json(payload);
}
