import { describe, expect, it } from "vitest";
import { askNext, gradeAnswer, isExamStart, newExamState, parseExamAnswer } from "./examDesk";
import type { QuizQuestion } from "../quizBank";

const bank: QuizQuestion[] = [
  { id: "a", question: "Q1?", options: ["x", "y", "z"], correctIndex: 1, explanation: "because y" },
  { id: "b", question: "Q2?", options: ["x", "y", "z"], correctIndex: 2, explanation: "because z" },
];
describe("exam desk", () => {
  it("recognises start phrases in both languages and ignores questions", () => {
    expect(isExamStart("quiz me")).toBe(true);
    expect(isExamStart("בחן אותי")).toBe(true);
    expect(isExamStart("what is a quiz")).toBe(false);
  });
  it("parses only valid option numbers", () => {
    expect(parseExamAnswer("2", 3)).toBe(1);
    expect(parseExamAnswer("answer 3", 3)).toBe(2);
    expect(parseExamAnswer("4", 3)).toBeNull();
    expect(parseExamAnswer("what is 2", 3)).toBeNull();
  });
  it("asks, grades, keeps score and moves on", () => {
    const a = askNext(newExamState(), bank, "en");
    expect(a.text).toContain("Question 1: Q1?");
    const g = gradeAnswer(a.state, 1, "en");
    expect(g.text).toContain("Correct.");
    expect(g.text).toContain("Score: 1 of 1.");
    const b = askNext(g.state, bank, "en");
    expect(b.text).toContain("Question 2: Q2?");
    const w = gradeAnswer(b.state, 0, "he");
    expect(w.text).toContain("לא מדויק");
    expect(w.text).toContain("ניקוד: 1 מתוך 2.");
  });
});
