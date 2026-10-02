import { describe, expect, it } from "vitest";
import { calibrate } from "./calibration";
const mk = (p: number, o: 0 | 1) => ({ probability: p, outcome: o });
describe("calibrate", () => {
  it("scores a perfect forecaster 0", () => {
    const r = calibrate([mk(1, 1), mk(0, 0), mk(1, 1), mk(0, 0), mk(1, 1)])!;
    expect(r.brier).toBe(0);
    expect(r.verdict).toBe("better_than_coin_flip");
  });
  it("always saying 50% equals the coin flip", () => {
    const r = calibrate([mk(0.5, 1), mk(0.5, 0), mk(0.5, 1), mk(0.5, 0), mk(0.5, 1)])!;
    expect(r.brier).toBe(0.25);
    expect(r.verdict).toBe("same_as_coin_flip");
  });
  it("punishes confident misses", () => {
    const r = calibrate([mk(0.9, 0), mk(0.9, 0), mk(0.9, 0), mk(0.9, 1), mk(0.9, 0)])!;
    expect(r.brier).toBeCloseTo(0.65, 6);
    expect(r.verdict).toBe("worse_than_coin_flip");
    expect(r.bins).toHaveLength(1);
    expect(r.bins[0].observedRate).toBeCloseTo(0.2);
  });
  it("puts 100% in the top bin", () => {
    const r = calibrate([mk(1, 1), mk(1, 1), mk(1, 1), mk(1, 1), mk(1, 1)])!;
    expect(r.bins[0].to).toBe(1);
  });
  it("refuses too few or invalid forecasts", () => {
    expect(calibrate([mk(0.5, 1)])).toBeNull();
    expect(calibrate([mk(0.5, 1), mk(0.5, 1), mk(0.5, 1), mk(0.5, 1), { probability: 1.5, outcome: 1 }])).toBeNull();
  });
});
