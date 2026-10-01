import { describe, expect, it } from "vitest";
import { lookupSymbol, parseSymbolQuestion, toInfo } from "./symbolDesk";
describe("symbolDesk", () => {
  it("only fires on 'what is TICKER' with an uppercase ticker that is not a finance term", () => {
    expect(parseSymbolQuestion("what is VOO")).toBe("VOO");
    expect(parseSymbolQuestion("מה זה AAPL?")).toBe("AAPL");
    expect(parseSymbolQuestion("what is ETF")).toBeNull();
    expect(parseSymbolQuestion("what is inflation")).toBeNull();
    expect(parseSymbolQuestion("what is voo")).toBeNull();
    expect(parseSymbolQuestion("how is AAPL doing")).toBeNull();
  });
  it("looks up names from the trimmed list", async () => {
    expect((await lookupSymbol("AAPL"))?.name).toBe("Apple Inc.");
    expect((await lookupSymbol("VOO"))?.kind).toBe("fund");
    expect(await lookupSymbol("ZZZZQ")).toBeNull();
  });
  it("maps rows", () => { expect(toInfo("X", undefined)).toBeNull(); });
});
