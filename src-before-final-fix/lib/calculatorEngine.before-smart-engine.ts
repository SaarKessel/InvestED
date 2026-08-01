// ---------------------------------------------------------------------------
// InvestED — Conversational Calculator Engine
// ---------------------------------------------------------------------------

export interface AssetClassOption {
  key: string;
  label: string;
  annualReturnPct: number;
  keywords: string[];
  blurb: string;
}


export const ASSET_CLASSES: AssetClassOption[] = [

  {
    key: "apple",
    label: "Apple (AAPL)",
    annualReturnPct: 12,
    keywords: [
      "apple",
      "אפל",
      "aapl"
    ],
    blurb:
      "מניית Apple Inc. — חברת טכנולוגיה גלובלית."
  },


  {
    key: "microsoft",
    label: "Microsoft (MSFT)",
    annualReturnPct: 12,
    keywords: [
      "microsoft",
      "מיקרוסופט",
      "msft"
    ],
    blurb:
      "מניית Microsoft — חברת תוכנה ושירותי ענן."
  },


  {
    key: "nasdaq",
    label: "מדד נאסד״ק / מניות טכנולוגיה",
    annualReturnPct: 12,
    keywords: [
      "nasdaq",
      "נאסדק",
      "נאסד״ק",
      "טכנולוגיה",
      "הייטק"
    ],
    blurb:
      "מדד מוטה טכנולוגיה עם תנודתיות גבוהה."
  },


  {
    key: "sp500",
    label: "מדד S&P 500",
    annualReturnPct: 10,
    keywords: [
      "s&p 500",
      "s&p500",
      "sp500",
      "אס אנד פי",
      "מדד אס אנד פי"
    ],
    blurb:
      "מדד הכולל 500 חברות גדולות בארה״ב."
  },


  {
    key: "ta125",
    label: "מדד ת״א 125",
    annualReturnPct: 7,
    keywords: [
      "תא 125",
      "תא125",
      "ת״א 125"
    ],
    blurb:
      "מדד החברות הגדולות בבורסה בישראל."
  },


  {
    key: "bonds",
    label: "אג״ח ממשלתי",
    annualReturnPct: 3.5,
    keywords: [
      "אגח",
      "אג״ח",
      "אגרות חוב",
      "ממשלתי",
      "סולידי"
    ],
    blurb:
      "אפיק השקעה סולידי יחסית."
  },


  {
    key: "balanced",
    label: "תיק מאוזן (מניות + אג״ח)",
    annualReturnPct: 7,
    keywords: [
      "מאוזן",
      "תיק מאוזן"
    ],
    blurb:
      "שילוב בין מניות ואג״ח."
  }

];



export interface ParsedQuery {
  age:number|null;
  years:number;
  monthlyContribution:number;
  principal:number;
  assetClassKey:string;
}



function parseAmount(
  value:string,
  unit?:string
){

  let number =
    Number(value.replace(/,/g,""));


  if(unit==="אלף")
    number*=1000;


  if(unit==="מיליון")
    number*=1000000;


  return number;
}



function detectAssetClass(
  text:string
){

  const lower =
    text.toLowerCase();


  for(const asset of ASSET_CLASSES){

    if(
      asset.keywords.some(
        keyword =>
          lower.includes(
            keyword.toLowerCase()
          )
      )
    ){
      return asset.key;
    }

  }


  return "balanced";
}



export function getAssetClass(
  key:string
){

  return (
    ASSET_CLASSES.find(
      a=>a.key===key
    )
    ??
    ASSET_CLASSES.find(
      a=>a.key==="balanced"
    )!
  );

}




export function parseCalculatorQuery(
  rawText:string
):ParsedQuery{


  const text =
    rawText.trim();



  const ageMatch =
    text.match(
      /(?:בן|בת)\s*(\d+)/
    );


  const age =
    ageMatch
    ? Number(ageMatch[1])
    : null;




  const yearsMatch =
    text.match(
      /(\d+)\s*שנ/
    );


  const years =
    yearsMatch
    ? Number(yearsMatch[1])
    : 10;



  let monthlyContribution=0;


  const monthlyMatch =
    text.match(
      /([\d,]+)\s*(?:ש"ח|₪)?\s*(?:בחודש|לחודש|חודשי)/
    );


  if(monthlyMatch){

    monthlyContribution =
      parseAmount(
        monthlyMatch[1]
      );

  }



  let principal=0;


  const amounts =
    [
      ...text.matchAll(
        /([\d,]+)\s*(אלף|מיליון)?\s*(?:ש"ח|₪)/g
      )
    ];



  for(const m of amounts){

    const value =
      parseAmount(
        m[1],
        m[2]
      );


    if(value !== monthlyContribution){

      principal =
        Math.max(
          principal,
          value
        );

    }

  }



  return {

    age,

    years,

    monthlyContribution,

    principal,

    assetClassKey:
      detectAssetClass(text)

  };

}



export interface ProjectionPoint{

  year:number;

  contributed:number;

  balance:number;

}



export interface ProjectionResult{

  finalBalance:number;

  totalContributed:number;

  growth:number;

  realValueAfterInflation:number;

  series:ProjectionPoint[];

}



export function computeProjection(

  principal:number,

  monthlyContribution:number,

  years:number,

  annualReturnPct:number,

  inflationPct:number=3

):ProjectionResult{


  const monthlyRate =
    annualReturnPct /100 /12;


  const months =
    years*12;



  let balance =
    principal;


  let contributed =
    principal;



  const series:ProjectionPoint[]=[
    {
      year:0,
      contributed,
      balance
    }
  ];



  for(
    let i=1;
    i<=months;
    i++
  ){


    balance =
      balance*(1+monthlyRate)
      +
      monthlyContribution;


    contributed +=
      monthlyContribution;



    if(i%12===0){

      series.push({

        year:i/12,

        contributed:
          Math.round(contributed),

        balance:
          Math.round(balance)

      });

    }

  }



  const finalBalance =
    Math.round(balance);



  return {

    finalBalance,

    totalContributed:
      Math.round(contributed),

    growth:
      Math.round(
        finalBalance-contributed
      ),

    realValueAfterInflation:
      Math.round(
        finalBalance /
        Math.pow(
          1+inflationPct/100,
          years
        )
      ),

    series

  };

}



export const CALCULATOR_PRESETS = [

"אני בן 27, יש לי 100,000 ש\"ח להשקיע ל-10 שנים במדד S&P 500",

"השקעתי 100,000 ש\"ח ל-10 שנים ב-Apple",

"השקעתי 100,000 ש\"ח ל-10 שנים ב-Microsoft",

"חיסכון חודשי של 1,000 ש\"ח לילד עד גיל 18",

"500 ש\"ח בחודש למשך 20 שנה באג\"ח ממשלתי",

"השקעה חד פעמית של 500,000 ש\"ח ל-15 שנה בתיק מאוזן"

];
