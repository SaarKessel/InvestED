import { describe, expect, it } from "vitest";
import { DEFAULT_LEVEL, LEVELS, isSelectable, readLevel, saveLevel } from "./levels";
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
describe("levels", () => {
  it("four live tracks with rising depth", () => { expect(LEVELS.map((l) => l.id)).toEqual(["basic", "junior", "senior", "professional"]); expect(LEVELS.every((l) => l.available)).toBe(true); expect(LEVELS.map((l) => l.depth)).toEqual([1, 2, 3, 4]); });
  it("defaults to basic, keeps a stored track and ignores unknown values", () => { const s = mem(); expect(readLevel("u1", s)).toBe(DEFAULT_LEVEL); s.setItem("invested.level.u1", "professional"); expect(readLevel("u1", s)).toBe("professional"); s.setItem("invested.level.u1", "wizard"); expect(readLevel("u1", s)).toBe("basic"); });
  it("saves a track per user and rejects unknown ones", () => { const s = mem(); expect(saveLevel("u1", "senior", s)).toBe(true); expect(readLevel("u1", s)).toBe("senior"); expect(readLevel("u2", s)).toBe("basic"); expect(isSelectable("junior")).toBe(true); expect(isSelectable("wizard")).toBe(false); });
});
