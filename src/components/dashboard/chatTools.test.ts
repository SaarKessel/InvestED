import { describe, it, expect } from "vitest";
import { CHAT_TOOLS, TOOL_PAGES, toolForPath } from "./chatTools";
import heLocale from "@/locales/he.json";
import enLocale from "@/locales/en.json";

describe("CHAT_TOOLS registry integrity", () => {
  it("ids and paths are unique", () => {
    expect(new Set(CHAT_TOOLS.map((t) => t.id)).size).toBe(CHAT_TOOLS.length);
    expect(new Set(CHAT_TOOLS.map((t) => t.path)).size).toBe(CHAT_TOOLS.length);
  });
  it("every tool path has a page to render", () => {
    for (const t of CHAT_TOOLS) expect(TOOL_PAGES[t.path], t.id).toBeDefined();
  });
  it("every labelKey exists in both locales", () => {
    for (const t of CHAT_TOOLS) {
      expect(heLocale[t.labelKey as keyof typeof heLocale], `he:${t.labelKey}`).toBeTruthy();
      expect(enLocale[t.labelKey as keyof typeof enLocale], `en:${t.labelKey}`).toBeTruthy();
    }
  });
  it("every group is one of the menu groups", () => {
    for (const t of CHAT_TOOLS) expect(["learn", "practice", "tools", "account", "about"]).toContain(t.group);
  });
});

describe("toolForPath", () => {
  it("resolves exact paths", () => {
    expect(toolForPath("/news")?.tool?.id).toBe("news");
    expect(toolForPath("/gapsheet")?.tool?.id).toBe("gapsheet");
  });
  it("tolerates trailing slashes", () => {
    expect(toolForPath("/news/")?.tool?.id).toBe("news");
    expect(toolForPath("/")?.path ?? null).toBeNull();
  });
  it("resolves sub-pages to their own page but the parent tool", () => {
    const hit = toolForPath("/career-lab/portfolio-game");
    expect(hit?.path).toBe("/career-lab/portfolio-game");
    expect(hit?.tool?.id).toBe("career");
  });
  it("returns null for unknown paths", () => {
    expect(toolForPath("/definitely-not-a-page")).toBeNull();
  });
});
