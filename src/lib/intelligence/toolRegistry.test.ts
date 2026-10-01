import { describe, expect, it } from "vitest";
import { TOOLS, toolFor } from "./toolRegistry";
describe("toolRegistry", () => {
  it("covers every engine with he and en titles", () => { for (const t of Object.values(TOOLS)) { expect(toolFor(t.id)).toBe(t); expect(t.title.en && t.title.he).toBeTruthy(); } expect(Object.keys(TOOLS)).toHaveLength(8); });
  it("marks only data tools as live", () => { expect(Object.values(TOOLS).filter((t) => t.live).map((t) => t.id).sort()).toEqual(["market", "news"]); });
});
