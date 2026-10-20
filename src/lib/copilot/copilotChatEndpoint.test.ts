// /api/copilot-chat endpoint contract: method gating, rate limiting, payload validation, and the
// fallback-on-any-failure promise (the deterministic answer stands whenever Gemini cannot be used).
import { describe, it, expect, vi, afterEach } from "vitest";
import handler from "../../../api/copilot-chat";

const recorder = () => {
  const res = { headers: {} as Record<string, string>, code: 0, body: undefined as unknown,
    setHeader(n: string, v: string) { this.headers[n] = v; },
    status(c: number) { this.code = c; return { json: (b: unknown) => { this.body = b; } }; } };
  return res;
};
const valid = { question: "מה זה ETF?", answer: "קרן סל נסחרת.", language: "he", facts: {} };
const post = (body: unknown, ip = "1.1.1.1") => ({ method: "POST", body, headers: { "x-forwarded-for": ip } });
afterEach(() => vi.unstubAllGlobals());

describe("POST /api/copilot-chat", () => {
  it("rejects non-POST methods", async () => {
    const res = recorder();
    await handler({ method: "GET", headers: {} }, res);
    expect(res.code).toBe(405);
  });
  it("rejects invalid payloads", async () => {
    const res = recorder();
    await handler(post({ question: "" }), res);
    expect(res.code).toBe(400);
    const res2 = recorder();
    await handler(post({ question: "q" }), res2);
    expect(res2.code).toBe(400);
  });
  it("answers fallback (not an error) when Gemini is not configured", async () => {
    const key = process.env.GEMINI_API_KEY; delete process.env.GEMINI_API_KEY;
    try {
      const res = recorder();
      await handler(post(valid), res);
      expect(res.code).toBe(200);
      expect((res.body as { fallback?: boolean; reason?: string }).fallback).toBe(true);
    } finally { if (key !== undefined) process.env.GEMINI_API_KEY = key; }
  });
  it("rate-limits bursts from one IP with a fallback answer", async () => {
    const ip = "9.9.9.9";
    let last = recorder();
    for (let i = 0; i < 21; i++) { last = recorder(); await handler(post(valid, ip), last); }
    expect(last.code).toBe(429);
    expect((last.body as { fallback?: boolean }).fallback).toBe(true);
  });
  it("answers fallback when Gemini is unreachable", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const res = recorder();
    await handler(post(valid, "2.2.2.2"), res);
    expect(res.code).toBe(200);
    expect((res.body as { fallback?: boolean; reason?: string }).reason).toBe("gemini_unreachable");
  });
  it("answers fallback on Gemini quota responses", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 429 })));
    const res = recorder();
    await handler(post(valid, "3.3.3.3"), res);
    expect((res.body as { fallback?: boolean; reason?: string }).reason).toBe("gemini_429");
  });
});
