import { describe, expect, it } from "vitest";
import { DEFAULT_LEVEL, LEVELS, isSelectable, readLevel, saveLevel } from "./levels";
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
describe("levels", () => {
  it("only basic is live, four tracks with rising depth", () => { expect(LEVELS.map((l) => l.id)).toEqual(["basic", "junior", "senior", "professional"]); expect(LEVELS.filter((l) => l.available).map((l) => l.id)).toEqual(["basic"]); expect(LEVELS.map((l) => l.depth)).toEqual([1, 2, 3, 4]); });
  it("defaults to basic and ignores unavailable stored values", () => { const s = mem(); expect(readLevel("u1", s)).toBe(DEFAULT_LEVEL); s.setItem("invested.level.u1", "professional"); expect(readLevel("u1", s)).toBe("basic"); });
  it("refuses to save a track that is not live, and keeps users apart", () => { const s = mem(); expect(saveLevel("u1", "senior", s)).toBe(false); expect(saveLevel("u1", "basic", s)).toBe(true); expect(readLevel("u2", s)).toBe("basic"); expect(isSelectable("junior")).toBe(false); });
});
