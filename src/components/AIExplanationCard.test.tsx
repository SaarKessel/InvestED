// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { AIExplanationCard } from "./AIExplanationCard";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(confidence: number) {
  act(() => root.render(<LanguageProvider><AIExplanationCard initialInvestment={10000} monthlyContribution={100} years={10} annualReturnPct={5} assetLabel="Index" confidence={confidence} /></LanguageProvider>));
}
describe("calculator confidence meter", () => {
  it("exposes and bounds the displayed confidence for assistive technology", () => {
    render(125);
    const meter = container.querySelector('[role="progressbar"]')!;
    expect(meter.getAttribute("aria-valuenow")).toBe("100");
    expect(meter.getAttribute("aria-label")).toBeTruthy();
    expect((meter.firstElementChild as HTMLElement).style.width).toBe("100%");
    render(-5);
    expect(meter.getAttribute("aria-valuenow")).toBe("0");
    expect((meter.firstElementChild as HTMLElement).style.width).toBe("0%");
  });
});
