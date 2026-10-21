// Stream mode of /api/copilot-chat: AI SDK streamText chunks, tool allowlist
// from the bot registry, and the verdict trailer. The "ai" module is mocked;
// the endpoint's wiring is what is under test.
import { describe, it, expect, vi, afterEach } from "vitest";

const streamTextMock = vi.fn();
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, streamText: (...args: unknown[]) => streamTextMock(...args) };
});

import handler from "../../../api/copilot-chat";

const streamRecorder = () => {
  const res = { headers: {} as Record<string, string>, code: 0, chunks: [] as string[], ended: false, body: undefined as unknown,
    setHeader(n: string, v: string) { this.headers[n] = v; },
    write(c: string) { this.chunks.push(c); },
    end() { this.ended = true; },
    status(c: number) { this.code = c; return { json: (b: unknown) => { this.body = b; } }; } };
  return res;
};
const valid = { question: "מה מחיר VOO?", answer: "המחיר הוא 612.5 דולר.", language: "he", facts: { price: 612.5 }, stream: true };
const post = (body: unknown, ip = "2.2.2.2") => ({ method: "POST", body, headers: { "x-forwarded-for": ip } });

async function* fakeStream(chunks: string[]) { for (const c of chunks) yield c; }

afterEach(() => { vi.unstubAllGlobals(); streamTextMock.mockReset(); });

describe("POST /api/copilot-chat stream mode", () => {
  it("streams chunks, applies the single bot voice, and ends with an ok trailer carrying tool facts", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ price: 612.5 }), { status: 200 })));
    streamTextMock.mockImplementation((opts: { tools: Record<string, { execute: (a: { symbol: string }) => Promise<unknown> }> }) => {
      void opts.tools.get_market_quote.execute({ symbol: "VOO" } as Record<string, never>);
      return { textStream: fakeStream(["המחיר ", "הוא 612.5 ", "דולר."]) };
    });
    const res = streamRecorder();
    await handler(post({ ...valid, botId: "investing" }), res);
    expect(res.headers["Content-Type"]).toContain("text/plain");
    expect(res.ended).toBe(true);
    const raw = res.chunks.join("");
    expect(raw).toContain("המחיר הוא 612.5 דולר.");
    expect(raw).toContain("[[INVESTED_VERDICT:ok]]");
    expect(raw).toContain("[[INVESTED_FACTS:");
    const call = streamTextMock.mock.calls[0][0] as { system: string; stopWhen: unknown; tools: Record<string, unknown> };
    expect(call.system).toContain("מורה חמים");
    expect(Object.keys(call.tools)).toEqual(["get_market_quote", "get_market_movers", "get_top_headlines"]);
  });
  it("ends with a fallback verdict when the model adds a new number", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    streamTextMock.mockImplementation(() => ({ textStream: fakeStream(["המחיר הוא 999 דולר."]) }));
    const res = streamRecorder();
    await handler(post({ ...valid, answer: "המחיר הוא 11 דולר." }, "3.3.3.3"), res);
    expect(res.chunks.join("")).toContain("[[INVESTED_VERDICT:fallback]]");
  });
  it("accepts a number that appears only in the conversation context", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    streamTextMock.mockImplementation(() => ({ textStream: fakeStream(["כמו שאמרנו, המחיר 887.25 דולר."]) }));
    const res = streamRecorder();
    await handler(post({ ...valid, answer: "המחיר הוא 44 דולר.", context: [{ q: "מה המחיר?", a: "המחיר הוא 887.25 דולר." }] }, "6.6.6.6"), res);
    expect(res.chunks.join("")).toContain("[[INVESTED_VERDICT:ok]]");
  });
  it("rejects the same context number when context is absent", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    streamTextMock.mockImplementation(() => ({ textStream: fakeStream(["כמו שאמרנו, המחיר 887.25 דולר."]) }));
    const res = streamRecorder();
    await handler(post({ ...valid, answer: "המחיר הוא 22 דולר." }, "6.6.6.7"), res);
    expect(res.chunks.join("")).toContain("[[INVESTED_VERDICT:fallback]]");
  });
  it("ends with a fallback verdict when streamText throws", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    streamTextMock.mockImplementation(() => { throw new Error("boom"); });
    const res = streamRecorder();
    await handler(post({ ...valid, answer: "המחיר הוא 33 דולר." }, "4.4.4.4"), res);
    expect(res.chunks.join("")).toContain("[[INVESTED_VERDICT:fallback]]");
  });
  it("non-stream requests keep the legacy JSON path even with write-capable res", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));
    const res = streamRecorder();
    await handler(post({ question: valid.question, answer: valid.answer, language: "he", facts: {} }, "5.5.5.5"), res);
    expect(res.chunks).toEqual([]);
    expect((res.body as { fallback?: boolean }).fallback).toBe(true);
  });
});
