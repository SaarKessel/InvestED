import { describe, expect, it, beforeEach } from "vitest";

/** @vitest-environment jsdom */

import {
  getQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
} from "./quizProgressStorage";

describe("quiz progress storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores the latest quiz score and completion state", () => {
    saveQuizProgress({
      completed: true,
      score: 4,
      total: 5,
      finishedAt: "2026-08-03T11:00:00.000Z",
    });

    expect(getQuizProgress()).toEqual({
      completed: true,
      score: 4,
      total: 5,
      finishedAt: "2026-08-03T11:00:00.000Z",
    });
  });

  it("clears persisted quiz progress", () => {
    saveQuizProgress({
      completed: true,
      score: 3,
      total: 5,
      finishedAt: "2026-08-03T11:00:00.000Z",
    });

    clearQuizProgress();

    expect(getQuizProgress()).toBeNull();
  });
});
