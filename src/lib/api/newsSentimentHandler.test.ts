import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./newsSentimentHandler";

const mkRes = () => {
  let code = 0; let body: unknown;
  return { res: { setHeader() {}, status: (c: number) => { code = c; return { json: (b: unknown) => { body = b; } }; } }, get: () => ({ code, body: body as Record<string, unknown> }) };
};
let ipN = 0;
const call = (body: unknown, headers: Record<string, string> = { "x-forwarded-for": `10.0.0.${++ipN}` }) => {
  const { res, get } = mkRes();
  return handler({ method: "POST", headers, body }, res).then(get);
};

beforeEach(() => { vi.restoreAllMocks(); delete process.env.GEMINI_API_KEY; delete process.env.GOOGLE_API_KEY; });

describe("newsSentimentHandler", () => {
  it("rejects non-POST", async () => {
    const { res, get } = mkRes();
    await handler({ method: "GET", headers: {} }, res);
    expect(get().code).toBe(405);
  });
  it("rejects an empty or invalid payload", async () => {
    expect((await call({})).code).toBe(400);
    expect((await call({ items: [{ id: "", title: "" }] })).code).toBe(400);
    expect((await call({ items: "nope" })).code).toBe(400);
  });
  it("returns a fallback, never an error, when no Gemini key is configured", async () => {
    const r = await call({ items: [{ id: "1", title: "Fed holds rates", source: "Fed" }] });
    expect(r.code).toBe(200);
    expect(r.body).toMatchObject({ fallback: true, reason: "auth_not_configured" });
  });
  it("truncates items to 12 and long fields, drops id-less entries", async () => {
    process.env.GEMINI_API_KEY = "k";
    const fetchMock = vi.fn(async () => ({ ok: false, status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const items = Array.from({ length: 15 }, (_, i) => ({ id: `id${i}`, title: "t".repeat(400), source: "s".repeat(100) }));
    const r = await call({ items });
    expect(r.body).toMatchObject({ fallback: true, reason: "gemini_500" });
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    const userText = sent.contents[0].parts[0].text as string;
    expect(userText.match(/id12|id13|id14/)).toBeNull();
    expect(userText).toContain("id11");
  });
  it("returns cached+valid items on success and drops invalid ratings", async () => {
    process.env.GEMINI_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify([{ id: "1", label: "positive", reason: "steady tone" }, { id: "2", label: "wild", reason: "x" }]) } ] } }] }),
    })));
    const r = await call({ items: [{ id: "1", title: "Fed holds", source: "Fed" }, { id: "2", title: "CPI falls", source: "BLS" }] });
    expect(r.code).toBe(200);
    const items = (r.body as { items: { id: string; tone: string }[] }).items;
    expect(items.map((i) => i.id)).toEqual(["1"]);
    expect(items[0].tone).toBe("positive");
  });
  it("bad JSON from the model is a fallback, not a crash", async () => {
    process.env.GEMINI_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "not json" }] } }] }) })));
    const r = await call({ items: [{ id: "1", title: "x", source: "y" }] });
    expect(r.body).toMatchObject({ fallback: true, reason: "bad_json" });
  });
  it("a network throw is a fallback, not a 500", async () => {
    process.env.GEMINI_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const r = await call({ items: [{ id: "1", title: "x", source: "y" }] });
    expect(r.body).toMatchObject({ fallback: true, reason: "gemini_unreachable" });
  });
  it("rate limits after 6 calls a minute per IP", async () => {
    const ip = { "x-forwarded-for": "9.9.9.9" };
    let last: { code: number; body: Record<string, unknown> } | undefined;
    for (let i = 0; i < 7; i++) last = await call({ items: [{ id: `a${i}`, title: "t", source: "s" }] }, ip);
    expect(last!.code).toBe(429);
    expect(last!.body).toMatchObject({ fallback: true, reason: "rate_limited" });
  });
});
