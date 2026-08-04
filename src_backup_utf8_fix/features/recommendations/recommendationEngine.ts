import { InvestmentProfile } from "../../data/investmentModels";

export function generateRecommendations(
  profile: InvestmentProfile
): string[] {

  const recommendations: string[] = [];

  if (profile.years >= 15) {
    recommendations.push(
      "Consider diversified equity exposure for long term goals."
    );
  }

  if (profile.monthlyContribution > 1000) {
    recommendations.push(
      "Your monthly contribution is a strong wealth building habit."
    );
  }

  if (profile.risk === "Conservative") {
    recommendations.push(
      "Consider reviewing whether your allocation matches your long horizon."
    );
  }

  recommendations.push(
    "Review fees because small differences compound over decades."
  );

  return recommendations;
}
