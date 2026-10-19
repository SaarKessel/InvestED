/** Colors a user can apply by name. Light fills keep text readable; font colors are the strong versions. */
export const PALETTE = ["yellow", "green", "red", "blue", "gray", "orange", "purple", "pink", "teal"] as const;
export type PaletteColor = (typeof PALETTE)[number];
export const BG_HEX: Record<PaletteColor, string> = { yellow: "#FFF2A8", green: "#C6EFCE", red: "#FFC7CE", blue: "#BDD7EE", gray: "#D9D9D9", orange: "#FFE0B3", purple: "#E1D1F0", pink: "#F8CFE3", teal: "#BFE8E4" };
export const FG_HEX: Record<PaletteColor, string> = { yellow: "#B38F00", green: "#1E7B34", red: "#C00000", blue: "#1F4E9C", gray: "#595959", orange: "#C55A11", purple: "#6B3FA0", pink: "#C2185B", teal: "#0F766E" };
export const COLOR_HE: Record<string, string> = { yellow: "צהוב", green: "ירוק", red: "אדום", blue: "כחול", gray: "אפור", orange: "כתום", purple: "סגול", pink: "ורוד", teal: "טורקיז" };

/** Excel number format string for a GapSheet number format. */
export function excelNumberFormat(f: { numberFormat?: string; decimals?: number }): string | undefined {
  const d = f.decimals;
  if (f.numberFormat === "date") return "yyyy-mm-dd";
  if (f.numberFormat === "percent") return d ? `0.${"0".repeat(d)}%` : "0%";
  if (f.numberFormat === "currency") return d ? `"₪"#,##0.${"0".repeat(d)}` : '"₪"#,##0';
  if (f.numberFormat === "number") return `#,##0.${"0".repeat(d ?? 2)}`;
  return undefined;
}
