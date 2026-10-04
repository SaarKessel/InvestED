import { describe, expect, it } from "vitest";
import { processAIMessage } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";
import type { AIConversationDeps } from "./aiConversationService";
const deps = { fetchAsset: async () => null, enhance: async () => null } as unknown as AIConversationDeps;
const ask = async (q: string, l: "en" | "he") => (await processAIMessage(createConversationSession(), q, l, deps)).response.text;
describe("B201 R3 a 0% loan rate is a valid explicit rate", () => {
  it("EN", async () => {
    const t = await ask("monthly payment on a loan of 500000 at 0% for 25 years", "en");
    expect(t).toMatch(/1,667/);
  });
});
