import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRssNews } from "./rssClient";
import { runTool } from "@/lib/intelligence/tools";
import { DOMAINS, runInDomain } from "@/lib/intelligence/domains";

afterEach(() => vi.unstubAllGlobals());
const good = { id: "a", title: "T", url: "https://x.gov/a", source: "S", publishedAt: "2026-10-01T00:00:00Z", eventType: "unknown", eventLabel: { en: "General", he: "כללי" } };
const payload = (items: unknown[]) => ({ available: true, feedProvider: "public_rss", items, feeds: [{ id: "f", publisher: "S", ok: true, count: 1 }], fetchedAt: "2026-10-02T00:00:00Z" });
const stub = (body: unknown, status = 200) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

describe("rss news client and domain wiring", () => {
  it("drops items with non-https links and keeps valid ones", async () => {
    stub(payload([good, { ...good, id: "b", url: "javascript:alert(1)" }, { ...good, id: "c", url: "http://x.gov" }]));
    const r = await fetchRssNews();
    expect(r?.items.map((i) => i.id)).toEqual(["a"]);
  });
  it("failure or garbage is null, never mock news", async () => {
    stub({}, 500);
    expect(await fetchRssNews()).toBeNull();
    stub({ nope: 1 });
    expect(await fetchRssNews()).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect(await fetchRssNews()).toBeNull();
  });
  it("the news domain is wired and the tool is unavailable when feeds fail", async () => {
    expect(DOMAINS.news.status).toBe("wired");
    stub({}, 503);
    expect(await runTool("rssnews", null)).toEqual({ ok: false, reason: "unavailable" });
    expect(await runInDomain("news", "rssnews", null)).toEqual({ ok: false, reason: "unavailable" });
  });
  it("a live result carries live provenance with an as-of time", async () => {
    stub(payload([good]));
    const r = await runInDomain("news", "rssnews", null);
    expect(r.ok && r.result.provenance.state).toBe("live");
    expect(r.ok && r.result.provenance.asOf).toBe("2026-10-02T00:00:00Z");
  });
});
