import { describe, expect, it } from "vitest";
import { isSaved, loadSaved, MAX_SAVED, removeSaved, toggleSaved } from "./savedAnswers";
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
describe("savedAnswers", () => {
  it("toggles per user and keeps users apart", () => {
    const s = mem();
    expect(toggleSaved("u1", "What is ETF?", "A fund.", 1, s)).toHaveLength(1);
    expect(isSaved(loadSaved("u1", s), "What is ETF?", "A fund.")).toBe(true);
    expect(loadSaved("u2", s)).toEqual([]);
    expect(toggleSaved("u1", "What is ETF?", "A fund.", 2, s)).toHaveLength(0);
  });
  it("caps the list, newest first, and removes by id", () => {
    const s = mem();
    for (let i = 0; i < MAX_SAVED + 5; i++) toggleSaved("u", `q${i}`, `a${i}`, i, s);
    const l = loadSaved("u", s);
    expect(l).toHaveLength(MAX_SAVED); expect(l[0].question).toBe(`q${MAX_SAVED + 4}`);
    expect(removeSaved("u", l[0].id, s)).toHaveLength(MAX_SAVED - 1);
  });
  it("survives corrupt storage", () => { expect(loadSaved("u", { getItem: () => "{oops", setItem: () => undefined })).toEqual([]); });
});
