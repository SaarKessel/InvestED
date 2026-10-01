import { describe, expect, it } from "vitest";
import { deleteAllMemory, exportMemory, remember, setConsent } from "./userMemory";

/** Tiny in-memory stand-in for the three tables, enough to test the order of operations. */
function fakeDb(consent: boolean) {
  const rows: Record<string, Record<string, unknown>[]> = { user_memory: [], saved_answers: [{ question: "q", answer: "a", created_at: "t" }] };
  const state = { consent };
  const db = {
    from(table: string) {
      return {
        select: () => ({ maybeSingle: async () => ({ data: table === "memory_consent" ? { enabled: state.consent } : null, error: null }), order: () => ({ limit: async () => ({ data: rows[table], error: null }) }) }),
        upsert: async (row: Record<string, unknown>) => { if (table === "memory_consent") state.consent = !!row.enabled; else rows[table].push(row); return { error: null }; },
        delete: () => ({ eq: async () => { rows[table] = []; return { error: null }; } }),
      };
    },
  };
  return { db: db as never, rows, state };
}
describe("userMemory", () => {
  it("refuses to write while consent is off", async () => {
    const f = fakeDb(false);
    expect(await remember("goal", "retire", "65", "u1", "user", f.db)).toBe(false);
    expect(f.rows.user_memory).toHaveLength(0);
  });
  it("writes once consent is on, exports it, and deletes everything and switches consent off", async () => {
    const f = fakeDb(false);
    await setConsent(true, "u1", f.db);
    expect(await remember("goal", "retire", "65", "u1", "user", f.db)).toBe(true);
    const ex = await exportMemory(f.db);
    expect(ex.consent).toBe(true); expect(ex.items).toHaveLength(1); expect(ex.savedAnswers).toHaveLength(1);
    await deleteAllMemory("u1", f.db);
    expect(f.rows.user_memory).toHaveLength(0); expect(f.rows.saved_answers).toHaveLength(0); expect(f.state.consent).toBe(false);
  });
});
