import { describe, expect, it } from "vitest";
import { cleanSeries, maxDrawdown, splitTrainTest } from "./performance";

const paths: number[][] = [];
for (const a of [50, 100, 150]) for (const b of [40, 90, 160]) for (const c of [30, 110, 170]) for (const d of [20, 120, 180]) paths.push([100, a, b, c, d]);
const pointsFor = (path: number[]) => path.map((close, i) => ({ date: `2026-01-${String(i + 1).padStart(2, "0")}`, close }));

describe("[sweep] B114 drawdown exhaustive peak-trough pairs", () => {
  it.each(paths.map((path) => [path] as const))("path %j", (path) => {
    const points = pointsFor(path);
    let worst = 0;
    let peakIndex = 0;
    let troughIndex = 0;
    for (let j = 1; j < path.length; j++) for (let i = 0; i < j; i++) {
      const decline = path[j] / path[i] - 1;
      if (decline < worst) { worst = decline; peakIndex = i; troughIndex = j; }
    }
    const recovered = worst < 0 && path.slice(troughIndex + 1).some((price) => price >= path[peakIndex]);
    const expected = { status: "computed", value: { maxDrawdownPct: Number((worst * 100).toFixed(2)) + 0, peakDate: points[peakIndex].date, troughDate: points[troughIndex].date, recovered } };
    expect(maxDrawdown(points)).toEqual(expected);
    expect(maxDrawdown(points.map((p) => ({ ...p, close: p.close * 2 })))).toEqual(expected);
    expect(points).toEqual(pointsFor(path));
  });
});

const splits: Array<[number, number, number]> = [];
for (const length of [2, 10, 20, 50, 100]) for (const fraction of [0.1, 0.25, 0.5, 0.7, 0.9]) for (const min of [1, 5, 10]) splits.push([length, fraction, min]);
describe("[sweep] B114 chronological split membership and minimum-window bounds", () => {
  it.each(splits)("length %s fraction %s minimum %s", (length, fraction, min) => {
    const points = Array.from({ length }, (_, i) => ({ date: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10), close: 100 + i }));
    const cut = Math.floor(length * fraction);
    const r = splitTrainTest([...points].reverse(), fraction, min);
    if (cut < min || length - cut < min) expect(r.status).toBe("unavailable");
    else {
      expect(r).toEqual({ status: "computed", value: { splitDate: points[cut].date, train: points.slice(0, cut), test: points.slice(cut) } });
      if (r.status === "computed") expect(new Set([...r.value.train, ...r.value.test].map((p) => p.date)).size).toBe(length);
    }
  });
});

describe("[hand] B114 invalid-price removal precedes deduplication", () => {
  it("a malformed first quote does not suppress a valid quote on the same date", () => {
    expect(cleanSeries([{ date: "2026-01-01", close: NaN }, { date: "2026-01-01", close: 10 }, { date: "2026-01-02", close: 12 }])).toMatchObject({ points: [{ date: "2026-01-01", close: 10 }, { date: "2026-01-02", close: 12 }], quality: { droppedInvalidPrice: 1, droppedDuplicateDate: 0, usedPoints: 2 } });
  });
  it("an empty drawdown history is unavailable, not zero", () => {
    expect(maxDrawdown([]).status).toBe("unavailable");
  });
});
