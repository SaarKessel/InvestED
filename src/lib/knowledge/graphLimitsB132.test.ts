import { describe, expect, it } from "vitest";
import { allConcepts } from "./concepts/registry";
import { neighbourhood, shortestPath } from "./graph";
const concepts = allConcepts();

describe("[sweep] B132 graph limits preserve sorted prefixes and node metadata", () => {
  it.each(concepts.map((c) => [c.id, c] as const))("%s", (id, concept) => {
    const complete = neighbourhood(id, 3, concepts.length);
    for (const limit of [0, 1, 3, 8, concepts.length]) {
      expect(neighbourhood(id, 3, limit)).toEqual(complete.slice(0, limit));
    }
    expect(new Set(complete.map((r) => r.node.id)).size).toBe(complete.length);
    expect(complete.every((r) => r.node.id !== id && r.distance >= 1 && r.distance <= 3)).toBe(true);
    for (const row of complete) {
      const source = concepts.find((c) => c.id === row.node.id)!;
      expect(row.node).toEqual({ id: source.id, en: source.en, he: source.he, category: source.category, hasText: source.explain !== null });
    }
    expect(shortestPath(id, id)).toEqual([{ id, en: concept.en, he: concept.he, category: concept.category, hasText: concept.explain !== null }]);
    for (const related of concept.related) {
      expect(shortestPath(id, related)?.map((n) => n.id)).toEqual([id, related]);
      expect(shortestPath(related, id)?.map((n) => n.id)).toEqual([related, id]);
    }
  });
});

describe("[hand] B132 graph absent identities stay absent", () => {
  it("unknown endpoints cannot invent nodes or routes", () => {
    expect(neighbourhood("__missing_graph_node__", 3, 100)).toEqual([]);
    expect(shortestPath("__missing_graph_node__", concepts[0].id)).toBeNull();
    expect(shortestPath(concepts[0].id, "__missing_graph_node__")).toBeNull();
    expect(shortestPath("__missing_graph_node__", "__missing_graph_node__")).toBeNull();
  });
});
