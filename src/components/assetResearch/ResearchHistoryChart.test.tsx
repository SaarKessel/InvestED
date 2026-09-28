// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
class TestResizeObserver { observe() {} unobserve() {} disconnect() {} }
globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
import { LanguageProvider } from "@/context/languageContext";
import type { CandleDatum } from "@/types";
import { ResearchHistoryChart } from "./ResearchHistoryChart";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
const history: CandleDatum[] = Array.from({ length: 90 }, (_, index) => ({
  date: `2026-09-${String(index % 28 + 1).padStart(2, "0")}`, open: 100 + index, high: 101 + index,
  low: 99 + index, close: 100 + index, price: 100 + index,
}));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (data: CandleDatum[]) => act(() => root.render(<LanguageProvider><ResearchHistoryChart history={data} currency="USD"/></LanguageProvider>));

describe("research chart observation ranges", () => {
  it("starts with all observations and switches to 22 without changing the data", () => {
    render(history);
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toContain("90 תצפיות");
    const first = [...container.querySelectorAll("button")].find(button => button.textContent?.includes("22"));
    expect(first).toBeTruthy();
    act(() => first!.click());
    expect(first!.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toContain("22 תצפיות");
    expect(history).toHaveLength(90);
  });
  it("marks absent history unavailable rather than drawing an invented curve", () => {
    render([]);
    expect(container.textContent).toContain("הנתונים אינם זמינים");
    expect(container.querySelector('[role="img"]')).toBeNull();
  });
});
