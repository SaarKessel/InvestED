// ---------------------------------------------------------------------------
// InvestED - discounted cash flow, textbook two-stage model (Gordon growth
// terminal value). Pure arithmetic on numbers the USER types in: no data is
// fetched or assumed, so every output is a scenario of those inputs, not a
// valuation of the company and not a price target.
// ---------------------------------------------------------------------------

export interface DcfInput {
  /** Free cash flow of the last full year, in any currency unit. */
  baseCashFlow: number;
  /** Annual growth during the explicit years, percent. */
  growthPct: number;
  /** Discount rate (cost of capital), percent. */
  discountPct: number;
  /** Terminal growth, percent. Must be below the discount rate. */
  terminalGrowthPct: number;
  years: number;
  /** Optional: net debt (debt minus cash) and share count to get a per-share figure. */
  netDebt?: number;
  shares?: number;
}

export interface DcfResult {
  presentValueOfCashFlows: number;
  presentValueOfTerminal: number;
  enterpriseValue: number;
  equityValue: number | null;
  perShare: number | null;
  terminalShareOfValuePct: number;
  cashFlows: { year: number; cashFlow: number; presentValue: number }[];
}

export type DcfOutcome = { ok: true; result: DcfResult } | { ok: false; error: string };

export function computeDcf(input: DcfInput): DcfOutcome {
  const { baseCashFlow, growthPct, discountPct, terminalGrowthPct, years } = input;
  const nums = [baseCashFlow, growthPct, discountPct, terminalGrowthPct, years];
  if (!nums.every(Number.isFinite)) return { ok: false, error: "All inputs must be numbers" };
  if (!Number.isInteger(years) || years < 1 || years > 30) return { ok: false, error: "Years must be a whole number from 1 to 30" };
  if (baseCashFlow <= 0) return { ok: false, error: "Base cash flow must be positive" };
  if (discountPct <= 0 || discountPct > 100) return { ok: false, error: "Discount rate must be above 0 and at most 100" };
  if (terminalGrowthPct >= discountPct) return { ok: false, error: "Terminal growth must be below the discount rate" };
  if (growthPct <= -100 || growthPct > 100) return { ok: false, error: "Growth must be between -100 and 100" };
  const g = growthPct / 100, r = discountPct / 100, tg = terminalGrowthPct / 100;
  const cashFlows: DcfResult["cashFlows"] = [];
  let pv = 0, cf = baseCashFlow;
  for (let y = 1; y <= years; y++) {
    cf *= 1 + g;
    const p = cf / (1 + r) ** y;
    pv += p;
    cashFlows.push({ year: y, cashFlow: cf, presentValue: p });
  }
  const terminal = (cf * (1 + tg)) / (r - tg);
  const pvTerminal = terminal / (1 + r) ** years;
  const enterprise = pv + pvTerminal;
  const hasEquity = typeof input.netDebt === "number" && Number.isFinite(input.netDebt);
  const equity = hasEquity ? enterprise - (input.netDebt as number) : null;
  const perShare = equity !== null && typeof input.shares === "number" && Number.isFinite(input.shares) && input.shares > 0 ? equity / input.shares : null;
  return { ok: true, result: { presentValueOfCashFlows: pv, presentValueOfTerminal: pvTerminal, enterpriseValue: enterprise, equityValue: equity, perShare, terminalShareOfValuePct: (pvTerminal / enterprise) * 100, cashFlows } };
}

/** Sensitivity grid: enterprise value for discount rate +/- step and terminal growth +/- step. Cells that are invalid stay null. */
export function dcfSensitivity(input: DcfInput, stepPct = 1): { discountPct: number; terminalGrowthPct: number; enterpriseValue: number | null }[] {
  const out: { discountPct: number; terminalGrowthPct: number; enterpriseValue: number | null }[] = [];
  for (const dr of [-stepPct, 0, stepPct]) for (const dt of [-stepPct, 0, stepPct]) {
    const d = input.discountPct + dr, t = input.terminalGrowthPct + dt;
    const o = computeDcf({ ...input, discountPct: d, terminalGrowthPct: t });
    out.push({ discountPct: d, terminalGrowthPct: t, enterpriseValue: o.ok ? o.result.enterpriseValue : null });
  }
  return out;
}
