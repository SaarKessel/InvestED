import { describe, expect, it, vi } from "vitest";
import { fetchHeadlineSentiment, validateSentiment } from "./sentiment";
import handler from "../api/newsSentimentHandler";

const inputs = [{ id: "a", title: "Apple beats earnings estimates", source: "X" }, { id: "b", title: "Oil falls 3 percent", source: "Y" }];

describe("validateSentiment", () => {
  it("keeps valid ratings", () => {
    expect(validateSentiment([{ id: "a", label: "positive", reason: "Apple beats estimates" }], inputs)).toEqual([{ id: "a", tone: "positive", reason: "Apple beats estimates" }]);
  });
  it("drops bad enum, unknown id, duplicates, empty reason, new numbers or tickers", () => {
    const raw = [
      { id: "a", label: "bullish", reason: "ok" },
      { id: "zzz", label: "neutral", reason: "ok" },
      { id: "b", label: "negative", reason: "" },
      { id: "b", label: "negative", reason: "Oil falls 9 percent" },
      { id: "b", label: "negative", reason: "Oil falls 3 percent" },
      { id: "b", label: "positive", reason: "dup" },
      { id: "a", label: "positive", reason: "Hits TSLA" },
    ];
    expect(validateSentiment(raw, inputs)).toEqual([{ id: "b", tone: "negative", reason: "Oil falls 3 percent" }]);
  });
  it("returns nothing for non-arrays", () => { expect(validateSentiment({}, inputs)).toEqual([]); });
});

describe("fetchHeadlineSentiment", () => {
  it("returns null on fallback, http error, throw, or no valid items - never a default label", async () => {
    const mk = (r: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => r });
    expect(await fetchHeadlineSentiment(inputs, "en", mk({ fallback: true }))).toBeNull();
    expect(await fetchHeadlineSentiment(inputs, "en", mk({}, false))).toBeNull();
    expect(await fetchHeadlineSentiment(inputs, "en", vi.fn().mockRejectedValue(new Error("x")))).toBeNull();
    expect(await fetchHeadlineSentiment(inputs, "en", mk({ items: [{ id: "a", label: "x", reason: "r" }] }))).toBeNull();
  });
  it("returns validated map", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [{ id: "a", label: "neutral", reason: "Apple beats estimates" }] }) });
    expect((await fetchHeadlineSentiment(inputs, "en", f))?.get("a")?.tone).toBe("neutral");
  });
});

function call(body: unknown, method = "POST") {
  let out: { code: number; json: unknown } = { code: 0, json: null };
  const res = { setHeader() {}, status: (c: number) => ({ json: (j: unknown) => { out = { code: c, json: j }; } }) };
  return handler({ method, body, headers: { "x-forwarded-for": `ip${Math.random()}` } }, res).then(() => out);
}

describe("news-sentiment handler", () => {
  it("rejects non-POST and empty payloads", async () => {
    expect((await call({}, "GET")).code).toBe(405);
    expect((await call({ items: [] })).code).toBe(400);
  });
  it("falls back without a key", async () => {
    const saved = { ...process.env }; delete process.env.GEMINI_API_KEY; delete process.env.GOOGLE_API_KEY;
    const r = await call({ items: inputs, language: "en" });
    process.env = saved;
    expect(r.code === 200 && typeof r.json === "object").toBe(true);
  });
  it("calls Gemini with structured output and validates", async () => {
    process.env.GEMINI_API_KEY = "k";
    const body = { candidates: [{ content: { parts: [{ text: JSON.stringify([{ id: "a", label: "positive", reason: "Apple beats estimates" }, { id: "b", label: "up", reason: "x" }]) }] } }] };
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => body } as Response);
    const r = await call({ items: [{ id: "a", title: "Apple beats earnings estimates", source: "Z1" }, { id: "b", title: "Oil falls 3 percent", source: "Z2" }], language: "en" });
    const sent = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.generationConfig.responseMimeType).toBe("application/json");
    expect((r.json as { items: unknown[] }).items).toEqual([{ id: "a", tone: "positive", reason: "Apple beats estimates" }]);
    spy.mockRestore(); delete process.env.GEMINI_API_KEY;
  });
});
