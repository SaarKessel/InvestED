import { describe, expect, it } from "vitest";
import { CHUNK_RELOAD_GUARD_MS, isChunkLoadError, shouldReloadForChunkError } from "./lazyWithRetry";

describe("isChunkLoadError", () => {
  it.each([
    "Failed to fetch dynamically imported module: https://x/assets/A-B123.js",
    "Loading chunk 7 failed. (missing: https://x/assets/A-B123.js)",
    "ChunkLoadError: Loading chunk 7 failed.",
    "Importing a module script failed.",
    "error loading dynamically imported module: https://x/assets/A-B123.js",
  ])("matches %s", (message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  it.each(["Network Error", "Cannot read properties of undefined", "timeout of 5000ms exceeded"])(
    "rejects unrelated error %s",
    (message) => {
      expect(isChunkLoadError(new Error(message))).toBe(false);
    },
  );

  it("handles non-Error values", () => {
    expect(isChunkLoadError("Failed to fetch dynamically imported module: x")).toBe(true);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError(42)).toBe(false);
  });
});

describe("shouldReloadForChunkError", () => {
  const chunkError = new Error("Failed to fetch dynamically imported module: x");

  it("reloads a first chunk failure", () => {
    expect(shouldReloadForChunkError(chunkError, 100_000, 0)).toBe(true);
  });

  it("suppresses a reload loop inside the guard window", () => {
    expect(shouldReloadForChunkError(chunkError, 100_000, 100_000 - CHUNK_RELOAD_GUARD_MS + 1)).toBe(false);
  });

  it("allows another reload after the guard window", () => {
    expect(shouldReloadForChunkError(chunkError, 100_000, 100_000 - CHUNK_RELOAD_GUARD_MS - 1)).toBe(true);
  });

  it("never reloads for unrelated errors", () => {
    expect(shouldReloadForChunkError(new Error("boom"), 100_000, 0)).toBe(false);
  });
});
