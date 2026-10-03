import { describe, expect, it } from "vitest";
import { shouldRefreshNews } from "./newsRefresh";
const now = Date.parse("2026-10-03T12:00:00Z");
const rows = [-100, 0, 30, 59, 60, 61, 120, 900, 3600].flatMap((ttl) => [-1, 0, 1].flatMap((delta) => ["Z", "+02:00", "-04:00"].map((zone) => [ttl, delta, zone] as const)));
function timestamp(ms: number, zone: string): string {
  if (zone === "Z") return new Date(ms).toISOString();
  const offset = zone === "+02:00" ? 120 : -240;
  return new Date(ms + offset * 60000).toISOString().replace("Z", zone);
}
describe("[sweep] B140 news-refresh TTL boundary is timezone-independent", () => {
  it.each(rows)("TTL %s seconds delta %s ms offset %s", (ttl, delta, zone) => {
    const age = Math.max(60, ttl) * 1000 + delta;
    const fetched = timestamp(now - age, zone);
    expect(Date.parse(fetched)).toBe(now - age);
    expect(shouldRefreshNews(fetched, now, ttl)).toBe(delta >= 0);
  });
});
describe("[hand] B140 missing invalid and future timestamps cannot assert freshness", () => {
  it("refreshes when the current feed timestamp is unusable", () => {
    for (const value of [null, "", "bad-date", "2026-99-99", new Date(now + 1).toISOString()]) expect(shouldRefreshNews(value, now, 900)).toBe(true);
    expect(shouldRefreshNews(new Date(now).toISOString(), now, 900)).toBe(false);
  });
});
