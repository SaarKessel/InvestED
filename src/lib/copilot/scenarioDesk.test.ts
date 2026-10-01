import { describe, expect, it } from "vitest";
import { loanExpression, runScenario } from "./scenarioDesk";
describe("scenarioDesk", () => {
  it("builds a pmt expression from a loan sentence", () => {
    expect(loanExpression("a loan of 200000 at 5% for 30 years")).toBe("pmt(200000, 5, 30)");
    expect(loanExpression("משכנתא של 800000 בריבית 4% ל-25 שנים")).toBe("pmt(800000, 4, 25)");
    expect(loanExpression("invest 500 a month")).toBeNull();
  });
  it("runs several parts in order", () => {
    const r = runScenario("Invest 10000 and save 500 a month for 10 years. Then what is 15% of 2000? Also a loan of 200000 at 5% for 30 years.")!;
    expect(r.map((p) => p.kind)).toEqual(["calc", "math", "math"]);
    const loan = r[2];
    expect(loan.kind === "math" && Math.round(loan.math.value ?? 0)).toBe(1074);
  });
  it("marks unreadable parts as skipped and needs two results", () => {
    const r = runScenario("What is 15% of 2000? Tell me a story about 3 dragons. And 2+2")!;
    expect(r.map((p) => p.kind)).toEqual(["math", "skipped", "math"]);
    expect(runScenario("What is 15% of 2000? Tell me a story about 3 dragons.")).toBeNull();
    expect(runScenario("2+2")).toBeNull();
  });
});
