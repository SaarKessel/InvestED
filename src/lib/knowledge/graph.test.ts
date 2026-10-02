import { describe, expect, it } from "vitest";
import { allConcepts } from "./concepts/registry";
import { graphStats, neighbourhood, shortestPath } from "./graph";

describe("knowledge graph", () => {
  const withLinks = allConcepts().find((c) => c.related.length > 0)!;
  it("lists neighbours by distance", () => {
    const n = neighbourhood(withLinks.id, 2);
    expect(n.length).toBeGreaterThan(0);
    for (let i = 1; i < n.length; i++) expect(n[i].distance).toBeGreaterThanOrEqual(n[i - 1].distance);
    expect(n.every((x) => x.node.id !== withLinks.id)).toBe(true);
  });
  it("returns nothing for an unknown id", () => { expect(neighbourhood("nope")).toEqual([]); expect(shortestPath("nope", withLinks.id)).toBeNull(); });
  it("finds a path to a direct neighbour and to itself", () => {
    const to = withLinks.related[0];
    expect(shortestPath(withLinks.id, to)?.map((x) => x.id)).toEqual([withLinks.id, to]);
    expect(shortestPath(withLinks.id, withLinks.id)?.length).toBe(1);
  });
  it("has no links that point at missing concepts", () => {
    const s = graphStats();
    expect(s.brokenLinks).toEqual([]);
    expect(s.nodes).toBe(allConcepts().length);
    expect(s.withText).toBeLessThanOrEqual(s.nodes);
  });
});
