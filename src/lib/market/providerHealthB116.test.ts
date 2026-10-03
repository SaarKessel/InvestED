import { describe, expect, it } from "vitest";
import { createProviderHealth } from "./marketRouting";
import { ProviderRateLimitError, ProviderUnavailableError } from "./errors";
import type { MarketProviderId } from "./providers/types";

const rows: Array<[MarketProviderId, number, number, boolean]> = [];
for (const id of ["yahoo_finance", "alpha_vantage"] as const) for (const normal of [0, 1, 30000]) for (const quota of [10, 100, 300000]) for (const rateLimited of [false, true]) rows.push([id, normal, quota, rateLimited]);

describe("[sweep] B116 provider cooldown exact boundaries and isolation", () => {
  it.each(rows)("provider %s failure %s quota %s rate limited %s", (id, failureCooldownMs, rateLimitCooldownMs, rateLimited) => {
    let time = 1000000;
    const h = createProviderHealth({ now: () => time, failureCooldownMs, rateLimitCooldownMs });
    const other: MarketProviderId = id === "yahoo_finance" ? "alpha_vantage" : "yahoo_finance";
    const duration = rateLimited ? rateLimitCooldownMs : failureCooldownMs;
    h.recordFailure(id, rateLimited ? new ProviderRateLimitError("quota") : new ProviderUnavailableError("down"));
    expect(h.cooldownRemainingMs(id)).toBe(duration);
    expect(h.isCoolingDown(id)).toBe(duration > 0);
    expect(h.isCoolingDown(other)).toBe(false);
    expect(h.cooldownRemainingMs(other)).toBe(0);
    if (duration > 0) {
      time += duration - 1;
      expect(h.isCoolingDown(id)).toBe(true); expect(h.cooldownRemainingMs(id)).toBe(1);
      time++;
    }
    expect(h.isCoolingDown(id)).toBe(false); expect(h.cooldownRemainingMs(id)).toBe(0);
    time += 100;
    expect(h.cooldownRemainingMs(id)).toBe(0);
  });
});

describe("[hand] B116 health recovery", () => {
  it("success resets only the recovered provider", () => {
    const h = createProviderHealth({ now: () => 1000 });
    h.recordFailure("yahoo_finance", new ProviderRateLimitError("quota"));
    h.recordFailure("alpha_vantage", new Error("network"));
    h.recordSuccess("yahoo_finance");
    expect(h.cooldownRemainingMs("yahoo_finance")).toBe(0);
    expect(h.cooldownRemainingMs("alpha_vantage")).toBe(30000);
  });
  it("a later rate-limit failure replaces a short cooldown with the longer quota window", () => {
    let now = 1000;
    const h = createProviderHealth({ now: () => now });
    h.recordFailure("alpha_vantage", new Error("failure")); now += 10000;
    h.recordFailure("alpha_vantage", new ProviderRateLimitError("quota"));
    expect(h.cooldownRemainingMs("alpha_vantage")).toBe(300000);
  });
});
