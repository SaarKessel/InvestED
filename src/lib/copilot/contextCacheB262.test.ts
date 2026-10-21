// Conversation context + rephrase cache: payload normalization, prompt
// building, cache hit/miss behavior and context-aware verification.
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../../../api/copilot-chat";
import { buildGatewayMessages, normalizeGatewayPayload, MAX_CONTEXT_TURNS } from "./gatewayPrompt";

const base = { question: "מה זה פיזור?", answer: "פיזור מפחית סיכון.", language: "he", facts: {} };

describe("context normalization", () => {
  it("accepts valid context, caps turns, filters junk", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ q: `q${i}`, a: `a${i}` }));
    const out = normalizeGatewayPayload({ ...base, context: [...many, { q: 1, a: "x" }, "junk"] })!;
    expect(out.context).toHaveLength(MAX_CONTEXT_TURNS);
    expect(out.context![0].q).toBe("q3");
    expect(normalizeGatewayPayload({ ...base, context: "nope" })!.context).toBeUndefined();
    const long = normalizeGatewayPayload({ ...base, context: [{ q: "x".repeat(900), a: "y".repeat(900) }] })!;
    expect(long.context![0].q).toHaveLength(400);
  });
  it("buildGatewayMessages includes the context section only when present", () => {
    const withC = buildGatewayMessages(normalizeGatewayPayload({ ...base, context: [{ q: "מה זה ETF?", a: "קרן סל." }] })!);
    expect(withC[1].content).toContain("RECENT CONVERSATION");
    expect(withC[1].content).toContain("קרן סל.");
    const without = buildGatewayMessages(normalizeGatewayPayload(base)!);
    expect(without[1].content).not.toContain("RECENT CONVERSATION");
  });
});

const recorder = () => {
  const res = { headers: {} as Record<string, string>, code: 0, body: undefined as unknown,
    setHeader(n: string, v: string) { this.headers[n] = v; },
    status(c: number) { this.code = c; return { json: (b: unknown) => { this.body = b; } }; } };
  return res;
};
const post = (body: unknown, ip: string) => ({ method: "POST", body, headers: { "x-forwarded-for": ip } });
const geminiOk = (text: string) => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ text, numbersUsed: [] }) }] } }] }) });

afterEach(() => vi.unstubAllGlobals());

describe("rephrase cache", () => {
  it("serves the second identical request from cache with zero model calls", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn(async () => geminiOk("פיזור מפחית סיכון."));
    vi.stubGlobal("fetch", fetchMock);
    const ip = "7.7.7.1";
    const first = recorder();
    await handler(post(base, ip), first);
    expect((first.body as { text?: string }).text).toBe("פיזור מפחית סיכון.");
    const second = recorder();
    await handler(post(base, ip), second);
    expect((second.body as { text?: string; cacheHit?: boolean }).text).toBe("פיזור מפחית סיכון.");
    expect((second.body as { cacheHit?: boolean }).cacheHit).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("never caches contextual turns", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn(async () => geminiOk("פיזור מפחית סיכון."));
    vi.stubGlobal("fetch", fetchMock);
    const ip = "7.7.7.2";
    const withCtx = { ...base, context: [{ q: "ספר לי", a: "הסברתי." }] };
    await handler(post(withCtx, ip), recorder());
    const second = recorder();
    await handler(post(withCtx, ip), second);
    expect((second.body as { cacheHit?: boolean }).cacheHit).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
