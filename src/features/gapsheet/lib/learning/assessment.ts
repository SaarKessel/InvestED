import type { LearnableSkill } from "./curriculum";
import { pick, type Lang } from "@/features/gapsheet/lib/i18n";
import { skillEvidence, type LedgerEntry } from "./ledger";

/** Diagnostic: real spreadsheet tasks, one per core skill, validated by the same semantic validator as practice. No multiple choice. */
export const ASSESSMENT_SKILLS: LearnableSkill[] = ["sum", "average", "sorting", "filtering", "if"];
export type ExcelLevel = "beginner" | "basic" | "intermediate";
export function excelLevel(passed: number, total = ASSESSMENT_SKILLS.length): ExcelLevel {
  const r = total === 0 ? 0 : passed / total; return r >= 0.8 ? "intermediate" : r >= 0.4 ? "basic" : "beginner";
}
export const levelLabel = (l: ExcelLevel, lang: Lang) => ({ beginner: pick(lang, "מתחילים", "Beginner"), basic: pick(lang, "בסיסי", "Basic"), intermediate: pick(lang, "בינוני", "Intermediate") }[l]);
/** Passing a diagnostic task unaided is evidence of PROFICIENT (60). It never lowers an existing score. */
export const ASSESSMENT_CREDIT = 60;
export function applyAssessment(scores: Record<string, number>, results: Record<string, boolean>): Record<string, number> {
  const out = { ...scores }; for (const [k, ok] of Object.entries(results)) if (ok) out[k] = Math.max(out[k] ?? 0, ASSESSMENT_CREDIT); return out;
}

export const BASE_SEED = 7;
/** Different data family from BASE_SEED (data repeats every 3 seeds), so a retest is a new context, not the same exercise. */
export const RETEST_SEED = 8;
export const HARDER_LADDER: LearnableSkill[] = ["sumif", "countif", "sumifs", "iferror"];
export interface Probe { skill: LearnableSkill; seed: number }

/** Level from evidence: counts ASSESSMENT_SKILLS with a counted independent success in the ledger. One task can never reach "basic". */
export function excelLevelFromLedger(ledger: LedgerEntry[]): ExcelLevel {
  const n = ASSESSMENT_SKILLS.filter((k) => skillEvidence(ledger, k).independentTasks.length > 0).length;
  return n >= 2 ? excelLevel(n) : "beginner";
}
/** Adaptive deepening after the base check. Strong result: harder skills in order (the flow stops at the first miss). Weak result: retest up to 2 failed skills on different data. results keys are `${skill}:${seed}`. */
export function planDeepening(results: Record<string, boolean>): { mode: "harder" | "retest" | "none"; tasks: Probe[] } {
  const base = ASSESSMENT_SKILLS.map((k) => ({ k, r: results[`${k}:${BASE_SEED}`] }));
  if (base.some((b) => b.r === undefined)) return { mode: "none", tasks: [] };
  const passed = base.filter((b) => b.r).length;
  if (passed >= ASSESSMENT_SKILLS.length - 1) return { mode: "harder", tasks: HARDER_LADDER.filter((k) => results[`${k}:${BASE_SEED}`] === undefined).map((skill) => ({ skill, seed: BASE_SEED })) };
  if (ASSESSMENT_SKILLS.some((k) => results[`${k}:${RETEST_SEED}`] !== undefined)) return { mode: "none", tasks: [] }; // retest happens once, for at most 2 skills
  const failed = base.filter((b) => !b.r).map((b) => b.k).filter((k) => results[`${k}:${RETEST_SEED}`] === undefined).slice(0, 2);
  return failed.length ? { mode: "retest", tasks: failed.map((skill) => ({ skill, seed: RETEST_SEED })) } : { mode: "none", tasks: [] };
}
