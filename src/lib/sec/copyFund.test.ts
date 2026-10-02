import { describe, expect, it } from "vitest";
import { buildTickerIndex, computeCopy, matchHoldings, normalizeName } from "./copyFund";
import type { Holding } from "./thirteenF";

const h = (issuer: string, valueUsd: number, titleOfClass = "COM", shareType = "SH"): Holding => ({ issuer, titleOfClass, cusip: "x", valueUsd, shares: 1, shareType, weightPct: 0 });
const idx = buildTickerIndex({ "0": { ticker: "AAPL", title: "Apple Inc." }, "1": { ticker: "KO", title: "COCA COLA CO" }, "2": { ticker: "GOOGL", title: "Alphabet Inc." }, "3": { ticker: "GOOG", title: "Alphabet Inc." }, "4": { ticker: "BAC", title: "BANK OF AMERICA CORP /DE/" } });

describe("matching", () => {
  it("normalizes legal suffixes and punctuation", () => {
    expect(normalizeName("Apple Inc.")).toBe("APPLE");
    expect(normalizeName("AT&T Inc")).toBe("AT AND T");
    expect(normalizeName("BANK OF AMERICA CORP /DE/")).toBe("BANK OF AMERICA");
  });
  it("matches only exact single-ticker names and lists the rest with a reason", () => {
    const r = matchHoldings([h("APPLE INC", 600), h("COCA COLA CO", 400), h("ALPHABET INC", 300, "CL A"), h("BANK AMER CORP", 200), h("SOME BOND", 100, "NOTE", "PRN")], idx);
    expect(r.matched.map((m) => m.ticker)).toEqual(["AAPL", "KO"]);
    expect(r.matched[0].weightPct).toBeCloseTo(60);
    expect(r.unmatched.map((u) => u.reason)).toEqual(["several_tickers", "no_exact_name_match", "not_common_stock"]);
  });
});

describe("computeCopy", () => {
  const m = [{ issuer: "A", ticker: "AAA", valueUsd: 750, weightPct: 75 }, { issuer: "B", ticker: "BBB", valueUsd: 250, weightPct: 25 }];
  const series = (a: number, b: number, c: number): { date: string; close: number }[] => [{ date: "2026-06-30", close: a }, { date: "2026-08-15", close: b }, { date: "2026-10-01", close: c }, { date: "2026-10-02", close: 9999 }];
  it("enters on the first close after filing, exits on the last completed close, compares to SPY", () => {
    const r = computeCopy(m, 0, { AAA: series(80, 100, 110), BBB: series(50, 100, 90) }, series(400, 500, 515), "2026-08-14", "2026-06-30", "2026-10-02");
    const f = r.fromFilingDate!;
    expect(f.entryDate).toBe("2026-08-15"); expect(f.latestDate).toBe("2026-10-01");
    expect(f.portfolioReturnPct).toBeCloseTo(0.75 * 10 + 0.25 * -10); // 5
    expect(f.spyReturnPct).toBeCloseTo(3);
    expect(r.fromQuarterEnd!.portfolioReturnPct).toBeCloseTo(0.75 * 37.5 + 0.25 * 80);
    expect(r.coveragePct).toBeCloseTo(100);
  });
  it("lists unpriced holdings and reports coverage instead of filling in", () => {
    const r = computeCopy(m, 1000, { AAA: series(80, 100, 110), BBB: null }, series(400, 500, 515), "2026-08-14", "2026-06-30", "2026-10-02");
    expect(r.notPriced).toEqual(["BBB"]);
    expect(r.coveragePct).toBeCloseTo(37.5);
    expect(r.fromFilingDate!.legs).toHaveLength(1);
    expect(r.fromFilingDate!.legs[0].weightPct).toBeCloseTo(100);
  });
  it("returns nothing when SPY or all prices are missing", () => {
    expect(computeCopy(m, 0, { AAA: series(1, 1, 1), BBB: series(1, 1, 1) }, null, "2026-08-14", "2026-06-30", "2026-10-02").fromFilingDate).toBeNull();
    expect(computeCopy(m, 0, { AAA: null, BBB: null }, series(1, 1, 1), "2026-08-14", "2026-06-30", "2026-10-02").fromFilingDate).toBeNull();
  });
  it("needs at least a day between entry and latest", () => {
    const s = [{ date: "2026-10-01", close: 1 }];
    expect(computeCopy(m, 0, { AAA: s, BBB: s }, s, "2026-09-30", "2026-06-30", "2026-10-02").fromFilingDate).toBeNull();
  });
});
