// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/languageContext";
import { ChatAssetCards } from "./ChatAssetCards";
import type { AssetAnalysis } from "@/types";
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function asset(overrides: Partial<AssetAnalysis> = {}): AssetAnalysis {
  return {
    symbol: "VOO",
    price: 705.86,
    changePercent: -0.25,
    volatilityPct: 0.69,
    rsi: 58.2,
    dataSource: "yahoo",
    timestamp: "2026-09-30T15:44:00Z",
    ...overrides,
  } as AssetAnalysis;
}

describe("chat asset quote cards", () => {
  it("renders symbol, price, change and provenance", () => {
    act(() => root.render(<LanguageProvider><ChatAssetCards assets={[asset()]} /></LanguageProvider>));
    expect(container.textContent).toContain("VOO");
    expect(container.textContent).toContain("705.86");
    expect(container.textContent).toContain("-0.25%");
    expect(container.textContent).toContain("yahoo");
  });

  it("labels simulated data", () => {
    act(() => root.render(<LanguageProvider><ChatAssetCards assets={[asset({ isMock: true })]} /></LanguageProvider>));
    expect(container.textContent).toContain("נתונים מדומים");
  });

  it("renders nothing for an empty set", () => {
    act(() => root.render(<LanguageProvider><ChatAssetCards assets={[]} /></LanguageProvider>));
    expect(container.firstChild).toBeNull();
  });
});
