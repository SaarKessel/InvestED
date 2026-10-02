import { describe, expect, it } from "vitest";
import { computeProjection } from "../calculatorEngine";
import { parseTranscription, solveCashflow, solveCompound, toNumber, transcriptionQuestion, validateCashflow, validateCompound } from "./workPad";

describe("workPad parsing and validation", () => {
  it("parses typed numbers strictly", () => {
    expect(toNumber("1,000")).toBe(1000);
    expect(toNumber(" 5% ")).toBe(5);
    expect(toNumber("-2.5")).toBe(-2.5);
    for (const bad of ["", "abc", "1e9x", "5 years", "NaN", "Infinity"]) expect(toNumber(bad)).toBeNull();
  });
  it("validates compound setups and rejects out-of-range values", () => {
    expect(validateCompound({ principal: 1000, monthly: 100, years: 10, annualPct: 5 })).not.toBeNull();
    expect(validateCompound({ principal: -1, monthly: 0, years: 10, annualPct: 5 })).toBeNull();
    expect(validateCompound({ principal: 1000, monthly: 0, years: 0, annualPct: 5 })).toBeNull();
    expect(validateCompound({ principal: 1000, monthly: 0, years: 10, annualPct: 500 })).toBeNull();
    expect(validateCompound({ principal: 0, monthly: 0, years: 10, annualPct: 5 })).toBeNull();
    expect(validateCompound({ principal: null, monthly: 0, years: 10, annualPct: 5 })).toBeNull();
  });
  it("validates cash-flow setups and sorts by time", () => {
    const s = validateCashflow(10, [{ t: 2, amount: 600 }, { t: 0, amount: -1000 }])!;
    expect(s.flows.map((f) => f.t)).toEqual([0, 2]);
    expect(validateCashflow(10, [])).toBeNull();
    expect(validateCashflow(null, [{ t: 0, amount: 1 }])).toBeNull();
    expect(validateCashflow(10, [{ t: -1, amount: 1 }])).toBeNull();
    expect(validateCashflow(10, Array.from({ length: 13 }, () => ({ t: 1, amount: 1 })))).toBeNull();
  });
});

describe("workPad deterministic solutions", () => {
  it("compound result equals the site's calculator engine", () => {
    const s = validateCompound({ principal: 10000, monthly: 500, years: 20, annualPct: 7 })!;
    const e = computeProjection(10000, 500, 20, 7, 0);
    const r = solveCompound(s);
    expect(r.finalBalance).toBe(e.finalBalance);
    expect(r.totalContributed).toBe(10000 + 500 * 240);
    expect(r.growth).toBe(e.growth);
    expect(r.months).toBe(240);
  });
  it("cash-flow present value and future value match hand calculation", () => {
    const s = validateCashflow(10, [{ t: 0, amount: -1000 }, { t: 1, amount: 600 }, { t: 2, amount: 600 }])!;
    const r = solveCashflow(s);
    expect(r.presentValue).toBeCloseTo(-1000 + 600 / 1.1 + 600 / 1.21, 6);
    expect(r.futureValue).toBeCloseTo(r.presentValue * 1.21, 6);
    expect(r.rows[1].discountFactor).toBeCloseTo(1 / 1.1, 8);
    expect(r.horizon).toBe(2);
  });
  it("zero rate leaves amounts unchanged", () => {
    const r = solveCashflow(validateCashflow(0, [{ t: 0, amount: -100 }, { t: 3, amount: 100 }])!);
    expect(r.presentValue).toBe(0);
    expect(r.futureValue).toBe(0);
  });
});

describe("workPad photo transcription parsing", () => {
  it("accepts JSON inside code fences and keeps only numbers", () => {
    const t = parseTranscription("compound", '```json\n{"principal": 5000, "monthly": "100", "years": 10, "annualPct": null}\n```')!;
    expect(t.compound).toEqual({ principal: 5000, monthly: null, years: 10, annualPct: null });
  });
  it("drops malformed flows and returns null when nothing usable", () => {
    const t = parseTranscription("cashflow", '{"ratePct": 8, "flows": [{"t": 0, "amount": -500}, {"t": "x", "amount": 5}, null]}')!;
    expect(t.cashflow).toEqual({ ratePct: 8, flows: [{ t: 0, amount: -500 }] });
    for (const bad of [null, "", "no json here", "{broken", '{"principal": "abc"}', "[]"]) expect(parseTranscription("compound", bad)).toBeNull();
  });
  it("asks the model only to transcribe, never to solve", () => {
    for (const k of ["compound", "cashflow"] as const) {
      const q = transcriptionQuestion(k, "en");
      expect(q).toMatch(/Do not solve it/);
      expect(q).toMatch(/Never guess/);
    }
  });
});
