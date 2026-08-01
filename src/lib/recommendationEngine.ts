import type { InvestmentProfile } from "@/data/investmentModels";

export function generateRecommendations(
  profile: InvestmentProfile
): string[] {

  const recommendations: string[] = [];


  if (profile.years >= 10) {

    recommendations.push(
      "���� ����� ���� ����� ������ ������ ����� ����."
    );

  }


  if (profile.risk === "Growth") {

    recommendations.push(
      "������ ������ ������ ����� ����� ���� ����� �����."
    );

  }


  if (
    false
  ) {

    recommendations.push(
      "���� ����� ����� ������ ������ ����������."
    );

  }


  recommendations.push(
    "����� ������ ����� �� ���� ����� ������ ���."
  );


  return recommendations;

}

