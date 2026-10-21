import { describe, expect, it } from "vitest";
import { BOTS, DEFAULT_BOT_ID, botPersonaLine, resolveBot } from "./bots";

describe("bot registry", () => {
  it("resolves known bots and falls back to the default for unknown ids", () => {
    expect(resolveBot("investing").id).toBe("investing");
    expect(resolveBot("nope").id).toBe(DEFAULT_BOT_ID);
    expect(resolveBot(undefined).id).toBe(DEFAULT_BOT_ID);
    expect(resolveBot(42).id).toBe(DEFAULT_BOT_ID);
  });
  it("mirrors the client agent ids", () => {
    expect(BOTS.map((b) => b.id).sort()).toEqual(["credit", "general", "insurance", "investing", "savings"]);
  });
  it("persona line follows the reply language", () => {
    expect(botPersonaLine(resolveBot("savings"), "he")).toContain("טון");
    expect(botPersonaLine(resolveBot("savings"), "en")).toContain("Voice:");
  });
});
