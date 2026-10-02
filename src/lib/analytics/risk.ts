// ---------------------------------------------------------------------------
// InvestED - Value at Risk, from textbook definitions (no third-party code).
//
// Historical VaR / expected shortfall (CVaR) take the empirical quantile of the
// real period returns. Parametric VaR assumes normal returns. Both describe
// the PAST distribution of one period (day, week or month, whatever the series
// frequency is) and are not a forecast or a loss limit. With too few
// observations the result is "unavailable"; nothing is filled in.
// ---------------------------------------------------------------------------

export type Metric<T = number> = { status: "computed"; value: T } | { status: "unavailable"; reason: string };
const ok = <T>(value: T): Metric<T> => ({ status: "computed", value });
const no = <T = number>(reason: string): Metric<T> => ({ status: "unavailable", reason });

export const MIN_VAR_RETURNS = 60;

export function periodReturns(closes: ReadonlyArray<number>): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) if (closes[i - 1] > 0 && closes[i] > 0 && Number.isFinite(closes[i]) && Number.isFinite(closes[i - 1])) out.push(closes[i] / closes[i - 1] - 1);
  return out;
}

export interface VarReport { confidencePct: number; observations: number; historicalVarPct: number; expectedShortfallPct: number; parametricVarPct: Metric }

/** Inverse standard normal CDF (Acklam's rational approximation, relative error < 1.2e-9). */
export function normInv(p: number): number {
  if (!(p > 0 && p < 1)) return NaN;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const lo = 0.02425;
  if (p < lo) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - lo) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Loss figures are positive percentages of one period. Quantile uses the lower empirical order statistic (conservative). */
export function computeVar(returns: ReadonlyArray<number>, confidencePct = 95): Metric<VarReport> {
  if (!(confidencePct > 50 && confidencePct < 100)) return no("Confidence must be between 50 and 100");
  const r = returns.filter((x) => Number.isFinite(x));
  if (r.length < MIN_VAR_RETURNS) return no(`At least ${MIN_VAR_RETURNS} return observations are needed (have ${r.length})`);
  const alpha = 1 - confidencePct / 100;
  const sorted = [...r].sort((a, b) => a - b);
  const k = Math.max(1, Math.floor(alpha * sorted.length));
  const q = sorted[k - 1];
  const tail = sorted.slice(0, k);
  const mean = r.reduce((s, x) => s + x, 0) / r.length;
  const sd = Math.sqrt(r.reduce((s, x) => s + (x - mean) ** 2, 0) / (r.length - 1));
  const parametric = sd > 1e-12 ? ok(Math.max(0, -(mean + normInv(alpha) * sd)) * 100) : no("Returns have no variance");
  return ok({
    confidencePct, observations: r.length,
    historicalVarPct: Math.max(0, -q) * 100,
    expectedShortfallPct: Math.max(0, -(tail.reduce((s, x) => s + x, 0) / tail.length)) * 100,
    parametricVarPct: parametric,
  });
}
