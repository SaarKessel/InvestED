export function generateRecommendations(result:any){

  const recommendations:string[] = [];


  if(result?.horizon === "ארוך"){

    recommendations.push(
      "אופק השקעה ארוך מאפשר להתמקד בצמיחה ארוכת טווח."
    );

  }


  if(result?.riskScore >= 7){

    recommendations.push(
      "סיבולת הסיכון מאפשרת חשיפה גבוהה יותר לנכסי צמיחה."
    );

  }


  if(result?.flags?.interests?.includes("טכנולוגיה")){

    recommendations.push(
      "ניתן לשקול חשיפה מבוקרת לסקטור הטכנולוגיה."
    );

  }


  recommendations.push(
    "התמדה והשקעה עקבית הן גורם מרכזי בבניית הון."
  );


  return recommendations;

}
