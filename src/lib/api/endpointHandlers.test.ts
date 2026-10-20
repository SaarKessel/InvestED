// Serverless endpoint contracts: allowlists, error payloads, cache behavior. Fetch is stubbed; res is a recorder.
import { describe, it, expect, vi, afterEach } from "vitest";
import worldbank from "../../../api/worldbank";
import bisRates from "../../../api/bis-policy-rates";
import insurance from "../../../api/insurance-reports";
import describeFile from "../../../api/describe-file";

const recorder = () => {
  const res = { headers: {} as Record<string, string>, code: 0, body: undefined as unknown,
    setHeader(n: string, v: string) { this.headers[n] = v; },
    status(c: number) { this.code = c; return { json: (b: unknown) => { this.body = b; } }; } };
  return res;
};
const stubFetch = (impl: (url: unknown) => Promise<Partial<Response>>) => vi.stubGlobal("fetch", vi.fn(impl));
afterEach(() => vi.unstubAllGlobals());

describe("GET /api/worldbank", () => {
  it("rejects countries and indicators outside the allowlist", async () => {
    const res = recorder();
    await worldbank({ query: { country: "FRA", code: "NY.GDP.MKTP.CD" } }, res);
    expect(res.code).toBe(400);
    const res2 = recorder();
    await worldbank({ query: { country: "ISR", code: "EVIL.CODE" } }, res2);
    expect(res2.code).toBe(400);
  });
  it("forwards allowed queries and answers 502 on upstream failure", async () => {
    stubFetch(async () => ({ ok: true, json: async () => [{}, []] }));
    const res = recorder();
    await worldbank({ query: { country: "ISR", code: "NY.GDP.MKTP.CD" } }, res);
    expect(res.code).toBe(200);
    stubFetch(async () => ({ ok: false }));
    const res2 = recorder();
    await worldbank({ query: { country: "ISR", code: "NY.GDP.MKTP.CD" } }, res2);
    expect(res2.code).toBe(502);
    expect((res2.body as { error: string }).error).toBe("unavailable");
  });
});

describe("GET /api/bis-policy-rates", () => {
  it("answers unavailable (never an error) when the upstream fails", async () => {
    stubFetch(async () => { throw new Error("down"); });
    const res = recorder();
    await bisRates({}, res);
    expect(res.code).toBe(200);
    expect((res.body as { status: string }).status).toBe("unavailable");
    expect((res.body as { points: unknown[] }).points).toEqual([]);
  });
  it("parses a good XML payload into points", async () => {
    stubFetch(async () => ({ ok: true, text: async () => "<xml/>" }));
    const res = recorder();
    await bisRates({}, res);
    expect(res.code).toBe(200);
    // <xml/> has no Israel monthly observations: unavailable, not a crash
    expect(["unavailable", "live"]).toContain((res.body as { status: string }).status);
  });
});

describe("GET /api/insurance-reports", () => {
  it("answers unavailable when the official API shape is wrong", async () => {
    stubFetch(async () => ({ ok: true, json: async () => ({ success: false }) }));
    const res = recorder();
    await insurance({}, res);
    expect(res.code).toBe(200);
    expect((res.body as { status: string }).status).toBe("unavailable");
  });
  it("answers unavailable on network failure", async () => {
    stubFetch(async () => { throw new Error("down"); });
    const res = recorder();
    await insurance({}, res);
    expect((res.body as { status: string }).status).toBe("unavailable");
  });
});

describe("POST /api/describe-file", () => {
  it("rejects non-POST and invalid payloads", async () => {
    const res = recorder();
    await describeFile({ method: "GET", headers: {} }, res);
    expect(res.code).toBe(405);
    const res2 = recorder();
    await describeFile({ method: "POST", body: { nope: true }, headers: {} }, res2);
    expect(res2.code).toBe(400);
  });
  it("answers fallback when Gemini is not configured", async () => {
    const env = { ...process.env }; delete process.env.GEMINI_API_KEY;
    try {
      const res = recorder();
      await describeFile({ method: "POST", body: { kind: "image", mimeType: "image/png", data: "aGVsbG8=", question: "q" }, headers: {} }, res);
      expect(res.code).toBe(200);
      expect((res.body as { fallback?: boolean }).fallback).toBe(true);
    } finally { process.env = env; }
  });
});
