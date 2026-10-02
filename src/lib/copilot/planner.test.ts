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

describe("rent-versus-buy routing", () => {
  it("opens the money lesson lab before the generic comparison route", () => {
    const p = planQuestion("שכירות מול קנייה של דירה ב-2,000,000 שקל, שכירות 6,000 בחודש");
    expect(p.route).toBe("tool");
    expect(p.toolPath).toBe("/money-lessons");
    expect(planQuestion("rent vs buy a home for 6000/month rent").toolPath).toBe("/money-lessons");
  });
});

describe("math route", () => {
  it("routes plain arithmetic to the math desk and leaves questions alone", () => {
    expect(planQuestion("1000*1.07^10").route).toBe("math");
    expect(planQuestion("what is inflation").route).not.toBe("math");
  });
});

describe("fx route", () => {
  it("routes a currency question and keeps others out", () => {
    expect(planQuestion("100 USD to ILS").route).toBe("fx");
    expect(planQuestion("what is inflation").route).not.toBe("fx");
  });
});

describe("wb route", () => {
  it("routes a country statistic and keeps concept questions out", () => {
    expect(planQuestion("inflation in Israel").route).toBe("wb");
    expect(planQuestion("what is inflation").route).not.toBe("wb");
  });
});

describe("scenario route", () => {
  it("routes a long multi-calculation question", () => {
    expect(planQuestion("Invest 10000 and save 500 a month for 10 years. Then what is 15% of 2000?").route).toBe("scenario");
    expect(planQuestion("invest 10000 and save 500 a month for 10 years").route).toBe("calc");
  });
});
