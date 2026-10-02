import { afterEach, describe, expect, it, vi } from "vitest";

import handler from "../api/sec13fHandler";

function run(query: Record<string, string>) {
  const headers: Record<string, string> = {};
  let status = 0;
  let body: unknown;
  handler(
    { query },
    {
      setHeader: (k, v) => void (headers[k] = v),
      status: (code) => ({ json: (b) => { status = code; body = b; } }),
    }
  );
  return new Promise<{ status: number; body: unknown; headers: Record<string, string> }>((resolve) => {
    const tick = () => (status ? resolve({ status, body, headers }) : setTimeout(tick, 5));
    tick();
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("/api/sec-13f", () => {
  it("rejects an invalid CIK without calling SEC", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const r = await run({ cik: "../x" });
    expect(r.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it("sends a User-Agent with a contact address and maps SEC outage to 503", async () => {
    const f = vi.fn(async () => ({ ok: false, status: 500, text: async () => "" }));
    vi.stubGlobal("fetch", f);
    const r = await run({ cik: "999001" });
    expect(r.status).toBe(503);
    expect(r.body).toEqual({ error: "sec_unavailable" });
    const init = (f.mock.calls[0] as unknown as [string, { headers: Record<string, string> }])[1];
    expect(init.headers["User-Agent"]).toMatch(/@/);
  });

  it("maps a filer without 13F to 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ filings: { recent: { form: ["8-K"], accessionNumber: ["a"] } } }) })));
    const r = await run({ cik: "999002" });
    expect(r.status).toBe(404);
  });
});
