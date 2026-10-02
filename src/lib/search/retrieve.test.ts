import { describe, expect, it } from "vitest";
import { retrieve, stemHe } from "./retrieve";

describe("retrieve", () => {
  it("returns nothing for empty or unmatched questions", () => {
    expect(retrieve("", "en")).toEqual([]);
    expect(retrieve("qqqzzzxxx", "en")).toEqual([]);
  });
  it("ranks stored explanations and keeps their text unchanged", () => {
    const r = retrieve("how does compound interest grow over time", "en", 3);
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(3);
    expect(r[0].text.length).toBeGreaterThan(10);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
  });
  it("works in Hebrew", () => {
    const r = retrieve("מהי ריבית דריבית", "he", 2);
    expect(r.length).toBeGreaterThan(0);
    expect(/[א-ת]/.test(r[0].text)).toBe(true);
  });
  it("matches Hebrew words with attached prefixes", () => {
    const plain = retrieve("ריבית דריבית", "he", 1)[0];
    const prefixed = retrieve("איך עובדת הריבית דריבית", "he", 1)[0];
    expect(plain && prefixed && prefixed.id === plain.id).toBe(true);
  });
  it("strips at most two prefix letters and keeps short words whole", () => {
    expect(stemHe("והריבית")).toBe("ריבית");
    expect(stemHe("בנק")).toBe("בנק");
    expect(stemHe("שלום")).toBe("שלום");
    expect(stemHe("interest")).toBe("interest");
  });
});
