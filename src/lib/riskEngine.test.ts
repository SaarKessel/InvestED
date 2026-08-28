import { describe, expect, it } from "vitest";
import {
  extractProfileFlags,
  computeRiskScore,
  riskScoreDescription,
  classifyInvestor,
  buildExplainability,
  recommendStrategies,
  generateLearningPath,
  explainInvestorStyle,
  horizonBucket,
  horizonExplanation,
} from "./riskEngine";

describe("extractProfileFlags", () => {
  describe("age detection not matching random 2-digit numbers", () => {
    it("does not extract age from random 2-digit numbers without context", () => {
      const result = extractProfileFlags("I have 50K to invest in tech stocks");
      expect(result.age).toBeNull();
    });

    it("does not extract 99 as age", () => {
      const result = extractProfileFlags("I want 99% returns");
      expect(result.age).toBeNull();
    });

    it("does not extract year 2025 as age", () => {
      const result = extractProfileFlags("I want to invest in 2025");
      expect(result.age).toBeNull();
    });

    it("does not extract 10 as age from '10K'", () => {
      const result = extractProfileFlags("I have 10K shekels to invest");
      expect(result.age).toBeNull();
    });

    it("does not extract age from percentage like 25%", () => {
      const result = extractProfileFlags("I want 25% annual returns");
      expect(result.age).toBeNull();
    });

    it("extracts age from Hebrew 'אני בן 32'", () => {
      const result = extractProfileFlags("אני בן 32, רוצה להשקיע");
      expect(result.age).toBe(32);
    });

    it("extracts age from Hebrew 'אני בת 45'", () => {
      const result = extractProfileFlags("אני בת 45");
      expect(result.age).toBe(45);
    });

    it("extracts age from English 'I am 27 years old'", () => {
      const result = extractProfileFlags("I am 27 years old");
      expect(result.age).toBe(27);
    });

    it("extracts age from English 'I'm 35 years old'", () => {
      const result = extractProfileFlags("I'm 35 years old");
      expect(result.age).toBe(35);
    });

    it("does not extract 3-digit age like 100", () => {
      const result = extractProfileFlags("I am 100 years old");
      expect(result.age).toBe(100);
    });
  });

  describe("risk level detection", () => {
    it("detects conservative risk level", () => {
      const result = extractProfileFlags("I want conservative investing with low risk");
      expect(result.riskLevel).toBe("very_low");
    });

    it("detects moderate risk level", () => {
      const result = extractProfileFlags("I want a balanced and moderate approach");
      expect(result.riskLevel).toBe("moderate");
    });

    it("detects high risk level", () => {
      const result = extractProfileFlags("I am ready for high risk and growth");
      expect(result.riskLevel).toBe("high");
    });

    it("detects very high risk level", () => {
      const result = extractProfileFlags("I want very aggressive and speculative trading");
      expect(result.riskLevel).toBe("very_high");
    });

    it("returns null for no risk keywords", () => {
      const result = extractProfileFlags("I want to learn about stocks");
      expect(result.riskLevel).toBeNull();
    });
  });

  describe("horizon detection", () => {
    it("detects long horizon", () => {
      const result = extractProfileFlags("I want long term investment for retirement");
      expect(result.horizon).toBe("long");
    });

    it("detects short horizon", () => {
      const result = extractProfileFlags("I need short term access to my money");
      expect(result.horizon).toBe("short");
    });

    it("detects medium horizon", () => {
      const result = extractProfileFlags("I want medium term investment");
      expect(result.horizon).toBe("medium");
    });

    it("returns null for no horizon keywords", () => {
      const result = extractProfileFlags("I want to invest");
      expect(result.horizon).toBeNull();
    });
  });

  describe("knowledge level detection", () => {
    it("detects beginner knowledge level", () => {
      const result = extractProfileFlags("I am a beginner with no experience");
      expect(result.knowledgeLevel).toBe("beginner");
    });

    it("detects intermediate knowledge level", () => {
      const result = extractProfileFlags("I have some experience, intermediate investor");
      expect(result.knowledgeLevel).toBe("some");
    });

    it("detects experienced knowledge level", () => {
      const result = extractProfileFlags("I am an experienced investor");
      expect(result.knowledgeLevel).toBe("experienced");
    });

    it("returns null for no knowledge keywords", () => {
      const result = extractProfileFlags("I want to invest in tech");
      expect(result.knowledgeLevel).toBeNull();
    });
  });

  describe("interest detection", () => {
    it("detects technology interest", () => {
      const result = extractProfileFlags("I am interested in technology and tech");
      expect(result.interests).toContain("technology");
    });

    it("detects finance interest", () => {
      const result = extractProfileFlags("I like finance and banking");
      expect(result.interests).toContain("finance");
    });

    it("detects energy interest", () => {
      const result = extractProfileFlags("I want to invest in energy");
      expect(result.interests).toContain("energy");
    });

    it("detects real estate interest", () => {
      const result = extractProfileFlags("I want to invest in נדלן");
      expect(result.interests).toContain("real_estate");
    });

    it("detects multiple interests", () => {
      const result = extractProfileFlags("I like technology and finance");
      expect(result.interests).toContain("technology");
      expect(result.interests).toContain("finance");
    });

    it("returns empty interests for no matching keywords", () => {
      const result = extractProfileFlags("I want to invest");
      expect(result.interests).toHaveLength(0);
    });
  });
});

describe("computeRiskScore", () => {
  it("risk score is bounded between 1 and 10", () => {
    const veryLowShort = computeRiskScore({
      age: 70,
      riskLevel: "very_low",
      horizon: "short",
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    const veryHighLong = computeRiskScore({
      age: 20,
      riskLevel: "very_high",
      horizon: "long",
      knowledgeLevel: "experienced",
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(veryLowShort).toBeGreaterThanOrEqual(1);
    expect(veryLowShort).toBeLessThanOrEqual(10);
    expect(veryHighLong).toBeGreaterThanOrEqual(1);
    expect(veryHighLong).toBeLessThanOrEqual(10);
  });

  it("very_low risk produces low score", () => {
    const score = computeRiskScore({
      age: null,
      riskLevel: "very_low",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(score).toBe(2);
  });

  it("very_high risk produces high score", () => {
    const score = computeRiskScore({
      age: null,
      riskLevel: "very_high",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(score).toBe(9);
  });

  it("short horizon decreases score by 1", () => {
    const baseScore = computeRiskScore({
      age: null,
      riskLevel: "high",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    const shortScore = computeRiskScore({
      age: null,
      riskLevel: "high",
      horizon: "short",
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(shortScore).toBe(baseScore - 1);
  });

  it("long horizon increases score by 2", () => {
    const baseScore = computeRiskScore({
      age: null,
      riskLevel: "high",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    const longScore = computeRiskScore({
      age: null,
      riskLevel: "high",
      horizon: "long",
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(longScore).toBe(baseScore + 2);
  });

  it("young age increases score by 1", () => {
    const baseScore = computeRiskScore({
      age: null,
      riskLevel: "moderate",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    const youngScore = computeRiskScore({
      age: 25,
      riskLevel: "moderate",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(youngScore).toBe(baseScore + 1);
  });

  it("age >= 60 decreases score by 1", () => {
    const baseScore = computeRiskScore({
      age: null,
      riskLevel: "moderate",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    const oldScore = computeRiskScore({
      age: 65,
      riskLevel: "moderate",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(oldScore).toBe(baseScore - 1);
  });

  it("experienced knowledge level increases score by 1", () => {
    const baseScore = computeRiskScore({
      age: null,
      riskLevel: "moderate",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    const expScore = computeRiskScore({
      age: null,
      riskLevel: "moderate",
      horizon: null,
      knowledgeLevel: "experienced",
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(expScore).toBe(baseScore + 1);
  });

  it("default score is 5 for moderate risk with no modifiers", () => {
    const score = computeRiskScore({
      age: null,
      riskLevel: "moderate",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
    });

    expect(score).toBe(5);
  });
});

describe("riskScoreDescription", () => {
  it("returns low band for scores 1-3", () => {
    expect(riskScoreDescription(1).band).toBe("low");
    expect(riskScoreDescription(3).band).toBe("low");
  });

  it("returns medium band for scores 4-6", () => {
    expect(riskScoreDescription(4).band).toBe("medium");
    expect(riskScoreDescription(6).band).toBe("medium");
  });

  it("returns high band for scores 7-10", () => {
    expect(riskScoreDescription(7).band).toBe("high");
    expect(riskScoreDescription(10).band).toBe("high");
  });

  it("includes volatility and psychology fields", () => {
    const desc = riskScoreDescription(5);
    expect(desc.volatility).toBe("medium");
    expect(desc.psychology).toBeDefined();
  });
});

describe("classifyInvestor", () => {
  it("classifies score 1-3 as conservative", () => {
    expect(classifyInvestor(1).type).toBe("conservative");
    expect(classifyInvestor(3).type).toBe("conservative");
  });

  it("classifies score 4-6 as balanced", () => {
    expect(classifyInvestor(4).type).toBe("balanced");
    expect(classifyInvestor(6).type).toBe("balanced");
  });

  it("classifies score 7-10 as growth", () => {
    expect(classifyInvestor(7).type).toBe("growth");
    expect(classifyInvestor(10).type).toBe("growth");
  });

  it("provides reason for classification", () => {
    const result = classifyInvestor(8);
    expect(result.reason).toBeDefined();
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("classification is consistent for boundary scores", () => {
    expect(classifyInvestor(3).type).toBe("conservative");
    expect(classifyInvestor(4).type).toBe("balanced");
    expect(classifyInvestor(6).type).toBe("balanced");
    expect(classifyInvestor(7).type).toBe("growth");
  });
});

describe("investor classification consistency", () => {
  it("riskScoreDescription band matches classifyInvestor type", () => {
    for (let score = 1; score <= 10; score++) {
      const desc = riskScoreDescription(score);
      const classification = classifyInvestor(score);

      if (desc.band === "low") {
        expect(classification.type).toBe("conservative");
      } else if (desc.band === "medium") {
        expect(classification.type).toBe("balanced");
      } else {
        expect(classification.type).toBe("growth");
      }
    }
  });
});

describe("buildExplainability", () => {
  it("returns English explanations by default", () => {
    const flags: Parameters<typeof buildExplainability>[0] = {
      age: 30,
      riskLevel: "moderate",
      horizon: "long",
      knowledgeLevel: "some",
      interests: ["technology"],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const classification = classifyInvestor(5);
    const result = buildExplainability(flags, classification, 5, "en");

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((line: string) => !/[\u0590-\u05FF]/.test(line))).toBe(true);
  });

  it("returns Hebrew explanations when language is he", () => {
    const flags: Parameters<typeof buildExplainability>[0] = {
      age: 30,
      riskLevel: "moderate",
      horizon: "long",
      knowledgeLevel: "some",
      interests: ["technology"],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const classification = classifyInvestor(5);
    const result = buildExplainability(flags, classification, 5, "he");

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((line: string) => /[\u0590-\u05FF]/.test(line))).toBe(true);
  });

  it("includes interest areas when present", () => {
    const flags: Parameters<typeof buildExplainability>[0] = {
      age: null,
      riskLevel: null,
      horizon: null,
      knowledgeLevel: null,
      interests: ["technology", "finance"],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const classification = classifyInvestor(5);
    const result = buildExplainability(flags, classification, 5, "en");

    expect(result.some((line: string) => line.includes("technology") || line.includes("finance"))).toBe(true);
  });

  it("does not include risk level when null", () => {
    const flags: Parameters<typeof buildExplainability>[0] = {
      age: null,
      riskLevel: null,
      horizon: "long",
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const classification = classifyInvestor(5);
    const result = buildExplainability(flags, classification, 5, "en");

    expect(result.every((line: string) => !line.includes("risk preference"))).toBe(true);
  });
});

describe("recommendStrategies", () => {
  it("recommends conservative strategies for score <= 3", () => {
    const flags: Parameters<typeof recommendStrategies>[1] = {
      age: null,
      riskLevel: "very_low",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const strategies = recommendStrategies(2, flags);

    expect(strategies).toContain("Passive investment in broad indices");
    expect(strategies).toContain("Combination of quality bond funds");
  });

  it("recommends balanced strategies for score 4-6", () => {
    const flags: Parameters<typeof recommendStrategies>[1] = {
      age: null,
      riskLevel: "moderate",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const strategies = recommendStrategies(5, flags);

    expect(strategies).toContain("Passive investment in indices");
    expect(strategies).toContain("Combination of stocks and bonds");
  });

  it("recommends growth strategies for score > 6", () => {
    const flags: Parameters<typeof recommendStrategies>[1] = {
      age: null,
      riskLevel: "high",
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const strategies = recommendStrategies(8, flags);

    expect(strategies).toContain("Investment in stock indices");
    expect(strategies).toContain("Exposure to growth sectors");
  });

  it("adds technology strategy when technology interest present", () => {
    const flags: Parameters<typeof recommendStrategies>[1] = {
      age: null,
      riskLevel: null,
      horizon: null,
      knowledgeLevel: null,
      interests: ["technology"],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const strategies = recommendStrategies(5, flags);

    expect(strategies.some((s: string) => s.includes("technology"))).toBe(true);
  });
});

describe("generateLearningPath", () => {
  it("generates beginner path for beginner knowledge level", () => {
    const flags: Parameters<typeof generateLearningPath>[0] = {
      age: null,
      riskLevel: null,
      horizon: null,
      knowledgeLevel: "beginner",
      interests: [],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const path = generateLearningPath(flags);

    expect(path).toContain("Introduction to stocks, bonds and ETFs");
    expect(path).toContain("Understanding risk and return concepts");
  });

  it("generates intermediate path for some knowledge level", () => {
    const flags: Parameters<typeof generateLearningPath>[0] = {
      age: null,
      riskLevel: null,
      horizon: null,
      knowledgeLevel: "some",
      interests: [],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const path = generateLearningPath(flags);

    expect(path).toContain("Building an investment strategy");
    expect(path).toContain("Asset allocation and portfolio management");
  });

  it("generates advanced path for experienced knowledge level", () => {
    const flags: Parameters<typeof generateLearningPath>[0] = {
      age: null,
      riskLevel: null,
      horizon: null,
      knowledgeLevel: "experienced",
      interests: [],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const path = generateLearningPath(flags);

    expect(path).toContain("Advanced investment portfolio analysis");
    expect(path).toContain("Performance metrics like Sharpe and Beta");
  });

  it("generates default path when knowledge level is null", () => {
    const flags: Parameters<typeof generateLearningPath>[0] = {
      age: null,
      riskLevel: null,
      horizon: null,
      knowledgeLevel: null,
      interests: [],
      preferences: [],
      goal: null,
      rawText: "",
    };

    const path = generateLearningPath(flags);

    expect(path.length).toBeGreaterThan(0);
    expect(path).toContain("Financial basics");
  });
});

describe("explainInvestorStyle", () => {
  it("explains conservative style", () => {
    expect(explainInvestorStyle({ type: "conservative", reason: "" })).toContain("capital preservation");
  });

  it("explains balanced style", () => {
    expect(explainInvestorStyle({ type: "balanced", reason: "" })).toContain("balance");
  });

  it("explains growth style", () => {
    expect(explainInvestorStyle({ type: "growth", reason: "" })).toContain("volatility");
  });

  it("returns default explanation for unknown type", () => {
    expect(explainInvestorStyle({ type: "unknown", reason: "" })).toContain("Balanced");
  });
});

describe("horizonBucket", () => {
  it("maps long to long", () => {
    expect(horizonBucket("long")).toBe("long");
  });

  it("maps short to short", () => {
    expect(horizonBucket("short")).toBe("short");
  });

  it("maps medium to medium", () => {
    expect(horizonBucket("medium")).toBe("medium");
  });

  it("maps null to medium", () => {
    expect(horizonBucket(null)).toBe("medium");
  });
});

describe("horizonExplanation", () => {
  it("returns long horizon explanation", () => {
    const explanation = horizonExplanation("long");
    expect(explanation).toContain("growth assets");
  });

  it("returns short horizon explanation", () => {
    const explanation = horizonExplanation("short");
    expect(explanation).toContain("liquidity");
  });

  it("returns medium horizon explanation", () => {
    const explanation = horizonExplanation("medium");
    expect(explanation).toContain("growth potential");
  });

  it("returns medium explanation for null horizon", () => {
    const explanation = horizonExplanation(null);
    expect(explanation.toLowerCase()).toContain("medium");
  });
});
