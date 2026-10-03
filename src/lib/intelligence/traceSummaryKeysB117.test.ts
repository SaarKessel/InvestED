import { describe, expect, it } from "vitest";
import { summarize, type TraceEntry } from "./traceStore";
const entry = (route: string, failedChecks: string[]): TraceEntry => ({ at: 1, route, tools: [], ms: 10, ok: false, failedChecks, q: "hash", live: "none" });
const keys = ["constructor", "toString", "valueOf", "hasOwnProperty", "__proto__", "isPrototypeOf", "normal", "risk"];

describe("[sweep] B117 trace summary treats every route/check key as data", () => {
  it.each(keys)("key %s", (key) => {
    const result = summarize([entry(key, [key]), entry(key, [key])]);
    expect(Object.hasOwn(result.byRoute, key)).toBe(true);
    expect(Object.hasOwn(result.failures, key)).toBe(true);
    expect(result.byRoute[key]).toBe(2);
    expect(result.failures[key]).toBe(2);
    expect(result.count).toBe(2);
  });
});

describe("[hand] B117 trace summary independent counts", () => {
  it("repeated checks are counted separately without altering Object.prototype", () => {
    const before = Object.getOwnPropertyNames(Object.prototype);
    const result = summarize([entry("__proto__", ["constructor", "constructor"]), entry("other", [])]);
    expect(result.byRoute.__proto__).toBe(1);
    expect(result.byRoute.other).toBe(1);
    expect(result.failures.constructor).toBe(2);
    expect(Object.getOwnPropertyNames(Object.prototype)).toEqual(before);
  });
});
