import type { InvestmentProfile } from "@/data/investmentModels";

export function generateRecommendations(
  profile: InvestmentProfile
): string[] {

  const recommendations: string[] = [];


  if (profile.years >= 10) {

    recommendations.push(
      "אורך טווח ארוך מאפשר לריבית דריבית להיות מנוע מרכזי בבניית ההון."
    );

  }


  if (profile.risk === "Growth") {

    recommendations.push(
      "פרופיל צמיחה עשוי להיות רגיש יותר לתנודות שוק, ולכן פיזור בין נכסים יכול לשנות את פרופיל הסיכון הכולל."
    );

  }


  recommendations.push(
    "חשוב לבחון את התרחיש ביחס למטרה, לאופק ההשקעה ויכולת האישית להתמודד עם ירידות."
  );


  return recommendations;

}
