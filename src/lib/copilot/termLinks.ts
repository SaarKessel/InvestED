/** Finds known finance terms inside an answer so they can be clicked for the stored plain explanation. Matching only; no text is changed or added. */
import { allConcepts } from "@/lib/knowledge/concepts/registry";
import { conceptAnswerByLabel } from "@/lib/financialEducation";

export type Segment = { text: string; id?: string };
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const HE = /[א-ת]/;
/** Words that are also common verbs: "spreads your money" must not open the bid-ask spread card, so no plural/-s match for them. */
const NO_PLURAL = new Set(["spread", "nudge", "leverage"]);
const names = (() => {
  const out: Array<{ id: string; name: string }> = [];
  for (const c of allConcepts()) {
    if (!c.explain) continue;
    for (const n of [c.en, c.he, ...c.aliases]) if (n.trim().length >= 3) out.push({ id: c.id, name: n.trim() });
  }
  return out.sort((a, b) => b.name.length - a.name.length);
})();

export function linkTerms(text: string, max = 5): Segment[] {
  const taken: Array<{ start: number; end: number; id: string }> = [];
  const seen = new Set<string>();
  for (const { id, name } of names) {
    if (seen.has(id) || taken.length >= max) continue;
    const re = HE.test(name)
      ? new RegExp(`(?<![א-ת])[הבלומשכ]?(${esc(name)})(?![א-ת])`, "u")
      : new RegExp(`(?<![A-Za-z0-9א-ת])(${esc(name)}${NO_PLURAL.has(name.toLowerCase()) ? "" : "(?:(?<=[sx])es|s)?"})(?![A-Za-z0-9א-ת])`, "iu");
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index + m[0].length - m[1].length;
    const end = start + m[1].length;
    if (taken.some((t) => start < t.end && end > t.start)) continue;
    taken.push({ start, end, id });
    seen.add(id);
  }
  taken.sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let at = 0;
  for (const t of taken) {
    if (t.start > at) out.push({ text: text.slice(at, t.start) });
    out.push({ text: text.slice(t.start, t.end), id: t.id });
    at = t.end;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out.length ? out : [{ text }];
}

export function termExplanation(id: string, lang: "he" | "en"): { label: string; text: string } | null {
  const c = allConcepts().find((x) => x.id === id);
  if (!c?.explain) return null;
  const text = conceptAnswerByLabel(c.explain, lang);
  return text ? { label: lang === "he" ? c.he : c.en, text } : null;
}
