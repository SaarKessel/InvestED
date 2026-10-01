import { describe, expect, it } from "vitest";
import { buildInsuranceNotes, buildRateNotes } from "./feeds";

describe("feeds", () => {
  it("copies the rate verbatim into en and he notes", () => {
    const n = buildRateNotes({ status: "live", fetchedAt: null, latestObservation: null, source: "https://example.org/bis", points: [{ month: "2026-08", rate: 4.5 }] } as never);
    expect(n).toHaveLength(2);
    expect(n[0].body).toContain("4.5%");
    expect(n[1].body).toContain("4.5%");
    expect(n[0].published_at).toBe("2026-08-01");
  });
  it("returns nothing when the feed is unavailable", () => {
    expect(buildRateNotes({ status: "unavailable", points: [], source: "", fetchedAt: null, latestObservation: null } as never)).toEqual([]);
    expect(buildInsuranceNotes({ status: "unavailable", reportPeriod: null, records: [], source: "", fetchedAt: null } as never)).toEqual([]);
  });
  it("ranks insurance yields and keeps only the top five", () => {
    const records = Array.from({ length: 7 }, (_, i) => ({ fundId: i, name: `F${i}`, classification: "x", reportPeriod: 202608, monthlyYield: 0, yearToDateYield: i, averageAnnualManagementFee: null }));
    const n = buildInsuranceNotes({ status: "live", reportPeriod: 202608, fetchedAt: null, source: "", records } as never);
    expect(n[0].body).toContain("F6: 6.00%");
    expect(n[0].body).not.toContain("F1:");
  });
});
