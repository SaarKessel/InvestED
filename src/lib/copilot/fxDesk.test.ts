import { describe, expect, it } from "vitest";
import { loadFx, parseFxRequest } from "./fxDesk";
describe("fxDesk", () => {
  it("parses English and Hebrew", () => {
    expect(parseFxRequest("100 USD to ILS")).toEqual({ amount: 100, from: "USD", to: "ILS" });
    expect(parseFxRequest("convert 500 euros to dollars")).toEqual({ amount: 500, from: "EUR", to: "USD" });
    expect(parseFxRequest("כמה זה 100 דולר בשקלים")).toEqual({ amount: 100, from: "USD", to: "ILS" });
    expect(parseFxRequest("שער דולר שקל")).toEqual({ amount: 1, from: "USD", to: "ILS" });
  });
  it("leaves other questions alone", () => {
    for (const q of ["what is a dollar cost average", "invest 500 dollars a month for 10 years", "hello", "100 USD"]) expect(parseFxRequest(q)).toBeNull();
  });
  it("loads a rate and handles failure", async () => {
    const ok = (async () => ({ ok: true, json: async () => ({ date: "2026-09-30", rates: { ILS: 3 } }) })) as unknown as typeof fetch;
    expect((await loadFx({ amount: 10, from: "USD", to: "ILS" }, ok))?.result).toBe(30);
    const bad = (async () => { throw new Error("x"); }) as unknown as typeof fetch;
    expect(await loadFx({ amount: 10, from: "USD", to: "ILS" }, bad)).toBeNull();
  });
});
