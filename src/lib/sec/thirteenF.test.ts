import { describe, expect, it } from "vitest";

import { cleanCik, fetchLatest13F, No13FError, parseInfoTable, parsePrimaryDoc, pickLatest13F, SecUnavailableError, ThirteenFParseError, type SecFetch } from "./thirteenF";

const row = (issuer: string, cusip: string, value: number, shares: number) => `
  <infoTable><nameOfIssuer>${issuer}</nameOfIssuer><titleOfClass>COM</titleOfClass><cusip>${cusip}</cusip>
  <value>${value}</value><shrsOrPrnAmt><sshPrnamt>${shares}</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt></infoTable>`;

const INFO = `<informationTable xmlns="x">${row("ALLY FINL INC", "02005N100", 600, 6)}${row("ALLY FINL INC", "02005N100", 200, 2)}${row("APPLE &amp; CO", "037833100", 200, 1)}</informationTable>`;
const PRIMARY = `<edgarSubmission><tableEntryTotal>3</tableEntryTotal><tableValueTotal>1000</tableValueTotal></edgarSubmission>`;
const SUBMISSIONS = {
  name: "TEST MANAGER",
  filings: { recent: { form: ["8-K", "13F-HR", "13F-HR"], accessionNumber: ["a-1", "0001-26-2", "0001-26-1"], filingDate: ["x", "2026-08-14", "2026-05-15"], reportDate: ["x", "2026-06-30", "2026-03-31"] } },
};

function fakeSec(overrides: Record<string, () => { ok: boolean; status: number; body: string }> = {}): SecFetch {
  return async (url) => {
    const key = Object.keys(overrides).find((k) => url.includes(k));
    const res = key
      ? overrides[key]()
      : url.includes("submissions") ? { ok: true, status: 200, body: JSON.stringify(SUBMISSIONS) }
      : url.endsWith("index.json") ? { ok: true, status: 200, body: JSON.stringify({ directory: { item: [{ name: "primary_doc.xml" }, { name: "info.xml" }, { name: "x-index.html" }] } }) }
      : url.endsWith("primary_doc.xml") ? { ok: true, status: 200, body: PRIMARY }
      : { ok: true, status: 200, body: INFO };
    return { ok: res.ok, status: res.status, text: async () => res.body };
  };
}

describe("13F parsing", () => {
  it("merges rows per CUSIP and decodes entities", () => {
    const rows = parseInfoTable(INFO);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.cusip === "02005N100")).toMatchObject({ valueUsd: 800, shares: 8 });
    expect(rows.find((r) => r.cusip === "037833100")?.issuer).toBe("APPLE & CO");
  });
  it("throws on empty or malformed tables instead of guessing", () => {
    expect(() => parseInfoTable("<x/>")).toThrow(ThirteenFParseError);
    expect(() => parseInfoTable("<infoTable><nameOfIssuer>A</nameOfIssuer></infoTable>")).toThrow(ThirteenFParseError);
  });
  it("reads reported totals", () => {
    expect(parsePrimaryDoc(PRIMARY)).toEqual({ reportedTotalValueUsd: 1000, reportedEntryCount: 3 });
    expect(parsePrimaryDoc("<x/>")).toEqual({ reportedTotalValueUsd: null, reportedEntryCount: null });
  });
  it("picks the newest 13F-HR and validates CIKs", () => {
    expect(pickLatest13F(SUBMISSIONS)?.accessionNumber).toBe("0001-26-2");
    expect(pickLatest13F({ filings: { recent: { form: ["8-K"], accessionNumber: ["a"] } } })).toBeNull();
    expect(cleanCik("1067983")).toBe("0001067983");
    expect(cleanCik("CIK0001067983")).toBe("0001067983");
    expect(cleanCik("abc")).toBeNull();
    expect(cleanCik("../etc")).toBeNull();
  });
});

describe("fetchLatest13F", () => {
  it("returns weighted, sorted holdings with source URL and reported totals", async () => {
    const result = await fetchLatest13F("1067983", fakeSec());
    expect(result).toMatchObject({ cik: "0001067983", managerName: "TEST MANAGER", reportDate: "2026-06-30", reportedTotalValueUsd: 1000, reportedEntryCount: 3 });
    expect(result.holdings.map((h) => h.cusip)).toEqual(["02005N100", "037833100"]);
    expect(result.holdings[0].weightPct).toBe(80);
    expect(result.sourceUrl).toBe("https://www.sec.gov/Archives/edgar/data/1067983/0001262/info.xml");
  });
  it("honors topN", async () => {
    expect((await fetchLatest13F("1067983", fakeSec(), { topN: 1 })).holdings).toHaveLength(1);
  });
  it("reports no filing, SEC outage and bad CIK distinctly", async () => {
    await expect(fetchLatest13F("1", fakeSec({ submissions: () => ({ ok: true, status: 200, body: JSON.stringify({ filings: { recent: { form: [], accessionNumber: [] } } }) }) }))).rejects.toBeInstanceOf(No13FError);
    await expect(fetchLatest13F("1", fakeSec({ submissions: () => ({ ok: false, status: 503, body: "" }) }))).rejects.toBeInstanceOf(SecUnavailableError);
    await expect(fetchLatest13F("x1", fakeSec())).rejects.toBeInstanceOf(No13FError);
  });
  it("network failure is unavailable, not empty", async () => {
    await expect(fetchLatest13F("1", async () => { throw new Error("boom"); })).rejects.toBeInstanceOf(SecUnavailableError);
  });
});
