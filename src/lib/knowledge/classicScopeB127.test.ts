import { describe, expect, it } from "vitest";
import { CLASSIC_NOTES, classicExplanation } from "./content/classics";
import { getConcept } from "./concepts/registry";
const rows = CLASSIC_NOTES.flatMap((note) => (["en", "he"] as const).map((lang) => [note.id, lang] as const));

describe("[sweep] B127 classic education content preserves source and limitations", () => {
  it.each(rows)("note %s language %s", (id, lang) => {
    const note = CLASSIC_NOTES.find((n) => n.id === id)!;
    const text = classicExplanation(note, lang);
    for (const part of [note.title, note.attribution, note.idea, note.why, note.practice, note.limits]) expect(text).toContain(part[lang]);
    for (const source of note.sources) {
      expect(text).toContain(source.label); expect(text).toContain(source.url);
      expect(source.url).toMatch(/^https:\/\//);
    }
    expect(text).toContain(lang === "en" ? "not personal investment advice" : "לא ייעוץ השקעות אישי");
    expect(getConcept(id)).toMatchObject({ en: note.title.en, he: note.title.he, category: note.category, related: note.related, explain: note.title.en });
    if (note.kind === "book-synthesis") expect(text).toContain(lang === "en" ? "not the book's text or a full summary" : "לא טקסט מהספר או סיכום מלא");
    else expect(text).toContain(lang === "en" ? "not a calculation or market forecast" : "לא חישוב או תחזית שוק");
  });
});
describe("[hand] B127 content rendering is repeatable and read-only", () => {
  it("rendering in either language does not modify the stored note", () => {
    const note = CLASSIC_NOTES[0];
    const before = JSON.stringify(note);
    const en = classicExplanation(note, "en");
    classicExplanation(note, "he");
    expect(classicExplanation(note, "en")).toBe(en);
    expect(JSON.stringify(note)).toBe(before);
  });
});
