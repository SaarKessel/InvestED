import { describe, expect, it } from "vitest";
import { CURRENCIES } from "./currencies";

describe("currencies", () => {
  it("provides a Hebrew name for every currency", () => {
    for (const c of CURRENCIES) {
      expect(c.nameHe.length).toBeGreaterThan(0);
      expect(/[א-ת]/.test(c.nameHe)).toBe(true);
    }
  });
});
