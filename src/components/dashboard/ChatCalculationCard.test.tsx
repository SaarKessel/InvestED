// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ChatCalculationCard } from "./ChatCalculationCard";
import type { Projection } from "@/types";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function projection(): Projection {
  return {
    totalContributed: 60000,
    growth: 23118,
    finalBalance: 83118,
    realValueAfterInflation: 70250,
    currency: "ILS",
    series: Array.from({ length: 10 }, (_, index) => ({ year: index + 1, contributed: 6000 * (index + 1), balance: 6000 * (index + 1), currency: "ILS" })),
  };
}

describe("chat calculation card", () => {
  it("renders the engine projection with years and all totals", () => {
    act(() => root.render(<LanguageProvider><ChatCalculationCard projection={projection()} /></LanguageProvider>));
    expect(container.textContent).toContain("הערכה לימודית");
    expect(container.textContent).toContain("10");
    expect(container.textContent).toContain("60,000 ILS");
    expect(container.textContent).toContain("83,118 ILS");
    expect(container.textContent).toContain("70,250 ILS");
  });

  it("always carries the not-a-forecast disclaimer", () => {
    act(() => root.render(<LanguageProvider><ChatCalculationCard projection={projection()} /></LanguageProvider>));
    expect(container.textContent).toContain("לא תחזית");
  });
});
