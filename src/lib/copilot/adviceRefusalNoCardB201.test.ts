import { describe, it, expect } from "vitest";
import { isAdviceRefusal } from "./multiPart";
import { planFinancialQA, createQAMemory } from "@/lib/financialQA";
import { ADVICE_DISCLAIMER_EN, ADVICE_DISCLAIMER_HE } from "./adviceGuard";

describe("advice refusal suppresses extra cards", () => {
  it("both languages still route to the advice boundary", () => {
    expect(planFinancialQA("pick me a stock to buy", "en", createQAMemory())?.kind).toBe("advice_boundary");
    expect(planFinancialQA("תמליץ לי על מניה", "he", createQAMemory())?.kind).toBe("advice_boundary");
  });
  it("recognises the boundary text and the guard disclaimer", () => {
    expect(isAdviceRefusal("I cannot tell you what to buy or sell - that is a personal decision")).toBe(true);
    expect(isAdviceRefusal("אני לא יכולה לומר לך מה לקנות או למכור - זו החלטה אישית")).toBe(true);
    expect(isAdviceRefusal(ADVICE_DISCLAIMER_EN)).toBe(true);
    expect(isAdviceRefusal(ADVICE_DISCLAIMER_HE)).toBe(true);
  });
  it("does not flag normal answers", () => {
    expect(isAdviceRefusal("A stock is a share of ownership.")).toBe(false);
  });
});

describe("live wording variant", () => {
  it("matches the Hebrew variant seen on the live site", () => {
    expect(isAdviceRefusal("אני לא יכולה להמליץ לך על מניה מסוימת או לומר לך מה לקנות או למכור")).toBe(true);
  });
});
