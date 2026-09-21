import { describe, it, expect } from "vitest";
import {
  createSimulation,
  valueSimulation,
  completeSimulation,
  abandonSimulation,
  sortLeaderboard,
  validateNickname,
  validateAllocations,
  SIMULATION_BUDGET,
  type SimulationQuote,
} from "./simulationEngine";

const NOW = Date.parse("2026-09-01T12:00:00.000Z");

function quote(price: number, overrides: Partial<SimulationQuote> = {}): SimulationQuote {
  return {
    symbol: "VOO",
    price,
    currency: "USD",
    dataSource: "yahoo_finance",
    timestamp: "2026-09-01T11:00:00.000Z",
    freshness: "current",
    isMock: false,
    ...overrides,
  };
}

const ALLOCATIONS = [
  { symbol: "VOO", name: "Vanguard S&P 500", weightPct: 60 },
  { symbol: "BND", name: "Vanguard Total Bond", weightPct: 40 },
];

const QUOTES = {
  VOO: quote(500, { symbol: "VOO" }),
  BND: quote(100, { symbol: "BND" }),
};

function startSimulation() {
  const result = createSimulation({
    nickname: "saar",
    windowDays: 7,
    allocations: ALLOCATIONS,
    quotes: QUOTES,
    now: NOW,
  });
  if ("error" in result) throw new Error(`unexpected error: ${result.error}`);
  return result.simulation;
}

describe("createSimulation", () => {
  it("locks positions, entry prices and fractional units from real quotes", () => {
    const sim = startSimulation();
    expect(sim.budget).toBe(SIMULATION_BUDGET);
    expect(sim.currency).toBe("USD");
    expect(sim.status).toBe("active");
    expect(sim.positions).toHaveLength(2);
    expect(sim.positions[0]).toMatchObject({ symbol: "VOO", weightPct: 60, entryPrice: 500, units: 12 });
    expect(sim.positions[1]).toMatchObject({ symbol: "BND", weightPct: 40, entryPrice: 100, units: 40 });
    expect(Date.parse(sim.endsAt) - Date.parse(sim.startedAt)).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("rejects simulated or unavailable quotes — a simulation never starts on fake data", () => {
    for (const bad of [
      { ...QUOTES, VOO: quote(500, { isMock: true }) },
      { ...QUOTES, VOO: quote(500, { freshness: "simulated" }) },
      { ...QUOTES, VOO: quote(500, { freshness: "unavailable" }) },
      { ...QUOTES, VOO: quote(0) },
      { ...QUOTES, VOO: null as unknown as SimulationQuote },
    ]) {
      const result = createSimulation({ nickname: "saar", windowDays: 7, allocations: ALLOCATIONS, quotes: bad, now: NOW });
      expect("error" in result ? result.error : null).toMatch(/quote/);
    }
  });

  it("rejects mixed currencies in one portfolio", () => {
    const result = createSimulation({
      nickname: "saar",
      windowDays: 7,
      allocations: ALLOCATIONS,
      quotes: { ...QUOTES, BND: quote(100, { symbol: "BND", currency: "ILS" }) },
      now: NOW,
    });
    expect(result).toEqual({ error: "mixed_currencies" });
  });

  it("rejects bad windows and bad allocations", () => {
    expect(createSimulation({ nickname: "saar", windowDays: 14, allocations: ALLOCATIONS, quotes: QUOTES, now: NOW })).toEqual({ error: "invalid_window" });
    expect(createSimulation({ nickname: "saar", windowDays: 7, allocations: [], quotes: QUOTES, now: NOW })).toEqual({ error: "no_positions" });
    expect(createSimulation({ nickname: "saar", windowDays: 7, allocations: [{ symbol: "VOO", name: "x", weightPct: 99 }], quotes: QUOTES, now: NOW })).toEqual({ error: "weights_must_sum_100" });
    expect(createSimulation({ nickname: "saar", windowDays: 7, allocations: [{ symbol: "VOO", name: "x", weightPct: 2 }, { symbol: "BND", name: "y", weightPct: 98 }], quotes: QUOTES, now: NOW })).toEqual({ error: "weight_out_of_range" });
    expect(createSimulation({ nickname: "saar", windowDays: 7, allocations: [{ symbol: "VOO", name: "x", weightPct: 50 }, { symbol: "VOO", name: "y", weightPct: 50 }], quotes: QUOTES, now: NOW })).toEqual({ error: "duplicate_symbol" });
  });
});

describe("validateNickname", () => {
  it("accepts normal nicknames in both languages", () => {
    expect(validateNickname("saar")).toBeNull();
    expect(validateNickname("סער כ")).toBeNull();
  });
  it("rejects empty, short, long, and contact-detail names (privacy boundary)", () => {
    expect(validateNickname("   ")).toBe("nickname_required");
    expect(validateNickname("a")).toBe("nickname_too_short");
    expect(validateNickname("a".repeat(21))).toBe("nickname_too_long");
    expect(validateNickname("me@example.com")).toBe("nickname_private_info");
    expect(validateNickname("call 0542503143")).toBe("nickname_private_info");
  });
});

describe("valueSimulation", () => {
  it("computes per-position and total returns", () => {
    const sim = startSimulation();
    const valuation = valueSimulation(sim, { VOO: quote(550, { symbol: "VOO" }), BND: quote(95, { symbol: "BND" }) }, NOW + 3 * 24 * 3600 * 1000);
    expect(valuation.allPricesAvailable).toBe(true);
    // VOO: 12u * 550 = 6600; BND: 40u * 95 = 3800 → 10400 → +4%
    expect(valuation.totalCurrentValue).toBe(10400);
    expect(valuation.totalReturnPct).toBeCloseTo(4, 6);
    expect(valuation.windowEnded).toBe(false);
    expect(valuation.elapsedPct).toBeCloseTo((3 / 7) * 100, 0);
  });

  it("reports partial availability honestly instead of guessing", () => {
    const sim = startSimulation();
    const valuation = valueSimulation(sim, { VOO: quote(550, { symbol: "VOO" }), BND: null }, NOW + 3 * 24 * 3600 * 1000);
    expect(valuation.allPricesAvailable).toBe(false);
    expect(valuation.totalCurrentValue).toBeNull();
    expect(valuation.totalReturnPct).toBeNull();
  });
});

describe("completeSimulation", () => {
  it("refuses to complete before the window ends (fair-return rule)", () => {
    const sim = startSimulation();
    const result = completeSimulation(sim, QUOTES, NOW + 3 * 24 * 3600 * 1000);
    expect(result).toEqual({ error: "window_not_ended" });
  });

  it("completes at window end with real final quotes and produces a leaderboard entry", () => {
    const sim = startSimulation();
    const finalQuotes = { VOO: quote(525, { symbol: "VOO" }), BND: quote(100, { symbol: "BND" }) };
    const result = completeSimulation(sim, finalQuotes, NOW + 7 * 24 * 3600 * 1000);
    if ("error" in result) throw new Error(`unexpected error: ${result.error}`);
    expect(result.simulation.status).toBe("completed");
    // VOO: 12*525=6300; BND: 40*100=4000 → 10300 → +3%
    expect(result.entry.returnPct).toBeCloseTo(3, 6);
    expect(result.entry.nickname).toBe("saar");
    expect(result.entry.windowDays).toBe(7);
  });

  it("refuses to complete when final quotes are unavailable", () => {
    const sim = startSimulation();
    const result = completeSimulation(sim, { VOO: null, BND: quote(100, { symbol: "BND" }) }, NOW + 8 * 24 * 3600 * 1000);
    expect(result).toEqual({ error: "quote_unavailable" });
  });
});

describe("abandonSimulation + leaderboard", () => {
  it("marks abandoned simulations that never rank", () => {
    const sim = abandonSimulation(startSimulation());
    expect(sim.status).toBe("abandoned");
  });

  it("sorts the leaderboard by return descending", () => {
    const entries = [
      { id: "a", nickname: "x", windowDays: 7 as const, startedAt: "", completedAt: "", returnPct: -2, finalValue: 9800, budget: 10000, currency: "USD" },
      { id: "b", nickname: "y", windowDays: 30 as const, startedAt: "", completedAt: "", returnPct: 5.5, finalValue: 10550, budget: 10000, currency: "USD" },
      { id: "c", nickname: "z", windowDays: 7 as const, startedAt: "", completedAt: "", returnPct: 1, finalValue: 10100, budget: 10000, currency: "USD" },
    ];
    expect(sortLeaderboard(entries).map((e) => e.id)).toEqual(["b", "c", "a"]);
  });
});
