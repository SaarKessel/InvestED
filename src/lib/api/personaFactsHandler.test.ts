import { describe, expect, it } from "vitest";
import handler from "./personaFactsHandler";

const run = async (query: Record<string, string>, f: typeof fetch) => {
  let status = 0, body: unknown;
  await handler({ query }, { setHeader() {}, status(c) { status = c; return { json(b) { body = b; } }; } }, f);
  return { status, body: body as Record<string, unknown> };
};
const tickers = { "0": { cik_str: 320193, ticker: "AAPL" } };
const facts = { entityName: "Apple Inc.", facts: { "us-gaap": { StockholdersEquity: { units: { USD: [{ end: "2025-09-27", val: 1, fy: 2025, fp: "FY", form: "10-K" }] } } } } };
const fake = (map: Record<string, unknown>, status = 200) => (async (url: string) => {
  const hit = Object.keys(map).find((k) => String(url).includes(k));
  return hit ? { ok: status < 400, status, json: async () => map[hit] } : { ok: false, status: 404, json: async () => ({}) };
}) as unknown as typeof fetch;

describe("persona-facts handler", () => {
  it("rejects bad symbols without a network call", async () => {
    let called = false;
    expect((await run({ symbol: "bad symbol!" }, (async () => { called = true; }) as unknown as typeof fetch)).status).toBe(400);
    expect(called).toBe(false);
  });
  it("returns facts for a US filer", async () => {
    const r = await run({ symbol: "AAPL" }, fake({ "company_tickers": tickers, "companyfacts/CIK0000320193": facts }));
    expect(r.status).toBe(200); expect((r.body.facts as { name: string }).name).toBe("Apple Inc.");
  });
  it("404s for a non-US or unknown symbol instead of guessing", async () => {
    expect((await run({ symbol: "NOPE" }, fake({ "company_tickers": tickers }))).status).toBe(404);
  });
});
