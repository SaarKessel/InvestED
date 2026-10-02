import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./researchDebateHandler";

function run(req: Record<string, unknown>) {
  let status = 0; let body: unknown;
  return handler({ headers: {}, ...req } as never, { setHeader() {}, status: (c: number) => ({ json: (b: unknown) => { status = c; body = b; } }) } as never).then(() => ({ status, body }));
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const facts = { symbol: "NVDA", name: "NVIDIA", lines: ["RSI(14) is 62.40."], unavailable: [] };

describe("/api/research-debate", () => {
  it("only accepts POST", async () => expect((await run({ method: "GET" })).status).toBe(405));
  it("rejects a payload without facts", async () => expect((await run({ method: "POST", body: {} })).status).toBe(400));
  it("falls back when no key is configured and never calls out", async () => {
    vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("GOOGLE_API_KEY", "");
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    const r = await run({ method: "POST", body: { facts, language: "en" }, headers: { "x-forwarded-for": "1.1.1.1" } });
    expect(r.body).toMatchObject({ fallback: true });
    expect(f).not.toHaveBeenCalled();
  });
  it("falls back when the model output has no valid items", async () => {
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ bull: ["Buy it."], bear: [], risk: "", changeMyMind: [] }) }] } }] }) })));
    const r = await run({ method: "POST", body: { facts, language: "en" }, headers: { "x-forwarded-for": "2.2.2.2" } });
    expect(r.body).toMatchObject({ fallback: true });
  });
});
