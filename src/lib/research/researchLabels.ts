import type { MarketAssetType, MarketDataSource, MarketStatus } from "../../types";

/** Display labels only: retain raw provider codes in data contracts and exports. */
export function researchCodeLabel(kind: "asset" | "status" | "source", value: MarketAssetType | MarketStatus | MarketDataSource | undefined, language: "he" | "en"): string {
  const labels: Record<typeof kind, Record<string, [string, string]>> = {
    asset: { stock: ["מניה", "Stock"], etf: ["קרן סל", "ETF"], fund: ["קרן", "Fund"], index: ["מדד", "Index"], unknown: ["סוג לא ידוע", "Unknown type"] },
    status: { open: ["פתוח", "Open"], closed: ["סגור", "Closed"], pre_market: ["טרום מסחר", "Pre-market"], after_hours: ["לאחר המסחר", "After-hours"], unknown: ["לא ידוע", "Unknown"] },
    source: { yahoo_finance: ["Yahoo Finance", "Yahoo Finance"], alpha_vantage: ["Alpha Vantage", "Alpha Vantage"], mock: ["הדמיה", "Simulation"] },
  };
  const choice = labels[kind][value ?? "unknown"];
  return choice?.[language === "he" ? 0 : 1] ?? (language === "he" ? "לא ידוע" : "Unknown");
}

export function indicatorLabel(value: string, language: "he" | "en"): string {
  const labels: Record<string, [string, string]> = {
    volatilityPct: ["תנודתיות", "Volatility"],
    rsi14: ["מדד חוזק יחסי (RSI 14)", "Relative strength (RSI 14)"],
    sma20: ["ממוצע נע 20 (SMA)", "20-period moving average (SMA)"],
    sma50: ["ממוצע נע 50 (SMA)", "50-period moving average (SMA)"],
    ema20: ["ממוצע נע מעריכי 20 (EMA)", "20-period exponential average (EMA)"],
    macd: ["מדד MACD", "Moving-average spread (MACD)"],
  };
  return labels[value]?.[language === "he" ? 0 : 1] ?? value;
}
