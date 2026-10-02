import { describe, expect, it } from "vitest";
import handler, { parseCloses } from "./closesHandler";

const run = async (query: Record<string, string>, fetchImpl: typeof fetch) => {
  let status = 0, body: unknown;
  await handler({ query }, { setHeader() {}, status(c) { status = c; return { json(b) { body = b; } }; } }, fetchImpl);
  return { status, body: body as Record<string, unknown> };
};
const chart = { chart: { result: [{ timestamp: [1759276800, 1759363200, 1759449600], indicators: { quote: [{ close: [100.123456, null, 102] }] } }] } };
const ok = (b: unknown, status = 200) => (async () => ({ ok: status < 400, status, json: async () => b })) as unknown as typeof fetch;

describe("closes handler", () => {
  it("drops null closes and keeps real ones", () => {
    expect(parseCloses(chart)).toEqual([{ date: "2025-10-01", close: 100.1235 }, { date: "2025-10-03", close: 102 }]);
    expect(parseCloses({})).toBeNull();
    expect(parseCloses({ chart: { result: [{ timestamp: [1], indicators: { quote: [{ close: [null] }] } }] } })).toBeNull();
  });
  it("rejects bad input before any fetch", async () => {
    let called = false;
    const f = (async () => { called = true; }) as unknown as typeof fetch;
    expect((await run({ symbol: "A B" }, f)).status).toBe(400);
    expect((await run({ symbol: "AAPL", from: "yesterday" }, f)).status).toBe(400);
    expect((await run({ symbol: "AAPL", from: "2999-01-01" }, f)).status).toBe(400);
    expect(called).toBe(false);
  });
  it("returns closes, and honest errors instead of invented data", async () => {
    const good = await run({ symbol: "aapl" }, ok(chart));
    expect(good.status).toBe(200); expect(good.body.symbol).toBe("AAPL");
    expect((await run({ symbol: "AAPL" }, ok({}, 404))).status).toBe(404);
    expect((await run({ symbol: "AAPL" }, ok({}, 500))).status).toBe(503);
    expect((await run({ symbol: "AAPL" }, ok({}))).status).toBe(502);
    expect((await run({ symbol: "AAPL" }, (async () => { throw new Error("x"); }) as unknown as typeof fetch)).status).toBe(503);
  });
});
