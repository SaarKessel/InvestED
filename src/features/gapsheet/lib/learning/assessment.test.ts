import { describe, it, expect } from "vitest";
import { ASSESSMENT_SKILLS, ASSESSMENT_CREDIT, BASE_SEED, RETEST_SEED, excelLevel, applyAssessment, planDeepening } from "./assessment";

describe("excelLevel", () => {
  it("maps pass ratios to levels", () => {
    expect(excelLevel(0)).toBe("beginner");
    expect(excelLevel(1)).toBe("beginner");
    expect(excelLevel(2)).toBe("basic");
    expect(excelLevel(4)).toBe("intermediate");
    expect(excelLevel(5)).toBe("intermediate");
  });
  it("handles a zero total without dividing by zero", () => {
    expect(excelLevel(0, 0)).toBe("beginner");
  });
});
describe("applyAssessment", () => {
  it("raises passed skills to the credit and never lowers scores", () => {
    const out = applyAssessment({ sum: 10, average: 80 }, { sum: true, average: true, if: false });
    expect(out.sum).toBe(ASSESSMENT_CREDIT);
    expect(out.average).toBe(80);
    expect(out.if).toBeUndefined();
  });
  it("does not mutate the input", () => {
    const scores = { sum: 10 };
    applyAssessment(scores, { sum: true });
    expect(scores.sum).toBe(10);
  });
});
describe("planDeepening", () => {
  const passAll = Object.fromEntries(ASSESSMENT_SKILLS.map((k) => [`${k}:${BASE_SEED}`, true]));
  it("waits while base results are incomplete", () => {
    expect(planDeepening({}).mode).toBe("none");
    expect(planDeepening({ "sum:7": true }).mode).toBe("none");
  });
  it("goes harder when nearly everything passed", () => {
    const plan = planDeepening(passAll);
    expect(plan.mode).toBe("harder");
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.tasks.every((t) => t.seed === BASE_SEED)).toBe(true);
  });
  it("offers a retest on different data for up to 2 failed skills", () => {
    const results = { ...passAll, [`sum:${BASE_SEED}`]: false, [`average:${BASE_SEED}`]: false, [`if:${BASE_SEED}`]: false };
    const plan = planDeepening(results);
    expect(plan.mode).toBe("retest");
    expect(plan.tasks.length).toBeLessThanOrEqual(2);
    expect(plan.tasks.every((t) => t.seed === RETEST_SEED)).toBe(true);
  });
  it("retests only once", () => {
    const results = { ...passAll, [`sum:${BASE_SEED}`]: false, [`average:${BASE_SEED}`]: false, [`sum:${RETEST_SEED}`]: false };
    expect(planDeepening(results).mode).toBe("none");
  });
});
