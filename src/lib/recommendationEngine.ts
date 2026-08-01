import type { InvestmentProfile } from "@/data/investmentModels";

export function generateRecommendations(
  profile: InvestmentProfile
): string[] {

  const recommendations: string[] = [];


  if (profile.years >= 10) {

    recommendations.push(
      "אופק השקעה ארוך מאפשר להתמקד בצמיחה ארוכת טווח."
    );

  }


  if (profile.risk === "Aggressive" || profile.risk === "High") {

    recommendations.push(
      "סיבולת הסיכון מאפשרת חשיפה גבוהה יותר לנכסי צמיחה."
    );

  }


  if (
    profile.interests?.includes("טכנולוגיה")
  ) {

    recommendations.push(
      "ניתן לשקול חשיפה מבוקרת לסקטור הטכנולוגיה."
    );

  }


  recommendations.push(
    "התמדה והשקעה עקבית הן גורם מרכזי בבניית הון."
  );


  return recommendations;

}
