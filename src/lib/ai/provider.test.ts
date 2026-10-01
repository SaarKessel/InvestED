import { describe, expect, it } from "vitest";
import { DEFAULT_PROVIDER, getProvider, PROVIDERS } from "./provider";
describe("AIProvider", () => {
  it("defaults to Gemini and falls back to rules-only for stubs or unknown ids", () => {
    expect(getProvider(undefined).id).toBe(DEFAULT_PROVIDER);
    expect(getProvider("openai").id).toBe("rule-based");
    expect(getProvider("nope").id).toBe("rule-based");
    expect(getProvider("rule-based").id).toBe("rule-based");
  });
  it("stubs are unavailable and never return text", async () => {
    for (const id of ["openai", "anthropic", "local"] as const) {
      expect(PROVIDERS[id].available).toBe(false);
      expect(await PROVIDERS[id].rephrase("q", "en", {} as never)).toBeNull();
    }
    expect(await PROVIDERS["rule-based"].rephrase("q", "en", {} as never)).toBeNull();
  });
});
