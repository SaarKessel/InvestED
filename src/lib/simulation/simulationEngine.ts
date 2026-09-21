// ---------------------------------------------------------------------------
// InvestED — Educational Portfolio Simulation ("Capstone-style")
//
// Users construct a SIMULATED portfolio from the known-assets universe,
// lock entry prices from real market data for a fixed return window
// (7 or 30 days), and see how allocation decisions play out. A local
// leaderboard ranks completed windows by return.
//
// Boundaries (enforced here, not in the UI):
// - SIMULATED ONLY: no real money, no trading, no advice. Ever.
// - Anti-cheat: positions and entry prices are locked at start; the
//   engine exposes no edit path. The only way out before the window
//   ends is "abandon", which is excluded from the leaderboard.
// - Identity/privacy: a nickname only. Emails, phone numbers and empty
//   names are rejected. Nothing leaves the device.
// - Pricing: entry and valuation require REAL provider quotes (never
//   mock/simulated). Returns are computed in the quote's own currency;
//   mixing currencies in one portfolio is rejected.
// - Leaderboard: local-only (this device), completed windows only.
// ---------------------------------------------------------------------------

export const SIMULATION_BUDGET = 10_000;
export const SIMULATION_WINDOWS_DAYS = [7, 30] as const;
export type SimulationWindowDays = (typeof SIMULATION_WINDOWS_DAYS)[number];

export const MIN_WEIGHT_PCT = 5;
export const MAX_POSITIONS = 6;
export const WEIGHT_SUM_TOLERANCE = 0.01;

export interface SimulationQuote {
  symbol: string;
  price: number;
  currency: string;
  dataSource: string;
  timestamp: string | null;
  freshness: string;
  isMock: boolean;
}

export interface SimulationPosition {
  symbol: string;
  name: string;
  weightPct: number;
  currency: string;
  entryPrice: number;
  units: number;
  entryDataSource: string;
  entryTimestamp: string | null;
}

export type SimulationStatus = "active" | "completed" | "abandoned";

export interface PortfolioSimulation {
  id: string;
  nickname: string;
  budget: number;
  currency: string;
  windowDays: SimulationWindowDays;
  startedAt: string;
  endsAt: string;
  status: SimulationStatus;
  positions: SimulationPosition[];
  completedAt?: string;
  finalReturnPct?: number;
  finalValue?: number;
}

export interface PositionValuation {
  symbol: string;
  name: string;
  weightPct: number;
  entryPrice: number;
  currentPrice: number | null;
  units: number;
  entryValue: number;
  currentValue: number | null;
  returnPct: number | null;
  priceAvailable: boolean;
}

export interface SimulationValuation {
  budget: number;
  totalCurrentValue: number | null;
  totalReturnPct: number | null;
  allPricesAvailable: boolean;
  positions: PositionValuation[];
  windowEnded: boolean;
  elapsedPct: number;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  windowDays: SimulationWindowDays;
  startedAt: string;
  completedAt: string;
  returnPct: number;
  finalValue: number;
  budget: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type SimulationValidationError =
  | "nickname_required"
  | "nickname_too_short"
  | "nickname_too_long"
  | "nickname_private_info"
  | "no_positions"
  | "too_many_positions"
  | "weight_out_of_range"
  | "weights_must_sum_100"
  | "duplicate_symbol"
  | "quote_unavailable"
  | "quote_simulated"
  | "mixed_currencies"
  | "invalid_window";

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;
const NICKNAME_PRIVATE_RE = /@|https?:|www\.|\d{9,}/;

export function validateNickname(nickname: string): SimulationValidationError | null {
  const trimmed = nickname.trim();
  if (trimmed.length === 0) return "nickname_required";
  if (trimmed.length < NICKNAME_MIN) return "nickname_too_short";
  if (trimmed.length > NICKNAME_MAX) return "nickname_too_long";
  // Privacy boundary: nicknames must not smuggle contact details.
  if (NICKNAME_PRIVATE_RE.test(trimmed)) return "nickname_private_info";
  return null;
}

export interface AllocationInput {
  symbol: string;
  name: string;
  weightPct: number;
}

export function validateAllocations(allocations: AllocationInput[]): SimulationValidationError | null {
  if (allocations.length === 0) return "no_positions";
  if (allocations.length > MAX_POSITIONS) return "too_many_positions";
  const seen = new Set<string>();
  for (const allocation of allocations) {
    if (seen.has(allocation.symbol)) return "duplicate_symbol";
    seen.add(allocation.symbol);
    if (!Number.isFinite(allocation.weightPct) || allocation.weightPct < MIN_WEIGHT_PCT || allocation.weightPct > 100) {
      return "weight_out_of_range";
    }
  }
  const total = allocations.reduce((sum, allocation) => sum + allocation.weightPct, 0);
  if (Math.abs(total - 100) > WEIGHT_SUM_TOLERANCE) return "weights_must_sum_100";
  return null;
}

function validateWindow(windowDays: number): SimulationValidationError | null {
  return (SIMULATION_WINDOWS_DAYS as readonly number[]).includes(windowDays) ? null : "invalid_window";
}

/** A quote is usable only when it is real, priced and not simulated. */
export function isUsableQuote(quote: SimulationQuote | null | undefined): quote is SimulationQuote {
  return !!quote && !quote.isMock && quote.freshness !== "simulated" && quote.freshness !== "unavailable"
    && typeof quote.price === "number" && Number.isFinite(quote.price) && quote.price > 0
    && typeof quote.currency === "string" && quote.currency.length > 0;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function createSimulation(input: {
  nickname: string;
  windowDays: number;
  allocations: AllocationInput[];
  quotes: Record<string, SimulationQuote | null>;
  now?: number;
}): { simulation: PortfolioSimulation } | { error: SimulationValidationError } {
  const nicknameError = validateNickname(input.nickname);
  if (nicknameError) return { error: nicknameError };
  const windowError = validateWindow(input.windowDays);
  if (windowError) return { error: windowError };
  const allocationError = validateAllocations(input.allocations);
  if (allocationError) return { error: allocationError };

  const quotes = input.allocations.map((allocation) => input.quotes[allocation.symbol]);
  if (quotes.some((quote) => quote === null || quote === undefined)) return { error: "quote_unavailable" };
  if (quotes.some((quote) => !isUsableQuote(quote))) return { error: "quote_simulated" };
  const usable = quotes as SimulationQuote[];
  const currencies = new Set(usable.map((quote) => quote.currency));
  if (currencies.size > 1) return { error: "mixed_currencies" };

  const now = input.now ?? Date.now();
  const currency = usable[0].currency;
  const positions: SimulationPosition[] = input.allocations.map((allocation, index) => {
    const quote = usable[index];
    const entryValue = (SIMULATION_BUDGET * allocation.weightPct) / 100;
    return {
      symbol: allocation.symbol,
      name: allocation.name,
      weightPct: allocation.weightPct,
      currency: quote.currency,
      entryPrice: quote.price,
      units: entryValue / quote.price,
      entryDataSource: quote.dataSource,
      entryTimestamp: quote.timestamp,
    };
  });

  return {
    simulation: {
      id: `sim-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      nickname: input.nickname.trim(),
      budget: SIMULATION_BUDGET,
      currency,
      windowDays: input.windowDays as SimulationWindowDays,
      startedAt: new Date(now).toISOString(),
      endsAt: new Date(now + (input.windowDays as number) * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      positions,
    },
  };
}

export function valueSimulation(
  simulation: PortfolioSimulation,
  currentQuotes: Record<string, SimulationQuote | null>,
  now?: number
): SimulationValuation {
  const nowMs = now ?? Date.now();
  const startedMs = Date.parse(simulation.startedAt);
  const endsMs = Date.parse(simulation.endsAt);

  const positions: PositionValuation[] = simulation.positions.map((position) => {
    const quote = currentQuotes[position.symbol];
    const usable = isUsableQuote(quote) && quote.currency === position.currency;
    const entryValue = position.units * position.entryPrice;
    if (!usable) {
      return {
        symbol: position.symbol,
        name: position.name,
        weightPct: position.weightPct,
        entryPrice: position.entryPrice,
        currentPrice: null,
        units: position.units,
        entryValue,
        currentValue: null,
        returnPct: null,
        priceAvailable: false,
      };
    }
    const currentValue = position.units * quote.price;
    return {
      symbol: position.symbol,
      name: position.name,
      weightPct: position.weightPct,
      entryPrice: position.entryPrice,
      currentPrice: quote.price,
      units: position.units,
      entryValue,
      currentValue,
      returnPct: ((quote.price - position.entryPrice) / position.entryPrice) * 100,
      priceAvailable: true,
    };
  });

  const allPricesAvailable = positions.every((position) => position.priceAvailable);
  const totalCurrentValue = allPricesAvailable
    ? positions.reduce((sum, position) => sum + (position.currentValue ?? 0), 0)
    : null;
  const totalReturnPct =
    totalCurrentValue !== null ? ((totalCurrentValue - simulation.budget) / simulation.budget) * 100 : null;

  return {
    budget: simulation.budget,
    totalCurrentValue,
    totalReturnPct,
    allPricesAvailable,
    positions,
    windowEnded: nowMs >= endsMs,
    elapsedPct: Math.max(0, Math.min(100, ((nowMs - startedMs) / (endsMs - startedMs)) * 100)),
  };
}

/**
 * Completes a simulation whose window has ended, using the final quotes.
 * Returns the completed simulation plus its leaderboard entry. A window
 * that has NOT ended cannot be completed (fair-return rule).
 */
export function completeSimulation(
  simulation: PortfolioSimulation,
  finalQuotes: Record<string, SimulationQuote | null>,
  now?: number
): { simulation: PortfolioSimulation; entry: LeaderboardEntry } | { error: "window_not_ended" | "quote_unavailable" } {
  const nowMs = now ?? Date.now();
  if (simulation.status !== "active" || nowMs < Date.parse(simulation.endsAt)) {
    return { error: "window_not_ended" };
  }
  const valuation = valueSimulation(simulation, finalQuotes, nowMs);
  if (!valuation.allPricesAvailable || valuation.totalCurrentValue === null || valuation.totalReturnPct === null) {
    return { error: "quote_unavailable" };
  }
  const completedAt = new Date(nowMs).toISOString();
  const completed: PortfolioSimulation = {
    ...simulation,
    status: "completed",
    completedAt,
    finalReturnPct: valuation.totalReturnPct,
    finalValue: valuation.totalCurrentValue,
  };
  return {
    simulation: completed,
    entry: {
      id: simulation.id,
      nickname: simulation.nickname,
      windowDays: simulation.windowDays,
      startedAt: simulation.startedAt,
      completedAt,
      returnPct: valuation.totalReturnPct,
      finalValue: valuation.totalCurrentValue,
      budget: simulation.budget,
      currency: simulation.currency,
    },
  };
}

/** Abandoning is the only early exit — and it never reaches the leaderboard. */
export function abandonSimulation(simulation: PortfolioSimulation): PortfolioSimulation {
  return { ...simulation, status: "abandoned" };
}

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.returnPct - a.returnPct);
}
