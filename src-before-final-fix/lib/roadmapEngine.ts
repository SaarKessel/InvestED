import { RoadmapStage } from "../components/dashboard/FinancialRoadmapCard";

interface RoadmapInput {
  horizon?: string;
}

export function generateRoadmap(
  result: RoadmapInput
): RoadmapStage[] {

  const years =
    result.horizon === "ארוך"
      ? "10-15 שנים"
      : "5 שנים";


  return [

    {
      year: "שלב 1",
      title: "בניית בסיס פיננסי",
      actions: [
        "הגדרת מטרות השקעה",
        "בניית תיק מפוזר",
        "השקעה עקבית"
      ]
    },


    {
      year: "שלב 2",
      title: "צמיחה ארוכת טווח",
      actions: [
        "הגדלת הפקדות",
        "ניצול ריבית דריבית",
        "מעקב תקופתי"
      ]
    },


    {
      year: years,
      title: "ניהול עצמאות כלכלית",
      actions: [
        "איזון סיכונים",
        "שימור הון",
        "תכנון עתידי"
      ]
    }

  ];

}
