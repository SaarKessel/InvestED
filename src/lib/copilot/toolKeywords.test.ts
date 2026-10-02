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
  it("opens the rent-vs-buy lab for complete Hebrew and English scenarios", () => {
    for (const phrase of [
      "שכירות מול קנייה של דירה ב-2,000,000 שקל, שכירות 6,000 בחודש",
      "שכירות לעומת קניה",
      "rent vs buy a home",
      "renting versus buying with 2000000 purchase price",
      "should I buy or rent?",
    ]) expect(resolveToolKeyword(phrase)).toBe("/money-lessons");
  });
  it("leaves real questions to the answer engine", () => {
    expect(resolveToolKeyword("what is the news about NVDA")).toBeNull();
    expect(resolveToolKeyword("how does a loan work")).toBeNull();
    expect(resolveToolKeyword("What is VOO price?")).toBeNull();
  });
});
