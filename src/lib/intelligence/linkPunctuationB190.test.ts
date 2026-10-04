import { describe, expect, it } from "vitest";
import { unknownLinks } from "./claims";
const rows = ["https://example.test/source", "https://example.test/path?q=value", "http://example.test/page"].flatMap((url) => ["", ".", ",", ";", ").", '"]'].map((tail) => [url, tail] as const));
describe("[sweep] B190 source-link matching tolerates sentence delimiters but not longer paths", () => {
  it.each(rows)("URL %s delimiter %s", (url, tail) => {
    expect(unknownLinks(`Source ${url}${tail}`, [`Known ${url}`])).toEqual([]);
    const invented = `${url}/invented`;
    expect(unknownLinks(`Source ${invented}${tail}`, [`Known ${url}`])).toEqual([invented]);
    expect(unknownLinks(`Source ${url}`, [`Known ${invented}`])).toEqual([url]);
  });
});
describe("[hand] B190 unknown links deduplicate without changing first-seen order", () => {
  it("returns only unseen exact URLs and no placeholders", () => {
    expect(unknownLinks("https://a.test/x https://b.test/y https://a.test/x", [])).toEqual(["https://a.test/x", "https://b.test/y"]);
    expect(unknownLinks("No links here", [])).toEqual([]);
  });
});
