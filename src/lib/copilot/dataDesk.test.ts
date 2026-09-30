import { describe, expect, it } from "vitest";
import { resolveDataDesk } from "./dataDesk";
describe("data desk routing", () => {
  it("routes movers, policy rate and insurance in both languages", () => {
    expect(resolveDataDesk("show top gainers today")).toBe("movers");
    expect(resolveDataDesk("מה זז בשוק?")).toBe("movers");
    expect(resolveDataDesk("what is the bank of israel rate")).toBe("policy_rate");
    expect(resolveDataDesk("מה ריבית בנק ישראל")).toBe("policy_rate");
    expect(resolveDataDesk("insurance fund yields")).toBe("insurance");
    expect(resolveDataDesk("תשואות בביטוח")).toBe("insurance");
  });
  it("leaves other questions to the engines", () => {
    expect(resolveDataDesk("What is VOO price?")).toBeNull();
    expect(resolveDataDesk("explain interest rate risk")).toBeNull();
  });
});
