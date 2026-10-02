import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./copy13fHandler";

const run = async (query: Record<string, string>) => {
  let status = 0, body: unknown;
  await handler({ query }, { setHeader() {}, status(c) { status = c; return { json(b) { body = b; } }; } });
  return { status, body };
};
afterEach(() => vi.unstubAllGlobals());

describe("copy-13f handler", () => {
  it("rejects a bad CIK without any network call", async () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect((await run({ cik: "abc" })).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("reports SEC unavailable instead of inventing a result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, text: async () => "" })));
    expect((await run({ cik: "1067983" })).status).toBe(503);
  });
});
