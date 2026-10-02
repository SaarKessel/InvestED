
export function personaValueLabel(value: string | null, language: "he" | "en"): string {
  if (!value || language === "en") return value ?? "";
  if (value === "yes") return "כן";
  if (value === "no") return "לא";
  if (value === "negative") return "שלילי";
  return value.replace(/\s+yr$/, " שנים");
}
