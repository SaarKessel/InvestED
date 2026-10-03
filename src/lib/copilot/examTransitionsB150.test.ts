import { describe, expect, it } from "vitest";
import { askNext, gradeAnswer, newExamState, REVIEW_AFTER } from "./examDesk";
import type { QuizQuestion } from "../quizBank";
const bank: QuizQuestion[] = Array.from({ length: 5 }, (_, i) => ({ id: `q${i}`, question: `Question text ${i}`, options: ["A", "B", "C"], correctIndex: i % 3, explanation: `Explanation ${i}` }));
const rows = bank.flatMap((q, index) => ["en", "he"].flatMap((lang) => [0, 1, 2].map((pick) => [index, lang as "en" | "he", pick, q] as const)));
describe("[sweep] B150 conversational exam grading preserves counters and missed identities", () => {
  it.each(rows)("index %s language %s pick %s", (index, lang, pick, q) => {
    const initial = { ...newExamState(), next: index, asked: 4, right: 2 };
    const asked = askNext(initial, bank, lang);
    expect(asked.state.current).toEqual(q);
    expect(asked.state.next).toBe(index + 1);
    expect(initial.current).toBeNull();
    const snapshot = JSON.stringify(asked.state);
    const result = gradeAnswer(asked.state, pick, lang);
    expect(result.state.current).toBeNull();
    expect(result.state.asked).toBe(5);
    expect(result.state.right).toBe(2 + Number(pick === q.correctIndex));
    expect(result.state.missed).toEqual(pick === q.correctIndex ? [] : [q.id]);
    expect(result.text).toContain(q.explanation);
    expect(result.text).toContain(lang === "en" ? `Score: ${result.state.right} of 5.` : `ניקוד: ${result.state.right} מתוך 5.`);
    expect(JSON.stringify(asked.state)).toBe(snapshot);
  });
});
describe("[hand] B150 missed-question review does not consume a fresh-bank position", () => {
  it("reviews after the configured fresh interval and clears a corrected mistake", () => {
    const state = { ...newExamState(["q0"]), next: 3, since: REVIEW_AFTER };
    const review = askNext(state, bank, "en");
    expect(review.state.current?.id).toBe("q0");
    expect(review.state.next).toBe(3);
    expect(review.state.since).toBe(0);
    expect(review.text).toContain("Back to one you missed");
    const corrected = gradeAnswer(review.state, 0, "en");
    expect(corrected.state.missed).toEqual([]);
    expect(askNext(corrected.state, bank, "en").state.current?.id).toBe("q3");
  });
});
