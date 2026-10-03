import { describe, expect, it } from "vitest";
import { emptyState, loadState, saveState } from "./newsPopup";
const rows = [0, 1, 49, 50, 51, 100].flatMap((count) => [false, true].flatMap((off) => [0, 3].map((shownToday) => [count, off, shownToday] as const)));
describe("[sweep] B143 popup persistence keeps last fifty seen stories and exact state", () => {
  it.each(rows)("seen %s off %s shown %s", (count, off, shownToday) => {
    const state = { ...emptyState(), seen: Array.from({ length: count }, (_, i) => `story${i}`), off, shownToday, lastShownAt: 123456, dayKey: "2026-10-03" };
    const snapshot = JSON.stringify(state);
    const storage = new Map<string, string>();
    const store = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); } };
    saveState(state, store);
    expect(storage.size).toBe(1);
    expect(loadState(store)).toEqual({ ...state, seen: state.seen.slice(-50) });
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});
describe("[hand] B143 storage errors do not break popup rendering", () => {
  it("read and write failures preserve safe empty defaults", () => {
    expect(loadState(null)).toEqual(emptyState());
    expect(loadState({ getItem: () => "{invalid" })).toEqual(emptyState());
    expect(loadState({ getItem: () => { throw new Error("denied"); } })).toEqual(emptyState());
    expect(() => saveState(emptyState(), { setItem: () => { throw new Error("quota"); } })).not.toThrow();
  });
  it("partial stored state receives new defaults without losing existing toggles", () => {
    expect(loadState({ getItem: () => JSON.stringify({ off: true }) })).toEqual({ ...emptyState(), off: true });
  });
});
