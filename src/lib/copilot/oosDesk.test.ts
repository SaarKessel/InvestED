import { describe, expect, it } from "vitest";
import { loadOos, parseOosRequest } from "./oosDesk";
import type { MarketAsset } from "@/types";

function hist(n: number, seed: number) {
  let s = seed, p = 100; const out: { date: string; close: number }[] = []; const d = new Date("2020-01-01T00:00:00Z");
  for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) % 4294967296; p *= 1 + 0.0004 + (s / 4294967296 - 0.5) * 0.02; out.push({ date: d.toISOString().slice(0, 10), close: p }); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}
const asset = (symbol: string, seed: number, extra: Partial<MarketAsset> = {}) => ({ symbol, history: hist(900, seed), isMock: false, dataSource: "yahoo", ...extra }) as unknown as MarketAsset;

describe("oos desk", () => {
  it("fires on out-of-sample wording with tickers, in English and Hebrew", () => {
    expect(parseOosRequest("does an optimized AAPL MSFT KO portfolio hold up out of sample?")).toEqual({ symbols: ["AAPL", "MSFT", "KO"] });
    expect(parseOosRequest("בדיקה מחוץ למדגם ל AAPL ו MSFT")).toEqual({ symbols: ["AAPL", "MSFT"] });
  });
  it("stays quiet on unrelated questions", () => {
    expect(parseOosRequest("what is the risk of AAPL")).toBeNull();
    expect(parseOosRequest("out of sample")).toBeNull();
  });
  it("runs on real history and refuses on missing or simulated history", async () => {
    const load = async (s: string) => asset(s, s.charCodeAt(0));
    const ok = await loadOos({ symbols: ["AAA", "BBB"] }, load);
    expect(ok.outcome.ok).toBe(true);
    const bad = await loadOos({ symbols: ["AAA", "BBB"] }, async (s) => (s === "BBB" ? asset(s, 1, { isMock: true }) : asset(s, 2)));
    expect(bad.outcome).toEqual({ ok: false, reason: "too_little_history" }); expect(bad.unavailable).toEqual(["BBB"]);
    const none = await loadOos({ symbols: ["AAA", "BBB"] }, async (s) => (s === "AAA" ? null : asset(s, 3)));
    expect(none.unavailable).toEqual(["AAA"]);
  });
  it("needs 2 to 5 tickers", async () => {
    expect((await loadOos({ symbols: ["AAA"] }, async () => null)).outcome).toEqual({ ok: false, reason: "too_few_assets" });
    expect((await loadOos({ symbols: ["A", "B", "C", "D", "E", "F"] }, async () => null)).outcome).toEqual({ ok: false, reason: "too_many_assets" });
  });
});
