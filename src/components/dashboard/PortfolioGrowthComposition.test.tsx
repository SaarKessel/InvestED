// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import type { Projection } from "@/types";
import { PortfolioGrowthComposition } from "./PortfolioGrowthComposition";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(finalBalance: number, totalContributed: number, growth: number) {
  const projection: Projection = { finalBalance, totalContributed, growth, realValueAfterInflation: finalBalance, series: [], currency: "ILS" };
  act(() => root.render(<LanguageProvider><PortfolioGrowthComposition projection={projection} currency="ILS" /></LanguageProvider>));
}
describe("dashboard scenario composition", () => {
  it("visualizes only computed contribution and positive-growth amounts", () => {
    render(200, 120, 80);
    const graphic = container.querySelector('[role="img"]');
    expect(graphic?.getAttribute("aria-label")).toContain("120");
    expect(graphic?.getAttribute("aria-label")).toContain("80");
    expect((graphic?.firstElementChild as HTMLElement).style.width).toBe("60%");
    expect(container.textContent).toContain("הנחות התרחיש");
  });
  it("does not show a false positive split when simulated value falls", () => {
    render(80, 120, -40);
    expect(container.querySelector('[role="img"]')).toBeNull();
    expect(container.textContent).toContain("אין חלוקה חיובית מטעה");
  });
});
