import { describe, expect, it } from "vitest";
import { MARKET_SIM_LABEL, parseMarketEventRequest, simulateMarketEvent } from "./marketEvents";
import { planQuestion } from "@/lib/copilot/planner";
import { runTool } from "@/lib/intelligence/tools";

describe("market event simulator", () => {
  it("label text is the approved wording in both languages", () => {
    expect(MARKET_SIM_LABEL.he).toBe("תרחיש לימודי, לא נתונים אמיתיים");
    expect(MARKET_SIM_LABEL.en).toBe("Educational scenario, not real data");
  });
  it("is deterministic and always synthetic and labelled", () => {
    const a = simulateMarketEvent({ kind: "crash", amount: 5000, magnitudePct: 35 });
    expect(simulateMarketEvent({ kind: "crash", amount: 5000, magnitudePct: 35 })).toEqual(a);
    expect(a.synthetic).toBe(true);
    expect(a.label).toEqual(MARKET_SIM_LABEL);
  });
  it("crash: drawdown equals the requested depth and recovery maths is exact", () => {
    const r = simulateMarketEvent({ kind: "crash", magnitudePct: 50 });
    expect(r.maxDrawdownPct).toBeCloseTo(50, 1);
    expect(r.recoveryNeededPct).toBeCloseTo(100, 0);
    expect(r.points[0].value).toBe(10000);
  });
  it("rally ends at the requested gain; bubble peaks then falls 65%", () => {
    const rally = simulateMarketEvent({ kind: "rally", magnitudePct: 60 });
    expect(rally.endValue).toBeCloseTo(16000, 0);
    const bubble = simulateMarketEvent({ kind: "bubble", magnitudePct: 100 });
    expect(bubble.maxDrawdownPct).toBeCloseTo(65, 1);
    expect(bubble.peakValue).toBeCloseTo(20000, 0);
  });
  it("clamps nonsense inputs", () => {
    expect(simulateMarketEvent({ kind: "crash", magnitudePct: 500 }).magnitudePct).toBe(90);
    expect(simulateMarketEvent({ kind: "crash", amount: -5 }).startAmount).toBe(10000);
  });
  it("parses English and Hebrew requests, but not plain questions about real events", () => {
    expect(parseMarketEventRequest("simulate a market crash of 30% with 20000")).toEqual({ kind: "crash", amount: 20000, magnitudePct: 30 });
    expect(parseMarketEventRequest("תדמה לי תרחיש של בועה")?.kind).toBe("bubble");
    expect(parseMarketEventRequest("סימולציה של קריסה בשוק")?.kind).toBe("crash");
    expect(parseMarketEventRequest("what caused the 2008 crash?")).toBeNull();
    expect(parseMarketEventRequest("what is a bubble")).toBeNull();
  });
  it("the planner routes it and the tool reports a synthetic state, never live", async () => {
    const plan = planQuestion("simulate a market crash");
    expect(plan.route).toBe("marketsim");
    const out = await runTool("marketsim", plan.marketsim);
    expect(out.ok && out.result.provenance.state).toBe("synthetic");
    expect(out.ok && out.result.trust).toBe("SIMULATION");
  });
});

import { routeRequest } from "@/lib/intelligence/router";
describe("chat routing", () => {
  it("reaches the simulator from the chat router in both languages", () => {
    expect(routeRequest("simulate a market bubble with 5000").plan.route).toBe("marketsim");
    expect(routeRequest("תדמה לי תרחיש של קריסת שוק").plan.route).toBe("marketsim");
    expect(routeRequest("what is a stock market crash?").plan.route).not.toBe("marketsim");
  });
});
