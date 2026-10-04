/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { processAIMessage } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";
const deps: any = { fetchAsset: async () => null, enhance: async () => null };
describe("B197 a negative amount in a projection is declined, not answered from the other numbers", () => {
  it("EN", async () => {
    const t = await processAIMessage(createConversationSession(), "invest -10000 and save 500 a month for 10 years", "en", deps);
    expect(t.response.text).toMatch(/negative amount/);
    expect(t.response.text).not.toMatch(/86,542/);
  });
  it("positive version still computes", async () => {
    const t = await processAIMessage(createConversationSession(), "invest 10000 and save 500 a month for 10 years", "en", deps);
    expect(t.response.text).not.toMatch(/negative amount/);
  });
});
