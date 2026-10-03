import { describe, expect, it } from "vitest";
import { runMathDesk } from "./mathDesk";
const loans: Array<[number, number, number]> = [];
for (const amount of [1000, 50000, 500000]) for (const rate of [0, 1, 4, 8]) for (const years of [1, 5, 10, 30]) loans.push([amount, rate, years]);

describe("[sweep] B122 arithmetic desk payment and future-value closed forms", () => {
  it.each(loans)("loan %s rate %s years %s", (amount, rate, years) => {
    const r = rate / 1200, n = years * 12;
    const payment = r === 0 ? amount / n : amount * r * (1 + r) ** n / ((1 + r) ** n - 1);
    const p = runMathDesk(`pmt(${amount},${rate},${years})`);
    expect(p?.ok).toBe(true);
    expect(p?.value).toBeCloseTo(payment, 6);
    const m = amount / 100;
    const future = r === 0 ? amount + m * n : amount * (1 + r) ** n + m * ((1 + r) ** n - 1) / r;
    const f = runMathDesk(`fv(${rate},${years},${m},${amount})`);
    expect(f?.ok).toBe(true); expect(f?.value).toBeCloseTo(future, 5);
  });
});
const returns: Array<[number, number]> = [];
for (const nominal of [-50, -5, 0, 2, 10, 100]) for (const inflation of [-20, 0, 2, 5, 25]) returns.push([nominal, inflation]);
describe("[sweep] B122 real-return multiplicative identity", () => {
  it.each(returns)("nominal %s inflation %s", (nominal, inflation) => {
    const r = runMathDesk(`real(${nominal},${inflation})`);
    expect(r?.ok).toBe(true);
    expect((1 + r!.value! / 100) * (1 + inflation / 100)).toBeCloseTo(1 + nominal / 100, 10);
  });
});
describe("[hand] B122 compound-rate semantics", () => {
  it("doubling over ten years gives the geometric annual rate, not ten percent", () => {
    const r = runMathDesk("cagr(100,200,10)");
    expect(r?.ok).toBe(true); expect(r?.value).toBeCloseTo((2 ** 0.1 - 1) * 100, 10);
  });
  it("zero-rate future value includes end-of-month deposits without growth", () => {
    expect(runMathDesk("fv(0,2,100,1000)")).toMatchObject({ ok: true, value: 3400 });
  });
});
