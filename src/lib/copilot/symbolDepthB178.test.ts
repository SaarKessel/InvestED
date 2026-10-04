import { describe, expect, it } from "vitest";
import { symbolSections, scenarioSections } from "./depth";
import type { SymbolInfo } from "./symbolDesk";
const rows = (["basic", "junior", "senior", "professional"] as const).flatMap((level) => (["equity", "fund"] as const).map((kind) => [level, kind] as const));
describe("[sweep] B178 symbol metadata depth uses asset-kind educational context", () => {
  it.each(rows)("level %s kind %s", (level, kind) => {
    const symbol: SymbolInfo = { symbol: "TEST", name: "Example", kind, sector: null, size: null, issuer: null };
    const snapshot = JSON.stringify(symbol);
    const sections = symbolSections(level, symbol);
    const ids = level === "basic" ? [] : level === "junior" ? ["symterms"] : level === "senior" ? ["symterms", "symnext"] : ["symterms", "symnext", "symlimits"];
    expect(sections.map((s) => s.id)).toEqual(ids);
    for (const section of sections) {
      expect(section.trust).toBe(section.id === "symlimits" ? "DATA" : "EDUCATIONAL");
      expect(section.title.he).toMatch(/[א-ת]/);
    }
    const next = sections.find((s) => s.id === "symnext");
    if (next) expect(next.lines[0].en).toContain(kind === "fund" ? "fund holds" : "company sells");
    if (level === "professional") expect(sections.at(-1)!.lines[0].en).toContain("not a recommendation");
    expect(JSON.stringify(symbol)).toBe(snapshot);
  });
});
describe("[hand] B178 multipart scenario depth never claims chained results", () => {
  it("states parts were computed independently with teaching rates", () => {
    expect(scenarioSections("basic")).toEqual([]);
    const sections = scenarioSections("professional");
    expect(sections.map((s) => s.id)).toEqual(["scmeaning", "sclimits"]);
    expect(sections[0].lines[0].en).toContain("not carried into the next part");
    expect(sections[1].lines[0].en).toContain("not forecasts");
    expect(sections.every((s) => s.trust === "CALCULATION")).toBe(true);
  });
});
