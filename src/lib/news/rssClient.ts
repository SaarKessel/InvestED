// Client for /api/news-feeds. A failed or empty response is "unavailable", never substituted with other content.
export interface RssNewsItem {
  id: string; title: string; url: string; source: string; publishedAt: string;
  eventType: string; eventLabel: { he: string; en: string };
}
export interface RssFeedStatus { id: string; publisher: string; ok: boolean; count: number; reason?: string }
export interface RssNewsResult { available: boolean; feedProvider: "public_rss"; items: RssNewsItem[]; feeds: RssFeedStatus[]; fetchedAt: string }

const isStr = (v: unknown): v is string => typeof v === "string";

/** Re-validates the payload on the client: only https links and plain strings pass; anything else is dropped. */
export async function fetchRssNews(): Promise<RssNewsResult | null> {
  let body: unknown;
  try {
    const response = await fetch("/api/news-feeds");
    if (!response.ok) return null;
    body = await response.json();
  } catch { return null; }
  const o = body as Partial<RssNewsResult> | null;
  if (!o || !Array.isArray(o.items) || !Array.isArray(o.feeds) || !isStr(o.fetchedAt)) return null;
  const items = o.items.filter((i): i is RssNewsItem => !!i && isStr(i.id) && isStr(i.title) && isStr(i.url) && /^https:\/\//.test(i.url) && isStr(i.source) && isStr(i.publishedAt) && !Number.isNaN(Date.parse(i.publishedAt)) && isStr(i.eventType) && !!i.eventLabel && isStr(i.eventLabel.en) && isStr(i.eventLabel.he));
  return { available: items.length > 0, feedProvider: "public_rss", items, feeds: o.feeds.filter((f) => f && isStr(f.id) && isStr(f.publisher) && typeof f.ok === "boolean"), fetchedAt: o.fetchedAt };
}
