import { describe, expect, it } from "vitest";
import { calculateEma, calculateMacd, calculateRsi, calculateSma, calculateVolatility } from "./indicators";
const history = (values: number[]) => values.map((close, i) => ({ date: `2026-01-${String(i+1).padStart(2,"0")}`, open: close, high: close, low: close, close, price: close, volume: 1 }));
describe("Phase 7 technical indicators", () => {
 it("computes deterministic SMA and EMA", () => { const data=history(Array.from({length:30},(_,i)=>i+1)); expect(calculateSma(data,20)).toBe(20.5); expect(calculateEma(data,20)).toBeTypeOf("number"); });
 it("requires adequate history", () => { const data=history([1,2]); expect(calculateRsi(data)).toBeNull(); expect(calculateSma(data,20)).toBeNull(); expect(calculateMacd(data)).toBeNull(); });
 it("computes RSI boundaries", () => { expect(calculateRsi(history(Array.from({length:15},(_,i)=>i+1)))).toBe(100); expect(calculateRsi(history(Array(15).fill(3)))).toBe(50); });
 it("computes volatility and MACD", () => { const data=history(Array.from({length:50},(_,i)=>100+i+(i%2))); expect(calculateVolatility(data)).not.toBeNull(); expect(calculateMacd(data)).toMatchObject({macd:expect.any(Number),signal:expect.any(Number),histogram:expect.any(Number)}); });
});
