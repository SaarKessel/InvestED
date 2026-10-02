// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LanguageProvider } from "@/context/languageContext";
import { RuleBuilderPanel } from "./RuleBuilderPanel";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
const fetchMock = vi.fn();
vi.mock("@/lib/marketData", () => ({ fetchMarketAssetBySymbol: (...a: unknown[]) => fetchMock(...a) }));

function days(n: number) {
  const d = new Date("2020-01-01T00:00:00Z");
  return Array.from({ length: n }, (_, i) => {
    const close = 100 + Math.sin(i / 4) * 12;
    return { date: new Date(d.getTime() + i * 86_400_000).toISOString().slice(0, 10), open: close, high: close, low: close, close, price: close };
  });
}

let container: HTMLDivElement;
let root: Root;
async function run() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(<LanguageProvider><RuleBuilderPanel /></LanguageProvider>); });
  await act(async () => { [...container.querySelectorAll("button")].find((b) => b.textContent)!.click(); });
  await act(async () => {});
}
afterEach(() => { act(() => root.unmount()); container.remove(); fetchMock.mockReset(); });

describe("RuleBuilderPanel", () => {
  it("shows explained rules, signal counts and the disclaimer from real history", async () => {
    fetchMock.mockResolvedValue({ history: days(200), dataSource: "yahoo_finance", isMock: false });
    await run();
    expect(fetchMock).toHaveBeenCalledWith("SPY", "5y", undefined, { allowSimulated: false });
    expect(container.textContent).toContain("אותות כניסה");
    expect(container.textContent).toContain("RSI(14)");
    expect(container.textContent).toContain("כרטיס דוח בדיקה היסטורית");
    expect(container.textContent).toContain("למה האסטרטגיה שלי הפסידה");
    expect(container.textContent).toContain("לא ייעוץ");
    expect(container.textContent).not.toContain("yahoo_finance");
    expect(container.textContent).toContain("Yahoo Finance");
    expect(container.textContent).toContain("מדד שארפ");
    expect(container.textContent).toContain(" עד ");
    expect(container.textContent).not.toContain(" to ");
  });
  it("refuses simulated history and shows unavailable instead", async () => {
    fetchMock.mockResolvedValue({ history: days(200), dataSource: "mock", isMock: true });
    await run();
    expect(container.textContent).toContain("לא זמינה");
    expect(container.textContent).not.toContain("אותות כניסה");
  });
});

describe("RuleBuilderPanel bundle 3", () => {
  it("shows the out-of-sample check and paper trading, and saves a paper run on this device", async () => {
    localStorage.clear();
    fetchMock.mockResolvedValue({ history: days(300), dataSource: "yahoo_finance", isMock: false });
    await run();
    expect(container.textContent).toContain("בדיקה מחוץ למדגם");
    expect(container.textContent).toContain("מסחר על הנייר");
    const start = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("התחילו מסחר על הנייר"))!;
    await act(async () => { start.click(); });
    expect(JSON.parse(localStorage.getItem("invested_algo_paper_v1")!)).toHaveLength(1);
    expect(container.textContent).toContain("SPY");
    const check = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("בדיקה"))!;
    await act(async () => { check.click(); });
    expect(fetchMock).toHaveBeenLastCalledWith("SPY", "5y", undefined, { allowSimulated: false });
  });
});
