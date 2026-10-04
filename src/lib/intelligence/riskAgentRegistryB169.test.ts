import { describe, expect, it } from "vitest";
import { SUPER_AGENTS, formatAgentResult, parseAgentRequest } from "./superAgents";
import { allConcepts } from "../knowledge/concepts/registry";
import { conceptAnswerByLabel } from "../financialEducation";
const names = ["risk", "volatility", "drawdown", "beta", "diversification", "hedging", "leverage", "stop-loss", "correlation", "asset-allocation", "time-horizon", "credit-rating", "liquidity", "duration", "short-selling", "rebalancing"];
const concepts = allConcepts();
const rows = names.flatMap((id) => ["en", "he"].map((lang) => [id, lang as "en" | "he"] as const));
describe("[sweep] B169 risk specialist copies stored explanations and preserves limits", () => {
  it.each(rows)("risk concept %s language %s", (id, lang) => {
    const concept = concepts.find((c) => c.id === id)!;
    const result = SUPER_AGENTS.risk.run(concept[lang], lang);
    expect(result.agent).toBe("risk");
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeLessThanOrEqual(4);
    for (const step of result.steps) {
      const source = concepts.find((c) => c.id === step.id)!;
      expect(step.label).toBe(source[lang]);
      expect(step.text).toBe(conceptAnswerByLabel(source.explain!, lang));
    }
    expect(result.next.length).toBeLessThanOrEqual(3);
    expect(new Set(result.next.map((n) => n.id)).size).toBe(result.next.length);
    expect(result.next.every((n) => !result.steps.some((s) => s.id === n.id))).toBe(true);
    const formatted = formatAgentResult(result, lang);
    expect(formatted).toContain(result.limits[lang]);
    for (const step of result.steps) expect(formatted).toContain(step.text);
    expect(result.tools.map((t) => t.path)).toEqual(["/simulation", "/calculator"]);
    const request = parseAgentRequest(`${lang === "en" ? "Risk agent" : "סוכן סיכון"}: ${concept[lang]}`);
    expect(request?.agent.id).toBe("risk");
    expect(request?.question).toBe(concept[lang]);
  });
});
describe("[hand] B169 specialist triggers need a nonblank question", () => {
  it("does not create work from a bare role label", () => {
    for (const text of ["Risk agent", "Learning agent:", "סוכן סיכון:  ", "סוכן למידה"]) expect(parseAgentRequest(text)).toBeNull();
  });
});
