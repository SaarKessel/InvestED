import { describe, expect, it } from "vitest";
import { buildInsuranceNotes } from "./feeds";
import type { InsuranceResult } from "../insuranceClient";
const rows = [0, 1, 4, 5, 6, 10].flatMap((count) => ["live", "cached", "unavailable"].flatMap((status) => [null, 202610].map((reportPeriod) => [count, status as InsuranceResult["status"], reportPeriod] as const)));
describe("[sweep] B181 insurance notes copy top available reported yields without personal recommendations", () => {
  it.each(rows)("count %s status %s report %s", (count, status, reportPeriod) => {
    const records = Array.from({ length: count }, (_, i) => ({ fundId: i + 1, name: `Fund${i}`, classification: "example", reportPeriod: 202610, monthlyYield: null, yearToDateYield: i - 3, averageAnnualManagementFee: null }));
    const input: InsuranceResult = { status, reportPeriod, records, source: "https://example.test/reports", fetchedAt: null };
    const snapshot = JSON.stringify(input);
    const notes = buildInsuranceNotes(input);
    if (!count || status === "unavailable" || reportPeriod === null) expect(notes).toEqual([]);
    else {
      expect(notes).toHaveLength(2);
      const expected = [...records].sort((a, b) => b.yearToDateYield - a.yearToDateYield).slice(0, 5);
      for (const note of notes) {
        for (const record of expected) expect(note.body).toContain(`${record.name}: ${record.yearToDateYield.toFixed(2)}%`);
        for (const record of records.filter((r) => !expected.includes(r))) expect(note.body).not.toContain(`${record.name}:`);
        expect(note.source_url).toBe(input.source);
        expect(note.published_at).toBe("2026-10-01");
      }
      expect(notes[0].body).toContain("Past yields do not predict future returns");
      expect(notes[1].body).toContain("תשואות עבר");
    }
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
describe("[hand] B181 missing reported yields do not become zero-yield notes", () => {
  it("drops funds whose year-to-date yield is unavailable", () => {
    const result: InsuranceResult = { status: "live", reportPeriod: 202610, source: "", fetchedAt: null, records: [{ fundId: 1, name: "Missing", classification: "x", reportPeriod: 202610, monthlyYield: 1, yearToDateYield: null, averageAnnualManagementFee: null }] };
    expect(buildInsuranceNotes(result)).toEqual([]);
  });
});
