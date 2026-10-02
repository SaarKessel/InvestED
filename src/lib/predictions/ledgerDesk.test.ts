import { describe, expect, it } from "vitest";
import { fromRow, planLedgerRequest, runLedger } from "./ledgerDesk";

type Row = Record<string, unknown>;
function fakeDb(rows: Row[], user: boolean = true) {
  const updates: Row[] = []; const inserts: Row[] = [];
  const db = {
    auth: { getUser: async () => ({ data: { user: user ? { id: "u1" } : null } }) },
    from: () => ({
      insert: (v: Row) => ({ select: () => ({ single: async () => { const r = { id: "new", created_at: "2026-10-02T10:00:00Z", status: "open", ...v }; inserts.push(r); rows.unshift(r); return { data: r, error: null }; } }) }),
      select: () => ({ order: () => ({ limit: async () => ({ data: rows, error: null }) }) }),
      update: (v: Row) => ({ eq: async () => { updates.push(v); return { error: null }; } }),
    }),
  };
  return { db: db as never, updates, inserts };
}
const fetchOf = (map: Record<string, { date: string; close: number }[] | null>) => (async (url: string) => {
  const sym = new URL(url, "http://x").searchParams.get("symbol")!;
  const closes = map[sym];
  return closes ? { ok: true, json: async () => ({ closes }) } : { ok: false, json: async () => ({}) };
}) as unknown as typeof fetch;
const now = new Date("2026-10-02T12:00:00Z");

describe("ledger desk", () => {
  it("plans from chat text", () => {
    expect(planLedgerRequest("prediction: AAPL goes up in 30 days, 70% sure")).toMatchObject({ kind: "create" });
  });
  it("needs sign-in", async () => {
    const r = await runLedger({ kind: "view" }, { db: fakeDb([], false).db, now });
    expect(r.reason).toBe("signin");
  });
  it("saves a call with real entry closes, and refuses when closes are unavailable", async () => {
    const f = fakeDb([]);
    const closes = [{ date: "2026-10-01", close: 200 }, { date: "2026-10-02", close: 999 }];
    const r = await runLedger({ kind: "create", input: { symbol: "AAPL", direction: "up", confidence: 70, horizonDays: 30, thesis: "services growth" } }, { db: f.db, fetcher: fetchOf({ AAPL: closes, SPY: [{ date: "2026-10-01", close: 500 }] }), now });
    expect(f.inserts).toHaveLength(1);
    expect(r.created).toMatchObject({ entryClose: 200, entrySpyClose: 500, dueDate: "2026-11-01", entryDate: "2026-10-01" });
    const g = fakeDb([]);
    const r2 = await runLedger({ kind: "create", input: { symbol: "AAPL", direction: "up", confidence: 70, horizonDays: 30, thesis: "services growth" } }, { db: g.db, fetcher: fetchOf({ AAPL: null, SPY: closes }), now });
    expect(r2.reason).toBe("closes_unavailable"); expect(g.inserts).toHaveLength(0);
  });
  it("settles due calls mechanically and leaves others open", async () => {
    const row = { id: "a", symbol: "AAPL", direction: "up", confidence: 80, horizon_days: 30, thesis: "x y z", created_at: "2026-08-20T10:00:00Z", due_date: "2026-09-19", entry_date: "2026-08-19", entry_close: 100, entry_spy_close: 500, status: "open" };
    const future = { ...row, id: "b", due_date: "2026-12-01" };
    const f = fakeDb([row, future]);
    const r = await runLedger({ kind: "view" }, { db: f.db, fetcher: fetchOf({ AAPL: [{ date: "2026-09-21", close: 90 }], SPY: [{ date: "2026-09-21", close: 510 }] }), now });
    expect(r.settledNow).toBe(1);
    expect(r.predictions.find((p) => p.id === "a")).toMatchObject({ status: "settled", hit: false });
    expect(r.predictions.find((p) => p.id === "b")?.status).toBe("open");
    expect(r.brier).toBeCloseTo(0.64);
    expect(f.updates[0]).toMatchObject({ hit: false, exit_close: 90 });
  });
  it("keeps a due call open when closes cannot be loaded", async () => {
    const row = { id: "a", symbol: "AAPL", direction: "up", confidence: 80, horizon_days: 30, thesis: "x y z", created_at: "2026-08-20T10:00:00Z", due_date: "2026-09-19", entry_date: "2026-08-19", entry_close: 100, entry_spy_close: 500, status: "open" };
    const f = fakeDb([row]);
    const r = await runLedger({ kind: "view" }, { db: f.db, fetcher: fetchOf({ AAPL: null, SPY: null }), now });
    expect(r.settledNow).toBe(0); expect(f.updates).toHaveLength(0); expect(r.brier).toBeNull();
  });
  it("maps rows", () => {
    expect(fromRow({ id: 1, symbol: "A", direction: "up", confidence: "70", horizon_days: 7, thesis: "t", created_at: "c", due_date: "d", entry_date: "e", entry_close: "1.5", entry_spy_close: "2", status: "settled", hit: true, return_pct: "3" }).entryClose).toBe(1.5);
  });
});
