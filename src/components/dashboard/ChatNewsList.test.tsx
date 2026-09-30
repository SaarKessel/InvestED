// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ChatNewsList } from "./ChatNewsList";
import type { NewsResult } from "@/lib/newsClient";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

function feed(items: Partial<NewsResult["items"][number]>[]): NewsResult {
  return {
    available: true,
    items: items.map((item, index) => ({
      id: `n${index}`,
      title: "כותרת",
      url: "https://finance.yahoo.com/news",
      source: "Test Source",
      publishedAt: "2026-09-30T16:00:00.000Z",
      symbols: [],
      eventType: "general",
      classificationSource: "deterministic_headline_rules",
      implicationsSource: "none",
      eventLabel: { he: "", en: "" },
      keyFacts: { he: [], en: [] },
      implications: { he: [], en: [] },
      ...item,
    })),
    fetchedAt: "2026-09-30T16:05:00.000Z",
  };
}

describe("chat related-news list", () => {
  it("renders only items that mention the turn's symbols", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed([
      { title: "אפל הודיעה על דיבידנד", symbols: ["AAPL"] },
      { title: "חדשות אחרות", symbols: ["XOM"] },
    ]) })));
    await act(async () => root.render(<LanguageProvider><ChatNewsList symbols={["AAPL"]} /></LanguageProvider>));
    expect(container.textContent).toContain("חדשות קשורות");
    expect(container.textContent).toContain("אפל הודיעה על דיבידנד");
    expect(container.textContent).not.toContain("חדשות אחרות");
    expect(container.textContent).toContain("Test Source");
  });

  it("renders nothing when nothing matches", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed([{ symbols: ["XOM"] }]) })));
    await act(async () => root.render(<LanguageProvider><ChatNewsList symbols={["AAPL"]} /></LanguageProvider>));
    expect(container.firstChild).toBeNull();
  });
});
