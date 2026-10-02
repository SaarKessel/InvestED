import { describe, expect, it } from "vitest";
import { formatAgentResult, parseAgentRequest, SUPER_AGENTS } from "./superAgents";
import { numbersIn } from "./verificationEngine";
import { conceptAnswerByLabel } from "@/lib/financialEducation";
import { getConcept } from "@/lib/knowledge/concepts/registry";

describe("parseAgentRequest", () => {
  it("reads the trigger in both languages and returns the question", () => {
    expect(parseAgentRequest("Risk agent: what is drawdown?")).toMatchObject({ question: "what is drawdown?" });
    expect(parseAgentRequest("סוכן למידה: מה זה אג״ח")?.agent.id).toBe("learning");
  });
  it("ignores plain questions and an empty request", () => {
    expect(parseAgentRequest("what is drawdown?")).toBeNull();
    expect(parseAgentRequest("risk agent:")).toBeNull();
  });
});
describe("risk agent", () => {
  it("answers a named risk concept from the stored text only", () => {
    const r = SUPER_AGENTS.risk.run("what is drawdown?", "en");
    expect(r.empty).toBe(false);
    expect(r.steps[0].id).toBe("drawdown");
    expect(r.steps[0].text).toBe(conceptAnswerByLabel(getConcept("drawdown")!.explain!, "en"));
  });
  it("falls back to the core risk concepts for a general question", () => {
    expect(SUPER_AGENTS.risk.run("how risky is investing", "en").steps.length).toBeGreaterThan(0);
  });
  it("keeps next topics inside the risk domain and always states its limits", () => {
    const r = SUPER_AGENTS.risk.run("volatility", "en");
    expect(r.limits.en).toMatch(/do not measure/);
    expect(r.tools.map((t) => t.path)).toContain("/simulation");
  });
});
describe("learning agent", () => {
  it("explains one concept and suggests linked ones to study next", () => {
    const r = SUPER_AGENTS.learning.run("what is an ETF", "en");
    expect(r.steps).toHaveLength(1);
    expect(r.next.length).toBeGreaterThan(0);
    expect(r.next.every((n) => n.id !== r.steps[0].id)).toBe(true);
  });
  it("says plainly when nothing is stored", () => {
    const r = SUPER_AGENTS.learning.run("qqqzzz", "en");
    expect(r.empty).toBe(true);
    expect(formatAgentResult(r, "en")).toMatch(/nothing to answer/);
    expect(formatAgentResult(r, "he")).toMatch(/אין לי מה לענות/);
  });
});
describe("formatAgentResult", () => {
  it("adds no number that is not in the stored text", () => {
    for (const lang of ["en", "he"] as const) {
      const r = SUPER_AGENTS.risk.run(lang === "he" ? "סטיית תקן" : "volatility and drawdown", lang);
      const stored = r.steps.map((s) => s.text).join(" ");
      const out = formatAgentResult(r, lang);
      expect(numbersIn(out).every((n) => numbersIn(stored).includes(n))).toBe(true);
    }
  });
});
