// ---------------------------------------------------------------------------
// InvestED ג€” Loan / Mortgage Calculator Engine
//
// ׳׳₪׳¨׳© ׳×׳™׳׳•׳¨ ׳—׳•׳₪׳©׳™ ׳©׳ ׳”׳׳•׳•׳׳”/׳׳©׳›׳ ׳×׳ (׳¡׳›׳•׳, ׳¨׳™׳‘׳™׳× ׳©׳ ׳×׳™׳×, ׳×׳§׳•׳₪׳”) ׳•׳׳—׳©׳‘
// ׳©׳ ׳™ ׳׳¡׳׳•׳׳™ ׳”׳—׳–׳¨ ׳ ׳₪׳•׳¦׳™׳ ׳‘׳™׳©׳¨׳׳:
//   - ׳©׳₪׳™׳¦׳¨ (Equal Payment / Annuity): ׳”׳—׳–׳¨ ׳—׳•׳“׳©׳™ ׳§׳‘׳•׳¢ ׳׳׳•׳¨׳ ׳›׳ ׳”׳×׳§׳•׳₪׳”.
//   - ׳¡׳™׳׳•׳§׳™׳ (Equal Principal): ׳§׳¨׳ ׳§׳‘׳•׳¢׳” ׳›׳ ׳—׳•׳“׳©, ׳¨׳™׳‘׳™׳× ׳™׳•׳¨׳“׳× ׳‘׳”׳“׳¨׳’׳”
//     ׳•׳׳›׳ ׳”׳”׳—׳–׳¨ ׳”׳—׳•׳“׳©׳™ ׳”׳›׳•׳׳ ׳’׳‘׳•׳” ׳‘׳”׳×׳—׳׳” ׳•׳™׳•׳¨׳“ ׳¢׳ ׳”׳–׳׳.
// ׳›׳׳• ׳‘׳׳—׳©׳‘׳•׳ ׳”׳¦׳׳™׳—׳”, ׳”׳₪׳¢׳ ׳•׳— ׳׳•׳¦׳’ ׳×׳׳™׳“ ׳‘׳©׳“׳•׳× ׳ ׳™׳×׳ ׳™׳ ׳׳¢׳¨׳™׳›׳” ׳׳₪׳ ׳™ ׳”׳—׳™׳©׳•׳‘.
// ---------------------------------------------------------------------------

export interface ParsedLoanQuery {
  loanAmount: number;
  annualRatePct: number;
  years: number;
}

function parseAmount(numStr: string, unit?: string): number {
  let val = parseFloat(numStr.replace(/,/g, ""));
  if (unit === "׳׳׳£") val *= 1_000;
  if (unit === "׳׳™׳׳™׳•׳") val *= 1_000_000;
  return val;
}

export function parseLoanQuery(rawText: string): ParsedLoanQuery {
  const text = rawText.trim();

  const yearsMatch = text.match(/(\d{1,2})\s*׳©׳ /);
  const years = yearsMatch ? Math.min(35, parseInt(yearsMatch[1], 10)) : 20;

  const rateMatch = text.match(/(\d{1,2}(?:\.\d+)?)\s*%|(\d{1,2}(?:\.\d+)?)\s*׳׳—׳•׳–|׳¨׳™׳‘׳™׳×\D{0,6}(\d{1,2}(?:\.\d+)?)/);
  const annualRatePct = rateMatch
    ? parseFloat(rateMatch[1] ?? rateMatch[2] ?? rateMatch[3])
    : 4.5;

  let loanAmount = 0;
  const currencyMatches = [
    ...text.matchAll(/([\d]{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(׳׳׳£|׳׳™׳׳™׳•׳)?\s*(?:׳©"׳—|׳©׳§׳(?:׳™׳)?|ג‚×)?/g),
  ];
  for (const m of currencyMatches) {
    // ׳׳×׳¢׳׳׳™׳ ׳׳׳¡׳₪׳¨׳™׳ ׳©׳›׳‘׳¨ ׳–׳•׳”׳• ׳›׳׳—׳•׳– ׳¨׳™׳‘׳™׳× ׳׳• ׳›׳׳¡׳₪׳¨ ׳©׳ ׳™׳ (׳׳׳ ׳™׳¢׳× ׳‘׳׳‘׳•׳)
    const val = parseAmount(m[1], m[2]);
    if (val === years) continue;
    if (val === annualRatePct) continue;
    if (val > loanAmount) loanAmount = val;
  }
  if (loanAmount < 1000) loanAmount = 800_000; // ׳‘׳¨׳™׳¨׳× ׳׳—׳“׳ ׳¡׳‘׳™׳¨׳” ׳׳ ׳׳ ׳–׳•׳”׳” ׳¡׳›׳•׳

  return { loanAmount, annualRatePct, years };
}

export interface AmortizationYearPoint {
  year: number;
  remainingBalance: number;
  cumulativeInterest: number;
}

export interface AmortizationResult {
  method: "׳©׳₪׳™׳¦׳¨" | "׳¡׳™׳׳•׳§׳™׳";
  firstMonthlyPayment: number;
  lastMonthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  yearlySeries: AmortizationYearPoint[];
}

export function computeSchpitzer(loanAmount: number, annualRatePct: number, years: number): AmortizationResult {
  const monthlyRate = annualRatePct / 100 / 12;
  const months = Math.max(1, Math.round(years * 12));

  const monthlyPayment =
    monthlyRate === 0 ? loanAmount / months : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  let balance = loanAmount;
  let cumulativeInterest = 0;
  const yearlySeries: AmortizationYearPoint[] = [{ year: 0, remainingBalance: Math.round(balance), cumulativeInterest: 0 }];

  for (let m = 1; m <= months; m++) {
    const interestPortion = balance * monthlyRate;
    const principalPortion = monthlyPayment - interestPortion;
    balance = Math.max(0, balance - principalPortion);
    cumulativeInterest += interestPortion;
    if (m % 12 === 0 || m === months) {
      yearlySeries.push({
        year: Math.ceil(m / 12),
        remainingBalance: Math.round(balance),
        cumulativeInterest: Math.round(cumulativeInterest),
      });
    }
  }

  const totalRepayment = Math.round(monthlyPayment * months);

  return {
    method: "׳©׳₪׳™׳¦׳¨",
    firstMonthlyPayment: Math.round(monthlyPayment),
    lastMonthlyPayment: Math.round(monthlyPayment),
    totalRepayment,
    totalInterest: Math.round(cumulativeInterest),
    yearlySeries,
  };
}

export function computeSillukin(loanAmount: number, annualRatePct: number, years: number): AmortizationResult {
  const monthlyRate = annualRatePct / 100 / 12;
  const months = Math.max(1, Math.round(years * 12));
  const principalPortion = loanAmount / months;

  let balance = loanAmount;
  let cumulativeInterest = 0;
  let firstPayment = 0;
  let lastPayment = 0;
  const yearlySeries: AmortizationYearPoint[] = [{ year: 0, remainingBalance: Math.round(balance), cumulativeInterest: 0 }];

  for (let m = 1; m <= months; m++) {
    const interestPortion = balance * monthlyRate;
    const payment = principalPortion + interestPortion;
    if (m === 1) firstPayment = payment;
    if (m === months) lastPayment = payment;
    balance = Math.max(0, balance - principalPortion);
    cumulativeInterest += interestPortion;
    if (m % 12 === 0 || m === months) {
      yearlySeries.push({
        year: Math.ceil(m / 12),
        remainingBalance: Math.round(balance),
        cumulativeInterest: Math.round(cumulativeInterest),
      });
    }
  }

  const totalRepayment = Math.round(loanAmount + cumulativeInterest);

  return {
    method: "׳¡׳™׳׳•׳§׳™׳",
    firstMonthlyPayment: Math.round(firstPayment),
    lastMonthlyPayment: Math.round(lastPayment),
    totalRepayment,
    totalInterest: Math.round(cumulativeInterest),
    yearlySeries,
  };
}

export const LOAN_PRESETS = [
  "׳׳§׳—׳×׳™ ׳׳©׳›׳ ׳×׳ ׳-20 ׳©׳ ׳” ׳‘׳¨׳™׳‘׳™׳× ׳©׳ 4.5% ׳‘׳©׳•׳•׳™ 800 ׳׳׳£ ׳©\"׳—",
  "׳”׳׳•׳•׳׳” ׳©׳ 100,000 ׳©\"׳— ׳-5 ׳©׳ ׳™׳ ׳‘׳¨׳™׳‘׳™׳× 6%",
  "׳׳©׳›׳ ׳×׳ ׳©׳ 1.2 ׳׳™׳׳™׳•׳ ׳©\"׳— ׳-25 ׳©׳ ׳” ׳‘׳¨׳™׳‘׳™׳× 3.8%",
];

