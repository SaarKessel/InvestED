// ---------------------------------------------------------------------------
// InvestED — public RSS news: allow-listed feeds + untrusted-content parser.
//
// Feed text is DATA ONLY. It is never executed, never rendered as HTML and
// never evaluated. The parser is a small tag scanner (no DOM, no XML entity
// expansion, no script/URL fetching). Every field is stripped of markup and
// control characters, length-capped and validated. Only the headline, link,
// publisher and timestamp are kept (no article body, no feed description), the
// same licensing contract as /api/news.
// ---------------------------------------------------------------------------
import type { RawNewsItem } from "../newsIntelligence";

export interface RssFeedSpec {
  id: string;
  publisher: string;
  /** feed URL, https only */
  url: string;
  /** hosts an item link may point to (exact host or subdomain) */
  linkHosts: string[];
  /** why this feed may be used */
  terms: string;
}

export const RSS_FEEDS: RssFeedSpec[] = [
  { id: "fed", publisher: "Federal Reserve Board", url: "https://www.federalreserve.gov/feeds/press_all.xml", linkHosts: ["federalreserve.gov"], terms: "US government publication, public RSS offered by the publisher" },
  { id: "sec", publisher: "U.S. SEC", url: "https://www.sec.gov/news/pressreleases.rss", linkHosts: ["sec.gov"], terms: "US government publication, public RSS offered by the publisher" },
  { id: "ecb", publisher: "European Central Bank", url: "https://www.ecb.europa.eu/rss/press.html", linkHosts: ["ecb.europa.eu"], terms: "Public RSS offered by the ECB; headlines and links with attribution" },
  { id: "boe", publisher: "Bank of England", url: "https://www.bankofengland.co.uk/rss/news", linkHosts: ["bankofengland.co.uk"], terms: "Public RSS offered by the Bank of England; headlines and links with attribution" },
];

export const MAX_FEED_BYTES = 1_000_000;
export const MAX_ITEMS_PER_FEED = 8;
const MAX_TITLE = 220;
const MAX_URL = 500;
const MAX_AGE_MS = 45 * 86_400_000;
const FUTURE_SLACK_MS = 36 * 3_600_000;

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201d", ldquo: "\u201c", ndash: "\u2013", mdash: "\u2014", hellip: "\u2026" };

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 31 && code < 0x110000 ? String.fromCodePoint(code) : " ";
    }
    const k = e.toLowerCase();
    return Object.prototype.hasOwnProperty.call(NAMED, k) ? NAMED[k] : m;
  });
}

/** Plain text only: markup removed, entities decoded once, control and bidi-override characters dropped. */
export function sanitizeText(raw: string, max = MAX_TITLE): string {
  let s = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  s = decodeEntities(s);
  s = s.replace(/<[^>]*>/g, " ").replace(/[<>]/g, " ");
  // eslint-disable-next-line no-control-regex -- stripping control characters is the point
  s = s.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}\u2026` : s;
}

/** An item link is kept only when it is plain https, has no credentials and points at a host the feed is allowed to link to. */
export function safeLink(raw: string, allowedHosts: string[]): string | null {
  const text = sanitizeText(raw, MAX_URL + 1);
  if (!text || text.length > MAX_URL || /\s/.test(text)) return null;
  let u: URL;
  try { u = new URL(text); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  if (!allowedHosts.some((h) => host === h || host.endsWith(`.${h}`))) return null;
  return u.toString().replace(/([^:])\/\/+/g, "$1/");
}

function field(block: string, tag: string): string | null {
  const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  return m ? m[1] : null;
}

function atomLink(block: string): string | null {
  for (const m of block.matchAll(/<link\b([^>]*?)\/?>/gi)) {
    const attrs = m[1];
    const rel = /rel\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] ?? "alternate";
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
    if (rel === "alternate" && href) return href;
  }
  return null;
}

export type ParseResult = { ok: true; items: RawNewsItem[]; dropped: number } | { ok: false; reason: "too_large" | "not_a_feed" | "unsafe_markup" };

/** Parse RSS 2.0 or Atom text into validated headline records. Anything malformed is dropped, never repaired or guessed. */
export function parseFeed(xml: string, spec: Pick<RssFeedSpec, "publisher" | "linkHosts">, now = Date.now()): ParseResult {
  if (xml.length > MAX_FEED_BYTES) return { ok: false, reason: "too_large" };
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) return { ok: false, reason: "unsafe_markup" };
  const isRss = /<rss[\s>]/i.test(xml) || /<channel[\s>]/i.test(xml);
  const isAtom = /<feed[\s>]/i.test(xml);
  if (!isRss && !isAtom) return { ok: false, reason: "not_a_feed" };
  const blocks = [...xml.matchAll(isRss ? /<item\b[^>]*>([\s\S]*?)<\/item>/gi : /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map((m) => m[1]);
  const items: RawNewsItem[] = [];
  let dropped = 0;
  for (const block of blocks) {
    const title = sanitizeText(field(block, "title") ?? "");
    const rawLink = isRss ? field(block, "link") : atomLink(block);
    const url = rawLink ? safeLink(rawLink, spec.linkHosts) : null;
    const dateText = sanitizeText(field(block, isRss ? "pubDate" : "updated") ?? field(block, "published") ?? field(block, "dc:date") ?? "", 80);
    const ms = Date.parse(dateText);
    if (!title || !url || Number.isNaN(ms) || ms > now + FUTURE_SLACK_MS || ms < now - MAX_AGE_MS) { dropped += 1; continue; }
    items.push({ title, url, source: spec.publisher, publishedAt: new Date(ms).toISOString() });
  }
  items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return { ok: true, items: items.slice(0, MAX_ITEMS_PER_FEED), dropped };
}
