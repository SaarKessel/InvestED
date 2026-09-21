// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/context/languageContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { AnalysisProvider } from "@/context/AnalysisContext";
import StrategyLabPage from "@/pages/StrategyLabPage";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function renderPage() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={["/strategy-lab"]}>
        <LanguageProvider>
          <ThemeProvider>
            <AnalysisProvider>
              <StrategyLabPage />
            </AnalysisProvider>
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>
    );
  });
}

function cleanup() {
  act(() => root.unmount());
  container.remove();
}

function text(): string {
  return container.textContent ?? "";
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = "";
});

describe("Strategy Lab page", () => {
  it("renders all ten strategies in Hebrew by default with RTL", () => {
    renderPage();
    try {
      expect(document.documentElement.dir).toBe("rtl");
      expect(text()).toContain("מעבדת אסטרטגיות");
      expect(text()).toContain("השקעת מדדים לטווח ארוך");
      expect(text()).toContain("השקעת דיבידנדים");
      expect(text()).toContain("פיזור");
      const cards = container.querySelectorAll("ul.grid > li");
      expect(cards.length).toBe(10);
    } finally {
      cleanup();
    }
  });

  it("renders in English (LTR) when the preference is English", () => {
    window.localStorage.setItem("invested_language_preference", "en");
    renderPage();
    try {
      expect(document.documentElement.dir).toBe("ltr");
      expect(text()).toContain("Strategy Lab");
      expect(text()).toContain("Dollar-Cost Averaging");
      expect(text()).toContain("for learning only, never investment advice");
    } finally {
      cleanup();
    }
  });

  it("filters strategies by search and shows an empty state", () => {
    window.localStorage.setItem("invested_language_preference", "en");
    renderPage();
    try {
      const search = container.querySelector("input[type=search]") as HTMLInputElement;
      act(() => setInputValue(search, "dollar-cost"));
      expect(container.querySelectorAll("ul.grid > li").length).toBe(1);
      expect(text()).toContain("Dollar-Cost Averaging");

      act(() => setInputValue(search, "no-such-strategy-xyz"));
      expect(text()).toContain("No strategies match");
      const reset = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("Reset filters"));
      expect(reset).toBeTruthy();
      act(() => reset!.click());
      expect(container.querySelectorAll("ul.grid > li").length).toBe(10);
    } finally {
      cleanup();
    }
  });

  it("opens a strategy detail with engine content and disclaimer", () => {
    window.localStorage.setItem("invested_language_preference", "en");
    renderPage();
    try {
      const open = container.querySelector('button[aria-label="Open strategy details: Momentum"]') as HTMLButtonElement;
      expect(open).toBeTruthy();
      act(() => open.click());
      expect(text()).toContain("Philosophy");
      expect(text()).toContain("Core rules");
      expect(text()).toContain("Limitations");
      expect(text()).toContain("Historical context");
      expect(text()).toContain("Jegadeesh");
      expect(text()).toContain("not a recommendation");
      expect(text()).toContain("Ask the Copilot about this strategy");
    } finally {
      cleanup();
    }
  });

  it("compares two strategies side by side", () => {
    window.localStorage.setItem("invested_language_preference", "en");
    renderPage();
    try {
      const compareToggle = [...container.querySelectorAll("button")].find((button) =>
        button.textContent?.trim() === "Compare"
      ) as HTMLButtonElement;
      act(() => compareToggle.click());

      const valueBtn = container.querySelector('button[aria-label="Select for comparison: Value Investing"]') as HTMLButtonElement;
      const growthBtn = container.querySelector('button[aria-label="Select for comparison: Growth Investing"]') as HTMLButtonElement;
      act(() => valueBtn.click());
      act(() => growthBtn.click());

      const run = [...container.querySelectorAll("button")].find((button) => button.textContent === "Compare selected") as HTMLButtonElement;
      expect(run).toBeTruthy();
      act(() => run.click());

      expect(text()).toContain("Risk level");
      expect(text()).toContain("Time horizon");
      expect(text()).toContain("Value Investing");
      expect(text()).toContain("Growth Investing");
      expect(container.querySelector("table")).toBeTruthy();
    } finally {
      cleanup();
    }
  });

  it("answers a strategy question through the Copilot without market calls", async () => {
    window.localStorage.setItem("invested_language_preference", "en");
    renderPage();
    try {
      const open = container.querySelector('button[aria-label="Open strategy details: Dividend Investing"]') as HTMLButtonElement;
      act(() => open.click());

      const askInput = container.querySelector('input[aria-label="Ask the Copilot about this strategy"]') as HTMLInputElement;
      act(() => setInputValue(askInput, "What is dividend investing?"));
      const send = [...container.querySelectorAll("button")].find((button) =>
        button.getAttribute("aria-label")?.startsWith("Ask")
      ) as HTMLButtonElement;
      await act(async () => {
        send.click();
        await Promise.resolve();
      });
      expect(text()).toContain("Dividend Investing");
      expect(text()).toContain("education only");
    } finally {
      cleanup();
    }
  });
});
