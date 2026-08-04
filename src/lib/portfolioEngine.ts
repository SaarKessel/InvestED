import type { AllocationItem, InvestorType, ProfileFlags } from "@/types";

// ---------------------------------------------------------------------------
// InvestED — Portfolio Engine
// בונה תיק לדוגמה חינוכי בלבד. לא המלצת השקעה.
// ---------------------------------------------------------------------------

const COLORS = {
  us: "#22b17d",
  intl: "#3ecfff",
  dividend: "#f9c74f",
  bonds: "#f97066",
  cash: "#9c8cf7",
  sector: "#5eead4",
};

type RawAllocation = Record<string, number>;

const BASE_TEMPLATES: Record<InvestorType, RawAllocation> = {
  "משקיע שמרני": { "מניות ארה\"ב (ETF)": 20, "מניות בינלאומיות (ETF)": 5, "דיבידנד (ETF)": 10, "אג\"ח (ETF)": 55, "מזומן": 10 },
  "משקיע דיבידנדים": { "מניות ארה\"ב (ETF)": 25, "מניות בינלאומיות (ETF)": 10, "דיבידנד (ETF)": 40, "אג\"ח (ETF)": 20, "מזומן": 5 },
  "משקיע מאוזן": { "מניות ארה\"ב (ETF)": 40, "מניות בינלאומיות (ETF)": 20, "דיבידנד (ETF)": 15, "אג\"ח (ETF)": 20, "מזומן": 5 },
  "משקיע ערך": { "מניות ארה\"ב (ETF)": 35, "מניות בינלאומיות (ETF)": 15, "דיבידנד (ETF)": 25, "אג\"ח (ETF)": 20, "מזומן": 5 },
  "משקיע פסיבי": { "מניות ארה\"ב (ETF)": 50, "מניות בינלאומיות (ETF)": 25, "דיבידנד (ETF)": 5, "אג\"ח (ETF)": 15, "מזומן": 5 },
  "משקיע צמיחה": { "מניות ארה\"ב (ETF)": 55, "מניות בינלאומיות (ETF)": 20, "דיבידנד (ETF)": 5, "אג\"ח (ETF)": 15, "מזומן": 5 },
};

function colorFor(name: string): string {
  if (name.includes("ארה\"ב")) return COLORS.us;
  if (name.includes("בינלאומ")) return COLORS.intl;
  if (name.includes("דיבידנד")) return COLORS.dividend;
  if (name.includes("אג\"ח")) return COLORS.bonds;
  if (name.includes("מזומן")) return COLORS.cash;
  return COLORS.sector;
}

function renormalize(raw: RawAllocation): RawAllocation {
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  if (total === 0) return raw;
  const scaled: RawAllocation = {};
  Object.entries(raw).forEach(([k, v]) => (scaled[k] = (v / total) * 100));
  const rounded: RawAllocation = {};
  Object.entries(scaled).forEach(([k, v]) => (rounded[k] = Math.round(v)));
  const diff = 100 - Object.values(rounded).reduce((a, b) => a + b, 0);
  if (diff !== 0) {
    const biggestKey = Object.entries(rounded).sort((a, b) => b[1] - a[1])[0][0];
    rounded[biggestKey] += diff;
  }
  return Object.fromEntries(Object.entries(rounded).filter(([, v]) => v > 0));
}


function adjustByProfile(
  allocation: RawAllocation,
  flags: ProfileFlags
): RawAllocation {

  const result = { ...allocation };

  const age = flags.age;

  // צעירים עם אופק ארוך יכולים לשאת יותר מניות
  if (age !== null && age < 35 && flags.horizon === "long") {

    const bonds = result["אג\"ח (ETF)"] ?? 0;

    const shift = Math.min(10, bonds);

    result["אג\"ח (ETF)"] = bonds - shift;

    result["מניות ארה\"ב (ETF)"] =
      (result["מניות ארה\"ב (ETF)"] ?? 0) + shift;

  }


  // משקיע מבוגר או אופק קצר
  if (
    (age !== null && age > 55) ||
    flags.horizon === "short"
  ) {

    const stocks =
      result["מניות ארה\"ב (ETF)"] ?? 0;

    const shift = Math.min(15, stocks);

    result["מניות ארה\"ב (ETF)"] =
      stocks - shift;

    result["אג\"ח (ETF)"] =
      (result["אג\"ח (ETF)"] ?? 0) + shift;

  }


  return result;
}
export function buildAllocation(
  investorType: InvestorType,
  flags: ProfileFlags
): AllocationItem[] {

  let allocation: RawAllocation = {
    ...(BASE_TEMPLATES[investorType] ?? BASE_TEMPLATES["משקיע מאוזן"])
  };


  const prefs = new Set(flags.preferences);


  // התאמות לפי העדפות משתמש
  if (prefs.has("dividend")) {

    const shift = Math.min(
      10,
      allocation["מניות ארה\"ב (ETF)"] ?? 0
    );

    allocation["מניות ארה\"ב (ETF)"] =
      (allocation["מניות ארה\"ב (ETF)"] ?? 0) - shift;

    allocation["דיבידנד (ETF)"] =
      (allocation["דיבידנד (ETF)"] ?? 0) + shift;
  }



  if (prefs.has("bonds")) {

    const cash = allocation["מזומן"] ?? 0;

    const shift = Math.min(
      10,
      cash + 5
    );


    allocation["מזומן"] =
      Math.max(
        0,
        cash - Math.min(5, cash)
      );


    allocation["אג\"ח (ETF)"] =
      (allocation["אג\"ח (ETF)"] ?? 0) + shift;

  }



  // התאמה לפי תחומי עניין
  const sectorInterests =
    flags.interests.filter(
      (i) =>
        i === "טכנולוגיה" ||
        i === "בריאות"
    );


  if (sectorInterests.length) {

    const usAlloc =
      allocation["מניות ארה\"ב (ETF)"] ?? 0;


    const carve =
      Math.min(
        15,
        usAlloc * 0.4
      );


    allocation["מניות ארה\"ב (ETF)"] =
      usAlloc - carve;


    const label =
      `קרנות סקטוריאליות (${sectorInterests.join("/")})`;


    allocation[label] =
      (allocation[label] ?? 0) + carve;
  }



  // ⭐ חדש: התאמה חכמה לפי גיל ואופק השקעה
  allocation = adjustByProfile(
    allocation,
    flags
  );



  const normalized =
    renormalize(allocation);



  return Object.entries(normalized).map(
    ([name, value]) => ({
      name,
      value,
      color: colorFor(name),
    })
  );
}

export function portfolioNarrative(
  investorType: InvestorType,
  allocation: AllocationItem[]
): string {

  const top = [...allocation]
    .sort((a, b) => b.value - a.value)[0];


  const parts: string[] = [
    `ההקצאה לדוגמה הזו משקפת פרופיל של "${investorType}".`,
    `הרכיב הגדול ביותר הוא ${top.name} (${top.value}%), שמעגן את אופי הסיכון-תשואה הכללי של התיק.`,
  ];


  const bonds = allocation.find(
    (a) => a.name.includes("אג\"ח")
  );


  if (bonds && bonds.value >= 25) {
    parts.push(
      "הקצאת אג\"ח משמעותית נכללת כדי לרסן תנודתיות בזמן ירידות בשוק המניות."
    );
  }


  const intl = allocation.find(
    (a) => a.name.includes("בינלאומ")
  );


  if (intl && intl.value >= 15) {
    parts.push(
      "רכיב בינלאומי בולט מוסיף פיזור גאוגרפי ומפחית תלות בכלכלה בודדת."
    );
  }


  parts.push(
    "זכור: זוהי דוגמה חינוכית בלבד — לא המלצת השקעה."
  );


  return parts.join(" ");
}


// ---------------------------------------------------------------------------
// Portfolio Intelligence Metrics
// שכבת ניתוח לתיק עבור Explainable AI
// ---------------------------------------------------------------------------

export function calculatePortfolioMetrics(
  allocation: AllocationItem[]
) {

  if (!allocation.length) {

    return {

      expectedReturn:0,

      riskLevel:"בינוני" as const,

      volatilityEstimate:"לא זמין",

      diversification:"נמוך",

      equityExposure:0,

      fixedIncomeExposure:0,

      explanation:
        "לא קיימים נתוני הקצאה לניתוח.",

      largestPosition:
        "לא ידוע",

      largestPositionWeight:0,

    };

  }



  const equityKeywords = [

    "מניות",

    "דיבידנד",

    "סקטור"

  ];



  const fixedKeywords = [

    "אג\"ח",

    "מזומן"

  ];





  const equityExposure = allocation

    .filter(item =>
      equityKeywords.some(
        key => item.name.includes(key)
      )
    )

    .reduce(
      (sum,item)=>sum + item.value,
      0
    );





  const fixedIncomeExposure = allocation

    .filter(item =>
      fixedKeywords.some(
        key => item.name.includes(key)
      )
    )

    .reduce(
      (sum,item)=>sum + item.value,
      0
    );







  const largestPosition =

    [...allocation]

      .sort(
        (a,b)=>b.value-a.value
      )[0];








  let diversification =
    "בינוני";


  if(allocation.length >= 5){

    diversification =
      "גבוה";

  }


  else if(allocation.length <= 2){

    diversification =
      "נמוך";

  }








  let riskLevel:
    | "נמוך"
    | "בינוני"
    | "גבוה";



  if(equityExposure >= 80){

    riskLevel="גבוה";

  }

  else if(equityExposure <=40){

    riskLevel="נמוך";

  }

  else {

    riskLevel="בינוני";

  }









  const expectedReturn =

    Math.round(

      (
        equityExposure * 0.08 +

        fixedIncomeExposure * 0.035

      )

      /100

      *100

    )

    /100;









  return {


    expectedReturn,


    riskLevel,


    volatilityEstimate:

      riskLevel === "גבוה"

        ?

        "תנודתיות גבוהה"

        :

        riskLevel === "נמוך"

        ?

        "תנודתיות נמוכה"

        :

        "תנודתיות בינונית",






    diversification,




    equityExposure:

      Math.round(
        equityExposure
      ),




    fixedIncomeExposure:

      Math.round(
        fixedIncomeExposure
      ),





    explanation:

      `התיק מכיל ${Math.round(
        equityExposure
      )}% חשיפה מנייתית ו-${Math.round(
        fixedIncomeExposure
      )}% רכיבים סולידיים. רמת הפיזור: ${diversification}.`,





    largestPosition:

      largestPosition.name,





    largestPositionWeight:

      largestPosition.value,


  };

}