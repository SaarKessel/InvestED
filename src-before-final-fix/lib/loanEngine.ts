// ---------------------------------------------------------------------------
// InvestED — Loan / Mortgage Calculator Engine
//
// מפרש תיאור חופשי של הלוואה/משכנתא (סכום, ריבית שנתית, תקופה) ומחשב
// שני מסלולי החזר נפוצים בישראל:
//   - שפיצר (Equal Payment / Annuity): החזר חודשי קבוע לאורך כל התקופה.
//   - סילוקין (Equal Principal): קרן קבועה כל חודש, ריבית יורדת בהדרגה
//     ולכן ההחזר החודשי הכולל גבוה בהתחלה ויורד עם הזמן.
// כמו במחשבון הצמיחה, הפענוח מוצג תמיד בשדות ניתנים לעריכה לפני החישוב.
// ---------------------------------------------------------------------------

export interface ParsedLoanQuery {
  loanAmount: number;
  annualRatePct: number;
  years: number;
}

function parseAmount(numStr: string, unit?: string): number {
  let val = parseFloat(numStr.replace(/,/g, ""));
  if (unit === "אלף") val *= 1_000;
  if (unit === "מיליון") val *= 1_000_000;
  return val;
}

export function parseLoanQuery(rawText: string): ParsedLoanQuery {
  const text = rawText.trim();

  const yearsMatch = text.match(/(\d{1,2})\s*שנ/);
  const years = yearsMatch ? Math.min(35, parseInt(yearsMatch[1], 10)) : 20;

  const rateMatch = text.match(/(\d{1,2}(?:\.\d+)?)\s*%|(\d{1,2}(?:\.\d+)?)\s*אחוז|ריבית\D{0,6}(\d{1,2}(?:\.\d+)?)/);
  const annualRatePct = rateMatch
    ? parseFloat(rateMatch[1] ?? rateMatch[2] ?? rateMatch[3])
    : 4.5;

  let loanAmount = 0;
  const currencyMatches = [
    ...text.matchAll(/([\d]{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(אלף|מיליון)?\s*(?:ש"ח|שקל(?:ים)?|₪)?/g),
  ];
  for (const m of currencyMatches) {
    // מתעלמים ממספרים שכבר זוהו כאחוז ריבית או כמספר שנים (למניעת בלבול)
    const val = parseAmount(m[1], m[2]);
    if (val === years) continue;
    if (val === annualRatePct) continue;
    if (val > loanAmount) loanAmount = val;
  }
  if (loanAmount < 1000) loanAmount = 800_000; // ברירת מחדל סבירה אם לא זוהה סכום

  return { loanAmount, annualRatePct, years };
}

export interface AmortizationYearPoint {
  year: number;
  remainingBalance: number;
  cumulativeInterest: number;
}

export interface AmortizationResult {
  method: "שפיצר" | "סילוקין";
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
    method: "שפיצר",
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
    method: "סילוקין",
    firstMonthlyPayment: Math.round(firstPayment),
    lastMonthlyPayment: Math.round(lastPayment),
    totalRepayment,
    totalInterest: Math.round(cumulativeInterest),
    yearlySeries,
  };
}

export const LOAN_PRESETS = [
  "לקחתי משכנתא ל-20 שנה בריבית של 4.5% בשווי 800 אלף ש\"ח",
  "הלוואה של 100,000 ש\"ח ל-5 שנים בריבית 6%",
  "משכנתא של 1.2 מיליון ש\"ח ל-25 שנה בריבית 3.8%",
];
