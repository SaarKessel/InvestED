import { describe, expect, it } from "vitest";
import { allConcepts, findConceptsInText, relatedChips } from "./concepts/registry";
const concepts = allConcepts();
const rows = concepts.flatMap((c) => (["en", "he"] as const).map((lang) => [c.id, lang, c[lang]] as const));
describe("[sweep] B137 related chips match stored forward and reverse relations", () => {
  it.each(rows)("concept %s language %s name %s", (_id, lang, name) => {
    const question = lang === "he" ? `מה זה ${name}?` : `What is ${name}?`;
    const selected = findConceptsInText(question, 1)[0];
    if (!selected) { expect(relatedChips(question)).toEqual([]); return; }
    const direct = selected.related.map((id) => concepts.find((c) => c.id === id)!).filter(Boolean);
    const back = concepts.filter((c) => c.related.includes(selected.id) && !selected.related.includes(c.id));
    const expected = [...direct, ...back].slice(0, 8).filter((c) => c.explain).map((c) => ({ id: c.id, label: c[lang], ask: lang === "he" ? `מה זה ${c.he}?` : `What is ${c.en}?` }));
    for (const limit of [0, 1, 4, 8, 20]) expect(relatedChips(question, limit)).toEqual(expected.slice(0, limit));
    const actual = relatedChips(question, 20);
    expect(new Set(actual.map((c) => c.id)).size).toBe(actual.length);
    expect(actual.every((chip) => concepts.find((c) => c.id === chip.id)?.explain)).toBe(true);
  });
});
describe("[hand] B137 unknown questions do not invent related concepts", () => {
  it("returns nothing for absent concepts and blank input", () => {
    expect(relatedChips("b137unknownconceptword")).toEqual([]);
    expect(relatedChips("   ")).toEqual([]);
  });
});
