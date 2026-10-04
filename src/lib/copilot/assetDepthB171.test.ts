import { describe, expect, it } from "vitest";
import { assetSections } from "./depth";
import type { Level } from "./levels";
const levels: Level[] = ["basic", "junior", "senior", "professional"];
const rows = levels.flatMap((level) => [-4, -3, -2.99, -1, -0.99, 0, 0.99, 1, 2.99, 3, 4].map((change) => [level, change] as const));
describe("[sweep] B171 asset depth move magnitude boundaries remain descriptive", () => {
  it.each(rows)("level %s change %s", (level, changePercent) => {
    const assets = [{ symbol: "TSLA", price: 100, changePercent }];
    const snapshot = JSON.stringify(assets);
    const sections = assetSections(level, assets);
    const ids = level === "basic" ? [] : level === "junior" ? ["terms"] : level === "senior" ? ["terms", "move"] : ["terms", "move", "assetlimits"];
    expect(sections.map((s) => s.id)).toEqual(ids);
    const move = sections.find((s) => s.id === "move");
    if (move) {
      expect(move.trust).toBe("ANALYSIS");
      const magnitude = Math.abs(changePercent);
      expect(move.lines[0].en).toContain(`a ${magnitude < 1 ? "small" : magnitude < 3 ? "moderate" : "large"} move`);
      expect(move.lines[0].en).toContain("not a signal");
      expect(move.lines[0].he).toContain("לא איתות");
    }
    expect(JSON.stringify(assets)).toBe(snapshot);
  });
});
describe("[hand] B171 empty asset list adds no invented depth sections", () => {
  it("returns no asset sections at any level without a source asset", () => {
    for (const level of levels) expect(assetSections(level, [])).toEqual([]);
  });
});
