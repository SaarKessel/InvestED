import { describe, expect, it } from "vitest";
import { hashQuestion, summarize, type TraceEntry } from "./traceStore";
const rows: Array<[number, number]> = [];
for (const length of [0, 1, 2, 3, 10, 20, 99, 200]) for (const offset of [0, 1, 1000]) rows.push([length, offset]);
const make = (length: number, offset: number): TraceEntry[] => Array.from({ length }, (_, i) => ({ at: i, route: ["calc", "risk", "__proto__"][i % 3], tools: [], ms: offset + ((i * 37) % 101), ok: i % 4 !== 0, failedChecks: i % 4 === 0 ? ["numbers", "constructor"] : [], q: "hashed", live: "none" }));

describe("[sweep] B118 trace aggregate conservation and nearest-rank quantiles", () => {
  it.each(rows)("length %s duration offset %s", (length, offset) => {
    const input = make(length, offset);
    const before = JSON.stringify(input);
    const r = summarize(input);
    const sorted = input.map((t) => t.ms).sort((a, b) => a - b);
    expect(r.count).toBe(length);
    expect(r.okRate).toBe(length ? input.filter((t) => t.ok).length / length : null);
    expect(r.p50).toBe(length ? sorted[Math.floor(length / 2)] : 0);
    expect(r.p95).toBe(length ? sorted[Math.floor(length * 0.95)] : 0);
    expect(Object.values(r.byRoute).reduce((a, b) => a + b, 0)).toBe(length);
    expect(Object.values(r.failures).reduce((a, b) => a + b, 0)).toBe(input.flatMap((t) => t.failedChecks).length);
    for (const route of ["calc", "risk", "__proto__"]) if (input.some((t) => t.route === route)) expect(r.byRoute[route]).toBe(input.filter((t) => t.route === route).length);
    expect(summarize([...input].reverse())).toEqual(r);
    expect(JSON.stringify(input)).toBe(before);
  });
});

const questions = ["What is an ETF?", "compound interest", "מהי ריבית דריבית", "AAPL and MSFT", "10% return", "שאלה עם מספר 12500"];
describe("[sweep] B118 question hashing normalization and no plaintext", () => {
  it.each(questions)("question %s", (q) => {
    const h = hashQuestion(q);
    expect(hashQuestion(`  ${q.toUpperCase()}  `)).toBe(h);
    expect(h).toMatch(/^[a-z0-9]+$/);
    expect(h).not.toBe(q);
    expect(h.length).toBeLessThanOrEqual(7);
  });
});

describe("[hand] B118 empty trace aggregates", () => {
  it("empty history has no invented success rate", () => {
    const r = summarize([]);
    expect(r).toMatchObject({ count: 0, okRate: null, p50: 0, p95: 0 });
    expect(Object.keys(r.byRoute)).toEqual([]); expect(Object.keys(r.failures)).toEqual([]);
  });
});
