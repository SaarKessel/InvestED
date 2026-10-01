import { describe, expect, it } from "vitest";
import { TOOL_KEYWORD_PATHS, resolveToolKeyword } from "./toolKeywords";
import { CHAT_TOOLS } from "@/components/dashboard/chatTools";

describe("menu items are chat keywords", () => {
  it("covers every menu tool", () => {
    for (const tool of CHAT_TOOLS) expect(TOOL_KEYWORD_PATHS, tool.id).toContain(tool.path);
  });
  it("opens the career page for the bare word", () => {
    expect(resolveToolKeyword("קריירה")).toBe("/career-lab");
    expect(resolveToolKeyword("Career!")).toBe("/career-lab");
    expect(resolveToolKeyword("פתח מחשבון")).toBe("/calculator");
    expect(resolveToolKeyword("open the calculator")).toBe("/calculator");
  });
  it("leaves real questions to the answer engine", () => {
    expect(resolveToolKeyword("what is the news about NVDA")).toBeNull();
    expect(resolveToolKeyword("how does a loan work")).toBeNull();
    expect(resolveToolKeyword("What is VOO price?")).toBeNull();
  });
});
