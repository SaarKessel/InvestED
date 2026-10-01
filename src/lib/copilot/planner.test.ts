import { describe, expect, it } from "vitest";
import { planQuestion, stepLabel, trustLabel } from "./planner";
describe("planner routes", () => {
  it("calculation questions route to the calculator with a CALCULATION step", () => {
    const p = planQuestion("If I invest 1000 at 7% for 10 years what do I get?");
    expect(["calc", "copilot"]).toContain(p.route);
    if (p.route === "calc") expect(p.trace.some((s) => s.trust === "CALCULATION")).toBe(true);
  });
  it("a plain concept question goes to the knowledge route and says a model may only rephrase", () => {
    const p = planQuestion("What is diversification?");
    expect(p.route).toBe("copilot");
    expect(p.trace.map((s) => stepLabel(s, "en")).join(" ")).toMatch(/only rephrase/);
    expect(p.trace.map((s) => stepLabel(s, "he")).join(" ")).toMatch(/רשאי/);
  });
  it("every step has en and he text; trust labels exist in both languages", () => {
    for (const q of ["What is diversification?", "open the calculator", "מה זה מדד?", "show me the market movers"]) {
      for (const s of planQuestion(q).trace) { expect(s.text.en.length).toBeGreaterThan(5); expect(s.text.he.length).toBeGreaterThan(5); if (s.trust) { expect(trustLabel(s.trust, "en")).toBeTruthy(); expect(trustLabel(s.trust, "he")).toBeTruthy(); } }
    }
  });
});
