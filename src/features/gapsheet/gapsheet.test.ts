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
