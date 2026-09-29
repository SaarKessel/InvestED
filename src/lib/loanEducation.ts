/** Educational fixed-rate annuity. Inputs are user assumptions, never market quotes. */
export interface LoanEstimate {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  principal: number;
  months: number;
  annualRatePct: number;
}

export function estimateFixedLoan(principal: number, annualRatePct: number, months: number): LoanEstimate | null {
  if (!Number.isFinite(principal) || principal <= 0 || principal > 100_000_000 ||
      !Number.isFinite(annualRatePct) || annualRatePct < 0 || annualRatePct > 100 ||
      !Number.isInteger(months) || months < 1 || months > 600) return null;
  const r = annualRatePct / 1200;
  const monthlyPayment = r === 0 ? principal / months : principal * r / (1 - (1 + r) ** -months);
  if (!Number.isFinite(monthlyPayment)) return null;
  const totalPaid = monthlyPayment * months;
  return { monthlyPayment, totalPaid, totalInterest: Math.max(0, totalPaid - principal), principal, months, annualRatePct };
}
