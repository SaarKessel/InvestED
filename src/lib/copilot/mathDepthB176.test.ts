import { describe, expect, it } from "vitest";
import { mathSections } from "./depth";
import { runMathDesk } from "./mathDesk";
const expressions = ["2 + 3", "2 * 3 + 4", "(2 + 3) * 4", "2^3", "10% of 250", "12 / 3", "1 / 0"];
const rows = expressions.flatMap((expression) => (["basic", "junior", "senior", "professional"] as const).map((level) => [expression, level] as const));
describe("[sweep] B176 math depth explains only successful deterministic calculations", () => {
  it.each(rows)("expression %s level %s", (expression, level) => {
    const result = runMathDesk(expression)!;
    expect(result).not.toBeNull();
    const snapshot = JSON.stringify(result);
    const sections = mathSections(level, result);
    const expected = !result.ok || level === "basic" ? [] : level === "junior" ? ["mathread"] : level === "senior" ? ["mathread", "mathcheck"] : ["mathread", "mathcheck", "mathlimits"];
    expect(sections.map((s) => s.id)).toEqual(expected);
    expect(sections.every((s) => s.trust === "CALCULATION")).toBe(true);
    if (sections.length) expect(sections[0].lines[0].en).toContain(`${result.steps.length} step`);
    if (level === "professional" && result.ok) expect(sections.at(-1)!.lines[0].en).toContain("instead of guessing");
    expect(JSON.stringify(result)).toBe(snapshot);
  });
});
describe("[hand] B176 failed arithmetic adds no fake solution steps", () => {
  it("keeps a division-by-zero failure free of deeper solved-result text", () => {
    const result = runMathDesk("1 / 0")!;
    expect(result.ok).toBe(false);
    expect(mathSections("professional", result)).toEqual([]);
  });
});
