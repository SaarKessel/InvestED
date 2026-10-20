import { describe, it, expect } from "vitest";
import { safeSlice } from "./safeSlice";

describe("safeSlice", () => {
  it("returns short text unchanged", () => {
    expect(safeSlice("abc", 10)).toBe("abc");
    expect(safeSlice("abc", 3)).toBe("abc");
  });
  it("cuts by code points, not UTF-16 units", () => {
    expect(safeSlice("abcdef", 3)).toBe("abc");
    const withEmoji = "ab😀cd";
    expect(safeSlice(withEmoji, 3)).toBe("ab😀");
  });
  it("never leaves a lone surrogate", () => {
    const cut = safeSlice("ab😀cd", 3);
    const last = cut.charCodeAt(cut.length - 1);
    expect(last < 0xd800 || last > 0xdbff).toBe(true); // never ends on a HIGH surrogate
    expect(cut).toBe("ab😀");
  });
  it("handles Hebrew text", () => {
    expect(safeSlice("שלום עולם", 4)).toBe("שלום");
  });
});
