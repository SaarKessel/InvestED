import { describe, expect, it } from "vitest";
import type { InvestmentStrategy } from "@/types";
import {
  STRATEGY_UNIVERSE,
} from "./strategyUniverse";
import {
  compareStrategies,
  detectStrategyMentions,
  educationalDisclaimer,
  evaluateEducationalFit,
  explainStrategy,
  filterStrategies,
  getStrategy,
  getStrategyRequirements,
  listStrategies,
  loadStrategyMarketExamples,
  searchStrategies,
  validateStrategyUniverse,
  type StrategyMarketFetcher,
} from "./strategyEngine";

const EXPECTED_IDS = [
  "long-term-index",
  "buy-and-hold",
  "dollar-cost-averaging",
  "value",
  "growth",
  "dividend",
  "momentum",
  "trend-following",
  "risk-based-allocation",
  "diversification",
] as const;

describe("Strategy universe schema", () => {
  it("contains exactly the ten initial strategies", () => {
    expect(listStrategies().map((strategy) => strategy.id)).toEqual([...EXPECTED_IDS]);
  });

  it("passes full schema validation for all strategies", () => {
    const result = validateStrategyUniverse();
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("flags an invalid strategy", () => {
    const broken = {
      ...STRATEGY_UNIVERSE[0],
      id: "broken",
      riskProfile: { level: 42, label: { he: "", en: "" } },
      rules: [],
    } as InvestmentStrategy;
    const result = validateStrategyUniverse([broken]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("never promises returns or issues buy/sell instructions", () => {
    const banned = /מובטחת|תשואה מובטחת|קנה עכשיו|מכור עכשיו|guaranteed return|guaranteed profit|buy now|sell now/i;
    for (const strategy of STRATEGY_UNIVERSE) {
      const text = JSON.stringify(strategy);
      expect(text).not.toMatch(banned);
    }
  });
});

describe("Strategy retrieval", () => {
  it("retrieves a strategy by id", () => {
    expect(getStrategy("value")?.name.en).toBe("Value Investing");
    expect(getStrategy("מומנטום")).toBeNull();
    expect(getStrategy("does-not-exist")).toBeNull();
  });
});

describe("Strategy search & filter", () => {
  it("searches in English", () => {
    const results = searchStrategies("dividend income");
    expect(results.map((strategy) => strategy.id)).toContain("dividend");
  });

  it("searches in Hebrew", () => {
    const results = searchStrategies("מיצוע");
    expect(results.map((strategy) => strategy.id)).toContain("dollar-cost-averaging");
  });

  it("searches with mixed-language queries", () => {
    const results = searchStrategies("מדד index");
    expect(results.map((strategy) => strategy.id)).toContain("long-term-index");
  });

  it("returns everything for an empty query", () => {
    expect(searchStrategies("  ")).toHaveLength(10);
  });

  it("filters by risk level, horizon, and asset type", () => {
    const lowRisk = filterStrategies({ maxRiskLevel: 4 });
    expect(lowRisk.every((strategy) => strategy.riskProfile.level <= 4)).toBe(true);
    expect(lowRisk.map((strategy) => strategy.id)).toContain("diversification");

    const shortTerm = filterStrategies({ timeHorizon: "short" });
    expect(shortTerm.map((strategy) => strategy.id)).toEqual(
      expect.arrayContaining(["momentum", "trend-following", "diversification"])
    );
    expect(shortTerm.map((strategy) => strategy.id)).not.toContain("long-term-index");

    const bonds = filterStrategies({ assetType: "bonds" });
    expect(bonds.map((strategy) => strategy.id)).toContain("risk-based-allocation");
    expect(bonds.map((strategy) => strategy.id)).toContain("diversification");
  });
});

describe("Strategy explanation", () => {
  it("explains a strategy in both languages with the educational disclaimer", () => {
    const en = explainStrategy("growth", "en");
    const he = explainStrategy("growth", "he");
    expect(en?.name).toBe("Growth Investing");
    expect(he?.name).toBe("השקעת צמיחה");
    expect(en?.disclaimer).toContain("education only");
    expect(he?.disclaimer).toContain("לצורכי למידה בלבד");
    expect(en?.rules.length).toBeGreaterThan(0);
    expect(en?.metrics.length).toBeGreaterThan(0);
    expect(en?.limitations.length).toBeGreaterThan(0);
    expect(en?.historicalContext).toContain("Fisher");
  });

  it("returns null for an unknown strategy", () => {
    expect(explainStrategy("nope", "en")).toBeNull();
  });
});

describe("Strategy comparison", () => {
  it("compares strategies across dimensions", () => {
    const result = compareStrategies(["value", "growth"], "en");
    expect(result).not.toBeNull();
    expect(result?.strategies).toHaveLength(2);
    expect(result?.rows.map((row) => row.dimension)).toEqual(
      expect.arrayContaining(["risk", "timeHorizon", "assetTypes", "strengths", "limitations"])
    );
    expect(result?.summary).toContain("Growth Investing");
    expect(result?.disclaimer).toContain("education only");
  });

  it("produces a Hebrew comparison", () => {
    const result = compareStrategies(["momentum", "diversification"], "he");
    expect(result?.summary).toContain("מומנטום");
    expect(result?.disclaimer).toContain("לצורכי למידה בלבד");
  });

  it("rejects comparisons with unknown or single strategies", () => {
    expect(compareStrategies(["value", "nope"], "en")).toBeNull();
    expect(compareStrategies(["value"], "en")).toBeNull();
  });
});

describe("Strategy requirements", () => {
  it("lists user inputs and data requirements", () => {
    const requirements = getStrategyRequirements("dividend");
    expect(requirements?.dataRequirements).toContain("dividend_history");
    expect(requirements?.userInputs.length).toBeGreaterThan(0);
    expect(requirements?.dataRequirementNotes.length).toBe(requirements?.dataRequirements.length);
  });

  it("returns null for unknown strategies", () => {
    expect(getStrategyRequirements("nope")).toBeNull();
  });
});

describe("Educational fit with a genuine profile", () => {
  it("clarifies instead of assessing when no profile exists", () => {
    const fit = evaluateEducationalFit("growth", null, "en");
    expect(fit.status).toBe("needs_profile");
    expect(fit.fit).toBeNull();
    expect(fit.reasons.join(" ")).toMatch(/genuine investor profile is missing/i);
  });

  it("clarifies when the profile lacks a risk score", () => {
    const fit = evaluateEducationalFit("growth", { classification: "growth" }, "he");
    expect(fit.status).toBe("needs_profile");
  });

  it("assesses fit against a genuine profile without inventing details", () => {
    const fit = evaluateEducationalFit(
      "long-term-index",
      { classification: "passive", riskScore: 5, summary: "balanced long-term saver" },
      "en"
    );
    expect(fit.status).toBe("assessed");
    expect(fit.fit).toBe("high");
    expect(fit.disclaimer).toContain("education only");
    expect(fit.disclaimer).toMatch(/not personalized investment advice/i);
  });

  it("marks distant risk levels as low fit", () => {
    const fit = evaluateEducationalFit(
      "momentum",
      { classification: "conservative", riskScore: 2 },
      "he"
    );
    expect(fit.status).toBe("assessed");
    expect(fit.fit).toBe("low");
    expect(fit.disclaimer).toContain("אינה ייעוץ השקעות מותאם אישית");
  });
});

describe("Market examples with provenance", () => {
  const fetcher: StrategyMarketFetcher = async (symbol) =>
    symbol === "VTI"
      ? { price: 250.5, changePercent: 1.2, dataSource: "yahoo_finance", freshness: "current", timestamp: "2026-09-21T10:00:00Z", isMock: false }
      : null;

  it("returns examples with full provenance", async () => {
    const examples = await loadStrategyMarketExamples("buy-and-hold", fetcher, { limit: 3 });
    expect(examples).toHaveLength(3);
    const vti = examples.find((example) => example.symbol === "VTI");
    expect(vti).toMatchObject({
      available: true,
      price: 250.5,
      dataSource: "yahoo_finance",
      freshness: "current",
    });
    const missing = examples.filter((example) => example.symbol !== "VTI");
    expect(missing.every((example) => example.available === false && example.price === null)).toBe(true);
  });

  it("survives fetcher failures without inventing values", async () => {
    const failing: StrategyMarketFetcher = async () => {
      throw new Error("provider down");
    };
    const examples = await loadStrategyMarketExamples("dividend", failing);
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.every((example) => !example.available && example.price === null)).toBe(true);
  });

  it("returns nothing for unknown strategies", async () => {
    expect(await loadStrategyMarketExamples("nope", fetcher)).toEqual([]);
  });
});

describe("Strategy mention detection", () => {
  it("detects English strategy mentions", () => {
    expect(detectStrategyMentions("Tell me about dividend investing")).toEqual(["dividend"]);
  });

  it("detects Hebrew strategy mentions", () => {
    expect(detectStrategyMentions("מהי אסטרטגיית מיצוע עלויות?")).toEqual(["dollar-cost-averaging"]);
  });

  it("detects multiple strategies in mention order", () => {
    expect(detectStrategyMentions("Compare value investing and growth investing")).toEqual(["value", "growth"]);
  });

  it("does not fire on generic finance words", () => {
    expect(detectStrategyMentions("What is the value of my investment in 10 years?")).toEqual([]);
    expect(detectStrategyMentions("How much will my savings grow?")).toEqual([]);
  });

  it("keeps the educational disclaimer bilingual", () => {
    expect(educationalDisclaimer("en")).toContain("education only");
    expect(educationalDisclaimer("he")).toContain("לצורכי למידה בלבד");
  });
});
