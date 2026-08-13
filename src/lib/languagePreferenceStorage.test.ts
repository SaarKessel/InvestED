import { describe, expect, it, beforeEach } from "vitest";

/** @vitest-environment jsdom */

import {
  getLanguagePreference,
  setLanguagePreference,
} from "./languagePreferenceStorage";

describe("language preference storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to Hebrew for a new browser", () => {
    expect(getLanguagePreference()).toBe("he");
  });

  it("persists the selected language", () => {
    setLanguagePreference("en");
    expect(getLanguagePreference()).toBe("en");
  });
});
