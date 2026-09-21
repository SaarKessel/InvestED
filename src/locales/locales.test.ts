// ---------------------------------------------------------------------------
// Locale consistency guard: Hebrew mode must be fully Hebrew, English mode
// fully English. Catches mixed-language leakage at CI time instead of in
// production UI.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import en from "./en.json";
import he from "./he.json";

const HEBREW_RE = /[\u0590-\u05FF]/;
const LATIN_WORD_RE = /[A-Za-z]{3,}/;

// Values that are intentionally Latin-only in Hebrew mode: technology proper
// nouns that are never translated (framework names, version strings).
const HEBREW_LATIN_ALLOWLIST = new Set([
  "tech_stack_desc",
  "about_stack_frontend_items_full",
]);

describe("locale dictionaries", () => {
  it("expose exactly the same keys in both languages", () => {
    const enKeys = Object.keys(en).sort();
    const heKeys = Object.keys(he).sort();
    expect(heKeys).toEqual(enKeys);
  });

  it("keeps the English dictionary free of Hebrew characters", () => {
    const leaks = Object.entries(en)
      .filter(([, value]) => HEBREW_RE.test(value))
      .map(([key]) => key);
    expect(leaks).toEqual([]);
  });

  it("keeps the Hebrew dictionary Hebrew-first", () => {
    // Any value containing a space and Latin words but no Hebrew at all is
    // English leakage, unless explicitly allowlisted as a proper noun.
    const leaks = Object.entries(he)
      .filter(([key, value]) =>
        !HEBREW_LATIN_ALLOWLIST.has(key) &&
        value.includes(" ") &&
        LATIN_WORD_RE.test(value) &&
        !HEBREW_RE.test(value)
      )
      .map(([key]) => key);
    expect(leaks).toEqual([]);
  });

  it("never falls back to the raw key as display text", () => {
    for (const [key, value] of Object.entries(he)) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(value).not.toBe(key);
    }
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(value).not.toBe(key);
    }
  });
});
