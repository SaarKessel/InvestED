import { describe, expect, it } from "vitest";
import { buildRateNotes } from "./feeds";
import type { BisRateResult } from "../bisRateClient";
const rows = [0, 0.25, 4.5, 10].flatMap((rate) => ["2026-10", "2026-01", "unknown month"].flatMap((month) => ["https://example.test/bis", "not a link"].map((source) => [rate, month, source] as const)));
describe("[sweep] B180 rate-feed learning notes copy only latest supplied figures", () => {
  it.each(rows)("rate %s month %s source %s", (rate, month, source) => {
    const result: BisRateResult = { status: "live", fetchedAt: null, latestObservation: null, points: [{ month: "2020-01", rate: 99 }, { month, rate }], source };
    const snapshot = JSON.stringify(result);
    const notes = buildRateNotes(result);
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.lang)).toEqual(["en", "he"]);
    for (const note of notes) {
      expect(note.body).toContain(`${rate}%`);
      expect(note.body).toContain(month);
      expect(note.body).not.toContain("99%");
      expect(note.source_url).toBe(source.startsWith("https://") ? source : null);
      expect(note.published_at).toBe(/^\d{4}-\d{2}$/.test(month) ? `${month}-01` : null);
      expect(note.source_label).toBe("BIS policy rate data");
    }
    expect(JSON.stringify(result)).toBe(snapshot);
  });
});
describe("[hand] B180 unavailable rate feed adds no knowledge notes", () => {
  it("does not recycle old values when the source is unavailable", () => {
    expect(buildRateNotes({ status: "unavailable", fetchedAt: null, latestObservation: null, points: [{ month: "2026-10", rate: 4.5 }], source: "" })).toEqual([]);
    expect(buildRateNotes({ status: "live", fetchedAt: null, latestObservation: null, points: [], source: "" })).toEqual([]);
  });
});
