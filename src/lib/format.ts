import { getCurrencyByCode } from "@/lib/currencies";

export function formatCurrency(
  value: number,
  currencyCode: string = "ILS",
  language: string = "en"
): string {
  const currency = getCurrencyByCode(currencyCode);
  const appLocale = language === "he" ? "he-IL" : "en-US";
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(appLocale, {
    style: "currency",
    currency: currency.currency,
    maximumFractionDigits: 0,
  }).format(safeValue);
}

export function formatCompactCurrency(
  value: number,
  currencyCode: string = "ILS",
  language: string = "en"
): string {
  const currency = getCurrencyByCode(currencyCode);
  const safeValue = Math.max(safeNumber(value), 0);
  if (safeValue >= 1_000_000) {
    return `${(safeValue / 1_000_000).toFixed(2)}M ${currency.symbol}`;
  }
  if (safeValue >= 1_000) {
    return `${Math.round(safeValue / 1_000)}K ${currency.symbol}`;
  }
  return formatCurrency(safeValue, currencyCode, language);
}

export function formatMoney(
  value: number,
  locale: string = "en-US",
  currencyCode: string = "ILS"
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(safeValue);
}

export function formatCompactMoney(
  value: number,
  locale: string = "en-US",
  currencyCode: string = "ILS"
): string {
  const currency = getCurrencyByCode(currencyCode);
  const safeValue = Math.max(safeNumber(value), 0);
  if (safeValue >= 1_000_000) {
    return `${(safeValue / 1_000_000).toFixed(2)}${currency.symbol}`;
  }
  if (safeValue >= 1_000) {
    return `${Math.round(safeValue / 1_000)}K ${currency.symbol}`;
  }
  return formatMoney(safeValue, locale, currencyCode);
}

export function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(value, min), max);
}

export function safeNumber(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function confidenceLabel(
  value: number | undefined,
  t: (key: string, fallback?: string) => string
): string {
  if (!value) return t("dashboard_not_calculated", "Not calculated");
  if (value >= 80) return t("dashboard_confidence_high", "High");
  if (value >= 50) return t("dashboard_confidence_medium", "Medium");
  return t("dashboard_confidence_low", "Low");
}

export function dashboardGoalLabel(
  goal: string | undefined,
  t: (key: string, fallback?: string) => string
): string {
  switch (goal) {
    case "retirement":
      return t("dashboard_goal_retirement", "Retirement & Financial Independence");
    case "home":
      return t("dashboard_goal_house", "Home Purchase");
    case "child":
      return t("dashboard_goal_children", "Children's Savings");
    case "growth":
      return t("dashboard_goal_wealth", "Wealth Building");
    default:
      return t("dashboard_goal_wealth_build", "Wealth Accumulation");
  }
}

export function calculatorGoalLabel(
  goal: string | undefined,
  t: (key: string, fallback?: string) => string
): string {
  switch (goal) {
    case "growth":
      return t("calc_ex_growth", "Wealth Building");
    case "retirement":
      return t("calc_ex_early_retirement", "Early Retirement");
    case "child":
      return t("calc_ex_children", "Saving for Children");
    case "home":
      return t("calc_ex_house", "Home Purchase");
    case "wealth":
      return t("calc_ex_independence", "Financial Independence");
    default:
      return t("calc_ex_general", "General Investing");
  }
}

export function investorTypeLabel(
  type: string,
  t: (key: string, fallback?: string) => string
): string {
  switch (type) {
    case "conservative":
      return t("investor_type_conservative", "Conservative");
    case "balanced":
      return t("investor_type_balanced", "Balanced");
    case "growth":
      return t("investor_type_growth", "Growth");
    case "dividend":
      return t("investor_type_dividend", "Dividend");
    case "passive":
      return t("investor_type_passive", "Passive");
    case "value":
      return t("investor_type_value", "Value");
    default:
      return type;
  }
}

export function riskBandLabel(
  band: string | undefined,
  t: (key: string, fallback?: string) => string
): string {
  switch (band) {
    case "low":
      return t("risk_band_low", "Low");
    case "medium":
      return t("risk_band_medium", "Medium");
    case "high":
      return t("risk_band_high", "High");
    default:
      return band ?? t("risk_band_medium", "Medium");
  }
}
