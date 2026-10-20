// /api/health contract: every upstream is probed, failures are reported per-check, never thrown.
import { describe, it, expect, vi, afterEach } from "vitest";
import handler from "./healthHandler";

const recorder = () => {
  const res = { headers: {} as Record<string, string>, code: 0, body: undefined as unknown,
    setHeader(n: string, v: string) { this.headers[n] = v; },
    status(c: number) { this.code = c; return { json: (b: unknown) => { this.body = b; } }; } };
  return res;
};
afterEach(() => vi.unstubAllGlobals());

describe("GET /api/health", () => {
  it("allOk is false and each probe reports a detail when upstreams are down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const res = recorder();
    await handler({}, res);
    expect(res.code).toBe(200);
    const body = res.body as { allOk: boolean; checks: Array<{ name: string; ok: boolean; detail?: string }> };
    expect(body.allOk).toBe(false);
    expect(body.checks.length).toBeGreaterThanOrEqual(4);
    expect(body.checks.every((c) => !c.ok)).toBe(true);
  });
  it("allOk is true when every probe verifies", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: unknown) => {
      const u = String(url);
      const good = u.includes("yahoo") ? '{"regularMarketPrice":1}' : u.includes("frankfurter") ? '{"ILS":3.7}' : u.includes("worldbank") ? "[{}]" : u.includes("federalreserve") ? "<rss><item/></rss>" : `[{"feed_date":"${new Date().toISOString().slice(0, 10)}"}]`;
      return { ok: true, text: async () => good } as Response;
    }));
    const res = recorder();
    await handler({}, res);
    const body = res.body as { allOk: boolean; checks: Array<{ ok: boolean }> };
    expect(body.allOk).toBe(true);
    expect(body.checks.every((c) => c.ok)).toBe(true);
  });
  it("flags a stale daily_feed row", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: unknown) => {
      const u = String(url);
      const good = u.includes("daily_feed") ? '[{"feed_date":"2020-01-01"}]' : u.includes("yahoo") ? '{"regularMarketPrice":1}' : u.includes("frankfurter") ? '{"ILS":3.7}' : u.includes("worldbank") ? "[{}]" : "<rss><item/></rss>";
      return { ok: true, text: async () => good } as Response;
    }));
    const res = recorder();
    await handler({}, res);
    const body = res.body as { allOk: boolean; checks: Array<{ name: string; ok: boolean; detail?: string }> };
    const feed = body.checks.find((c) => c.name === "daily_feed")!;
    expect(feed.ok).toBe(false);
    expect(feed.detail).toContain("stale");
    expect(body.allOk).toBe(false);
  });
});
