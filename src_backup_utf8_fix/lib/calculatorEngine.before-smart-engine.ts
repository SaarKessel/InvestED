// ---------------------------------------------------------------------------
// InvestED ג€” Conversational Calculator Engine
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
      "׳׳₪׳",
      "aapl"
    ],
    blurb:
      "׳׳ ׳™׳™׳× Apple Inc. ג€” ׳—׳‘׳¨׳× ׳˜׳›׳ ׳•׳׳•׳’׳™׳” ׳’׳׳•׳‘׳׳™׳×."
  },


  {
    key: "microsoft",
    label: "Microsoft (MSFT)",
    annualReturnPct: 12,
    keywords: [
      "microsoft",
      "׳׳™׳§׳¨׳•׳¡׳•׳₪׳˜",
      "msft"
    ],
    blurb:
      "׳׳ ׳™׳™׳× Microsoft ג€” ׳—׳‘׳¨׳× ׳×׳•׳›׳ ׳” ׳•׳©׳™׳¨׳•׳×׳™ ׳¢׳ ׳."
  },


  {
    key: "nasdaq",
    label: "׳׳“׳“ ׳ ׳׳¡׳“׳´׳§ / ׳׳ ׳™׳•׳× ׳˜׳›׳ ׳•׳׳•׳’׳™׳”",
    annualReturnPct: 12,
    keywords: [
      "nasdaq",
      "׳ ׳׳¡׳“׳§",
      "׳ ׳׳¡׳“׳´׳§",
      "׳˜׳›׳ ׳•׳׳•׳’׳™׳”",
      "׳”׳™׳™׳˜׳§"
    ],
    blurb:
      "׳׳“׳“ ׳׳•׳˜׳” ׳˜׳›׳ ׳•׳׳•׳’׳™׳” ׳¢׳ ׳×׳ ׳•׳“׳×׳™׳•׳× ׳’׳‘׳•׳”׳”."
  },


  {
    key: "sp500",
    label: "׳׳“׳“ S&P 500",
    annualReturnPct: 10,
    keywords: [
      "s&p 500",
      "s&p500",
      "sp500",
      "׳׳¡ ׳׳ ׳“ ׳₪׳™",
      "׳׳“׳“ ׳׳¡ ׳׳ ׳“ ׳₪׳™"
    ],
    blurb:
      "׳׳“׳“ ׳”׳›׳•׳׳ 500 ׳—׳‘׳¨׳•׳× ׳’׳“׳•׳׳•׳× ׳‘׳׳¨׳”׳´׳‘."
  },


  {
    key: "ta125",
    label: "׳׳“׳“ ׳×׳´׳ 125",
    annualReturnPct: 7,
    keywords: [
      "׳×׳ 125",
      "׳×׳125",
      "׳×׳´׳ 125"
    ],
    blurb:
      "׳׳“׳“ ׳”׳—׳‘׳¨׳•׳× ׳”׳’׳“׳•׳׳•׳× ׳‘׳‘׳•׳¨׳¡׳” ׳‘׳™׳©׳¨׳׳."
  },


  {
    key: "bonds",
    label: "׳׳’׳´׳— ׳׳׳©׳׳×׳™",
    annualReturnPct: 3.5,
    keywords: [
      "׳׳’׳—",
      "׳׳’׳´׳—",
      "׳׳’׳¨׳•׳× ׳—׳•׳‘",
      "׳׳׳©׳׳×׳™",
      "׳¡׳•׳׳™׳“׳™"
    ],
    blurb:
      "׳׳₪׳™׳§ ׳”׳©׳§׳¢׳” ׳¡׳•׳׳™׳“׳™ ׳™׳—׳¡׳™׳×."
  },


  {
    key: "balanced",
    label: "׳×׳™׳§ ׳׳׳•׳–׳ (׳׳ ׳™׳•׳× + ׳׳’׳´׳—)",
    annualReturnPct: 7,
    keywords: [
      "׳׳׳•׳–׳",
      "׳×׳™׳§ ׳׳׳•׳–׳"
    ],
    blurb:
      "׳©׳™׳׳•׳‘ ׳‘׳™׳ ׳׳ ׳™׳•׳× ׳•׳׳’׳´׳—."
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


  if(unit==="׳׳׳£")
    number*=1000;


  if(unit==="׳׳™׳׳™׳•׳")
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
      /(?:׳‘׳|׳‘׳×)\s*(\d+)/
    );


  const age =
    ageMatch
    ? Number(ageMatch[1])
    : null;




  const yearsMatch =
    text.match(
      /(\d+)\s*׳©׳ /
    );


  const years =
    yearsMatch
    ? Number(yearsMatch[1])
    : 10;



  let monthlyContribution=0;


  const monthlyMatch =
    text.match(
      /([\d,]+)\s*(?:׳©"׳—|ג‚×)?\s*(?:׳‘׳—׳•׳“׳©|׳׳—׳•׳“׳©|׳—׳•׳“׳©׳™)/
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
        /([\d,]+)\s*(׳׳׳£|׳׳™׳׳™׳•׳)?\s*(?:׳©"׳—|ג‚×)/g
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

"׳׳ ׳™ ׳‘׳ 27, ׳™׳© ׳׳™ 100,000 ׳©\"׳— ׳׳”׳©׳§׳™׳¢ ׳-10 ׳©׳ ׳™׳ ׳‘׳׳“׳“ S&P 500",

"׳”׳©׳§׳¢׳×׳™ 100,000 ׳©\"׳— ׳-10 ׳©׳ ׳™׳ ׳‘-Apple",

"׳”׳©׳§׳¢׳×׳™ 100,000 ׳©\"׳— ׳-10 ׳©׳ ׳™׳ ׳‘-Microsoft",

"׳—׳™׳¡׳›׳•׳ ׳—׳•׳“׳©׳™ ׳©׳ 1,000 ׳©\"׳— ׳׳™׳׳“ ׳¢׳“ ׳’׳™׳ 18",

"500 ׳©\"׳— ׳‘׳—׳•׳“׳© ׳׳׳©׳ 20 ׳©׳ ׳” ׳‘׳׳’\"׳— ׳׳׳©׳׳×׳™",

"׳”׳©׳§׳¢׳” ׳—׳“ ׳₪׳¢׳׳™׳× ׳©׳ 500,000 ׳©\"׳— ׳-15 ׳©׳ ׳” ׳‘׳×׳™׳§ ׳׳׳•׳–׳"

];

