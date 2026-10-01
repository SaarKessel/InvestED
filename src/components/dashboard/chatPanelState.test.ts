import { describe, expect, it } from "vitest";
import { hasVisuals } from "./chatPanelState";

describe("side panel opens only for visual answers", () => {
  it("plain text does not open it", () => expect(hasVisuals({})).toBe(false));
  it("a stock answer opens it", () => expect(hasVisuals({ response: { assets: [{}] } })).toBe(true));
  it("a learning path opens it", () => expect(hasVisuals({ learnPath: true })).toBe(true));
  it("an empty comparison does not", () => expect(hasVisuals({ response: { comparison: null } })).toBe(false));
});
