import { describe, expect, it } from "vitest";
import { addDays, brierScore, calibrationBins, lastCompletedClose, parseLedgerRequest, settle, validateInput, type Prediction } from "./ledger";

const resolve = (q: string) => ({ aapl: "AAPL", tsla: "TSLA", nvda: "NVDA", אפל: "AAPL" } as Record<string, string>)[q.toLowerCase()] ?? null;
const base: Prediction = { id: "1", symbol: "AAPL", direction: "up", confidence: 70, horizonDays: 30, thesis: "x y z", createdAt: "2026-09-01T10:00:00Z", dueDate: "2026-10-01", entryDate: "2026-08-31", entryClose: 100, entrySpyClose: 500, status: "open" };

describe("settlement", () => {
  it("stays open until a completed close on or after the due date exists", () => {
    const stock = [{ date: "2026-09-30", close: 110 }];
    expect(settle(base, stock, stock, "2026-10-02").status).toBe("open");
    const s2 = [{ date: "2026-10-01", close: 110 }];
    expect(settle(base, s2, [{ date: "2026-10-01", close: 505 }], "2026-10-01").status).toBe("open"); // bar dated today is not final
  });
  it("hit for up when exit above entry, with return vs SPY", () => {
    const r = settle(base, [{ date: "2026-10-01", close: 110 }], [{ date: "2026-10-01", close: 510 }], "2026-10-02");
    expect(r.status).toBe("settled"); expect(r.hit).toBe(true);
    expect(r.returnPct).toBeCloseTo(10); expect(r.spyReturnPct).toBeCloseTo(2);
  });
  it("uses the first close after a weekend due date", () => {
    const r = settle({ ...base, dueDate: "2026-10-03" }, [{ date: "2026-10-02", close: 90 }, { date: "2026-10-05", close: 120 }], [{ date: "2026-10-05", close: 500 }], "2026-10-06");
    expect(r.exitClose).toBe(120);
  });
  it("down call hits on a fall; a flat close is a miss", () => {
    const d = { ...base, direction: "down" as const };
    expect(settle(d, [{ date: "2026-10-01", close: 90 }], [{ date: "2026-10-01", close: 500 }], "2026-10-02").hit).toBe(true);
    expect(settle(d, [{ date: "2026-10-01", close: 100 }], [{ date: "2026-10-01", close: 500 }], "2026-10-02").hit).toBe(false);
  });
  it("never settles twice", () => {
    const done = settle(base, [{ date: "2026-10-01", close: 110 }], [{ date: "2026-10-01", close: 510 }], "2026-10-02");
    expect(settle(done, [{ date: "2026-10-01", close: 1 }], [{ date: "2026-10-01", close: 1 }], "2026-10-02")).toBe(done);
  });
  it("entry uses the last completed close", () => {
    expect(lastCompletedClose([{ date: "2026-10-01", close: 5 }, { date: "2026-10-02", close: 6 }], "2026-10-02")?.close).toBe(5);
    expect(lastCompletedClose([], "2026-10-02")).toBeNull();
  });
});

describe("scores", () => {
  const mk = (confidence: number, hit: boolean): Prediction => ({ ...base, confidence, status: "settled", hit });
  it("brier: perfect, coin-flip and overconfident", () => {
    expect(brierScore([mk(99, true)])).toBeCloseTo(0.0001);
    expect(brierScore([mk(50, true), mk(50, false)])).toBeCloseTo(0.25);
    expect(brierScore([mk(90, false)])).toBeCloseTo(0.81);
    expect(brierScore([])).toBeNull();
    expect(brierScore([base])).toBeNull();
  });
  it("calibration bins compare stated and realized, and flag small samples", () => {
    const set = [mk(70, true), mk(72, true), mk(75, false), mk(71, true), mk(79, true), mk(65, false)];
    const bins = calibrationBins(set);
    const b70 = bins.find((b) => b.low === 70)!;
    expect(b70.n).toBe(5); expect(b70.hitRate).toBeCloseTo(80); expect(b70.statedAvg).toBeCloseTo(73.4); expect(b70.enough).toBe(true);
    const b60 = bins.find((b) => b.low === 60)!;
    expect(b60.n).toBe(1); expect(b60.enough).toBe(false);
    expect(bins.find((b) => b.low === 90)!.hitRate).toBeNull();
  });
});

describe("parsing and validation", () => {
  it("does not read the pronoun I as a ticker (live bug: 'I predict AAPL ...' resolved to symbol I)", () => {
    const anyUpper = (q: string) => (/^[A-Za-z]{1,5}$/.test(q) ? q.toUpperCase() : null);
    expect(parseLedgerRequest("I predict AAPL goes up in 30 days, 70% sure", anyUpper)).toMatchObject({ kind: "create", input: { symbol: "AAPL" } });
  });
  it("reads a full call", () => {
    const r = parseLedgerRequest("Prediction: AAPL goes up in 30 days, 70% sure, services growth", resolve);
    expect(r).toMatchObject({ kind: "create", input: { symbol: "AAPL", direction: "up", confidence: 70, horizonDays: 30 } });
  });
  it("reads months, weeks and Hebrew", () => {
    expect(parseLedgerRequest("my call: TSLA will fall in 2 months 60%", resolve)).toMatchObject({ kind: "create", input: { direction: "down", horizonDays: 60 } });
    expect(parseLedgerRequest("תחזית: אפל תעלה תוך 4 שבועות 65%", resolve)).toMatchObject({ kind: "create", input: { symbol: "AAPL", direction: "up", horizonDays: 28, confidence: 65 } });
  });
  it("asks for the format when a part is missing, never guesses", () => {
    expect(parseLedgerRequest("prediction: AAPL up in 30 days", resolve)).toEqual({ kind: "help" });
    expect(parseLedgerRequest("prediction: AAPL up 70% in 3 days", resolve)).toEqual({ kind: "help" });
    expect(parseLedgerRequest("prediction: AAPL up 120% in 30 days", resolve)).toEqual({ kind: "help" });
    expect(parseLedgerRequest("prediction: up 70% in 30 days", resolve)).toEqual({ kind: "help" });
  });
  it("opens the view and ignores unrelated text", () => {
    expect(parseLedgerRequest("show my calibration", resolve)).toEqual({ kind: "view" });
    expect(parseLedgerRequest("what is a bond", resolve)).toBeNull();
  });
  it("validates and adds days", () => {
    expect(validateInput({ symbol: "aapl", direction: "up", confidence: 70, horizonDays: 30, thesis: "abc" })).toBe("symbol");
    expect(validateInput({ symbol: "AAPL", direction: "up", confidence: 49, horizonDays: 30, thesis: "abc" })).toBe("confidence");
    expect(addDays("2026-10-02", 30)).toBe("2026-11-01");
  });
});
