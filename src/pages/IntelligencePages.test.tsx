// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { recordTrace } from "@/lib/intelligence/traceStore";
import { resolveToolKeyword } from "@/lib/copilot/toolKeywords";
import KnowledgeMapPage from "./KnowledgeMapPage";
import SystemHealthPage from "./SystemHealthPage";
vi.mock("@/components/layout/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => null }));
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement; let root: Root;
beforeEach(() => { localStorage.clear(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (language: "he" | "en", Page: () => JSX.Element) => { localStorage.setItem("invested_language_preference", language); act(() => root.render(<MemoryRouter><LanguageProvider><Page /></LanguageProvider></MemoryRouter>)); };

for (const language of ["he", "en"] as const) {
  it(`${language} knowledge map: one main, one h1, opening a concept shows its detail`, () => {
    render(language, KnowledgeMapPage);
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    act(() => { container.querySelector<HTMLButtonElement>("ul[aria-label] button")!.click(); });
    expect(container.querySelector("[data-testid=map-detail] h2")).not.toBeNull();
    expect(container.querySelector("section")?.getAttribute("dir")).toBe(language === "he" ? "rtl" : "ltr");
  });
  it(`${language} system health: empty state, then summary after a trace, then clear`, () => {
    render(language, SystemHealthPage);
    expect(container.querySelector("[data-testid=health-empty]")).not.toBeNull();
    act(() => root.unmount()); root = createRoot(container);
    recordTrace({ at: 1, route: "deep", tools: [], ms: 120, ok: true, failedChecks: [], live: "none", question: "private question" });
    render(language, SystemHealthPage);
    expect(container.querySelector("[data-testid=health-summary]")).not.toBeNull();
    expect(container.textContent).not.toMatch(/private question/);
    act(() => { [...container.querySelectorAll("button")].at(-1)!.click(); });
    expect(container.querySelector("[data-testid=health-empty]")).not.toBeNull();
  });
}
it("keywords reach the new pages without the shorter knowledge keyword winning", () => {
  expect(resolveToolKeyword("open the knowledge map")).toBe("/knowledge-map");
  expect(resolveToolKeyword("show system health")).toBe("/system-health");
});
