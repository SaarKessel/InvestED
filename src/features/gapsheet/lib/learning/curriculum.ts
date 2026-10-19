import type { SkillId } from "@/features/gapsheet/types/ai";
import { statusFor } from "./mastery";
import type { Lang } from "@/features/gapsheet/lib/i18n";
import { pick } from "@/features/gapsheet/lib/i18n";

/** Excel skill map (master prompt 49): an explicit, supported subset ordered as a learning path. Only skills that are implemented and tested appear here. */
export type LearnableSkill = Exclude<SkillId, "none">;
export interface Stage { id: string; he: string; en: string; skills: LearnableSkill[] }
export const STAGES: Stage[] = [
  { id: "basic", he: "נוסחאות בסיס", en: "Basic formulas", skills: ["sum", "average", "min", "max", "count"] },
  { id: "logic", he: "לוגיקה", en: "Logic", skills: ["if"] },
  { id: "conditional", he: "חישוב לפי תנאי", en: "Conditional calculation", skills: ["sumif", "countif", "sumifs"] },
  { id: "summary", he: "סיכום נתונים", en: "Summarizing data", skills: ["pivot"] },
  { id: "text", he: "טקסט ושגיאות", en: "Text and errors", skills: ["iferror", "text", "dates"] },
  { id: "lookup", he: "חיפוש בטבלאות", en: "Lookups", skills: ["xlookup", "indexmatch"] },
  { id: "data", he: "ניהול נתונים", en: "Working with data", skills: ["sorting", "filtering", "dedupe"] },
];
/** A skill is "ready" once its prerequisites have been at least practiced (score >= 30). Nothing is locked: the path recommends, it never blocks. */
export const PREREQS: Record<LearnableSkill, LearnableSkill[]> = {
  sum: [], average: ["sum"], min: ["sum"], max: ["sum"], count: ["sum"], if: ["sum"], sumif: ["sum", "if"], countif: ["count", "if"], sorting: [], filtering: ["sorting"], dedupe: ["sorting"], dates: ["sum"], sumifs: ["sumif"], iferror: ["if"], text: ["sum"], pivot: ["sumif"], xlookup: ["sum"], indexmatch: ["xlookup"],
};
export const ORDER: LearnableSkill[] = STAGES.flatMap((s) => s.skills);
export const stageName = (s: Stage, lang: Lang) => pick(lang, s.he, s.en);
export const isReady = (skill: LearnableSkill, scores: Record<string, number>) => PREREQS[skill].every((p) => (scores[p] ?? 0) >= 30);

/** The next skill to work on: the first in path order that is below PROFICIENT and whose prerequisites are practiced. Null when everything is proficient. */
export function nextSkill(scores: Record<string, number>): LearnableSkill | null {
  return ORDER.find((k) => (scores[k] ?? 0) < 60 && isReady(k, scores)) ?? null;
}
export function stageProgress(stage: Stage, scores: Record<string, number>) {
  const done = stage.skills.filter((k) => statusFor(scores[k] ?? 0) === "PROFICIENT" || statusFor(scores[k] ?? 0) === "MASTERED").length;
  return { done, total: stage.skills.length };
}

/** Stage unlock (owner-approved 9.10.2026): soft and derived, never stored and never blocking.
 *  complete = every skill proficient; unlocked = at least one skill is ready (prerequisites practiced); later = suggested for later.
 *  A "later" stage can always be opened; it only changes the recommendation. Legacy scores keep their stages unlocked via migrateLegacy. */
export type StageState = "complete" | "unlocked" | "later";
export function stageState(stage: Stage, scores: Record<string, number>): StageState {
  if (stage.skills.every((k) => (scores[k] ?? 0) >= 60)) return "complete";
  return stage.skills.some((k) => isReady(k, scores)) ? "unlocked" : "later";
}
