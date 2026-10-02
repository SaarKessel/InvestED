// ---------------------------------------------------------------------------
// InvestED - show-your-work scratchpad
//
// The learner sets up a compound-interest problem or a cash-flow timeline (typed,
// or read from a photo of a hand sketch through the EXISTING /api/describe-file
// endpoint). The photo path only TRANSCRIBES the setup. Every transcribed value
// is validated, shown in editable fields, and must be confirmed by the learner.
// Every number in the result comes from the deterministic engine, never from
// the model. Educational only.
//
// Concept credit: THEOREMX1.0 (license not verified; the idea of working from a
// handwritten setup only. Nothing copied).
// ---------------------------------------------------------------------------
import { computeProjection } from "../calculatorEngine";

export type PadKind = "compound" | "cashflow";
export interface CompoundSetup { kind: "compound"; principal: number; monthly: number; years: number; annualPct: number }
export interface Flow { t: number; amount: number }
export interface CashflowSetup { kind: "cashflow"; ratePct: number; flows: Flow[] }
export type PadSetup = CompoundSetup | CashflowSetup;

export const LIMITS = { money: 1e9, monthly: 1e7, years: 80, pct: 100, minPct: -50, maxFlows: 12 } as const;

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
/** Parses a typed field. Accepts "1,000" and "5%" style text. Returns null when it is not a plain number. */
export function toNumber(text: string): number | null {
  const clean = text.trim().replace(/[,\s%]/g, "");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(clean)) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

export function validateCompound(s: Partial<Record<keyof Omit<CompoundSetup, "kind">, number | null>>): CompoundSetup | null {
  const { principal, monthly, years, annualPct } = s;
  if (!finite(principal) || principal < 0 || principal > LIMITS.money) return null;
  if (!finite(monthly) || monthly < 0 || monthly > LIMITS.monthly) return null;
  if (!finite(years) || years <= 0 || years > LIMITS.years) return null;
  if (!finite(annualPct) || annualPct < LIMITS.minPct || annualPct > LIMITS.pct) return null;
  if (principal === 0 && monthly === 0) return null;
  return { kind: "compound", principal, monthly, years, annualPct };
}

export function validateCashflow(ratePct: number | null | undefined, flows: { t?: number | null; amount?: number | null }[]): CashflowSetup | null {
  if (!finite(ratePct) || ratePct < LIMITS.minPct || ratePct > LIMITS.pct) return null;
  if (flows.length < 1 || flows.length > LIMITS.maxFlows) return null;
  const out: Flow[] = [];
  for (const f of flows) {
    if (!finite(f.t) || f.t < 0 || f.t > LIMITS.years || !finite(f.amount) || Math.abs(f.amount) > LIMITS.money) return null;
    out.push({ t: f.t, amount: f.amount });
  }
  return { kind: "cashflow", ratePct, flows: out.sort((a, b) => a.t - b.t) };
}

export function validatePadSetup(s: PadSetup): PadSetup | null {
  return s.kind === "compound" ? validateCompound(s) : validateCashflow(s.ratePct, s.flows);
}

// --- deterministic solutions -----------------------------------------------

export interface CompoundSolution { months: number; monthlyRatePct: number; totalContributed: number; finalBalance: number; growth: number }
/** Uses the site's calculator engine (monthly compounding, deposits at month end, no inflation adjustment). */
export function solveCompound(s: CompoundSetup): CompoundSolution {
  const p = computeProjection(s.principal, s.monthly, s.years, s.annualPct, 0);
  return { months: Math.round(s.years * 12), monthlyRatePct: s.annualPct / 12, totalContributed: p.totalContributed, finalBalance: p.finalBalance, growth: p.growth };
}

export interface FlowRow { t: number; amount: number; discountFactor: number; presentValue: number; futureValue: number }
export interface CashflowSolution { rows: FlowRow[]; horizon: number; presentValue: number; futureValue: number }
/** Present value at time 0 and future value at the last flow's time, with annual compounding. */
export function solveCashflow(s: CashflowSetup): CashflowSolution {
  const r = s.ratePct / 100;
  const horizon = Math.max(...s.flows.map((f) => f.t));
  const rows = s.flows.map((f) => {
    const discountFactor = 1 / Math.pow(1 + r, f.t);
    return { t: f.t, amount: f.amount, discountFactor, presentValue: f.amount * discountFactor, futureValue: f.amount * Math.pow(1 + r, horizon - f.t) };
  });
  return { rows, horizon, presentValue: rows.reduce((a, x) => a + x.presentValue, 0), futureValue: rows.reduce((a, x) => a + x.futureValue, 0) };
}

// --- optional photo transcription ----------------------------------------------

export function transcriptionQuestion(kind: PadKind, language: "he" | "en"): string {
  const shape = kind === "compound"
    ? '{"principal": number|null, "monthly": number|null, "years": number|null, "annualPct": number|null}'
    : '{"ratePct": number|null, "flows": [{"t": number, "amount": number}]}';
  return [
    "Transcribe the handwritten or drawn financial setup in this image into JSON only. Do not solve it. Do not calculate anything.",
    `Use exactly this shape: ${shape}.`,
    kind === "compound"
      ? "principal = starting amount, monthly = amount added each month, years = length, annualPct = yearly rate in percent."
      : "t = time in years from the start (0 for now), amount = money in (positive) or out (negative), ratePct = yearly rate in percent.",
    "Copy only numbers that are clearly written. Use null for anything unreadable or missing. Never guess.",
    language === "he" ? "Labels in the image may be Hebrew." : "Labels in the image may be English.",
  ].join("\n");
}

export interface Transcription { compound?: Partial<Record<"principal" | "monthly" | "years" | "annualPct", number | null>>; cashflow?: { ratePct: number | null; flows: { t: number; amount: number }[] } }

/** Pulls the JSON object out of the model text and keeps only well-formed numbers. Returns null when nothing usable. */
export function parseTranscription(kind: PadKind, text: string | null): Transcription | null {
  if (!text) return null;
  const m = /\{[\s\S]*\}/.exec(text.replace(/```(?:json)?/gi, ""));
  if (!m) return null;
  let raw: unknown;
  try { raw = JSON.parse(m[0]); } catch { return null; }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const num = (v: unknown): number | null => (finite(v) ? v : null);
  if (kind === "compound") {
    const c = { principal: num(o.principal), monthly: num(o.monthly), years: num(o.years), annualPct: num(o.annualPct) };
    return Object.values(c).some((v) => v !== null) ? { compound: c } : null;
  }
  const flows = (Array.isArray(o.flows) ? o.flows : []).slice(0, LIMITS.maxFlows)
    .map((f) => ({ t: (f as { t?: unknown })?.t, amount: (f as { amount?: unknown })?.amount }))
    .filter((f): f is Flow => finite(f.t) && finite(f.amount));
  const ratePct = num(o.ratePct);
  return flows.length > 0 || ratePct !== null ? { cashflow: { ratePct, flows } } : null;
}

export interface TimelineEvent { t: number; label: string; amount: number }
export function timelineEvents(s: PadSetup, finalBalance?: number): TimelineEvent[] {
  if (s.kind === "cashflow") return s.flows.map((f) => ({ t: f.t, label: f.amount >= 0 ? "in" : "out", amount: f.amount }));
  const ev: TimelineEvent[] = [{ t: 0, label: "start", amount: s.principal }];
  if (finalBalance !== undefined) ev.push({ t: s.years, label: "end", amount: finalBalance });
  return ev;
}

export const fmtNumber = (n: number, lang: "he" | "en"): string => new Intl.NumberFormat(lang === "he" ? "he-IL" : "en-US", { maximumFractionDigits: 2 }).format(n);
