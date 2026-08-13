import { describe, expect, it, beforeEach } from "vitest";

/** @vitest-environment jsdom */

import {
  appendAnalysisHistory,
  getAnalysisHistory,
  clearAnalysisHistory,
} from "./analysisHistoryStorage";

describe("analysis history storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores a new analysis snapshot and keeps the newest items first", () => {
    appendAnalysisHistory({
      profileText: "first",
      savedAt: "2026-08-03T10:00:00.000Z",
    });

    appendAnalysisHistory({
      profileText: "second",
      savedAt: "2026-08-03T11:00:00.000Z",
    });

    const history = getAnalysisHistory();

    expect(history).toHaveLength(2);
    expect(history[0]?.profileText).toBe("second");
    expect(history[1]?.profileText).toBe("first");
  });

  it("clears all persisted history", () => {
    appendAnalysisHistory({
      profileText: "first",
      savedAt: "2026-08-03T10:00:00.000Z",
    });

    clearAnalysisHistory();

    expect(getAnalysisHistory()).toHaveLength(0);
  });
});
