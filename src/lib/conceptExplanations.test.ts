import { describe, it, expect } from "vitest";
import { EXTRA_CONCEPTS } from "./conceptExplanations";

describe("EXTRA_CONCEPTS registry", () => {
  it("every concept has both languages, labels, and at least one pattern", () => {
    for (const c of EXTRA_CONCEPTS) {
      expect(c.patterns.length, c.enLabel).toBeGreaterThan(0);
      expect(c.heLabel).toBeTruthy();
      expect(c.enLabel).toBeTruthy();
      expect(c.he.length, c.enLabel).toBeGreaterThan(40);
      expect(c.en.length, c.enLabel).toBeGreaterThan(40);
    }
  });
  it("Hebrew text contains Hebrew and no Latin sentences; English contains no Hebrew", () => {
    for (const c of EXTRA_CONCEPTS) {
      expect(c.he, c.enLabel).toMatch(/[א-ת]/);
      expect(c.en, c.enLabel).not.toMatch(/[א-ת]/);
      expect(c.heLabel, c.enLabel).toMatch(/[א-ת]/);
    }
  });
  it("patterns match their own language's query", () => {
    const find = (q: string) => EXTRA_CONCEPTS.find((c) => c.patterns.some((p) => p.test(q)));
    expect(find("what is the Sharpe ratio?")?.enLabel).toBe("Sharpe Ratio");
    expect(find("מה זה שארפ")?.heLabel).toBe("יחס שארפ");
    expect(find("explain DCF")?.enLabel).toBe("DCF");
    expect(find("תזרים מהוון")?.heLabel).toBe("תזרים מהוון (DCF)");
    expect(find("correlation between assets")?.enLabel).toBe("Correlation");
    expect(find("מהו מח\"מ")?.heLabel).toBe("מח״מ (Duration)");
  });
  it("educational text stays advice-free: no buy/sell instructions", () => {
    for (const c of EXTRA_CONCEPTS) {
      expect(c.en.toLowerCase(), c.enLabel).not.toMatch(/you should (buy|sell|invest)/);
      expect(c.he, c.enLabel).not.toMatch(/כדאי לך ל(קנות|מכור|השקיע)/);
    }
  });
  it("no duplicate labels", () => {
    const en = EXTRA_CONCEPTS.map((c) => c.enLabel.toLowerCase());
    expect(new Set(en).size).toBe(en.length);
  });
});
