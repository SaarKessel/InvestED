// ---------------------------------------------------------------------------
// InvestED — Simulation persistence (localStorage, this device only)
//
// The leaderboard is LOCAL. Remote identity/backend does not exist in the
// product, so a multi-user leaderboard would be fabricated — the UI labels
// the local scope explicitly instead.
// ---------------------------------------------------------------------------

import type { LeaderboardEntry, PortfolioSimulation } from "./simulationEngine";

const CURRENT_KEY = "invested_simulation_current";
const LEADERBOARD_KEY = "invested_simulation_leaderboard";

export function getCurrentSimulation(): PortfolioSimulation | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CURRENT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PortfolioSimulation;
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCurrentSimulation(simulation: PortfolioSimulation): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_KEY, JSON.stringify(simulation));
}

export function clearCurrentSimulation(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_KEY);
}

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Adds an entry (replacing any prior entry for the same simulation id). */
export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const entries = getLeaderboard().filter((item) => item.id !== entry.id);
  entries.push(entry);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  }
  return entries;
}
