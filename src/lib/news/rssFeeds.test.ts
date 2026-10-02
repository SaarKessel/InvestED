import { describe, expect, it } from "vitest";
import { parseFeed, safeLink, sanitizeText, RSS_FEEDS, MAX_ITEMS_PER_FEED } from "./rssFeeds";

const NOW = Date.parse("2026-10-02T08:00:00Z");
const spec = { publisher: "Test Bank", linkHosts: ["example.gov"] };
const item = (t: string, l: string, d = "Thu, 01 Oct 2026 12:00:00 +0000") => `<item><title>${t}</title><link>${l}</link><pubDate>${d}</pubDate></item>`;
const rss = (...items: string[]) => `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>${items.join("")}</channel></rss>`;

describe("rss parsing of untrusted content", () => {
  it("keeps headline, link, publisher and time", () => {
    const r = parseFeed(rss(item("Rates held", "https://www.example.gov/a")), spec, NOW);
    expect(r).toEqual({ ok: true, dropped: 0, items: [{ title: "Rates held", url: "https://www.example.gov/a", source: "Test Bank", publishedAt: "2026-10-01T12:00:00.000Z" }] });
  });
  it("strips markup, scripts and control characters; decodes entities once", () => {
    expect(sanitizeText("<![CDATA[<b>Hi</b><script>alert(1)</script> &amp; \u202Ebye\u0000]]>")).toBe("Hi alert(1) & bye");
    expect(sanitizeText("&lt;img src=x onerror=alert(1)&gt;")).not.toMatch(/[<>]/);
    expect(sanitizeText("&amp;lt;b&amp;gt;")).toBe("&lt;b&gt;");
  });
  it("drops non-https, off-host, credentialed and javascript links", () => {
    const h = ["example.gov"];
    expect(safeLink("http://example.gov/a", h)).toBeNull();
    expect(safeLink("javascript:alert(1)", h)).toBeNull();
    expect(safeLink("https://evil.com/a", h)).toBeNull();
    expect(safeLink("https://example.gov.evil.com/a", h)).toBeNull();
    expect(safeLink("https://u:p@example.gov/a", h)).toBeNull();
    expect(safeLink("https://sub.example.gov/a", h)).toBe("https://sub.example.gov/a");
  });
  it("drops items with bad dates, future dates, stale dates or empty titles", () => {
    const r = parseFeed(rss(item("ok", "https://example.gov/1"), item("bad", "https://example.gov/2", "nope"), item("future", "https://example.gov/3", "Mon, 01 Jan 2029 00:00:00 +0000"), item("old", "https://example.gov/4", "Mon, 01 Jan 2024 00:00:00 +0000"), item("  ", "https://example.gov/5")), spec, NOW);
    expect(r.ok && r.items.map((i) => i.title)).toEqual(["ok"]);
    expect(r.ok && r.dropped).toBe(4);
  });
  it("refuses DOCTYPE/ENTITY, oversize and non-feed bodies", () => {
    expect(parseFeed(`<!DOCTYPE x [<!ENTITY a "b">]>${rss()}`, spec, NOW)).toEqual({ ok: false, reason: "unsafe_markup" });
    expect(parseFeed("x".repeat(1_000_001), spec, NOW)).toEqual({ ok: false, reason: "too_large" });
    expect(parseFeed("<html><body>hi</body></html>", spec, NOW)).toEqual({ ok: false, reason: "not_a_feed" });
  });
  it("reads Atom and caps the item count", () => {
    const atom = `<feed xmlns="http://www.w3.org/2005/Atom">${Array.from({ length: 12 }, (_, i) => `<entry><title>t${i}</title><link rel="alternate" href="https://example.gov/${i}"/><updated>2026-10-01T${String(i).padStart(2, "0")}:00:00Z</updated></entry>`).join("")}</feed>`;
    const r = parseFeed(atom, spec, NOW);
    expect(r.ok && r.items).toHaveLength(MAX_ITEMS_PER_FEED);
    expect(r.ok && r.items[0].title).toBe("t11");
  });
  it("only https allow-listed feeds exist", () => {
    for (const f of RSS_FEEDS) { expect(f.url.startsWith("https://")).toBe(true); expect(new URL(f.url).hostname.endsWith(f.linkHosts[0])).toBe(true); }
  });
});
