import { describe, expect, it, vi } from "vitest";
import { fetchDebate, lineIsSafe, guardContext, validateDebate } from "./investmentDebate";
import type { BriefFacts } from "./scenarioBrief";

const facts: BriefFacts = { symbol: "NVDA", name: "NVIDIA", lines: ["Last price 120.50 USD, daily change 1.20%.", "RSI(14) is 62.40.", "SMA50 is 110.00 (price is above it)."], unavailable: ["basic financials (no reliable provider)"] };
const good = { bull: ["The price is above its SMA50 of 110.00, a sign of steady strength."], bear: ["RSI(14) is 62.40, which can mean the move is stretched."], risk: "Basic financials are unavailable, so valuation is unknown.", changeMyMind: ["If the price falls below its SMA50, the bull case weakens."] };

describe("validateDebate", () => {
  it("keeps a clean debate", () => expect(validateDebate(good, facts, "en")).toEqual(good));
  it("drops an argument with a number the engine did not return", () => {
    const r = validateDebate({ ...good, bull: ["Price could reach 150 soon.", ...good.bull] }, facts, "en")!;
    expect(r.bull).toEqual(good.bull);
  });
  it("requires bull and bear to cite a fact number", () => {
    expect(validateDebate({ ...good, bull: ["Momentum looks strong overall."] }, facts, "en")).toBeNull();
  });
  it("rejects verdict and forecast language", () => {
    for (const bad of ["You should buy at 120.50.", "Analysts say hold since RSI(14) is 62.40.", "The price will rise from 120.50.", "A price target of 120.50 is fair."]) {
      expect(lineIsSafe(bad, guardContext(facts, "en"), true), bad).toBe(false);
    }
  });
  it("rejects hebrew advice and wrong script", () => {
    const he = guardContext(facts, "he");
    expect(lineIsSafe("מומלץ לקנות כי ה-RSI הוא 62.40.", he, true)).toBe(false);
    expect(lineIsSafe("כדאי לקנות כי RSI הוא 62.40", he, true)).toBe(false);
    expect(lineIsSafe("המחיר מעל SMA50 שעומד על 110.00.", he, true)).toBe(true);
    expect(lineIsSafe("The price is above 110.00.", he, true)).toBe(false);
  });
  it("rejects invented tickers", () => expect(lineIsSafe("AAPL is cheaper than 120.50.", guardContext(facts, "en"), true)).toBe(false));
  it("needs both sides and a change-my-mind list", () => {
    expect(validateDebate({ ...good, bear: [] }, facts, "en")).toBeNull();
    expect(validateDebate({ ...good, changeMyMind: [] }, facts, "en")).toBeNull();
    expect(validateDebate(null, facts, "en")).toBeNull();
  });
  it("drops a change-my-mind item with an invented threshold", () => {
    const r = validateDebate({ ...good, changeMyMind: ["If RSI(14) drops below 30, caution rises.", "If new headlines change the story, revisit."] }, facts, "en")!;
    expect(r.changeMyMind).toEqual(["If new headlines change the story, revisit."]);
  });
});

describe("fetchDebate", () => {
  it("returns null on fallback or network error", async () => {
    expect(await fetchDebate(facts, "en", async () => ({ ok: true, json: async () => ({ fallback: true }) }))).toBeNull();
    expect(await fetchDebate(facts, "en", vi.fn(async () => { throw new Error("x"); }))).toBeNull();
  });
  it("re-validates what the server sent", async () => {
    const r = await fetchDebate(facts, "en", async () => ({ ok: true, json: async () => ({ debate: { ...good, bull: ["Buy now at 120.50."] } }) }));
    expect(r).toBeNull();
  });
});

describe("shared advice guard is applied", () => {
  it("rejects what checkAdvice rejects", async () => {
    const { checkAdvice } = await import("../copilot/adviceGuard");
    const line = "You should put 50% of your savings in it given RSI(14) is 62.40.";
    expect(checkAdvice(line).ok).toBe(false);
    expect(lineIsSafe(line, guardContext(facts, "en"), true)).toBe(false);
  });
});
