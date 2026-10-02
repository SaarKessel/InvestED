/** Rent-vs-buy lab. Calculation module only, from the user's own assumptions. No tax rules, no preset returns,
 *  no market data: every number below comes from the inputs and nothing is filled in for the user.
 *  Idea adapted from an MIT-licensed rent-or-buy calculator; the code is written here. */
export interface RentBuyInputs {
  homePrice: number; downPayment: number;
  mortgageRatePct: number; mortgageYears: number;
  /** Yearly costs of owning, as % of home price (upkeep, property charges, insurance) - the user's own number. */
  ownCostPct: number;
  homeGrowthPct: number;
  monthlyRent: number; rentGrowthPct: number;
  /** Return on the money you invest instead - the user's own assumption. */
  investReturnPct: number;
  years: number;
  /** Cost of selling, % of the sale price. */
  sellCostPct: number;
}
export interface YearRow { year: number; homeEquity: number; ownerExtraInvested: number; liquidInvestments: number; ownerOutflow: number; renterOutflow: number }
export interface RentBuyResult {
  rows: YearRow[];
  /** First year where owning leaves more wealth than renting, or null if not within the horizon. */
  breakEvenYear: number | null;
  monthlyPayment: number;
}
export const RENT_BUY_FIELDS: (keyof RentBuyInputs)[] = ["homePrice", "downPayment", "mortgageRatePct", "mortgageYears", "ownCostPct", "homeGrowthPct", "monthlyRent", "rentGrowthPct", "investReturnPct", "years", "sellCostPct"];

export function validateInputs(i: Partial<RentBuyInputs>): i is RentBuyInputs {
  if (!RENT_BUY_FIELDS.every((k) => typeof i[k] === "number" && Number.isFinite(i[k] as number))) return false;
  const v = i as RentBuyInputs;
  return v.homePrice > 0 && v.downPayment >= 0 && v.downPayment <= v.homePrice && v.mortgageYears >= 1 && v.mortgageYears <= 50 &&
    v.years >= 1 && v.years <= 50 && v.monthlyRent >= 0 && v.mortgageRatePct >= 0 && v.mortgageRatePct <= 50 &&
    v.ownCostPct >= 0 && v.sellCostPct >= 0 && v.sellCostPct < 100 && v.investReturnPct > -100 && v.homeGrowthPct > -100 && v.rentGrowthPct > -100;
}

export function monthlyPaymentFor(loan: number, ratePct: number, years: number): number {
  const n = years * 12;
  if (loan <= 0) return 0;
  const r = ratePct / 100 / 12;
  return r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
}

/** Both households spend the same cash each month: whoever spends less than the higher outflow invests the difference. */
export function rentVsBuy(input: Partial<RentBuyInputs>): RentBuyResult | null {
  if (!validateInputs(input)) return null;
  const i = input;
  const loan = i.homePrice - i.downPayment;
  const pay = monthlyPaymentFor(loan, i.mortgageRatePct, i.mortgageYears);
  const rm = Math.pow(1 + i.investReturnPct / 100, 1 / 12) - 1;
  let balance = loan;
  const mr = i.mortgageRatePct / 100 / 12;
  let ownerPot = 0;
  let renterPot = i.downPayment; // renter invests the down payment
  const rows: YearRow[] = [];
  let breakEvenYear: number | null = null;
  for (let m = 1; m <= i.years * 12; m++) {
    const yearIdx = Math.floor((m - 1) / 12);
    const homeValueNow = i.homePrice * Math.pow(1 + i.homeGrowthPct / 100, yearIdx);
    const ownCost = (homeValueNow * i.ownCostPct) / 100 / 12;
    const rent = i.monthlyRent * Math.pow(1 + i.rentGrowthPct / 100, yearIdx);
    const interest = balance * mr;
    const principal = m <= i.mortgageYears * 12 ? Math.min(balance, pay - interest) : 0;
    const mortgagePaid = m <= i.mortgageYears * 12 ? pay : 0;
    balance = Math.max(0, balance - principal);
    const ownerOut = mortgagePaid + ownCost;
    const gap = ownerOut - rent;
    ownerPot *= 1 + rm; renterPot *= 1 + rm;
    if (gap > 0) renterPot += gap; else ownerPot += -gap;
    if (m % 12 === 0) {
      const year = m / 12;
      const price = i.homePrice * Math.pow(1 + i.homeGrowthPct / 100, year);
      const equity = price * (1 - i.sellCostPct / 100) - balance;
      rows.push({ year, homeEquity: equity, ownerExtraInvested: ownerPot, liquidInvestments: renterPot, ownerOutflow: ownerOut * 12, renterOutflow: rent * 12 });
      if (breakEvenYear === null && equity + ownerPot > renterPot) breakEvenYear = year;
    }
  }
  return { rows: rows.map((r) => ({ ...r })), breakEvenYear, monthlyPayment: pay };
}
/** Re-run with one input moved up and down so the learner sees which assumption matters. Each case is labeled by the field and delta. */
export function sensitivity(input: RentBuyInputs, field: "homeGrowthPct" | "investReturnPct" | "mortgageRatePct" | "monthlyRent", delta: number) {
  const run = (d: number) => rentVsBuy({ ...input, [field]: input[field] + d });
  return { field, delta, down: run(-delta), base: run(0), up: run(delta) };
}
