// =====================================================
// InvestED - Financial Insight Engine
// =====================================================

import type {
  FinancialScenario,
  Projection
} from "@/types";

import type {
  InvestorClassification
} from "@/types";



export interface FinancialInsight {

  title:string;

  description:string;

  type:
    | "growth"
    | "risk"
    | "goal"
    | "education";

}



export interface FinancialInsightResult {

  headline:string;

  insights:FinancialInsight[];

}




export function generateFinancialInsights(

  scenario:FinancialScenario,

  projection:Projection,

  investor:InvestorClassification

):FinancialInsightResult {


  const insights:FinancialInsight[] = [];



  if(
    scenario.years >= 10
  ){

    insights.push({

      title:
        "אופק השקעה ארוך",

      description:
        "משך השקעה ארוך מאפשר לנצל את אפקט הריבית דריבית ולהתמודד טוב יותר עם תנודתיות.",

      type:
        "growth"

    });

  }



  if(
    investor.type === "משקיע צמיחה"
  ){

    insights.push({

      title:
        "פרופיל צמיחה",

      description:
        "הפרופיל מצביע על נכונות לקחת סיכון גבוה יותר עבור פוטנציאל תשואה ארוך טווח.",

      type:
        "risk"

    });

  }



  if(
    projection.growth >
    projection.totalContributed
  ){

    insights.push({

      title:
        "הריבית דריבית משמעותית",

      description:
        "חלק משמעותי מהתוצאה הסופית מגיע מצמיחת ההשקעה ולא רק מההפקדות.",

      type:
        "education"

    });

  }



  if(
    scenario.goal === "retirement"
  ){

    insights.push({

      title:
        "יעד פרישה",

      description:
        "התכנון מתמקד בבניית הון לטווח ארוך ועצמאות פיננסית.",

      type:
        "goal"

    });

  }



  return {

    headline:
      buildHeadline(
        scenario,
        investor
      ),

    insights

  };


}




function buildHeadline(

 scenario:FinancialScenario,

 investor:InvestorClassification

):string {


 if(
  scenario.goal === "retirement"
 ){

  return "התוכנית מתמקדת בבניית עצמאות פיננסית לאורך זמן.";

 }


 if(
  investor.type === "משקיע צמיחה"
 ){

  return "האסטרטגיה מתאימה למשקיע שמחפש צמיחה ארוכת טווח.";

 }


 return "הניתוח מבוסס על שילוב בין יעד פיננסי, זמן וסיכון.";

}