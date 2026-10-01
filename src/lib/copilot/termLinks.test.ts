import { describe, expect, it } from "vitest";
import { linkTerms, termExplanation } from "./termLinks";
describe("termLinks", () => {
  it("never changes the text", () => {
    for (const t of ["Diversification means not putting all your money in one place. An ETF is a fund.", "פיזור משמעותו לא לשים את כל הכסף במקום אחד. ריבית דריבית עובדת עם הזמן.", "plain words only", ""])
      expect(linkTerms(t).map((s) => s.text).join("")).toBe(t);
  });
  it("links an English term once and leaves a stored explanation behind it", () => {
    const segs = linkTerms("Diversification helps. Diversification again.");
    const linked = segs.filter((s) => s.id);
    expect(linked).toHaveLength(1);
    expect(termExplanation(linked[0].id!, "en")?.text.length).toBeGreaterThan(10);
  });
  it("links a Hebrew term, including with an attached prefix, and keeps the prefix outside the link", () => {
    const segs = linkTerms("הפיזור מקטין סיכון.");
    const hit = segs.find((s) => s.id);
    expect(hit?.text).toBe("פיזור");
    expect(segs[0].text).toBe("ה");
  });
  it("does not link inside longer words", () => { expect(linkTerms("Rebalancing the datasets").some((s) => s.id === undefined ? false : /sets/.test(s.text))).toBe(false); });
  it("caps the number of links", () => { expect(linkTerms("diversification risk inflation stocks bonds ETF index fund dividend yield volatility", 3).filter((s) => s.id).length).toBeLessThanOrEqual(3); });
});
