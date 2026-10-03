import { describe, expect, it } from "vitest";
import { parseStructuredResponse } from "./structuredAnswer";
const rows = ["Plain answer", "תשובה בעברית", "Value 12.5 USD", "Emoji 🧠 answer"].flatMap((text) => [[], ["12.5"], [12.5]].flatMap((numbersUsed) => [1, 2, 3, 7, 15].map((parts) => [text, numbersUsed, parts] as const)));
describe("[sweep] B151 structured rephrase multipart JSON preserves Unicode and number strings", () => {
  it.each(rows)("text %s declared %j parts %s", (text, numbersUsed, count) => {
    const raw = JSON.stringify({ text: `  ${text}  `, numbersUsed });
    const parts = Array.from({ length: count }, (_, i) => ({ text: raw.slice(Math.floor(i * raw.length / count), Math.floor((i + 1) * raw.length / count)) }));
    const body = { candidates: [{ content: { parts } }, { content: { parts: [{ text: "ignored" }] } }] };
    const snapshot = JSON.stringify(body);
    expect(parseStructuredResponse(body)).toEqual({ text, numbersUsed: numbersUsed.map(String) });
    expect(JSON.stringify(body)).toBe(snapshot);
  });
});
describe("[hand] B151 structured rephrase rejects invalid declared-number values", () => {
  it("requires string or numeric entries and nonblank text", () => {
    const body = (value: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] });
    for (const numbersUsed of [[null], [true], [{}], [[]], "12", null]) expect(parseStructuredResponse(body({ text: "Answer", numbersUsed }))).toBeNull();
    expect(parseStructuredResponse(body({ text: "   ", numbersUsed: [] }))).toBeNull();
    expect(parseStructuredResponse(body({ text: 123, numbersUsed: [] }))).toBeNull();
    expect(parseStructuredResponse(body({ text: "Answer" }))).toBeNull();
  });
});
