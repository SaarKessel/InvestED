// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBestQuizScore, recordQuizScore, getQuizProgress, saveQuizProgress, clearQuizProgress } from "./quizProgressStorage";
afterEach(() => { localStorage.clear(); vi.useRealTimers(); });
const rows = [5, 10, 25].flatMap((count) => [0, 1, Math.floor(count / 2), count].flatMap((first) => [0, 1, count].map((next) => [count, first, next] as const)));
describe("[sweep] B149 quiz best-score records only strictly better attempts", () => {
  it.each(rows)("count %s first score %s next score %s", (count, first, next) => {
    localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-03T12:00:00Z"));
    const original = recordQuizScore(count, first);
    expect(original).toEqual({ score: first, total: count, finishedAt: "2026-10-03T12:00:00.000Z" });
    vi.setSystemTime(new Date("2026-10-03T13:00:00Z"));
    const updated = recordQuizScore(count, next);
    expect(updated).toEqual(next > first ? { score: next, total: count, finishedAt: "2026-10-03T13:00:00.000Z" } : original);
    expect(getBestQuizScore(count)).toEqual(updated);
    expect(getBestQuizScore(count + 100)).toBeNull();
    expect(original.score).toBe(first);
  });
});
describe("[hand] B149 progress and best-score stores remain independent", () => {
  it("clearing current progress does not erase a best score", () => {
    localStorage.clear();
    recordQuizScore(5, 4);
    saveQuizProgress({ completed: true, score: 3, total: 5 });
    expect(getQuizProgress()?.score).toBe(3);
    expect(getBestQuizScore(5)?.score).toBe(4);
    clearQuizProgress();
    expect(getQuizProgress()).toBeNull();
    expect(getBestQuizScore(5)?.score).toBe(4);
  });
  it("corrupt best-score JSON starts a fresh record", () => {
    localStorage.setItem("invested_quiz_best_scores", "{bad");
    expect(getBestQuizScore(5)).toBeNull();
    expect(recordQuizScore(5, 2).score).toBe(2);
  });
});
