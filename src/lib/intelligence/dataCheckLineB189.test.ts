import { describe, expect, it } from "vitest";
import { dataCheckLine } from "./claims";
import type { ToolResult } from "./envelope";
const now = Date.parse("2026-10-03T12:00:00Z");
const rows = ["market", "filings", "etf", "macro"].flatMap((toolId) => ["fresh", "stale", "missing"].map((mode) => [toolId, mode] as const));
describe("[sweep] B189 data-check lines disclose fresh stale and missing-date evidence", () => {
  it.each(rows)("tool %s date mode %s", (toolId, mode) => {
    const result: ToolResult = { toolId, value: null, trust: "DATA", provenance: { state: "live", source: { en: "Source", he: "מקור" }, ...(mode === "missing" ? {} : { asOf: mode === "fresh" ? "2026-10-03" : "2020-01-01" }) } };
    const line = dataCheckLine(result, now);
    expect(line.he).toMatch(/[א-ת]/);
    if (mode === "fresh") { expect(line.en).toContain("Data check passed"); expect(line.en).toContain("2026-10-03"); }
    else if (mode === "stale") { expect(line.en).toContain("older than the freshness limit"); expect(line.he).toContain("ישנים"); }
    else { expect(line.en).toContain("carries no date"); expect(line.he).toContain("אין תאריך"); }
  });
});
describe("[hand] B189 bilingual source omission cannot claim a passed data check", () => {
  it("reports an absent source label even with a fresh timestamp", () => {
    const result: ToolResult = { toolId: "market", value: null, trust: "DATA", provenance: { state: "live", source: { en: "Source", he: "" }, asOf: "2026-10-03" } };
    expect(dataCheckLine(result, now).en).toContain("not named in both languages");
  });
});
