import { RoadmapStage } from "../components/dashboard/FinancialRoadmapCard";

interface RoadmapInput {
  horizon?: string;
}

export function generateRoadmap(
  result: RoadmapInput,
  language: "he" | "en" = "he"
): RoadmapStage[] {

  const years =
    result.horizon === "ארוך"
      ? language === "he" ? "10-15 שנים" : "10-15 years"
      : language === "he" ? "5 שנים" : "5 years";


  return [

    {
      year: language === "he" ? "שלב 1" : "Stage 1",
      title: language === "he" ? "בניית בסיס פיננסי" : "Financial Basics",
      actions: language === "he"
        ? ["הגדרת מטרות השקעה", "בניית תיק מפוזר", "השקעה עקבית"]
        : ["Define investment goals", "Build a diversified portfolio", "Consistent investing"]
    },


    {
      year: language === "he" ? "שלב 2" : "Stage 2",
      title: language === "he" ? "צמיחה ארוכת טווח" : "Long-Term Growth",
      actions: language === "he"
        ? ["הגדלת הפקדות", "ניצול ריבית דריבית", "מעקב תקופתי"]
        : ["Increase contributions", "Leverage compound interest", "Periodic review"]
    },


    {
      year: years,
      title: language === "he" ? "ניהול עצמאות כלכלית" : "Managing Financial Independence",
      actions: language === "he"
        ? ["איזון סיכונים", "שימור הון", "תכנון עתידי"]
        : ["Risk balancing", "Capital preservation", "Future planning"]
    }

  ];

}
