import { describe, expect, it } from "vitest";
import { parseStructuredResponse, verifyStructuredAnswer } from "./structuredAnswer";
import type { GatewayRequestPayload } from "./gatewayPrompt";

const payload: GatewayRequestPayload = { question: "Explain portfolio costs", answer: "The fee is 0.03 percent and the balance is 12500 USD.", language: "en", facts: {} };
const body = (value: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] });
const malformed = [null, [], true, 1, "text", {}, { text: "ok" }, { numbersUsed: [] }, { text: "", numbersUsed: [] }, { text: "   ", numbersUsed: [] }, { text: 10, numbersUsed: [] }, { text: "ok", numbersUsed: null }, { text: "ok", numbersUsed: {} }, { text: "ok", numbersUsed: [true] }, { text: "ok", numbersUsed: [{}] }];

describe("[sweep] B108 structured completion rejects malformed schema", () => {
  it.each(malformed.map((v, index) => [index, v] as const))("schema case %s", (_index, value) => {
    expect(parseStructuredResponse(body(value))).toBeNull();
    expect(verifyStructuredAnswer(payload, parseStructuredResponse(body(value)))).toEqual({ ok: false, reason: "bad_structure" });
  });
});

const unsupported = [0.04, 0.3, 3, 30, 125, 1250, 12501, 125000, 2026, 99];
const frames = ["The cost is % percent.", "The balance equals % USD.", "The fee totals %.", "The amount is %.", "העמלה היא % אחוז.", "היתרה היא % דולר."];
const rows = unsupported.flatMap((value) => frames.map((frame): [string, string] => [frame.replace("%", String(value)), String(value)]));

describe("[sweep] B108 declared and undeclared invented numbers stay blocked", () => {
  it.each(rows)("%s declared %s", (text, number) => {
    expect(verifyStructuredAnswer(payload, parseStructuredResponse(body({ text, numbersUsed: [number] })))).toEqual({ ok: false, reason: "number_mismatch" });
    expect(verifyStructuredAnswer(payload, parseStructuredResponse(body({ text, numbersUsed: [] })))).toEqual({ ok: false, reason: "undeclared_number" });
  });
});

const renderings: Array<[string, string]> = [["12500", "12500"], ["12,500", "12500"], ["12500.0", "12500"], ["12500.00", "12500"], ["0.030", "0.03"], ["0.0300", "0.03"]];
describe("[sweep] B108 schema bridge keeps exact validated numeric precision", () => {
  it.each(renderings)("number %s declared as %s", (number, declared) => {
    const text = `The amount is ${number}.`;
    const parsed = parseStructuredResponse(body({ text, numbersUsed: [declared] }));
    expect(parsed).toEqual({ text, numbersUsed: [declared] });
    // Gateway contract allows comma normalization, but retains exact numeric tokens.
    // Extra decimal zeros alter displayed precision, so the deterministic answer remains.
    if (["12500", "12,500"].includes(number)) expect(verifyStructuredAnswer(payload, parsed)).toEqual({ ok: true, text });
    else expect(verifyStructuredAnswer(payload, parsed)).toEqual({ ok: false, reason: "fact_mismatch" });
  });
});

describe("[hand] B108 malformed completion transport", () => {
  it("joins split candidate text before parsing JSON", () => {
    expect(parseStructuredResponse({ candidates: [{ content: { parts: [{ text: '{"text":"Cost is 0.03",' }, { text: '"numbersUsed":[0.03]}' }] } }] })).toEqual({ text: "Cost is 0.03", numbersUsed: ["0.03"] });
  });
  it("never treats fenced prose as schema JSON", () => {
    expect(parseStructuredResponse({ candidates: [{ content: { parts: [{ text: '```json\n{"text":"Hello","numbersUsed":[]}\n```' }] } }] })).toBeNull();
  });
});
