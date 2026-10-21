import { describe, expect, it } from "vitest";
import { BOTS, botPersonaLine, resolveBot } from "./bots";

describe("single-bot voice", () => {
  it("has exactly one bot and resolves every id to it", () => {
    expect(BOTS).toHaveLength(1);
    expect(resolveBot("investing").id).toBe("general");
    expect(resolveBot("nope").id).toBe("general");
    expect(resolveBot(undefined).id).toBe("general");
  });
  it("persona line follows the reply language", () => {
    expect(botPersonaLine(resolveBot(), "he")).toContain("טון");
    expect(botPersonaLine(resolveBot(), "en")).toContain("Voice:");
  });
});
