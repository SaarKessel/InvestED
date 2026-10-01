import { describe, expect, it } from "vitest";
import { describeStep, TRUST_LABEL } from "./provenance";
describe("provenance", () => {
  it("has he and en labels for every class", () => { for (const v of Object.values(TRUST_LABEL)) { expect(v.en).toBeTruthy(); expect(v.he).toBeTruthy(); } });
  it("describes a real step with source and time", () => { expect(describeStep({ tool: "quote", trust: "DATA", source: "yahoo_finance", asOf: "12:41" }, "en")).toBe("Market data: quote · yahoo_finance · 12:41"); });
});
