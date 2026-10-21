/** Multi-step orchestrator: runs a decomposed plan one task at a time, in order. A task that fails or times out is recorded and the next one still runs. The caller supplies how one task is answered, so no second pipeline exists. */
import { decompose, type Decomposition, type SubTask } from "./decompose";
import type { Route } from "./planner";

export type TaskStatus = "done" | "failed" | "timeout" | "skipped";
export interface TaskOutcome { task: SubTask; status: TaskStatus; ms: number; error?: string }
export interface RunOptions { timeoutMs?: number; signal?: { aborted: boolean }; onStart?: (task: SubTask, total: number) => void; onSettled?: (outcome: TaskOutcome) => void; /** Max tasks answered at once. 1 (default) keeps the ordered one-at-a-time run. */
  concurrency?: number }
export const TASK_TIMEOUT_MS = 30_000;

/** Routes whose answer is a fixed engine result. A question mixing these with other parts gains from running part by part. */
const ENGINE_ROUTES: Route[] = ["fx", "calc", "math", "wb", "desk"];
/** Routes that already take the whole question, so splitting it would only duplicate or break them. */
const WHOLE_ROUTES: Route[] = ["tool", "career", "learnpath", "site", "scenario", "marketsim", "filings", "etf", "macro", "ledger", "oos", "copyfund"];

/** True when the question should run as an ordered plan: several parts, at least one engine part, and no route that must see the whole text. */
export function shouldOrchestrate(question: string, d: Decomposition = decompose(question), wholeRoute?: Route): boolean {
  if (!d.multi) return false;
  if (wholeRoute && WHOLE_ROUTES.includes(wholeRoute)) return false;
  return d.tasks.some((t) => ENGINE_ROUTES.includes(t.route)) && !d.tasks.some((t) => WHOLE_ROUTES.includes(t.route));
}

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | "timeout"> =>
  new Promise((resolve, reject) => { const id = setTimeout(() => resolve("timeout"), ms); p.then((v) => { clearTimeout(id); resolve(v); }, (e) => { clearTimeout(id); reject(e); }); });

export async function runPlan(tasks: SubTask[], runOne: (task: SubTask) => Promise<void>, opts: RunOptions = {}): Promise<TaskOutcome[]> {
  const limit = Math.max(1, Math.min(opts.concurrency ?? 1, tasks.length || 1));
  const out: (TaskOutcome | undefined)[] = new Array(tasks.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const i = next++;
      if (i >= tasks.length) return;
      const task = tasks[i];
      if (opts.signal?.aborted) { out[i] = { task, status: "skipped", ms: 0 }; opts.onSettled?.(out[i]!); continue; }
      opts.onStart?.(task, tasks.length);
      const t0 = Date.now();
      try {
        const r = await withTimeout(runOne(task), opts.timeoutMs ?? TASK_TIMEOUT_MS);
        out[i] = { task, status: r === "timeout" ? "timeout" : "done", ms: Date.now() - t0 };
      } catch (e) {
        out[i] = { task, status: "failed", ms: Date.now() - t0, error: e instanceof Error ? e.message : "error" };
      }
      opts.onSettled?.(out[i]!);
    }
  };
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return out as TaskOutcome[];
}
