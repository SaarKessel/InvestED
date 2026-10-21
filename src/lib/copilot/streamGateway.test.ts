import { describe, expect, it } from "vitest";
import { encodeFactsTrailer, splitStreamTrailer, visibleStreamText, VERDICT_FALLBACK, VERDICT_OK } from "./streamGateway";

describe("stream trailer", () => {
  it("parses text, facts and ok verdict", () => {
    const raw = `hello world${encodeFactsTrailer(["quote VOO: {\"price\":612.5}"])}${VERDICT_OK}`;
    const out = splitStreamTrailer(raw);
    expect(out.ok).toBe(true);
    expect(out.text).toBe("hello world");
    expect(out.acceptedFacts[0]).toContain("612.5");
  });
  it("fallback verdict discards everything", () => {
    expect(splitStreamTrailer(`partial text${VERDICT_FALLBACK}`).ok).toBe(false);
  });
  it("missing verdict means failure", () => {
    expect(splitStreamTrailer("some text with no trailer").ok).toBe(false);
  });
  it("empty visible text is not ok", () => {
    expect(splitStreamTrailer(`${VERDICT_OK}`).ok).toBe(false);
  });
  it("visibleStreamText cuts at the first trailer marker for progressive display", () => {
    expect(visibleStreamText("abc\n[[INVESTED_FACTS:xx]]")).toBe("abc");
    expect(visibleStreamText("abc")).toBe("abc");
  });
});
