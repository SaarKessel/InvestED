import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnimatedNumber, formatAnimatedNumber } from "./AnimatedNumber";

describe("formatAnimatedNumber", () => {
  it("groups thousands with the requested decimals", () => {
    expect(formatAnimatedNumber(12345.678, { decimals: 2 })).toBe("12,345.68");
  });
  it("keeps the sign on negatives", () => {
    expect(formatAnimatedNumber(-1250, { decimals: 0 })).toBe("-1,250");
  });
  it("supports compact notation", () => {
    expect(formatAnimatedNumber(1_250_000, { compact: true, decimals: 1 })).toBe("1.3M");
  });
  it("never renders invented digits for non-finite input", () => {
    expect(formatAnimatedNumber(Number.NaN)).toBe("—");
    expect(formatAnimatedNumber(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("AnimatedNumber", () => {
  it("forces LTR digit order and exposes the full value", () => {
    const html = renderToStaticMarkup(<AnimatedNumber value={1250} prefix="$" suffix=" USD" />);
    expect(html).toContain('dir="ltr"');
    expect(html).toContain('aria-label="$1,250 USD"');
  });
  it("renders every digit column", () => {
    const html = renderToStaticMarkup(<AnimatedNumber value={4200} />);
    for (const digit of ["4", "2", "0"]) expect(html).toContain(`>${digit}</div>`);
  });
});
