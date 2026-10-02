import { describe, expect, it } from "vitest";
import { buildDashboard } from "./dashboard";
import { DOMAINS } from "./domains";

const t = (route: string, ok = true) => ({ at: 1, route, tools: [], ms: 5, ok, failedChecks: ok ? [] : ["numbers"], q: "x", live: "none" as const });
describe("buildDashboard", () => {
  it("reports every domain with its true status", () => {
    const d = buildDashboard([]);
    expect(d.domains).toHaveLength(Object.keys(DOMAINS).length);
    expect(d.wiredDomains).toBe(d.domains.filter((x) => x.status === "wired").length);
    expect(d.wiredDomains).toBeLessThan(d.domains.length);
  });
  it("counts knowledge consistently", () => {
    const k = buildDashboard([]).knowledge;
    expect(k.withText + k.withoutText).toBe(k.concepts);
    expect(k.brokenLinks).toBe(0);
  });
  it("lists the runnable specialist agents", () => { expect(buildDashboard([]).superAgents.map((a) => a.id)).toEqual(["risk", "learning"]); });
  it("lists the topic agents", () => { expect(buildDashboard([]).agents.length).toBeGreaterThanOrEqual(4); });
  it("ranks routes and reports empty health as no data", () => {
    expect(buildDashboard([]).health.okRate).toBeNull();
    const d = buildDashboard([t("calc"), t("calc"), t("fx"), t("deep", false)]);
    expect(d.topRoutes[0]).toEqual({ route: "calc", count: 2 });
    expect(d.health.failures).toEqual({ numbers: 1 });
  });
});
