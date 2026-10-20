import { describe, it, expect } from "vitest";
import { BROKERS } from "./brokers";

describe("BROKERS directory", () => {
  it("every broker has both languages and a valid https url", () => {
    expect(BROKERS.length).toBeGreaterThan(0);
    for (const b of BROKERS) {
      expect(b.name.he.trim()).not.toBe("");
      expect(b.name.en.trim()).not.toBe("");
      expect(() => new URL(b.url)).not.toThrow();
      expect(b.url.startsWith("https://")).toBe(true);
    }
  });
});
