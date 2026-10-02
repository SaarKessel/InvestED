/** Plan object: ordered steps with dependencies, per-step state, bounded retries and a partial result. Pure and deterministic apart from what each step does. Wraps the existing sequential runners instead of replacing them. */
export type StepState = "pending" | "running" | "done" | "failed" | "timeout" | "blocked";
export interface PlanStep<T = unknown> {
  id: string; label: string;
  /** ids that must be "done" first; if one is not, this step is "blocked" and never runs */
  dependsOn?: string[];
  /** extra attempts after the first failure; capped by MAX_RETRIES */
  retries?: number;
  run: (prior: Record<string, unknown>) => Promise<T>;
}
export interface StepRecord { id: string; label: string; state: StepState; attempts: number; ms: number; error?: string }
export interface PlanRun { steps: StepRecord[]; values: Record<string, unknown>; /** at least one step finished and at least one did not */ partial: boolean; complete: boolean }
export const MAX_RETRIES = 2;
export const STEP_TIMEOUT_MS = 20_000;

const race = <T,>(p: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> =>
  new Promise((resolve, reject) => { const id = setTimeout(() => resolve(TIMED_OUT), ms); p.then((v) => { clearTimeout(id); resolve(v); }, (e) => { clearTimeout(id); reject(e); }); });
const TIMED_OUT = Symbol("timeout");

export async function runSteps(steps: PlanStep[], opts: { timeoutMs?: number; onState?: (r: StepRecord, all: StepRecord[]) => void } = {}): Promise<PlanRun> {
  const records: StepRecord[] = steps.map((s) => ({ id: s.id, label: s.label, state: "pending", attempts: 0, ms: 0 }));
  const values: Record<string, unknown> = {};
  const emit = (r: StepRecord) => opts.onState?.(r, records);
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i], r = records[i];
    const unmet = (s.dependsOn ?? []).filter((d) => records.find((x) => x.id === d)?.state !== "done");
    if (unmet.length) { r.state = "blocked"; r.error = `needs ${unmet.join(", ")}`; emit(r); continue; }
    const max = 1 + Math.min(MAX_RETRIES, Math.max(0, s.retries ?? 0));
    const t0 = Date.now();
    r.state = "running"; emit(r);
    while (r.attempts < max) {
      r.attempts++;
      try {
        const v = await race(s.run(values), opts.timeoutMs ?? STEP_TIMEOUT_MS);
        if (v === TIMED_OUT) { r.state = "timeout"; r.error = "timeout"; continue; }
        values[s.id] = v; r.state = "done"; r.error = undefined; break;
      } catch (e) { r.state = "failed"; r.error = e instanceof Error ? e.message : "error"; }
    }
    r.ms = Date.now() - t0; emit(r);
  }
  const done = records.filter((r) => r.state === "done").length;
  return { steps: records, values, partial: done > 0 && done < records.length, complete: done === records.length };
}

const STATE_WORD: Record<StepState, { en: string; he: string }> = {
  pending: { en: "waiting", he: "ממתין" }, running: { en: "running", he: "רץ" }, done: { en: "done", he: "הושלם" },
  failed: { en: "failed", he: "נכשל" }, timeout: { en: "timed out", he: "פג הזמן" }, blocked: { en: "skipped (a step it needs did not finish)", he: "דולג (שלב שהוא תלוי בו לא הסתיים)" },
};
/** One plain line per run, in both languages, for the answer trace. Only states and counts, no model text. */
export function describeRun(steps: StepRecord[]): { en: string; he: string } {
  const n = steps.length, ok = steps.filter((s) => s.state === "done").length;
  const bad = steps.filter((s) => s.state !== "done");
  const tail = (l: "en" | "he") => bad.map((s) => `${s.id === "reword" ? (l === "he" ? "ניסוח מחדש" : "rewording") : s.label}: ${STATE_WORD[s.state][l]}`).join("; ");
  return {
    en: `Plan state: ${ok} of ${n} steps done${bad.length ? ` (${tail("en")}). The answer uses what finished.` : "."}`,
    he: `מצב התוכנית: ${ok} מתוך ${n} שלבים הושלמו${bad.length ? ` (${tail("he")}). התשובה משתמשת במה שהסתיים.` : "."}`,
  };
}
