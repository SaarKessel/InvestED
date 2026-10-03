import { describe, expect, it } from "vitest";
import { askNext, gradeAnswer, newExamState, REVIEW_AFTER } from "./examDesk";
import type { QuizQuestion } from "../quizBank";

const bank: QuizQuestion[] = Array.from({ length: 4 }, (_, i) => ({ id: `B120-${i}`, question: `Question ${i}`, options: ["Alpha", "Beta", "Gamma"], correctIndex: i % 3, explanation: `Explanation ${i}`, topic: "basics" })) as QuizQuestion[];
const rows: Array<[number, "en" | "he"]> = Array.from({ length: 64 }, (_, i) => i).flatMap((mask) => (["en", "he"] as const).map((lang): [number, "en" | "he"] => [mask, lang]));

describe("[sweep] B120 conversational exam state model", () => {
  it.each(rows)("outcome mask %s language %s", (mask, lang) => {
    let state = newExamState();
    let next = 0; let since = 0; let right = 0;
    let missed: string[] = [];
    for (let turn = 0; turn < 6; turn++) {
      const before = JSON.stringify(state);
      const due = since >= REVIEW_AFTER ? bank.find((q) => missed.includes(q.id)) : undefined;
      const expected = due ?? bank[next % bank.length];
      const asked = askNext(state, bank, lang);
      expect(JSON.stringify(state)).toBe(before);
      expect(asked.state.current).toBe(expected);
      expect(asked.text).toContain(expected.question);
      for (const [index, option] of expected.options.entries()) expect(asked.text).toContain(`${index + 1}. ${option}`);
      if (due) since = 0; else { next++; since++; }
      expect(asked.state.next).toBe(next); expect(asked.state.since).toBe(since);
      const correct = Boolean(mask & (1 << turn));
      const pick = correct ? expected.correctIndex : (expected.correctIndex + 1) % 3;
      const graded = gradeAnswer(asked.state, pick, lang);
      if (correct) { right++; missed = missed.filter((id) => id !== expected.id); }
      else if (!missed.includes(expected.id)) missed.push(expected.id);
      expect(graded.state.asked).toBe(turn + 1);
      expect(graded.state.right).toBe(right);
      expect(graded.state.current).toBeNull();
      expect(graded.state.missed).toEqual(missed);
      expect(graded.text).toContain(expected.explanation);
      expect(graded.text).toContain(lang === "en" ? `Score: ${right} of ${turn + 1}.` : `ניקוד: ${right} מתוך ${turn + 1}.`);
      state = graded.state;
    }
  });
});

describe("[hand] B120 missed-question review", () => {
  it("a correct review clears the missed id without consuming a fresh question", () => {
    const start = { ...newExamState([bank[0].id]), since: REVIEW_AFTER, next: 3 };
    const review = askNext(start, bank, "en");
    expect(review.text).toContain("Back to one you missed.");
    expect(review.state.next).toBe(3);
    const graded = gradeAnswer(review.state, bank[0].correctIndex, "en");
    expect(graded.state.missed).toEqual([]);
    expect(askNext(graded.state, bank, "en").state.current).toBe(bank[3]);
  });
});
