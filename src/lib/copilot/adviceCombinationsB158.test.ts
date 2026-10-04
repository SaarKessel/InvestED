import { describe, expect, it } from "vitest";
import { checkAdvice, applyAdviceGuard, ADVICE_DISCLAIMER_EN, ADVICE_DISCLAIMER_HE, type AdviceViolation } from "./adviceGuard";
const en = ["You should buy now.", "Invest everything into stocks.", "This guarantees profit."];
const he = ["תקנה עכשיו.", "שים את כל הכסף במניה.", "תשואה מובטחת."];
const kinds: AdviceViolation[] = ["directive", "position_sizing", "guaranteed_return"];
const rows = ["en", "he"].flatMap((lang) => Array.from({ length: 7 }, (_, i) => [lang, i + 1] as const));
describe("[sweep] B158 advice violations compose without losing independent categories", () => {
  it.each(rows)("language %s category mask %s", (lang, mask) => {
    const clauses = lang === "en" ? en : he;
    const text = clauses.filter((_, i) => mask & (1 << i)).join(" ");
    const expected = kinds.filter((_, i) => mask & (1 << i));
    expect(checkAdvice(text)).toEqual({ ok: false, violations: expected });
    expect(applyAdviceGuard(text)).toEqual({ text: lang === "en" ? ADVICE_DISCLAIMER_EN : ADVICE_DISCLAIMER_HE, guarded: true, violations: expected });
    expect(checkAdvice(`${text} ${text}`).violations).toEqual(expected);
  });
});
describe("[hand] B158 clean education remains unchanged and disclaimers do not recurse", () => {
  it("returns clean educational prose verbatim", () => {
    const text = "Diversification spreads exposure. Past performance is not a forecast.";
    expect(applyAdviceGuard(text)).toEqual({ text, guarded: false, violations: [] });
    expect(checkAdvice(ADVICE_DISCLAIMER_EN).ok).toBe(true);
    expect(checkAdvice(ADVICE_DISCLAIMER_HE).ok).toBe(true);
  });
});
