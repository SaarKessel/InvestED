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

import { acceptRephrase } from "./provider";
describe("acceptRephrase", () => {
  const resp = { text: "VOO is at 512.30, up 1.2%.", assets: [{ price: 512.3 }] } as never;
  it("keeps a rewording whose numbers all come from the deterministic answer", () => { expect(acceptRephrase("VOO sits near 512.30 and rose 1.2%.", "VOO?", resp)).toBe("VOO sits near 512.30 and rose 1.2%."); });
  it("rejects a rewording that adds a number", () => { expect(acceptRephrase("VOO is 512.30, up 1.2%, target 600.", "VOO?", resp)).toBeNull(); });
  it("passes null through", () => { expect(acceptRephrase(null, "q", resp)).toBeNull(); });
});
