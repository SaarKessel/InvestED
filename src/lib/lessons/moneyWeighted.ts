/** Money-weighted return lesson: "did my portfolio grow, or did I just deposit more?"
 *  Concept from an MIT-licensed effective-appreciation-rate project; the math is rewritten here and uses a guarded
 *  bracket-and-bisect solver that reports "no solution" or "ambiguous" instead of inventing a number.
 *  Dates are UTC date-only (YYYY-MM-DD). */
export interface CashFlow { date: string; amount: number }
export type MwrResult =
  | { status: "ok"; annualRate: number; contributions: number; withdrawals: number; endingValue: number; netGain: number; timeline: TimelineRow[]; days: number }
  | { status: "no_solution" | "ambiguous"; contributions: number; withdrawals: number; endingValue: number; netGain: number; timeline: TimelineRow[]; days: number }
  | { status: "invalid"; reason: "dates" | "amounts" | "too_short" | "no_flows" };
export interface TimelineRow { date: string; amount: number; cumulativeNet: number }

const DAY = 86_400_000;
export function parseUtcDate(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d ? t : null;
}

/** flows: positive = money you put in, negative = money you took out. endingValue: what the portfolio is worth on endDate. */
export function moneyWeightedReturn(flows: CashFlow[], endingValue: number, endDate: string): MwrResult {
  const end = parseUtcDate(endDate);
  if (end === null) return { status: "invalid", reason: "dates" };
  if (!Array.isArray(flows) || flows.length === 0) return { status: "invalid", reason: "no_flows" };
  if (!Number.isFinite(endingValue) || endingValue < 0 || flows.some((f) => !Number.isFinite(f.amount) || f.amount === 0)) return { status: "invalid", reason: "amounts" };
  const dated = flows.map((f) => ({ t: parseUtcDate(f.date), amount: f.amount }));
  if (dated.some((f) => f.t === null || (f.t as number) > end)) return { status: "invalid", reason: "dates" };
  const sorted = (dated as { t: number; amount: number }[]).sort((a, b) => a.t - b.t);
  const start = sorted[0].t;
  const days = Math.round((end - start) / DAY);
  if (days < 1) return { status: "invalid", reason: "too_short" };

  const contributions = sorted.filter((f) => f.amount > 0).reduce((s, f) => s + f.amount, 0);
  const withdrawals = sorted.filter((f) => f.amount < 0).reduce((s, f) => s - f.amount, 0);
  const netGain = endingValue + withdrawals - contributions;
  let running = 0;
  const timeline = sorted.map((f) => { running += f.amount; return { date: new Date(f.t).toISOString().slice(0, 10), amount: f.amount, cumulativeNet: running }; });
  const base = { contributions, withdrawals, endingValue, netGain, timeline, days };

  // Value today of every flow at annual rate r, from the investor's side (money in is negative, ending value positive).
  const npv = (r: number) => sorted.reduce((s, f) => s - f.amount * Math.pow(1 + r, -(f.t - start) / DAY / 365), 0) + endingValue * Math.pow(1 + r, -days / 365);
  // Scan a fixed grid of rates for sign changes. More than one bracket means more than one answer.
  const grid: number[] = [];
  for (let r = -0.99; r < 0; r += 0.01) grid.push(Number(r.toFixed(2)));
  for (let r = 0; r <= 10; r += 0.01) grid.push(Number(r.toFixed(2)));
  const brackets: [number, number][] = [];
  for (let i = 0; i < grid.length - 1; i++) {
    const a = npv(grid[i]);
    const b = npv(grid[i + 1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (a === 0) brackets.push([grid[i], grid[i]]);
    else if (a * b < 0) brackets.push([grid[i], grid[i + 1]]);
  }
  if (brackets.length === 0) return { status: "no_solution", ...base };
  if (brackets.length > 1) return { status: "ambiguous", ...base };
  let [lo, hi] = brackets[0];
  if (lo !== hi) {
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2;
      if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
    }
  }
  const annualRate = (lo + hi) / 2;
  if (!Number.isFinite(annualRate)) return { status: "no_solution", ...base };
  return { status: "ok", annualRate, ...base };
}
