import { describe, expect, it } from "vitest";
import { createTtlCache } from "./cache";

const scenarios: Array<[number, number, number]> = [];
for (const capacity of [1, 2, 5]) for (const ttl of [0, 1, 10, 100]) for (const seed of [1, 7, 42, 99, 2026]) scenarios.push([capacity, ttl, seed]);

describe("[sweep] B113 TTL cache operation sequences against an independent list model", () => {
  it.each(scenarios)("capacity %s ttl %s seed %s", (capacity, ttl, seed) => {
    let time = 1000;
    let random = seed;
    const cache = createTtlCache<number>({ maxEntries: capacity, ttlMs: ttl, now: () => time });
    let model: Array<{ key: string; value: number; stored: number }> = [];
    const read = (key: string) => {
      const item = model.find((entry) => entry.key === key);
      if (item && time - item.stored > ttl) { model = model.filter((entry) => entry !== item); return undefined; }
      return item;
    };
    for (let i = 0; i < 200; i++) {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      const key = `K${(random >>> 8) % 7}`;
      switch (random % 7) {
        case 0: {
          model = model.filter((entry) => entry.key !== key);
          model.push({ key, value: i, stored: time });
          if (model.length > capacity) model.shift();
          cache.set(key, i); break;
        }
        case 1: expect(cache.get(key)).toBe(read(key)?.value ?? null); break;
        case 2: expect(cache.has(key)).toBe(read(key) !== undefined); break;
        case 3: expect(cache.ageMs(key)).toBe(read(key) ? time - read(key)!.stored : null); break;
        case 4: cache.delete(key); model = model.filter((entry) => entry.key !== key); break;
        case 5: time += (random >>> 16) % 25; break;
        case 6: if (i % 17 === 0) { cache.clear(); model = []; } break;
      }
      expect(cache.size).toBe(model.length);
    }
  });
});

describe("[hand] B113 cache refresh and exact expiration", () => {
  it("replacing a key refreshes its insertion order rather than evicting itself", () => {
    const c = createTtlCache<number>({ ttlMs: 100, maxEntries: 2, now: () => 0 });
    c.set("A", 1); c.set("B", 2); c.set("A", 3); c.set("C", 4);
    expect(c.get("A")).toBe(3); expect(c.get("B")).toBeNull(); expect(c.get("C")).toBe(4);
  });
  it("expiration is inclusive at TTL and removes the entry one millisecond later", () => {
    let time = 0;
    const c = createTtlCache<number>({ ttlMs: 10, now: () => time });
    c.set("A", 0); time = 10;
    expect(c.get("A")).toBe(0); expect(c.has("A")).toBe(true); expect(c.ageMs("A")).toBe(10);
    time = 11; expect(c.get("A")).toBeNull(); expect(c.size).toBe(0);
  });
});
