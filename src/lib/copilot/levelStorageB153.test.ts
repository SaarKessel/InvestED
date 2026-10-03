import { afterEach, describe, expect, it } from "vitest";
import { LEVELS, DEFAULT_LEVEL, readLevel, saveLevel, isSelectable, setActiveLevel, rewordBudgetMs } from "./levels";
afterEach(() => setActiveLevel(DEFAULT_LEVEL));
const rows = LEVELS.flatMap((level) => [null, undefined, "alice", "bob", ""].map((user) => [level.id, level.rewordBudgetMs, user] as const));
describe("[sweep] B153 pipeline level storage isolation and explicit speed budgets", () => {
  it.each(rows)("level %s budget %s user %s", (level, budget, user) => {
    const storage = new Map<string, string>();
    const store = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); } };
    expect(readLevel(user, store)).toBe(DEFAULT_LEVEL);
    expect(saveLevel(user, level, store)).toBe(true);
    expect(readLevel(user, store)).toBe(level);
    expect(storage.get(`invested.level.${user ?? "anon"}`)).toBe(level);
    expect(readLevel("other-user", store)).toBe(DEFAULT_LEVEL);
    expect(isSelectable(level)).toBe(true);
    setActiveLevel(level);
    expect(rewordBudgetMs()).toBe(budget);
    expect(rewordBudgetMs(level)).toBe(budget);
  });
});
describe("[hand] B153 inaccessible and unknown level values use safe defaults", () => {
  it("read errors and unknown stored strings fall back while write failures report false", () => {
    expect(readLevel("u", { getItem: () => { throw new Error("denied"); } })).toBe(DEFAULT_LEVEL);
    for (const value of ["wizard", "", "BASIC", "professional "]) expect(readLevel("u", { getItem: () => value })).toBe(DEFAULT_LEVEL);
    expect(saveLevel("u", "professional", { setItem: () => { throw new Error("denied"); } })).toBe(false);
    expect(readLevel("u", null)).toBe(DEFAULT_LEVEL);
  });
});
