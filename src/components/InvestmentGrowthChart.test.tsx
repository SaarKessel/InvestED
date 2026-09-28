// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { InvestmentGrowthChart } from "./InvestmentGrowthChart";

class TestResizeObserver { observe() {} unobserve() {} disconnect() {} }
globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (years: number) => act(() => root.render(<LanguageProvider><InvestmentGrowthChart currency="ILS" data={Array.from({ length: years + 1 }, (_, year) => ({ year, balance: year * 1000, contributed: year * 800 }))} /></LanguageProvider>));

describe("calculator projection range controls", () => {
  it("marks scenario chart as a simulation and slices the displayed years", () => {
    render(20);
    expect(container.textContent).toContain("סימולציה לפי ההנחות");
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toContain("0–20");
    const five = [...container.querySelectorAll("button")].find(button => button.textContent?.includes("5 שנים"));
    expect(five).toBeTruthy();
    act(() => five!.click());
    expect(five!.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toContain("15–20");
    const tableToggle = [...container.querySelectorAll("button")].find(button => button.textContent?.includes("הצג נתונים בטבלה"));
    expect(tableToggle).toBeTruthy();
    act(() => tableToggle!.click());
    expect(tableToggle!.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelectorAll("#projection-data-table tbody tr")).toHaveLength(6);
    expect(container.querySelector("#projection-data-table tbody tr")?.textContent).toContain("15");
  });
  it("does not offer impossible windows for a short simulation", () => {
    render(4);
    expect(container.querySelectorAll('[role="group"] button')).toHaveLength(0);
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toContain("0–4");
  });
});
