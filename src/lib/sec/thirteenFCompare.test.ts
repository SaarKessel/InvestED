import { describe, expect, it } from "vitest";
import type { Holding, Latest13F } from "./thirteenF";
import { compare13F, concentration } from "./thirteenFCompare";
import { fetchTwo13Fs, No13FError, pickOriginal13Fs } from "./thirteenF";

const h = (cusip: string, shares: number, valueUsd: number): Holding => ({ issuer: cusip, titleOfClass: "COM", cusip, valueUsd, shares, shareType: "SH", weightPct: 0 });
const f = (reportDate: string, holdings: Holding[]): Latest13F => ({ cik: "1", managerName: "M", accessionNumber: "a", filingDate: "", reportDate, form: "13F-HR", reportedTotalValueUsd: null, reportedEntryCount: null, holdings, sourceUrl: "" });

describe("compare13F", () => {
  const prev = f("2026-03-31", [h("A", 100, 1000), h("B", 50, 500), h("C", 10, 100), h("D", 5, 50)]);
  const cur = f("2026-06-30", [h("A", 150, 1800), h("B", 20, 150), h("C", 10, 120), h("E", 7, 70)]);
  const r = compare13F(prev, cur)!;
  it("labels positions by share change", () => {
    const by = Object.fromEntries(r.changes.map((c) => [c.cusip, c.change]));
    expect(by).toEqual({ A: "increased", B: "decreased", C: "unchanged", D: "absent", E: "new" });
    expect(r.counts.new).toBe(1);
  });
  it("keeps shares and reported values separate and never invents a price", () => {
    const c = r.changes.find((x) => x.cusip === "C")!;
    expect(c.change).toBe("unchanged");
    expect(c.valuePrevUsd).toBe(100);
    expect(c.valueCurUsd).toBe(120);
    expect(Object.keys(c)).not.toContain("price");
  });
  it("absent means not listed, with prior shares kept", () => {
    const d = r.changes.find((x) => x.cusip === "D")!;
    expect(d.sharesCur).toBe(0);
    expect(d.sharesPrev).toBe(5);
  });
  it("computes concentration", () => {
    expect(concentration(prev.holdings).top1Pct).toBeCloseTo(60.61, 2);
    expect(r.concentrationCur.positions).toBe(4);
  });
  it("refuses wrong order, same quarter or different managers", () => {
    expect(compare13F(cur, prev)).toBeNull();
    expect(compare13F(prev, prev)).toBeNull();
    expect(compare13F(prev, { ...cur, cik: "2" })).toBeNull();
  });
});

describe("pickOriginal13Fs", () => {
  const subs = { filings: { recent: { form: ["13F-HR/A", "13F-HR", "10-K", "13F-HR", "13F-HR"], accessionNumber: ["1", "2", "3", "4", "5"], filingDate: ["d1", "d2", "d3", "d4", "d5"], reportDate: ["q3", "q3", "x", "q2", "q1"] } } };
  it("skips amendments, other forms and repeated quarters", () => {
    expect(pickOriginal13Fs(subs, 2).map((x) => x.accessionNumber)).toEqual(["2", "4"]);
  });
});

describe("fetchTwo13Fs", () => {
  it("throws No13FError with fewer than two filings", async () => {
    const one = JSON.stringify({ name: "X", filings: { recent: { form: ["13F-HR"], accessionNumber: ["0001-26-1"], filingDate: ["d"], reportDate: ["q"] } } });
    await expect(fetchTwo13Fs("1", async () => ({ ok: true, status: 200, text: async () => one }))).rejects.toBeInstanceOf(No13FError);
  });
  it("reads both filings", async () => {
    const subs = JSON.stringify({ name: "X", filings: { recent: { form: ["13F-HR", "13F-HR"], accessionNumber: ["0001-26-2", "0001-26-1"], filingDate: ["d2", "d1"], reportDate: ["2026-06-30", "2026-03-31"] } } });
    const xml = (v: number) => `<informationTable><infoTable><nameOfIssuer>A</nameOfIssuer><titleOfClass>COM</titleOfClass><cusip>1</cusip><value>${v}</value><sshPrnamt>10</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></infoTable></informationTable>`;
    const fetcher = async (url: string) => {
      const text = url.includes("submissions") ? subs : url.endsWith("index.json") ? JSON.stringify({ directory: { item: [{ name: "primary_doc.xml" }, { name: "t.xml" }] } }) : url.endsWith("primary_doc.xml") ? "" : xml(url.includes("000126" + "2") ? 200 : 100);
      return { ok: true, status: 200, text: async () => text };
    };
    const { current, previous } = await fetchTwo13Fs("1", fetcher);
    expect(current.reportDate).toBe("2026-06-30");
    expect(previous.reportDate).toBe("2026-03-31");
    expect(current.holdings[0].valueUsd).toBe(200);
  });
});
