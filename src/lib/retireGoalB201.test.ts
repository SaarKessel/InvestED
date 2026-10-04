import { describe, expect, it } from "vitest";
import { processAIMessage } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";
import type { AIConversationDeps } from "./aiConversationService";
const deps = { fetchAsset: async () => null, enhance: async () => null } as unknown as AIConversationDeps;
const ask = async (q: string, l: "en" | "he") => (await processAIMessage(createConversationSession(), q, l, deps)).response.text;
describe("B201 R1 ambiguous retirement need is asked, not computed", () => {
  it("EN", async () => {
    const t = await ask("retire at 60 with 3M need 15000 a month", "en");
    expect(t).toMatch(/did not assume anything/);
    expect(t).not.toMatch(/1,800,000|projected final balance/);
  });
  it("HE", async () => {
    const t = await ask("אני רוצה לפרוש בגיל 60 עם 3 מיליון ואני צריך 15000 בחודש", "he");
    expect(t).toMatch(/לא הנחתי כלום/);
    expect(t).not.toMatch(/1,800,000/);
  });
});
describe("B201 R2 retire-with-target goal solver", () => {
  it("EN years and rate", async () => {
    const t = await ask("I want to retire with 3M in 25 years, how much a month at 6%", "en");
    expect(t).toMatch(/about 4,329 a month/);
    expect(t).not.toMatch(/teaching default/);
  });
  it("EN ages, default rate disclosed", async () => {
    const t = await ask("I am 35 and want to retire at 60 with 3M", "en");
    expect(t).toMatch(/in 25 years at 7%/);
    expect(t).toMatch(/did not give a return/);
  });
  it("HE years and rate", async () => {
    const t = await ask("אני רוצה לפרוש עם 3 מיליון בעוד 25 שנה, כמה לחסוך בחודש ב-6%", "he");
    expect(t).toMatch(/4,329 בחודש/);
  });
  it("HE ages", async () => {
    const t = await ask("אני בן 35 ורוצה לפרוש בגיל 60 עם 3 מיליון", "he");
    expect(t).toMatch(/בעוד 25 שנים/);
    expect(t).toMatch(/לא ציינת תשואה/);
  });
  it("missing years asks", async () => {
    const t = await ask("I want to retire with 3M, how much a month", "en");
    expect(t).toMatch(/did not assume anything/);
  });
});
describe("B201 R3 a 0% loan rate is a valid explicit rate", () => {
  it("EN", async () => {
    const t = await ask("monthly payment on a loan of 500000 at 0% for 25 years", "en");
    expect(t).toMatch(/1,667/);
  });
});
