export type InvestorRisk =
  | "Conservative"
  | "Balanced"
  | "Growth"
  | "Aggressive";

export interface InvestmentProfile {
  age: number;
  initialCapital: number;
  monthlyContribution: number;
  years: number;
  risk: InvestorRisk;
  goal: string;
}

export interface InvestmentScenario {
  name: string;
  annualReturn: number;
  description: string;
}

export const defaultScenarios: InvestmentScenario[] = [
  {
    name: "Conservative",
    annualReturn: 0.05,
    description: "Low volatility portfolio"
  },
  {
    name: "S&P 500 Historical",
    annualReturn: 0.10,
    description: "Long term equity growth scenario"
  },
  {
    name: "Aggressive Growth",
    annualReturn: 0.12,
    description: "Higher risk growth scenario"
  }
];