import { describe, expect, it, beforeEach } from "vitest";

/** @vitest-environment jsdom */

import {
  getLearningProgress,
  saveLearningProgress,
  clearLearningProgress,
} from "./learningProgressStorage";

describe("learning progress storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores completed roadmap stage ids", () => {
    saveLearningProgress(["שלב 1", "שלב 2"]);

    expect(getLearningProgress()).toEqual(["שלב 1", "שלב 2"]);
  });

  it("clears stored roadmap progress", () => {
    saveLearningProgress(["שלב 1"]);
    clearLearningProgress();

    expect(getLearningProgress()).toEqual([]);
  });
});
