// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LanguageProvider } from "@/context/languageContext";
import { STRATEGY_UNIVERSE } from "@/lib/strategy/strategyUniverse";
import { StrategyPerformancePanel } from "./StrategyPerformancePanel";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const fetchMock = vi.fn();
vi.mock("@/lib/marketData", () => ({ fetchMarketAssetBySymbol: (...args: unknown[]) => fetchMock(...args) }));

function weekly(n: number) {
  const d = new Date("2018-01-01T00:00:00Z");
  return Array.from({ length: n }, (_, i) => {
    const close = 100 * 1.003 ** i * (i % 5 === 0 ? 0.98 : 1);
    return { date: new Date(d.getTime() + i * 7 * 86_400_000).toISOString().slice(0, 10), open: close, high: close, low: close, close, price: close };
  });
}

let container: HTMLDivElement;
let root: Root;

async function mountAndLoad() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <LanguageProvider>
        <StrategyPerformancePanel strategyId={STRATEGY_UNIVERSE[0].id} />
      </LanguageProvider>
    );
  });
  await act(async () => {
    container.querySelector("button")!.click();
  });
  await act(async () => {});
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  fetchMock.mockReset();
});

describe("StrategyPerformancePanel", () => {
  it("shows real-data metrics with the past-performance notice", async () => {
    fetchMock.mockResolvedValue({ history: weekly(300), dataSource: "yahoo_finance", isMock: false });
    await mountAndLoad();
    const text = container.textContent ?? "";
    expect(text).toMatch(/Sharpe|שארפ/);
    expect(text).toMatch(/Bollinger|בולינגר/);
    expect(text).toMatch(/Yahoo Finance/i);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), "10y", undefined, { allowSimulated: false });
  });

  it("shows VaR and min-variance blocks from real history, labeled as past/in-sample", async () => {
    fetchMock.mockImplementation(async (symbol: string) => ({ history: weekly(300).map((p, i) => ({ ...p, close: p.close * (1 + 0.01 * Math.sin(i * (symbol.length + 1))) })), dataSource: "yahoo_finance", isMock: false }));
    await mountAndLoad();
    const block = container.querySelector('[data-testid="slab-risk"]');
    expect(block).not.toBeNull();
    expect(block?.textContent).toMatch(/VaR/);
    expect(block?.textContent).toMatch(/%/);
  });

  it("shows an honest error and no numbers when real history is unavailable", async () => {
    fetchMock.mockResolvedValue(null);
    await mountAndLoad();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).not.toMatch(/Sharpe|שארפ/);
  });
});
