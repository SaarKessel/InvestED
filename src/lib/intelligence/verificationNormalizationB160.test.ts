import { describe, expect, it } from "vitest";
import { numbersIn, verifyNumbers } from "./verificationEngine";
const rows = [1, 12, 1250, 1000000].flatMap((value) => ["plain", "grouped", "decimalzeros"].flatMap((form) => ["en", "he"].map((lang) => [value, form, lang] as const)));
describe("[sweep] B160 number verification normalizes separators and decimal zeros", () => {
  it.each(rows)("value %s representation %s language %s", (value, form, lang) => {
    const number = form === "grouped" ? new Intl.NumberFormat("en-US").format(value) : form === "decimalzeros" ? `${value}.000` : String(value);
    const text = lang === "en" ? `Value ${number} USD` : `ערך ${number} דולר`;
    expect(numbersIn(text)).toEqual([String(value)]);
    expect(verifyNumbers(text, [`allowed ${value}`])).toEqual({ ok: true, unsupported: [] });
    expect(verifyNumbers(`unknown ${value + 2}`, [text])).toEqual({ ok: false, unsupported: [String(value + 2)] });
  });
});
describe("[hand] B160 unsupported numbers are deduplicated in first-seen order", () => {
  it("does not invent a required number for text without digits", () => {
    expect(verifyNumbers("no numeric data", [])).toEqual({ ok: true, unsupported: [] });
    expect(verifyNumbers("12 7 12 9 7", ["9"])).toEqual({ ok: false, unsupported: ["12", "7"] });
    expect(numbersIn("12.50, 1,250.000 and 0.00")).toEqual(["12.5", "1250", "0"]);
  });
});
