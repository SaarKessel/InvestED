import { describe, expect, it, vi } from "vitest";
import { isHistoryRange } from "@/lib/market/providers/types";
import { createYahooFinanceProvider } from "@/lib/market/providers/yahooFinance";
import type { FetchLike } from "@/lib/market/providers/types";
import { runOutOfSample, MIN_TOTAL_DAYS } from "@/lib/portfolio/outOfSample";

const fetchMock = vi.fn();
vi.mock("@/lib/marketData", () => ({ fetchMarketAssetBySymbol: (...a: unknown[]) => fetchMock(...a) }));

function series(n: number, seed: number, stepDays = 1) {
  let s = seed, p = 100; const out: { date: string; close: number }[] = []; const d = new Date("2021-01-01T00:00:00Z");
  for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) % 4294967296; p *= 1 + 0.0004 + (s / 4294967296 - 0.5) * 0.02; out.push({ date: d.toISOString().slice(0, 10), close: p }); d.setUTCDate(d.getUTCDate() + stepDays); }
  return out;
}

describe("out-of-sample history range", () => {
  it("the chat loader asks for DAILY history (5y), not the monthly 10y series", async () => {
    const { defaultLoader } = await import("./oosDesk");
    fetchMock.mockResolvedValue(null);
    await defaultLoader("AAPL");
    expect(fetchMock).toHaveBeenCalledWith("AAPL", "5y", undefined, { allowSimulated: false });
  });
  it("5y is an accepted range and Yahoo is asked for daily bars", async () => {
    expect(isHistoryRange("5y")).toBe(true);
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => { urls.push(url); return { ok: true, status: 200, json: async () => ({ chart: { result: [{ meta: {}, timestamp: [], indicators: { quote: [{}] } }] } }) }; }) as unknown as FetchLike;
    await createYahooFinanceProvider({ fetchImpl }).getHistory("SPY", "5y").catch(() => undefined);
    expect(urls[0]).toContain("range=5y&interval=1d");
  });
  it("about 1,250 daily bars clear the minimums; about 121 monthly bars still do not (never faked)", () => {
    const sym = ["AAA", "BBB"];
    const daily = runOutOfSample(sym, [series(1255, 1), series(1255, 2)], series(1255, 3));
    expect(daily.ok).toBe(true);
    if (daily.ok) { expect(daily.result.testDays).toBeGreaterThanOrEqual(100); expect(daily.result.trainDays + daily.result.testDays).toBeGreaterThanOrEqual(MIN_TOTAL_DAYS); }
    const monthly = runOutOfSample(sym, [series(121, 1, 30), series(121, 2, 30)], series(121, 3, 30));
    expect(monthly).toEqual({ ok: false, reason: "too_little_history" });
  });
});
