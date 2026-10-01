import { describe, expect, it } from "vitest";
import { alsoAnswered, toolHints } from "./multiPart";
describe("multiPart", () => {
  it("answers other concepts named in a long question, in its language", () => {
    const he = alsoAnswered("תסביר לי יחס שארפ ואיך זה שונה מסורטינו ומה זה אינפלציה", "");
    expect(he.length).toBeGreaterThan(0); expect(he.every((x) => /[א-ת]/.test(x.text))).toBe(true);
    expect(alsoAnswered("What is the Sharpe ratio and what about inflation?", "").length).toBeGreaterThan(0);
  });
  it("skips what the main answer already says and caps the list", () => {
    const first = alsoAnswered("Sharpe ratio, Sortino ratio, inflation, diversification", "");
    expect(first.length).toBeLessThanOrEqual(3);
    expect(alsoAnswered("Sharpe ratio", alsoAnswered("Sharpe ratio", "")[0].text)).toEqual([]);
  });
  it("points to tools for market drop, monthly deposits and loans", () => {
    expect(toolHints("what if the market drops 30 percent").map((h) => h.toolId)).toEqual(["simulation"]);
    expect(toolHints("כמה להפקיד כל חודש").map((h) => h.toolId)).toEqual(["calculator"]);
    expect(toolHints("hello")).toEqual([]);
  });
  it("hints carry no digits", () => { for (const q of ["market drop monthly loan"]) for (const h of toolHints(q)) expect(/\d/.test(h.en + h.he)).toBe(false); });
});
