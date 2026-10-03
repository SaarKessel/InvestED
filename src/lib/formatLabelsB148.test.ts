import { describe, expect, it } from "vitest";
import { calculatorGoalLabel, dashboardGoalLabel, investorTypeLabel, riskBandLabel, confidenceLabel } from "./format";
const mappings = [
  ["calculator", "growth", "calc_ex_growth", "Wealth Building"],
  ["calculator", "retirement", "calc_ex_early_retirement", "Early Retirement"],
  ["calculator", "child", "calc_ex_children", "Saving for Children"],
  ["calculator", "home", "calc_ex_house", "Home Purchase"],
  ["calculator", "wealth", "calc_ex_independence", "Financial Independence"],
  ["dashboard", "retirement", "dashboard_goal_retirement", "Retirement & Financial Independence"],
  ["dashboard", "home", "dashboard_goal_house", "Home Purchase"],
  ["dashboard", "child", "dashboard_goal_children", "Children's Savings"],
  ["dashboard", "growth", "dashboard_goal_wealth", "Wealth Building"],
  ["investor", "conservative", "investor_type_conservative", "Conservative"],
  ["investor", "balanced", "investor_type_balanced", "Balanced"],
  ["investor", "growth", "investor_type_growth", "Growth"],
  ["investor", "dividend", "investor_type_dividend", "Dividend"],
  ["investor", "passive", "investor_type_passive", "Passive"],
  ["investor", "value", "investor_type_value", "Value"],
  ["risk", "low", "risk_band_low", "Low"],
  ["risk", "medium", "risk_band_medium", "Medium"],
  ["risk", "high", "risk_band_high", "High"],
] as const;
describe("[sweep] B148 UI labels request exact translation keys and fallback copy", () => {
  it.each(mappings)("%s value %s key %s", (kind, value, key, fallback) => {
    const calls: unknown[][] = [];
    const t = (k: string, f?: string) => { calls.push([k, f]); return `translated:${k}`; };
    const fn = { calculator: calculatorGoalLabel, dashboard: dashboardGoalLabel, investor: investorTypeLabel, risk: riskBandLabel }[kind];
    expect(fn(value, t)).toBe(`translated:${key}`);
    expect(calls).toEqual([[key, fallback]]);
  });
});
const confidence = [[undefined, "not_calculated"], [0, "not_calculated"], [1, "low"], [49.99, "low"], [50, "medium"], [79.99, "medium"], [80, "high"], [100, "high"]] as const;
describe("[sweep] B148 confidence label thresholds", () => {
  it.each(confidence)("value %s band %s", (value, band) => expect(confidenceLabel(value, (key) => key)).toBe(`dashboard_${band === "not_calculated" ? band : `confidence_${band}`}`));
});
describe("[hand] B148 unknown label fallbacks stay explicit", () => {
  it("unknown investor/risk strings remain literal and missing goals use general labels", () => {
    const t = (key: string) => key;
    expect(investorTypeLabel("custom", t)).toBe("custom");
    expect(riskBandLabel("custom", t)).toBe("custom");
    expect(riskBandLabel(undefined, t)).toBe("risk_band_medium");
    expect(calculatorGoalLabel(undefined, t)).toBe("calc_ex_general");
    expect(dashboardGoalLabel(undefined, t)).toBe("dashboard_goal_wealth_build");
  });
});
