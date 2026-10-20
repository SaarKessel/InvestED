// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getCurrentSimulation, saveCurrentSimulation, clearCurrentSimulation, getLeaderboard, addLeaderboardEntry } from "./simulationStorage";
import type { LeaderboardEntry, PortfolioSimulation } from "./simulationEngine";

const sim = { id: "s1" } as unknown as PortfolioSimulation;
const entry = (id: string, score = 10) => ({ id, score }) as unknown as LeaderboardEntry;

beforeEach(() => window.localStorage.clear());

describe("current simulation storage", () => {
  it("round-trips a saved simulation", () => {
    expect(getCurrentSimulation()).toBeNull();
    saveCurrentSimulation(sim);
    expect(getCurrentSimulation()?.id).toBe("s1");
    clearCurrentSimulation();
    expect(getCurrentSimulation()).toBeNull();
  });
  it("returns null for corrupted or shapeless payloads", () => {
    window.localStorage.setItem("invested_simulation_current", "{not json");
    expect(getCurrentSimulation()).toBeNull();
    window.localStorage.setItem("invested_simulation_current", '{"nope":1}');
    expect(getCurrentSimulation()).toBeNull();
  });
});
describe("leaderboard storage", () => {
  it("starts empty and rejects corrupted payloads", () => {
    expect(getLeaderboard()).toEqual([]);
    window.localStorage.setItem("invested_simulation_leaderboard", "{oops");
    expect(getLeaderboard()).toEqual([]);
    window.localStorage.setItem("invested_simulation_leaderboard", '{"a":1}');
    expect(getLeaderboard()).toEqual([]);
  });
  it("adds entries and replaces the same simulation id", () => {
    expect(addLeaderboardEntry(entry("s1", 10))).toHaveLength(1);
    expect(addLeaderboardEntry(entry("s2", 20))).toHaveLength(2);
    const replaced = addLeaderboardEntry(entry("s1", 99));
    expect(replaced).toHaveLength(2);
    expect(replaced.find((e) => e.id === "s1")?.score).toBe(99);
    expect(getLeaderboard()).toHaveLength(2);
  });
});
