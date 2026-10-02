/**
 * Daily intelligence feed: shapes what the scheduled job stores. Pure functions, no network.
 * Only headlines, links, publisher names and times are kept (no article text), and movers are stored
 * exactly as the market-movers endpoint served them. An empty or unavailable source stores nothing.
 */
export type FeedKind = "market_movers" | "headlines";
export interface FeedRow { feed_date: string; kind: FeedKind; payload: unknown; source: string; fetched_at: string }

interface MoversIn { available?: boolean; coverage?: string | null; gainers?: unknown[]; losers?: unknown[]; fetchedAt?: string }
interface NewsIn { available?: boolean; feedProvider?: string; items?: { title?: unknown; url?: unknown; source?: unknown; publishedAt?: unknown }[] }

export const MAX_HEADLINES = 20;
export const MAX_MOVERS = 10;

export function moversRow(date: string, now: string, m: MoversIn | null): FeedRow | null {
  if (!m || m.available !== true) return null;
  const gainers = (m.gainers ?? []).slice(0, MAX_MOVERS), losers = (m.losers ?? []).slice(0, MAX_MOVERS);
  if (gainers.length + losers.length === 0) return null;
  return { feed_date: date, kind: "market_movers", payload: { coverage: m.coverage ?? null, gainers, losers, providerFetchedAt: m.fetchedAt ?? null }, source: "Yahoo Finance screener via /api/market-movers", fetched_at: now };
}

export function headlinesRow(date: string, now: string, n: NewsIn | null): FeedRow | null {
  if (!n || n.available !== true || !Array.isArray(n.items)) return null;
  const items = n.items
    .filter((i) => typeof i.title === "string" && i.title.trim() && typeof i.url === "string" && /^https?:\/\//.test(i.url))
    .slice(0, MAX_HEADLINES)
    .map((i) => ({ title: String(i.title).slice(0, 300), url: String(i.url), source: typeof i.source === "string" ? i.source.slice(0, 80) : null, publishedAt: typeof i.publishedAt === "string" ? i.publishedAt : null }));
  if (items.length === 0) return null;
  return { feed_date: date, kind: "headlines", payload: { items }, source: `${n.feedProvider ?? "Yahoo Finance search"} via /api/news (headlines and links only)`, fetched_at: now };
}

/** Israel is the product's home timezone; the feed day follows it. */
export const feedDate = (d: Date): string => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
