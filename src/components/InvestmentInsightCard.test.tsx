// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { InvestmentInsightCard } from "./InvestmentInsightCard";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(finalBalance: number, totalContributed: number, growth: number) {
  act(() => root.render(<LanguageProvider><InvestmentInsightCard finalBalance={finalBalance} totalContributed={totalContributed} growth={growth} years={15} assetLabel="Example" annualReturnPct={7} monthlyContribution={100} currency="ILS" /></LanguageProvider>));
}
describe("calculator contribution and growth breakdown", () => {
  it("draws only a grounded positive-value split with accessible monetary amounts", () => {
    render(200, 120, 80);
    const chart = container.querySelector('[role="img"]');
    expect(chart?.getAttribute("aria-label")).toContain("120");
    expect(chart?.getAttribute("aria-label")).toContain("80");
    expect((chart?.firstElementChild as HTMLElement).style.width).toBe("60%");
  });
  it("does not depict losses as a positive slice of final value", () => {
    render(80, 120, -40);
    expect(container.querySelector('[role="img"]')).toBeNull();
  });
});
