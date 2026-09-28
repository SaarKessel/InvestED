import { describe, expect, it } from "vitest";
import { shouldRefreshNews } from "./newsRefresh";

describe("news refresh on return", () => {
  const now = Date.parse("2026-09-28T18:00:00Z");
  it("refreshes when no result or timestamp is usable", () => {
    expect(shouldRefreshNews(null, now, 900)).toBe(true);
    expect(shouldRefreshNews("bad", now, 900)).toBe(true);
    expect(shouldRefreshNews("2026-09-28T18:01:00Z", now, 900)).toBe(true);
  });
  it("waits for the provider TTL, with a one-minute minimum", () => {
    expect(shouldRefreshNews("2026-09-28T17:50:00Z", now, 900)).toBe(false);
    expect(shouldRefreshNews("2026-09-28T17:45:00Z", now, 900)).toBe(true);
    expect(shouldRefreshNews("2026-09-28T17:59:30Z", now, 0)).toBe(false);
  });
});
