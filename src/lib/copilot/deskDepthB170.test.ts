import { describe, expect, it } from "vitest";
import { deskSections, depthOf } from "./depth";
import type { Level } from "./levels";
import type { DataDeskKind } from "./dataDesk";
const levels: Level[] = ["basic", "junior", "senior", "professional"];
const kinds: DataDeskKind[] = ["movers", "policy_rate", "insurance"];
const rows = levels.flatMap((level) => kinds.map((kind) => [level, kind] as const));
describe("[sweep] B170 data-desk depth follows deterministic educational passes", () => {
  it.each(rows)("level %s desk %s", (level, kind) => {
    const sections = deskSections(level, kind);
    const expected = ["read", "next", "datalimits"].slice(0, depthOf(level) - 1);
    expect(sections.map((s) => s.id)).toEqual(expected);
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
    for (const section of sections) {
      expect(section.title.en.length).toBeGreaterThan(0);
      expect(section.title.he).toMatch(/[א-ת]/);
      expect(section.lines).toHaveLength(1);
      expect(section.lines[0].en.length).toBeGreaterThan(0);
      expect(section.lines[0].he).toMatch(/[א-ת]/);
      expect(section.trust).toBe(section.id === "datalimits" ? "DATA" : "EDUCATIONAL");
    }
    expect(sections).toEqual(deskSections(level, kind));
  });
});
describe("[hand] B170 professional desk limits describe delays and historical performance", () => {
  it("keeps the fixed data limits rather than promising forecasts", () => {
    expect(deskSections("professional", "movers").at(-1)!.lines[0].en).toContain("not live");
    expect(deskSections("professional", "policy_rate").at(-1)!.lines[0].en).toContain("not what will happen");
    expect(deskSections("professional", "insurance").at(-1)!.lines[0].en).toContain("not advice");
  });
});
