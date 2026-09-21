import type { InvestmentProfile } from "@/data/investmentModels";

export function generateRecommendations(
  profile: InvestmentProfile,
  language: "he" | "en" = "he"
): string[] {

  const recommendations: string[] = [];


  if (profile.years >= 10) {

    recommendations.push(
      language === "he"
        ? "אורך טווח ארוך מאפשר לריבית דריבית להיות מנוע מרכזי בבניית ההון."
        : "A long-term horizon allows compound interest to be a central engine in building wealth."
    );

  }


  if (profile.risk === "Growth") {

    recommendations.push(
      language === "he"
        ? "פרופיל צמיחה עשוי להיות רגיש יותר לתנודות שוק, ולכן פיזור בין נכסים יכול לשנות את פרופיל הסיכון הכולל."
        : "A growth profile may be more sensitive to market fluctuations, so diversification across assets can change the overall risk profile."
    );

  }


  recommendations.push(
language === "he"
      ? "חשוב לבחון את התרחיש ביחס למטרה, לאופק ההשקעה ויכולת האישית להתמודד עם ירידות."
      : "It's important to examine the scenario in relation to the goal, investment horizon, and personal ability to cope with declines."
  );


  return recommendations;

}
