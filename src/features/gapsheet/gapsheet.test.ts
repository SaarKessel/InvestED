import { describe, expect, it } from "vitest";
import { newWorkbook } from "./lib/workbook/sample";
import { buildContext } from "./lib/ai/context";
import { parseIntent } from "./lib/ai/intent";
import { executeActions } from "./lib/actions/executor";
import { explainActions } from "./lib/ai/explain";

function ask(msg: string, lang: "en" | "he") {
  const state = newWorkbook();
  const r = parseIntent(msg, buildContext(state, null), state, lang);
  if (r.kind !== "action") return { r, state };
  const res = executeActions(r.actions, state, { source: "ai", lang });
  return { r, res, state };
}

describe("GapSheet inside InvestED", () => {
  it("adds up Sales and explains the Excel formula (en)", () => {
    const { r, res } = ask("Add up Sales", "en");
    expect(r.kind).toBe("action");
    expect(res?.status).toBe("success");
    if (r.kind === "action" && res?.status === "success") expect(explainActions(r.actions, r.focus, res.after, "en").excelEquivalent).toMatch(/SUM\(/);
  });
  it("understands Hebrew requests", () => {
    const { r, res } = ask("חשב סך מכירות", "he");
    expect(r.kind).toBe("action");
    expect(res?.status).toBe("success");
  });
  it("asks to clarify instead of guessing", () => {
    expect(ask("asdf qwer", "en").r.kind).toBe("clarification");
  });
});

import { csvToWorkbook, sheetToCsv } from "./lib/io";
describe("GapSheet CSV", () => {
  it("round-trips and never turns imported text into a formula", () => {
    const wb = csvToWorkbook("Name,Sales\r\nDan,10\r\nEve,=1+1\r\n", "t.csv");
    const sheet = wb.sheets[0];
    expect(sheet.cells["B2"].value).toBe(10);
    expect(sheet.cells["B3"].formula).toBeNull();
    expect(sheetToCsv(sheet)).toContain("Dan,10");
  });
});

import { parseInput, setCell } from "./lib/workbook/engine";
import { generatePractice } from "./lib/practice/generator";
import { validatePractice } from "./lib/practice/validator";
import { newEntry, verifiedLevel } from "./lib/learning/ledger";
describe("GapSheet practice and mastery", () => {
  it("rejects a wrong answer and accepts the right formula", () => {
    const task = generatePractice("sum", 0, "en");
    expect(validatePractice(task, { state: task.workbook }).correct).toBe(false);
    const wb = setCell(task.workbook, "p1", task.targetCell, parseInput(`=SUM(${task.dataRange})`));
    expect(validatePractice(task, { state: wb }).correct).toBe(true);
  });
  it("only independent first attempts make a skill proficient; help and reveal do not", () => {
    const base = { skill: "sum", kind: "attempt" as const, source: "practice" as const, contextId: "c", hints: 0, revealed: false, correct: true };
    expect(verifiedLevel([newEntry({ ...base, taskId: "practice_sum_0", hints: 1 })], "sum")).not.toBe("PROFICIENT");
    expect(verifiedLevel([newEntry({ ...base, taskId: "practice_sum_0", correct: false, revealed: true })], "sum")).not.toBe("PROFICIENT");
    expect(verifiedLevel([newEntry({ ...base, taskId: "practice_sum_0" })], "sum")).toBe("PROFICIENT");
  });
});
