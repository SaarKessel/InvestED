import { describe, expect, it } from "vitest";
import { buildBrief, isDeepRequest, MAX_STEPS, planResearch, runDeepResearch, stripTrigger } from "./deepResearch";
describe("deepResearch", () => {
  it("triggers only with the phrase and a question", () => {
    expect(isDeepRequest("Deep research: inflation and bonds")).toBe(true);
    expect(isDeepRequest("מחקר מעמיק: פיזור וריבית")).toBe(true);
    expect(isDeepRequest("deep research")).toBe(false);
    expect(isDeepRequest("what is deep research")).toBe(false);
    expect(stripTrigger("Deep research: inflation")).toBe("inflation");
  });
  it("plans at most MAX_STEPS steps, each from stored text", () => {
    const steps = planResearch("diversification inflation bonds stocks ETF index fund dividend yield volatility risk", "en");
    expect(steps.length).toBeGreaterThan(1); expect(steps.length).toBeLessThanOrEqual(MAX_STEPS);
    for (const s of steps) expect(s.text.length).toBeGreaterThan(10);
  });
  it("runs steps in order, rewords through the injected model, and falls back to the stored brief", async () => {
    const seen: number[] = [];
    const ok = await runDeepResearch("diversification and inflation", "en", (d) => seen.push(d), async () => "reworded");
    expect(ok.reworded).toBe(true); expect(ok.text).toBe("reworded"); expect(seen).toEqual(seen.slice().sort((a, b) => a - b));
    const fb = await runDeepResearch("diversification and inflation", "en", () => undefined, async () => null);
    expect(fb.reworded).toBe(false); expect(fb.text).toBe(buildBrief(fb.steps, "diversification and inflation", "en"));
  });
  it("says nothing when the knowledge base has nothing", async () => {
    const r = await runDeepResearch("zzzz qqqq", "en", () => undefined, async () => "x");
    expect(r.steps).toEqual([]); expect(r.text).toBe("");
  });
});

import { missingTopics } from "./deepResearch";
describe("missing topics", () => { it("names concepts without a stored explanation, never invents text", async () => { const m = missingTopics("inflation bonds diversification", "en"); expect(Array.isArray(m)).toBe(true); const r = await runDeepResearch("inflation bonds diversification", "en", () => undefined, async () => null); expect(r.missing).toEqual(m); }); });
