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

describe("adaptive review", () => {
  const b3: QuizQuestion[] = [...bank, { id: "c", question: "Q3?", options: ["x", "y", "z"], correctIndex: 0, explanation: "because x" }];
  it("brings a missed question back after two fresh ones, then clears it when answered right", () => {
    let s = askNext(newExamState(), b3, "en").state; // Q1 (a)
    const w = gradeAnswer(s, 0, "en"); // wrong
    expect(w.state.missed).toEqual(["a"]);
    expect(w.text).toContain("bring this one back");
    s = askNext(w.state, b3, "en").state; // Q2 (b), since=2? since was 1 -> now 2
    s = gradeAnswer(s, 2, "en").state;
    const r = askNext(s, b3, "en");
    expect(r.text).toContain("Back to one you missed.");
    expect(r.text).toContain("Q1?");
    const ok = gradeAnswer(r.state, 1, "en");
    expect(ok.state.missed).toEqual([]);
  });
  it("seeds from earlier missed ids and does not review when none are missed", () => {
    expect(newExamState(["b"]).missed).toEqual(["b"]);
    let s = newExamState();
    for (let i = 0; i < 4; i++) { const a = askNext(s, b3, "he"); expect(a.text).not.toContain("חזרה על שאלה"); s = gradeAnswer(a.state, a.state.current!.correctIndex, "he").state; }
  });
});
