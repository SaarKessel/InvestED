// ---------------------------------------------------------------------------
// InvestED — Financial Formatting Utilities
// Centralized formatting for currency, percentages, and numbers
// ---------------------------------------------------------------------------

export type LocaleCode = "he-IL" | "en-US";

const localeFromLanguage = (language: string): LocaleCode =>
  language === "he" ? "he-IL" : "en-US";

export function formatCurrency(
  value: number,
  language = "he",
  options: Intl.NumberFormatOptions = {}
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(localeFromLanguage(language), {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
    ...options,
  }).format(safeValue);
}

export function formatNumber(
  value: number,
  language = "he",
  options: Intl.NumberFormatOptions = {}
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(localeFromLanguage(language), {
    maximumFractionDigits: 0,
    ...options,
  }).format(safeValue);
}

export function formatPercent(
  value: number,
  _language = "he",
  decimals = 1
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(decimals)}%`;
}

export function formatCompactNumber(
  value: number,
  _language = "he"
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  if (safeValue >= 1_000_000) {
    return `${(safeValue / 1_000_000).toFixed(1)}M`;
  }
  if (safeValue >= 1_000) {
    return `${(safeValue / 1_000).toFixed(1)}K`;
  }
  return safeValue.toString();
}
