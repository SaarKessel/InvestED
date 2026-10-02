import { describe, expect, it } from "vitest";
import { cleanTicker, fetchFundHoldings, findFundSeries, NoNportError, NportParseError, parseNport, pickLatestNport } from "./nport";
import { SecUnavailableError, type SecFetch } from "./thirteenF";

const row = (name: string, cusip: string, val: number, pct: number, extra = "") =>
  `<invstOrSec><name>${name}</name><title>T</title><cusip>${cusip}</cusip><identifiers><isin value="US${cusip}1"/></identifiers><balance>10.0</balance><units>NS</units><valUSD>${val}</valUSD><pctVal>${pct}</pctVal><payoffProfile>Long</payoffProfile><assetCat>EC</assetCat>${extra}</invstOrSec>`;
const XML = `<edgarSubmission><seriesId>S000002839</seriesId><seriesName>TEST 500 FUND</seriesName><repPdDate>2026-06-30</repPdDate><netAssets>1000</netAssets>
${row("Small &amp; Co", "111111111", 10, 1)}${row("Big Corp", "222222222", 70, 7)}${row("Mid Corp", "333333333", 30, 3)}<invstOrSec><name>No value</name></invstOrSec></edgarSubmission>`;
const MF = { fields: ["cik", "seriesId", "classId", "symbol"], data: [[36405, "S000002839", "C1", "VOO"], [36405, "S000002848", "C2", "VTI"]] };
const ATOM = `<feed><entry><content><accession-number>0000036405-26-000473</accession-number><filing-date>2026-08-28</filing-date><filing-type>NPORT-P</filing-type></content></entry></feed>`;

const fakeSec = (over: Record<string, { ok: boolean; status: number; body: string }> = {}): SecFetch => async (url) => {
  const k = Object.keys(over).find((x) => url.includes(x));
  const r = k ? over[k] : url.includes("company_tickers_mf") ? { ok: true, status: 200, body: JSON.stringify(MF) } : url.includes("browse-edgar") ? { ok: true, status: 200, body: ATOM } : { ok: true, status: 200, body: XML };
  return { ok: r.ok, status: r.status, text: async () => r.body };
};

describe("N-PORT parsing", () => {
  it("sorts by weight, decodes entities, skips unreadable rows and reports counts", () => {
    const p = parseNport(XML, "S000002839", 2);
    expect(p.holdings.map((h) => h.name)).toEqual(["Big Corp", "Mid Corp"]);
    expect(p.totalHoldingCount).toBe(4);
    expect(p.shownWeightPct).toBe(10);
    expect(p.reportDate).toBe("2026-06-30");
    expect(p.netAssetsUsd).toBe(1000);
    expect(parseNport(XML, "S000002839", 10).holdings.find((h) => h.cusip === "111111111")?.name).toBe("Small & Co");
    expect(p.holdings[0].isin).toBe("US2222222221");
  });
  it("refuses a filing for another series and an empty filing", () => {
    expect(() => parseNport(XML, "S999", 5)).toThrow(NportParseError);
    expect(() => parseNport("<x><seriesId>S1</seriesId></x>", "S1", 5)).toThrow(NportParseError);
  });
  it("maps tickers to series, only exact symbols", () => {
    expect(findFundSeries(MF, "VOO")).toEqual({ cik: "0000036405", seriesId: "S000002839", classId: "C1" });
    expect(findFundSeries(MF, "SPY")).toBeNull();
    expect(findFundSeries({}, "VOO")).toBeNull();
  });
  it("picks the newest NPORT-P entry and validates tickers", () => {
    expect(pickLatestNport(ATOM)).toEqual({ accessionNumber: "0000036405-26-000473", filingDate: "2026-08-28" });
    expect(pickLatestNport("<feed><entry><filing-type>10-K</filing-type></entry></feed>")).toBeNull();
    expect(cleanTicker(" voo ")).toBe("VOO");
    expect(cleanTicker("../x")).toBeNull();
  });
});

describe("fetchFundHoldings", () => {
  it("returns holdings with the report date and a filing URL", async () => {
    const r = await fetchFundHoldings("voo", fakeSec(), { topN: 2 });
    expect(r).toMatchObject({ ticker: "VOO", seriesId: "S000002839", reportDate: "2026-06-30", filingDate: "2026-08-28" });
    expect(r.sourceUrl).toBe("https://www.sec.gov/Archives/edgar/data/36405/000003640526000473/primary_doc.xml");
    expect(r.holdings).toHaveLength(2);
  });
  it("unknown ticker (e.g. a UIT like SPY) and no filings are unavailable, not empty", async () => {
    await expect(fetchFundHoldings("SPY", fakeSec())).rejects.toBeInstanceOf(NoNportError);
    await expect(fetchFundHoldings("VOO", fakeSec({ "browse-edgar": { ok: true, status: 200, body: "<feed/>" } }))).rejects.toBeInstanceOf(NoNportError);
    await expect(fetchFundHoldings("../x", fakeSec())).rejects.toBeInstanceOf(NoNportError);
  });
  it("SEC errors surface as unavailable", async () => {
    await expect(fetchFundHoldings("VOO", fakeSec({ primary_doc: { ok: false, status: 503, body: "" } }))).rejects.toBeInstanceOf(SecUnavailableError);
    await expect(fetchFundHoldings("VOO", async () => { throw new Error("x"); })).rejects.toBeInstanceOf(SecUnavailableError);
  });
});
