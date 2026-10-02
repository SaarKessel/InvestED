import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../api/nportHandler";

function run(query: Record<string, string>) {
  let status = 0; let body: unknown;
  handler({ query }, { setHeader: () => {}, status: (c) => ({ json: (b) => { status = c; body = b; } }) });
  return new Promise<{ status: number; body: unknown }>((resolve) => { const tick = () => (status ? resolve({ status, body }) : setTimeout(tick, 5)); tick(); });
}
afterEach(() => vi.unstubAllGlobals());

describe("/api/sec-nport", () => {
  it("400 on an invalid ticker without calling SEC", async () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect((await run({ ticker: "../x" })).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("503 when SEC is down, with a contact in the User-Agent", async () => {
    const f = vi.fn(async () => ({ ok: false, status: 500, text: async () => "" })); vi.stubGlobal("fetch", f);
    const r = await run({ ticker: "ZZZA" });
    expect(r).toEqual({ status: 503, body: { error: "sec_unavailable" } });
    const init = (f.mock.calls[0] as unknown as [string, { headers: Record<string, string> }])[1];
    expect(init.headers["User-Agent"]).toMatch(/@/);
  });
});
