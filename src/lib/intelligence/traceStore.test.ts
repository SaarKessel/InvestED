import { describe, expect, it } from "vitest";
import { clearTraces, hashQuestion, loadTraces, MAX_TRACES, recordTrace, summarize } from "./traceStore";

const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
const base = { at: 1, route: "calc", tools: ["calc"], ms: 10, ok: true, failedChecks: [] as string[], live: "none" as const };
describe("traceStore", () => {
  it("stores a hash, never the question", () => {
    const s = mem();
    recordTrace({ ...base, question: "my secret salary 123" }, s);
    const raw = JSON.stringify([...Array(1)].map(() => s.getItem("invested.traces.v1")));
    expect(raw).not.toMatch(/secret/);
    expect(loadTraces(s)[0].q).toBe(hashQuestion("my secret salary 123"));
  });
  it("caps the log and clears it", () => {
    const s = mem();
    for (let i = 0; i < MAX_TRACES + 5; i++) recordTrace({ ...base, at: i, question: `q${i}` }, s);
    expect(loadTraces(s)).toHaveLength(MAX_TRACES);
    clearTraces(s);
    expect(loadTraces(s)).toEqual([]);
  });
  it("survives corrupt storage and no storage", () => {
    const s = mem(); s.setItem("invested.traces.v1", "{bad");
    expect(loadTraces(s)).toEqual([]);
    expect(loadTraces(null)).toEqual([]);
  });
  it("summarizes counts, latency and failures", () => {
    const list = [10, 20, 30, 40].map((ms, i) => ({ ...base, q: "x", ms, ok: i !== 3, failedChecks: i === 3 ? ["numbers"] : [] }));
    const r = summarize(list);
    expect(r).toMatchObject({ count: 4, okRate: 0.75, byRoute: { calc: 4 }, failures: { numbers: 1 } });
    expect(r.p50).toBe(30);
    expect(summarize([]).okRate).toBeNull();
  });
});
