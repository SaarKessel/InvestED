import type {
  HistoricalPortfolioPoint,
  HistoricalStockSimulationInput,
  HistoricalStockSimulationResult,
  StockPricePoint,
  StockProjectionInput,
  StockProjectionResult,
} from "@/types/stockSimulation";

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function validPrices(prices: StockPricePoint[], startDate?: string, endDate?: string): StockPricePoint[] {
  return prices
    .filter((point) => Number.isFinite(point.price) && point.price > 0)
    .filter((point) => (!startDate || point.date >= startDate) && (!endDate || point.date <= endDate))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function isFirstPriceOfMonth(prices: StockPricePoint[], index: number): boolean {
  return index === 0 || prices[index - 1].date.slice(0, 7) !== prices[index].date.slice(0, 7);
}

function annualizedReturn(finalValue: number, invested: number, startDate: string, endDate: string): number | null {
  if (invested <= 0 || finalValue < 0) return null;
  const days = (Date.parse(endDate) - Date.parse(startDate)) / 86_400_000;
  if (days < 365) return null;
  return (Math.pow(finalValue / invested, 365 / days) - 1) * 100;
}

export function simulateHistoricalInvestment(input: HistoricalStockSimulationInput): HistoricalStockSimulationResult {
  const prices = validPrices(input.prices, input.startDate, input.endDate);
  if (prices.length === 0) throw new Error("A historical simulation requires at least one valid price point.");

  const feeRate = Math.max(0, input.purchaseFeePercent ?? 0) / 100;
  const contribution = input.contribution;
  let shares = 0;
  let invested = 0;
  let purchases = 0;
  let peakValue = 0;
  let maxDrawdownPercent = 0;
  const series: HistoricalPortfolioPoint[] = [];

  prices.forEach((point, index) => {
    const monthlyPurchase = isFirstPriceOfMonth(prices, index);
    let cashToInvest = 0;

    if (contribution.cadence === "one_time" && index === 0) {
      cashToInvest = contribution.initialInvestment ?? 0;
    }
    if (contribution.cadence === "monthly_cash" && monthlyPurchase) {
      cashToInvest = contribution.monthlyContribution ?? 0;
    }
    if (contribution.cadence === "monthly_shares" && monthlyPurchase) {
      const shareCount = contribution.monthlyShares ?? 0;
      const grossCost = shareCount * point.price;
      shares += shareCount;
      invested += grossCost * (1 + feeRate);
      if (shareCount > 0) purchases += 1;
    }
    if (cashToInvest > 0) {
      const netCash = cashToInvest / (1 + feeRate);
      shares += netCash / point.price;
      invested += cashToInvest;
      purchases += 1;
    }

    const value = shares * point.price;
    peakValue = Math.max(peakValue, value);
    const drawdownPercent = peakValue === 0 ? 0 : ((value - peakValue) / peakValue) * 100;
    maxDrawdownPercent = Math.min(maxDrawdownPercent, drawdownPercent);
    series.push({
      date: point.date,
      price: point.price,
      shares: round(shares, 6),
      contributed: round(invested),
      value: round(value),
      drawdownPercent: round(drawdownPercent),
    });
  });

  const finalValue = series[series.length - 1].value;
  return {
    symbol: input.symbol,
    invested: round(invested),
    shares: round(shares, 6),
    finalValue,
    profit: round(finalValue - invested),
    returnPercent: invested === 0 ? 0 : round(((finalValue - invested) / invested) * 100),
    annualizedReturnPercent: annualizedReturn(finalValue, invested, prices[0].date, prices[prices.length - 1].date),
    maxDrawdownPercent: round(maxDrawdownPercent),
    purchases,
    series,
  };
}

export function projectStockInvestment(input: StockProjectionInput): StockProjectionResult {
  const months = Math.max(1, Math.round(input.years * 12));
  const monthlyRate = input.annualReturnPercent / 100 / 12;
  const monthlyContribution = Math.max(0, input.monthlyContribution ?? 0);
  let contributed = Math.max(0, input.initialInvestment ?? 0);
  let value = contributed;
  const series = [{ month: 0, contributed: round(contributed), value: round(value) }];

  for (let month = 1; month <= months; month += 1) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    contributed += monthlyContribution;
    series.push({ month, contributed: round(contributed), value: round(value) });
  }

  const inflationPercent = input.inflationPercent ?? 3;
  const projectedValue = round(value);
  return {
    symbol: input.symbol,
    contributed: round(contributed),
    projectedValue,
    growth: round(projectedValue - contributed),
    realValueAfterInflation: round(projectedValue / Math.pow(1 + inflationPercent / 100, input.years)),
    series,
  };
}


