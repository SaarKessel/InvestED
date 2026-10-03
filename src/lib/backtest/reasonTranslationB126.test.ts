import { describe, expect, it } from "vitest";
import { reasonText } from "./reasonText";
const rows: Array<[string, string]> = [];
for (const need of [2, 5, 10, 20, 60, 253]) for (const have of [0, 1, 4, 19, 120]) {
  rows.push([`Need ${need} observations (have ${have})`, `נדרשות ${need} תצפיות (יש ${have})`]);
  rows.push([`Need at least ${need} aligned return observations (have ${have})`, `נדרשות לפחות ${need} תצפיות תשואה מיושרות (יש ${have})`]);
  rows.push([`Need at least ${need} return observations (have ${have})`, `נדרשות לפחות ${need} תצפיות תשואה (יש ${have})`]);
  rows.push([`Only ${have} common dates across assets; at least ${need} are needed`, `רק ${have} תאריכים משותפים בין הנכסים; נדרשים לפחות ${need}`]);
}
describe("[sweep] B126 metric-reason Hebrew substitution preserves all quantities", () => {
  it.each(rows)("reason %s", (en, he) => {
    expect(reasonText(en, "he")).toBe(he);
    expect(reasonText(en, "en")).toBe(en);
    expect(reasonText(en, "fr")).toBe(en);
    expect(he.match(/\d+/g)).toEqual(en.match(/\d+/g));
  });
});
describe("[hand] B126 unknown metric reason remains transparent", () => {
  it("does not fabricate a translation or drop a provider reason", () => {
    const r = "Provider ABC missing dataset 42";
    expect(reasonText(r, "he")).toBe(r);
  });
});
