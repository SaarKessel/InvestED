import { describe, expect, it, vi } from "vitest";

import { benchmarkFor, loadStrategyPerformance, type HistoryAsset } from "./strategyPerformance";
import { getStrategy } from "../strategy/strategyEngine";
import { STRATEGY_UNIVERSE } from "../strategy/strategyUniverse";

function weekly(n: number, growth: number): HistoryAsset {
  const d = new Date("2018-01-01T00:00:00Z");
  const history = Array.from({ length: n }, (_, i) => {
    const close = 100 * growth ** i * (i % 5 === 0 ? 0.98 : 1);
    const date = new Date(d.getTime() + i * 7 * 86_400_000).toISOString().slice(0, 10);
    return { date, open: close, high: close, low: close, close, price: close };
  });
  return { history, dataSource: "yahoo_finance", isMock: false };
}

const strategyId = STRATEGY_UNIVERSE[0].id;

describe("loadStrategyPerformance", () => {
  it("computes metrics from real history and a benchmark", async () => {
    const fetchAsset = vi.fn(async (symbol: string) => weekly(300, symbol === "SPY" ? 1.002 : 1.003));
    const result = await loadStrategyPerformance(strategyId, fetchAsset);
    expect(result.status).toBe("computed");
    if (result.status !== "computed") return;
    const symbol = getStrategy(strategyId)!.exampleAssets[0];
    expect(result.value.symbol).toBe(symbol);
    expect(result.value.benchmarkSymbol).toBe(benchmarkFor(symbol));
    expect(result.value.performance.status).toBe("computed");
    expect(result.value.trainTest.status).toBe("computed");
    expect(fetchAsset).toHaveBeenCalledWith(symbol, "10y");
  });

  it("treats simulated history as unavailable", async () => {
    const result = await loadStrategyPerformance(strategyId, async () => ({ ...weekly(300, 1.002), isMock: true, dataSource: "mock" }));
    expect(result).toMatchObject({ status: "unavailable" });
  });

  it("treats a failed fetch as unavailable", async () => {
    const result = await loadStrategyPerformance(strategyId, async () => {
      throw new Error("offline");
    });
    expect(result.status).toBe("unavailable");
  });

  it("still returns asset metrics with the benchmark labeled unavailable when only the benchmark is missing", async () => {
    const symbol = getStrategy(strategyId)!.exampleAssets[0];
    const result = await loadStrategyPerformance(strategyId, async (s) => (s === symbol ? weekly(300, 1.002) : null));
    expect(result.status).toBe("computed");
    if (result.status !== "computed" || result.value.performance.status !== "computed") throw new Error("expected computed");
    expect(result.value.performance.value.benchmark.status).toBe("unavailable");
  });

  it("unknown strategy is unavailable", async () => {
    expect((await loadStrategyPerformance("nope", async () => null)).status).toBe("unavailable");
  });

  it("uses VOO as the benchmark for SPY", () => {
    expect(benchmarkFor("SPY")).toBe("VOO");
    expect(benchmarkFor("VTI")).toBe("SPY");
  });
});
