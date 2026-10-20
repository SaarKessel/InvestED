// /api/news-feeds endpoint contract: rejects bad methods, never crashes on upstream failures, flags feeds with reasons.
import { describe, it, expect, vi, afterEach } from "vitest";

async function load() {
  vi.resetModules();
  return (await import("../../../api/news-feeds")).default;
}
const recorder = () => {
  const res = { headers: {} as Record<string, string>, code: 0, body: undefined as unknown,
    setHeader(n: string, v: string) { this.headers[n] = v; },
    status(c: number) { this.code = c; return { json: (b: unknown) => { this.body = b; } }; } };
  return res;
};
afterEach(() => vi.unstubAllGlobals());

describe("GET /api/news-feeds", () => {
  it("rejects non-GET methods", async () => {
    const handler = await load();
    const res = recorder();
    await handler({ method: "POST" }, res);
    expect(res.code).toBe(405);
  });
  it("reports every feed with a reason when all upstreams fail, and stays available:false", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const handler = await load();
    const res = recorder();
    await handler({ method: "GET" }, res);
    expect(res.code).toBe(200);
    const body = res.body as { available: boolean; feeds: Array<{ ok: boolean; reason?: string }>; items: unknown[] };
    expect(body.available).toBe(false);
    expect(body.items).toEqual([]);
    expect(body.feeds.length).toBeGreaterThan(0);
    expect(body.feeds.every((f) => !f.ok && f.reason === "fetch_failed")).toBe(true);
  });
  it("flags non-XML responses as not_xml", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
      ok: true, url, headers: new Headers({ "content-type": "text/html" }),
      text: async () => "<html></html>", body: null,
    })));
    const handler = await load();
    const res = recorder();
    await handler({ method: "GET" }, res);
    const body = res.body as { feeds: Array<{ reason?: string }> };
    expect(body.feeds.every((f) => f.reason === "not_xml")).toBe(true);
  });
  it("flags redirects that leave the feed host", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, url: "https://evil.example/hijack", headers: new Headers({ "content-type": "application/rss+xml" }),
      text: async () => "<rss/>", body: null,
    })));
    const handler = await load();
    const res = recorder();
    await handler({ method: "GET" }, res);
    const body = res.body as { feeds: Array<{ reason?: string }> };
    expect(body.feeds.every((f) => f.reason === "redirected_off_host")).toBe(true);
  });
});
