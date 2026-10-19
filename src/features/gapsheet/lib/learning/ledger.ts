import type { SkillStatus } from "./skills";

/** Evidence ledger (G2). Mastery is derived from this, never from activity counts. Rules: docs in GapSheet-G2-rules-he. */
export interface LedgerEntry {
  id: string; skill: string; kind: "exposure" | "attempt"; taskId?: string; contextId?: string; ts: number;
  hints: number; revealed: boolean; correct: boolean; source: "ai" | "explain" | "practice" | "assessment";
}
/** Locked by the owner on 9.10.2026: N=3 distinct independent tasks and R=3 days retention. Frozen so nothing changes it at runtime; a change is a code change plus a new decision. Numbers only matter once the hard evidence conditions hold. */
export const MASTERY_CONFIG = Object.freeze({ distinctTasks: 3, retentionDays: 3 });
const DAY = 86_400_000;
const MAX_LEDGER = 5000;

export function addEntry(ledger: LedgerEntry[], e: LedgerEntry): LedgerEntry[] { const l = [...ledger, e]; return l.length > MAX_LEDGER ? l.slice(l.length - MAX_LEDGER) : l; }
export const newEntry = (e: Omit<LedgerEntry, "id" | "ts"> & { ts?: number }): LedgerEntry => ({ ...e, ts: e.ts ?? Date.now(), id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}` });

export interface SkillEvidence { exposures: number; attempts: number; independentTasks: string[]; assistedTasks: string[]; transfer: boolean; retained: boolean; firstIndependentTs: number | null; retentionDueTs: number | null }

/** The first correct-or-revealed attempt of a task decides whether the task counts. A later clean repeat of a task first solved with help does not. */
export function skillEvidence(ledger: LedgerEntry[], skill: string, cfg: { distinctTasks: number; retentionDays: number } = MASTERY_CONFIG): SkillEvidence {
  const mine = ledger.filter((e) => e.skill === skill);
  const attempts = mine.filter((e) => e.kind === "attempt").sort((a, b) => a.ts - b.ts);
  const first = new Map<string, LedgerEntry>();
  for (const a of attempts) { const k = a.taskId ?? a.id; if (!first.has(k) && (a.correct || a.revealed)) first.set(k, a); }
  const indep: LedgerEntry[] = [], assisted: string[] = [];
  for (const [k, a] of first) { if (a.correct && !a.revealed && a.hints === 0 && (a.source === "practice" || a.source === "assessment")) indep.push(a); else if (a.correct) assisted.push(k); }
  indep.sort((a, b) => a.ts - b.ts);
  const f = indep[0] ?? null;
  const transfer = !!f && indep.some((a) => (a.contextId ?? "") !== (f.contextId ?? ""));
  const retained = !!f && indep.some((a) => a !== f && a.ts >= f.ts + cfg.retentionDays * DAY);
  return { exposures: mine.filter((e) => e.kind === "exposure").length, attempts: attempts.length, independentTasks: indep.map((a) => a.taskId ?? a.id), assistedTasks: assisted,
    transfer, retained, firstIndependentTs: f?.ts ?? null, retentionDueTs: f ? f.ts + cfg.retentionDays * DAY : null };
}

export function levelFor(e: SkillEvidence, cfg: { distinctTasks: number; retentionDays: number } = MASTERY_CONFIG): SkillStatus {
  if (e.independentTasks.length >= 1) return e.independentTasks.length >= cfg.distinctTasks && e.transfer && e.retained ? "MASTERED" : "PROFICIENT";
  if (e.attempts > 0) return "PRACTICING";
  if (e.exposures > 0) return "INTRODUCED";
  return "NOT_STARTED";
}
/** Representative score for consumers that still read a number (readiness, stages). Derived from the level only. */
export const scoreForLevel = (l: SkillStatus): number => ({ NOT_STARTED: 0, INTRODUCED: 10, PRACTICING: 40, PROFICIENT: 70, MASTERED: 95 }[l]);
export const verifiedLevel = (ledger: LedgerEntry[], skill: string) => levelFor(skillEvidence(ledger, skill));

/** Old scores are kept untouched and labelled unverified. They count as progress up to PRACTICING only; verified levels come from the ledger. */
export function migrateLegacy(legacy: Record<string, number>) {
  return {
    legacy: { ...legacy }, unverified: true as const,
    effective(old: Record<string, number>, ledger: LedgerEntry[]): Record<string, number> {
      const out: Record<string, number> = {};
      for (const k of new Set([...Object.keys(old), ...ledger.map((e) => e.skill)])) out[k] = Math.max(scoreForLevel(verifiedLevel(ledger, k)), Math.min(old[k] ?? 0, 59));
      return out;
    },
  };
}

/** Context of a generated practice task: same skill and same data family = same context (data repeats every 3 seeds). */
export function contextOf(taskId: string): string { const m = /^(?:assess_)?practice_(.+)_(\d+)$/.exec(taskId); return m ? `${m[1]}:d${Number(m[2]) % 3}` : taskId; }
