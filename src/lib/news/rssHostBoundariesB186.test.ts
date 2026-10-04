import { describe, expect, it } from "vitest";
import { RSS_FEEDS, safeLink, parseFeed } from "./rssFeeds";
const rows = RSS_FEEDS.flatMap((feed) => feed.linkHosts.flatMap((host) => ["exact", "subdomain", "prefix-spoof", "suffix-spoof", "http", "credentials"].map((mode) => [feed.id, host, mode] as const)));
describe("[sweep] B186 public-feed links require exact host or genuine subdomain", () => {
  it.each(rows)("feed %s host %s mode %s", (_id, host, mode) => {
    const url = mode === "subdomain" ? `https://news.${host}/news` : mode === "prefix-spoof" ? `https://evil${host}/news` : mode === "suffix-spoof" ? `https://${host}.evil.test/news` : mode === "http" ? `http://${host}/news` : mode === "credentials" ? `https://user:pass@${host}/news` : `https://${host}/news`;
    expect(safeLink(url, [host])).toBe(mode === "exact" || mode === "subdomain" ? url : null);
  });
});
describe("[hand] B186 unsafe feed declarations never enter the public-headline parser", () => {
  it("rejects entity and doctype markup without parsing supplied content", () => {
    const spec = RSS_FEEDS[0];
    expect(parseFeed('<!DOCTYPE rss><rss></rss>', spec)).toEqual({ ok: false, reason: "unsafe_markup" });
    expect(parseFeed('<!ENTITY secret "value"><rss></rss>', spec)).toEqual({ ok: false, reason: "unsafe_markup" });
    expect(parseFeed('<html>not a feed</html>', spec)).toEqual({ ok: false, reason: "not_a_feed" });
  });
});
