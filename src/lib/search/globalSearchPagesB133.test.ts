import { describe, expect, it } from "vitest";
import { globalSearch } from "./globalSearch";
import { SITE_CAPABILITIES } from "../copilot/siteCapabilities";
import { normalizeTerm } from "../knowledge/concepts/registry";
const rows = SITE_CAPABILITIES.flatMap((p) => (['en', 'he'] as const).flatMap((queryLanguage) => p[queryLanguage].filter((alias) => normalizeTerm(alias).length >= 2).flatMap((alias) => (['en', 'he'] as const).map((lang) => [p.id, alias, lang, p] as const))));
describe("[sweep] B133 page aliases preserve routes and output-language labels", () => {
  it.each(rows)("%s alias %s output %s", (id, alias, lang, page) => {
    const hits = globalSearch(alias, { lang, limit: 1000 });
    const hit = hits.find((h) => h.kind === 'page' && h.id === id);
    expect(hit).toEqual({ kind: 'page', id, label: page[lang][0], score: 100, route: page.route });
    expect(globalSearch(`  ${alias.toUpperCase()}  `, { lang, limit: 1000 })).toEqual(hits);
    for (const limit of [0, 1, 3, 8]) expect(globalSearch(alias, { lang, limit })).toEqual(hits.slice(0, limit));
    expect(new Set(hits.map((h) => `${h.kind}:${h.id}`)).size).toBe(hits.length);
  });
});
describe("[hand] B133 page search rejects empty and one-character queries", () => {
  it("blank and normalized short input cannot flood the result list", () => {
    for (const q of ['', ' ', 'a', 'א']) for (const lang of ['en', 'he'] as const) expect(globalSearch(q, { lang, limit: 1000 })).toEqual([]);
  });
});
