import { describe, expect, it } from "vitest";
import { normalizeYahooScreener } from "./movers";

const payload = (time: unknown) => ({ finance: { result: [{ quotes: [{ symbol: "TEST", regularMarketPrice: 12, regularMarketTime: time }, { symbol: "GOOD", regularMarketTime: 1800000000 }] }] } });
const invalid = [NaN, Infinity, -Infinity, 1e20, -1e20, Number.MAX_VALUE, -Number.MAX_VALUE, "1800000000", { raw: 1e20 }, { raw: NaN }, null, undefined];

describe("[sweep] B115 invalid mover timestamps do not crash the whole quote list", () => {
  it.each(invalid.map((time, i) => [i, time] as const))("invalid timestamp case %s", (_i, time) => {
    const movers = normalizeYahooScreener(payload(time));
    expect(movers).toHaveLength(2);
    expect(movers[0]).toMatchObject({ symbol: "TEST", price: 12, timestamp: null });
    expect(movers[1].timestamp).toBe(new Date(1800000000000).toISOString());
  });
});

describe("[hand] B115 valid mover timestamp contract", () => {
  it("accepts zero epoch seconds without substituting a current date", () => {
    expect(normalizeYahooScreener(payload(0))[0].timestamp).toBe("1970-01-01T00:00:00.000Z");
  });
  it("preserves valid negative epoch timestamps and wrapped raw seconds", () => {
    expect(normalizeYahooScreener(payload(-1))[0].timestamp).toBe("1969-12-31T23:59:59.000Z");
    expect(normalizeYahooScreener(payload({ raw: 1800000000 }))[0].timestamp).toBe(new Date(1800000000000).toISOString());
  });
});
