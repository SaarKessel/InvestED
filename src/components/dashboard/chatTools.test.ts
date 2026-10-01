import { describe, expect, it } from "vitest";
import { CHAT_TOOLS, TOOL_PAGES, toolForPath } from "./chatTools";

describe("former tabs live in the chat", () => {
  it("every menu tool has a page", () => {
    for (const tool of CHAT_TOOLS) expect(TOOL_PAGES[tool.path], tool.id).toBeDefined();
  });
  it("career games resolve to the career lab tool", () => {
    expect(toolForPath("/career-lab/analyst-game")?.tool?.id).toBe("career");
  });
  it("the chat itself and unknown paths open no tool", () => {
    expect(toolForPath("/")).toBeNull();
    expect(toolForPath("/nope")).toBeNull();
  });
  it("tolerates a trailing slash", () => {
    expect(toolForPath("/calculator/")?.tool?.id).toBe("calculator");
  });
});
