import { describe, expect, it } from "vitest";
import { unknownLinks } from "./claims";

const known = "https://source.example/reports/annual";
describe("[hand] B109 source-link membership uses whole URLs", () => {
  it("does not authorize a shorter path merely because a source URL starts with it", () => {
    expect(unknownLinks("Read https://source.example/reports", [known])).toEqual(["https://source.example/reports"]);
  });
  it("does not authorize a host prefix that is actually a different domain", () => {
    expect(unknownLinks("Read https://source.example", ["https://source.example.evil.test/report"])).toEqual(["https://source.example"]);
  });
  it("keeps identical source links and deduplicates invented links", () => {
    expect(unknownLinks(`${known}. https://other.example/x https://other.example/x`, [`(${known})`])).toEqual(["https://other.example/x"]);
  });
});

const rows: Array<[string, string]> = [];
for (const host of ["source.example", "official.example", "data.example"]) for (const path of ["/report", "/annual", "/markets", "/data"]) for (const extension of ["/detail", "?version=2", "#table", "-revised"]) rows.push([`https://${host}${path}`, extension]);
describe("[sweep] B109 distinct URL suffixes never authorize their base URL", () => {
  it.each(rows)("base %s source suffix %s", (base, suffix) => {
    expect(unknownLinks(base, [`Source: ${base}${suffix}`])).toEqual([base]);
    expect(unknownLinks(`${base}${suffix}`, [`Source: ${base}`])).toEqual([`${base}${suffix}`]);
    expect(unknownLinks(base, [`Source: ${base}.`])).toEqual([]);
  });
});
