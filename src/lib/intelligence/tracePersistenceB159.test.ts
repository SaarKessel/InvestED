import { describe, expect, it } from "vitest";
import { loadTraces, recordTrace, clearTraces, hashQuestion, MAX_TRACES } from "./traceStore";
const rows = [0, 1, 199, 200, 201, 250].flatMap((count) => ["en", "he"].map((lang) => [count, lang] as const));
describe("[sweep] B159 trace persistence caps oldest entries and stores no question text", () => {
  it.each(rows)("existing count %s language %s", (count, lang) => {
    const storage = new Map<string, string>();
    const store = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } };
    const old = Array.from({ length: count }, (_, i) => ({ at: i, route: "calc", tools: ["calc"], ms: i, ok: true, failedChecks: [], q: `hash${i}`, live: "none" }));
    storage.set("invested.traces.v1", JSON.stringify(old));
    const question = lang === "en" ? "private question b159" : "שאלה פרטית b159";
    const entry = { at: 999, route: "risk", tools: ["risk"], ms: 10, ok: false, failedChecks: ["numbers"], live: "unavailable" as const, question };
    const snapshot = JSON.stringify(entry);
    const next = recordTrace(entry, store);
    expect(next).toHaveLength(Math.min(count + 1, MAX_TRACES));
    expect(next.at(-1)).toEqual({ at: 999, route: "risk", tools: ["risk"], ms: 10, ok: false, failedChecks: ["numbers"], live: "unavailable", q: hashQuestion(question) });
    expect(next.slice(0, -1)).toEqual(old.slice(-(MAX_TRACES - 1)));
    expect(loadTraces(store)).toEqual(next);
    expect(storage.get("invested.traces.v1")).not.toContain(question);
    expect(JSON.stringify(entry)).toBe(snapshot);
    clearTraces(store);
    expect(loadTraces(store)).toEqual([]);
  });
});
describe("[hand] B159 trace storage write failures preserve in-memory result", () => {
  it("returns the new trace even when persistence is denied", () => {
    const store = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => { throw new Error("denied"); } };
    expect(recordTrace({ at: 1, route: "calc", tools: [], ms: 1, ok: true, failedChecks: [], live: "none", question: "question" }, store)).toHaveLength(1);
    expect(() => clearTraces(store)).not.toThrow();
  });
});
