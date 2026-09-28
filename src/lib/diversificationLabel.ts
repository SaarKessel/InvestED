/** The portfolio engine returns a qualitative band, never a percentage. */
export function diversificationLabel(value: string, t: (key: string, fallback?: string) => string): string {
  if (value === "low" || value === "medium" || value === "high") {
    return t(`portfolio_risk_${value}`, value);
  }
  return t("profile_unset", "Not set");
}
