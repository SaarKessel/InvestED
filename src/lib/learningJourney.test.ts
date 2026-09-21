// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY_LEARNING_JOURNEY, journeyProgress, nextJourneyStep, readLearningJourney, saveLearningJourney } from "./learningJourney";

describe("learning journey", () => {
  beforeEach(() => localStorage.clear());
  it("starts safely with no diagnosis", () => {
    expect(readLearningJourney()).toEqual(EMPTY_LEARNING_JOURNEY);
    expect(nextJourneyStep(EMPTY_LEARNING_JOURNEY)).toBe("diagnostic");
    expect(journeyProgress(EMPTY_LEARNING_JOURNEY)).toBe(0);
  });
  it("persists a local journey and computes progress", () => {
    const state = { diagnostic: { level: "foundation" as const, goal: "confidence" as const, minutesPerWeek: 30 as const, completedAt: "2026-01-01" }, completedSteps: ["lesson" as const, "practice" as const], reflection: "Diversification reduces concentration risk.", updatedAt: "" };
    saveLearningJourney(state);
    expect(readLearningJourney().reflection).toContain("Diversification");
    expect(journeyProgress(state)).toBe(60);
    expect(nextJourneyStep(state)).toBe("simulation");
  });
  it("treats malformed storage as empty", () => {
    localStorage.setItem("invested_learning_journey_v1", "not json");
    expect(readLearningJourney()).toEqual(EMPTY_LEARNING_JOURNEY);
  });
});
