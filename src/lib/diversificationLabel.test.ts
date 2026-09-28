import { describe, expect, it } from "vitest";
import he from "@/locales/he.json";
import en from "@/locales/en.json";
import { diversificationLabel } from "./diversificationLabel";
const heT = (key: string, fallback = key) => (he as Record<string,string>)[key] ?? fallback;
const enT = (key: string, fallback = key) => (en as Record<string,string>)[key] ?? fallback;
describe("qualitative portfolio diversification display", () => {
  it("localizes engine bands without attaching a percent sign", () => {
    expect(diversificationLabel("high", heT)).toBe("גבוה");
    expect(diversificationLabel("medium", enT)).toBe("Medium");
    expect(diversificationLabel("low", heT)).toBe("נמוך");
  });
  it("does not print unknown raw values", () => {
    expect(diversificationLabel("mystery", heT)).toBe("לא הוגדר");
  });
});
