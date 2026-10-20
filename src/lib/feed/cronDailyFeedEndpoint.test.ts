// /api/cron/daily-feed endpoint contract: authorization, configuration failures, real-data-only behavior.
import { describe, it, expect, vi, afterEach } from "vitest";

async function load() {
  vi.resetModules();
  return (await import("../../../api/cron/daily-feed")).default;
}
const recorder = () => {
  const res = { headers: {} as Record<string, string>, code: 0, body: undefined as unknown,
    setHeader(n: string, v: string) { this.headers[n] = v; },
    status(c: number) { this.code = c; return { json: (b: unknown) => { this.body = b; } }; } };
  return res;
};
const authed = { method: "GET", headers: { authorization: "Bearer s3cret" } };
afterEach(() => { vi.unstubAllGlobals(); delete process.env.CRON_SECRET; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });

describe("GET /api/cron/daily-feed", () => {
  it("refuses everything when CRON_SECRET is not configured", async () => {
    const handler = await load();
    const res = recorder();
    await handler({ method: "GET", headers: {} }, res);
    expect(res.code).toBe(500);
    expect((res.body as { error: string }).error).toBe("cron_not_configured");
  });
  it("rejects wrong or missing bearer tokens", async () => {
    process.env.CRON_SECRET = "s3cret";
    const handler = await load();
    const res = recorder();
    await handler({ method: "GET", headers: {} }, res);
    expect(res.code).toBe(401);
    const res2 = recorder();
    await handler({ method: "GET", headers: { authorization: "Bearer wrong" } }, res2);
    expect(res2.code).toBe(401);
  });
  it("refuses when the service-role key is missing", async () => {
    process.env.CRON_SECRET = "s3cret";
    const handler = await load();
    const res = recorder();
    await handler(authed, res);
    expect(res.code).toBe(500);
    expect((res.body as { error: string }).error).toBe("service_key_missing");
  });
  it("stores nothing when both source feeds are down", async () => {
    process.env.CRON_SECRET = "s3cret";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const handler = await load();
    const res = recorder();
    await handler(authed, res);
    expect(res.code).toBe(502);
    expect((res.body as { ok: boolean; stored: unknown[] }).stored).toEqual([]);
  });
});
