import { describe, expect, it } from "vitest";
import { parseMemoryCommand } from "./memoryCommands";

describe("memory commands", () => {
  it("parses remember in English and Hebrew", () => {
    expect(parseMemoryCommand("remember that I am saving for a flat")).toEqual({ kind: "remember", value: "I am saving for a flat" });
    expect(parseMemoryCommand("Remember: my horizon is 10 years")).toEqual({ kind: "remember", value: "my horizon is 10 years" });
    expect(parseMemoryCommand("זכור שאני חוסך לדירה")).toEqual({ kind: "remember", value: "אני חוסך לדירה" });
  });
  it("parses list and forget", () => {
    expect(parseMemoryCommand("what do you remember?")).toEqual({ kind: "list" });
    expect(parseMemoryCommand("מה אתה זוכר")).toEqual({ kind: "list" });
    expect(parseMemoryCommand("forget everything")).toEqual({ kind: "forget" });
    expect(parseMemoryCommand("תשכח הכול")).toEqual({ kind: "forget" });
  });
  it("leaves ordinary questions alone", () => {
    for (const q of ["what is inflation", "how do I remember my password", "remember", "מה זה ריבית", "what is a note payable"]) expect(parseMemoryCommand(q)).toBeNull();
  });
  it("caps the stored note", () => {
    const v = parseMemoryCommand("remember " + "x".repeat(500));
    expect(v && v.kind === "remember" && v.value.length).toBe(300);
  });
});
