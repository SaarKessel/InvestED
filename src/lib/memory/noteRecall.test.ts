import { describe, expect, it } from "vitest";
import { relevantNotes, recallLine } from "./noteRecall";
describe("noteRecall", () => {
  it("matches shared words", () => { expect(relevantNotes("How should I save for an apartment?", ["I am saving for an apartment", "I like tea"])).toEqual(["I am saving for an apartment"]); });
  it("matches Hebrew with prefixes", () => { expect(relevantNotes("כמה לחסוך לדירה?", ["אני חוסך לדירה"])).toEqual(["אני חוסך לדירה"]); });
  it("returns nothing without overlap", () => { expect(relevantNotes("What is inflation?", ["I like tea"])).toEqual([]); });
  it("labels the line", () => { expect(recallLine(["x"], "en")).toContain("saved notes"); });
});
