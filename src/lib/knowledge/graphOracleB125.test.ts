import { describe, expect, it } from "vitest";
import { allConcepts } from "./concepts/registry";
import { neighbourhood, shortestPath, graphStats } from "./graph";
const concepts = allConcepts();
const ids = concepts.map((c) => c.id);
const index = new Map(ids.map((id, i) => [id, i]));
const distances = ids.map((_id, i) => ids.map((_other, j) => i === j ? 0 : Infinity));
for (const c of concepts) for (const target of c.related) {
  const i = index.get(c.id)!, j = index.get(target)!;
  distances[i][j] = 1; distances[j][i] = 1;
}
// Floyd-Warshall uses the source relation table, independent of registry neighbour/BFS helpers.
for (let k = 0; k < ids.length; k++) for (let i = 0; i < ids.length; i++) for (let j = 0; j < ids.length; j++) distances[i][j] = Math.min(distances[i][j], distances[i][k] + distances[k][j]);

describe("[sweep] B125 knowledge neighbourhoods match all-pairs distance oracle", () => {
  it.each(ids)("concept %s", (id) => {
    const from = index.get(id)!;
    for (const depth of [0, 1, 2, 3]) {
      const expected = ids.map((other, i) => ({ id: other, distance: distances[from][i] })).filter((r) => r.id !== id && r.distance <= depth).sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
      expect(neighbourhood(id, depth, ids.length).map((r) => ({ id: r.node.id, distance: r.distance }))).toEqual(expected);
    }
    for (const target of [ids[0], ids[Math.floor(ids.length / 2)], ids[ids.length - 1]]) {
      const path = shortestPath(id, target);
      const distance = distances[from][index.get(target)!];
      if (!Number.isFinite(distance)) expect(path).toBeNull();
      else {
        expect(path!.length).toBe(distance + 1);
        expect(path![0].id).toBe(id); expect(path!.at(-1)!.id).toBe(target);
        for (let i = 1; i < path!.length; i++) expect(distances[index.get(path![i - 1].id)!][index.get(path![i].id)!]).toBe(1);
      }
    }
  });
});
describe("[hand] B125 graph counts conserve registry content", () => {
  it("category counts and explained/isolated membership come from the source table", () => {
    const stats = graphStats();
    expect(Object.values(stats.byCategory).reduce((a, b) => a + b, 0)).toBe(ids.length);
    expect(stats.withText).toBe(concepts.filter((c) => c.explain !== null).length);
    expect(stats.isolated).toEqual(ids.filter((_id, i) => distances[i].every((d, j) => i === j || !Number.isFinite(d))));
  });
});
