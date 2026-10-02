import { describe, expect, it } from "vitest";
import { applyAdviceGuard, checkAdvice } from "./adviceGuard";

describe("adviceGuard", () => {
  it.each([
    ["You should buy AAPL now.", "directive"],
    ["Sell it immediately before it drops.", "directive"],
    ["I recommend you buy this stock.", "directive"],
    ["תקנה עכשיו את המניה", "directive"],
    ["כדאי לך למכור היום", "directive"],
    ["You should put 40% of your savings in Tesla.", "position_sizing"],
    ["Your optimal position size is 12 shares.", "position_sizing"],
    ["Invest everything into crypto.", "position_sizing"],
    ["This fund guarantees 8% returns.", "guaranteed_return"],
    ["It's a risk-free trade.", "guaranteed_return"],
    ["The price will definitely double.", "guaranteed_return"],
    ["תשואה מובטחת של 10%", "guaranteed_return"],
    ["השקעה ללא סיכון", "guaranteed_return"],
  ])("flags %s", (text, kind) => {
    const r = checkAdvice(text);
    expect(r.ok).toBe(false);
    expect(r.violations).toContain(kind);
  });

  it.each([
    "A buy order is an instruction to purchase a security at the market price.",
    "Index funds spread risk across many companies; past returns do not guarantee future results.",
    "Some people sell when a stock hits their stop-loss. That is a rule, not a recommendation.",
    "Diversification means not putting all your eggs in one basket.",
    "קנייה של מניה היא רכישת חלק קטן מחברה.",
    "תשואה היסטורית אינה מבטיחה תשואה עתידית.",
    "The portfolio held 40% bonds in this example.",
  ])("passes %s", (text) => {
    expect(checkAdvice(text).ok).toBe(true);
  });

  it("swaps in the disclaimer in the answer's language", () => {
    const en = applyAdviceGuard("You must buy now.");
    expect(en.guarded).toBe(true);
    expect(en.text).toMatch(/educational simulation/);
    const he = applyAdviceGuard("תקנה עכשיו");
    expect(he.text).toMatch(/סימולציה לימודית/);
  });

  it("leaves clean text untouched", () => {
    const r = applyAdviceGuard("Compound interest grows over time.");
    expect(r).toEqual({ text: "Compound interest grows over time.", guarded: false, violations: [] });
  });
});
