// ---------------------------------------------------------------------------
// InvestED — /api/news
//
// Serves the AI News surfaces (home updates + the dedicated news page).
//
// Content/licensing contract:
// - Only headlines, links, publisher names and timestamps are served —
//   full article text is NEVER fetched, stored or reproduced, and no
//   paywall is bypassed. The client always links out to the original.
// - Classification, key facts and implications are deterministic and
//   educational; "unknown" items carry no implications at all.
// ---------------------------------------------------------------------------

import { createTtlCache } from "../src/lib/market/cache.js";
import {
  normalizeNewsFeed,
  buildImplications,
  buildKeyFacts,
  eventTypeLabel,
  type NewsEvent,
  type RawNewsItem,
} from "../src/lib/newsIntelligence.js";
import { listKnownAssets } from "../src/lib/market/knownAssets.js";

interface NewsRequest {
  query?: Record<string, string | string[] | undefined>;
}

interface NewsResponse {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
}

const CACHE_TTL_MS = Number(process.env.NEWS_CACHE_TTL_MS) || 15 * 60 * 1000;
const NEWS_COUNT = 20;
const SERVED_COUNT = 12;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface EnrichedNewsItem extends NewsEvent {
  eventLabel: { he: string; en: string };
  keyFacts: { he: ReturnType<typeof buildKeyFacts>; en: ReturnType<typeof buildKeyFacts> };
  implications: { he: ReturnType<typeof buildImplications>; en: ReturnType<typeof buildImplications> };
}

interface NewsPayload {
  available: boolean;
  feedProvider: "yahoo_finance_search";
  cacheTtlSeconds: number;
  staleWhileRevalidateSeconds: number;
  items: EnrichedNewsItem[];
  fetchedAt: string;
}

const cache = createTtlCache<NewsPayload>({ ttlMs: CACHE_TTL_MS });

interface YahooSearchNewsEntry {
  uuid?: string;
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: number;
  summary?: string;
}

// Yahoo's news search is query-sensitive: some terms intermittently return
// zero items, so we fan out over several market queries, merge the results,
// dedupe by story id and serve the freshest. Any single query may fail
// without taking the feed down.
const NEWS_QUERIES = ["stocks", "stock market", "markets", "earnings", "S&P 500"];

async function fetchYahooNewsQuery(query: string): Promise<RawNewsItem[]> {
  const url =
    "https://query1.finance.yahoo.com/v1/finance/search" +
    `?q=${encodeURIComponent(query)}&newsCount=${NEWS_COUNT}&quotesCount=0&enableFuzzyQuery=false`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Yahoo Finance news search returned HTTP ${response.status}`);
  }
  const payload = (await response.json()) as { news?: YahooSearchNewsEntry[] };
  const entries = Array.isArray(payload.news) ? payload.news : [];
  return entries
    .map((entry): RawNewsItem | null => {
      if (!entry.title || !entry.link || !entry.publisher || !entry.providerPublishTime) return null;
      return {
        title: entry.title,
        url: entry.link,
        source: entry.publisher,
        publishedAt: new Date(entry.providerPublishTime * 1000).toISOString(),
        // The provider summary, when present, is short metadata — used
        // only to improve symbol/event classification, never displayed.
        summary: entry.summary,
      };
    })
    .filter((item): item is RawNewsItem => item !== null);
}

async function fetchYahooNews(): Promise<RawNewsItem[]> {
  const settled = await Promise.allSettled(NEWS_QUERIES.map((query) => fetchYahooNewsQuery(query)));
  const seen = new Set<string>();
  const merged: RawNewsItem[] = [];
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value) {
      const key = item.url;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  if (merged.length === 0) {
    throw new Error("Yahoo Finance news search returned no usable items");
  }
  return merged;
}

export default async function handler(_req: NewsRequest, res: NewsResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");

  const cached = cache.get("news");
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  let payload: NewsPayload;
  try {
    const raw = await fetchYahooNews();
    const knownSymbols = listKnownAssets().map((asset) => asset.symbol);
    const events = normalizeNewsFeed(raw, knownSymbols).slice(0, SERVED_COUNT);
    payload = {
      available: events.length > 0,
      feedProvider: "yahoo_finance_search",
      cacheTtlSeconds: CACHE_TTL_MS / 1000,
      staleWhileRevalidateSeconds: 1800,
      items: events.map((event) => ({
        ...event,
        eventLabel: { he: eventTypeLabel(event.eventType, "he"), en: eventTypeLabel(event.eventType, "en") },
        keyFacts: { he: buildKeyFacts(event, "he"), en: buildKeyFacts(event, "en") },
        implications: { he: buildImplications(event, "he"), en: buildImplications(event, "en") },
      })),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    payload = { available: false, feedProvider: "yahoo_finance_search", cacheTtlSeconds: CACHE_TTL_MS / 1000, staleWhileRevalidateSeconds: 1800, items: [], fetchedAt: new Date().toISOString() };
  }

  cache.set("news", payload);
  res.status(200).json(payload);
}
