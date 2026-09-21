// =====================================================
// InvestED - Phase 6: Strategy Universe
// =====================================================
// The single source of truth for the ten educational
// investment strategies. Content only - all retrieval,
// search, comparison, fit and market-context logic lives in
// strategyEngine.ts. All user-facing text is bilingual.
//
// Historical context is limited to durable, well-documented
// facts (originators, publications, long-studied behavior).
// Nothing here promises returns, predicts performance, or
// tells anyone to buy or sell anything.
// =====================================================

import type { InvestmentStrategy } from "@/types";

export const STRATEGY_UNIVERSE: InvestmentStrategy[] = [
  {
    id: "long-term-index",
    name: {
      he: "השקעת מדדים לטווח ארוך",
      en: "Long-Term Index Investing",
    },
    description: {
      he: "השקעה בקרנות מדד רחבות שעוקבות אחרי שוק שלם (כמו מדד מניות רחב) במקום ניסיון לבחור מניות בודדות שינצחו את השוק.",
      en: "Investing in broad index funds that track an entire market (such as a wide stock index) instead of trying to pick individual stocks that will beat the market.",
    },
    philosophy: {
      he: "הפילוסופיה: לאורך זמן קשה מאוד להכות את השוק בעקביות, ולכן עדיף להחזיק את השוק כולו בעלות נמוכה ולתת לזמן ולריבית דריבית לעבוד.",
      en: "The philosophy: consistently beating the market over time is very hard, so it is better to own the whole market at low cost and let time and compounding do the work.",
    },
    suitableFor: {
      he: "משקיעים לטווח ארוך שמעדיפים גישה פשוטה, זולה ושקטה נפשית, ואינם רוצים לעקוב אחרי חברות בודדות.",
      en: "Long-term investors who prefer a simple, low-cost, low-maintenance approach and do not want to follow individual companies.",
    },
    riskProfile: {
      level: 5,
      label: { he: "סיכון בינוני", en: "Moderate risk" },
    },
    timeHorizon: ["long"],
    assetTypes: ["index_funds", "etfs"],
    rules: [
      {
        he: "בוחרים קרן מדד רחבה וזולה ומחזיקים אותה שנים רבות.",
        en: "Choose a broad, low-cost index fund and hold it for many years.",
      },
      {
        he: "ממשיכים להשקיע באופן קבוע גם בתקופות של ירידות.",
        en: "Keep investing regularly, including during market declines.",
      },
      {
        he: "לא מנסים לתזמן כניסות ויציאות מהשוק.",
        en: "Do not try to time entries and exits from the market.",
      },
    ],
    metrics: [
      {
        key: "expense_ratio",
        name: { he: "דמי ניהול", en: "Expense ratio" },
        description: {
          he: "העלות השנתית של הקרן; נמוכה יותר פירושה שיותר מהתשואה נשאר אצל המשקיע.",
          en: "The fund's annual cost; lower means more of the return stays with the investor.",
        },
      },
      {
        key: "tracking_difference",
        name: { he: "פער עקיבה", en: "Tracking difference" },
        description: {
          he: "כמה ביצועי הקרן קרובים לביצועי המדד שהיא עוקבת אחריו.",
          en: "How closely the fund's performance matches the index it tracks.",
        },
      },
    ],
    historicalContext: {
      he: "הגישה זכתה לפופולריות בזכות ג'ון בוגל, שהקים ב-1975 את קרן המדד הראשונה לציבור ב-Vanguard. מחקרים ארוכי שנים מראים שמרבית הקרנות הפעילות לא הצליחו להכות את המדד לאורך תקופות ארוכות, אם כי גם מדדים יורדים בתקופות משבר.",
      en: "The approach was popularized by John Bogle, who launched the first public index fund at Vanguard in 1975. Long-running studies show most active funds failed to beat the index over long periods, although indexes also fall during crises.",
    },
    strengths: [
      { he: "עלות נמוכה", en: "Low cost" },
      { he: "פיזור רחב מובנה", en: "Built-in broad diversification" },
      { he: "פשוט לתחזוקה לאורך שנים", en: "Simple to maintain for years" },
    ],
    limitations: [
      { he: "אי אפשר \"לנצח\" את השוק - מקבלים את תשואת השוק", en: "You cannot beat the market - you get the market's return" },
      { he: "התיק יורד עם השוק בירידות", en: "The portfolio falls with the market in downturns" },
      { he: "דורש משמעת לאורך שנים רבות", en: "Requires discipline over many years" },
    ],
    educationalNotes: {
      he: "זו נקודת פתיחה קלאסית ללימוד השקעות, כי היא ממחישה את הקשר בין עלות, זמן ופיזור.",
      en: "This is a classic starting point for learning about investing because it demonstrates the link between cost, time, and diversification.",
    },
    dataRequirements: ["price_history"],
    exampleAssets: ["VOO", "VTI", "SPY", "IVV"],
    keywordsList: {
      he: ["מדד", "מדדים", "פסיבי", "השקעה פסיבית", "קרן מדד", "קרנות מדד", "אינדקס", "השקעת מדדים"],
      en: ["index investing", "index fund", "index funds", "passive investing", "index strategy"],
    },
  },
  {
    id: "buy-and-hold",
    name: {
      he: "קנה והחזק",
      en: "Buy & Hold",
    },
    description: {
      he: "רכישת נכסים איכותיים והחזקתם לתקופה ארוכה מאוד, תוך התעלמות מרעש יומיומי ותנודות קצרות.",
      en: "Buying quality assets and holding them for a very long time, ignoring daily noise and short-term swings.",
    },
    philosophy: {
      he: "הפילוסופיה: הזמן בשוק חשוב מתזמון השוק. מי שנשאר מושקע לאורך שנים נהנה מצמיחת הכלכלה ומריבית דריבית, בלי עלויות ומסים של מסחר תכוף.",
      en: "The philosophy: time in the market matters more than timing the market. Staying invested for years captures economic growth and compounding, without the costs and taxes of frequent trading.",
    },
    suitableFor: {
      he: "משקיעים סבלניים עם אופק ארוך שלא רוצים לנהל את התיק באופן תכוף.",
      en: "Patient investors with a long horizon who do not want to manage their portfolio frequently.",
    },
    riskProfile: {
      level: 5,
      label: { he: "סיכון בינוני", en: "Moderate risk" },
    },
    timeHorizon: ["long"],
    assetTypes: ["stocks", "index_funds", "etfs"],
    rules: [
      {
        he: "בוחרים נכסים שמאמינים בערכם לטווח ארוך.",
        en: "Choose assets you believe have long-term value.",
      },
      {
        he: "מחזיקים דרך תקופות של עליות וירידות.",
        en: "Hold through both rising and falling periods.",
      },
      {
        he: "בודקים את ההשקעה לעיתים רחוקות, לא כל יום.",
        en: "Review the investment infrequently, not daily.",
      },
    ],
    metrics: [
      {
        key: "holding_period",
        name: { he: "משך החזקה", en: "Holding period" },
        description: {
          he: "כמה זמן הנכס מוחזק בפועל; מדד מרכזי למשמעת בגישה זו.",
          en: "How long the asset is actually held; a central discipline metric for this approach.",
        },
      },
      {
        key: "turnover",
        name: { he: "שיעור מחזור", en: "Turnover" },
        description: {
          he: "כמה פעמים קונים ומוכרים; בגישת קנה והחזק הוא אמור להיות נמוך מאוד.",
          en: "How often assets are bought and sold; in buy & hold it should be very low.",
        },
      },
    ],
    historicalContext: {
      he: "הגישה מזוהה עם משקיעי ערך מפורסמים כמו וורן באפט, שאמר שהתקופה המועדפת עליו להחזקת מניה היא \"לנצח\". מחקרים על התנהגות משקיעים מראים שמסחר תכוף נוטה לפגוע בתשואות בגלל עלויות ותזמון גרוע.",
      en: "The approach is associated with famous value investors like Warren Buffett, who said his favorite holding period is 'forever'. Investor-behavior studies show frequent trading tends to hurt returns because of costs and poor timing.",
    },
    strengths: [
      { he: "עלויות מסחר נמוכות", en: "Low trading costs" },
      { he: "פחות החלטות רגשיות", en: "Fewer emotional decisions" },
      { he: "נותן לריבית דריבית לעבוד", en: "Lets compounding work" },
    ],
    limitations: [
      { he: "נכס בודד יכול להישאר חלש שנים רבות", en: "An individual asset can stay weak for many years" },
      { he: "דורש סבלנות קיצונית בירידות", en: "Demands extreme patience during declines" },
      { he: "החזקה עיוורת בלי בחינה מחדש עלולה להיות שגיאה", en: "Holding blindly without re-examining can be a mistake" },
    ],
    educationalNotes: {
      he: "הגישה מלמדת את ההבדל בין השקעה למסחר ואת מחיר התזמון הגרוע.",
      en: "This approach teaches the difference between investing and trading, and the cost of poor timing.",
    },
    dataRequirements: ["price_history"],
    exampleAssets: ["VTI", "AAPL", "MSFT"],
    keywordsList: {
      he: ["קנה והחזק", "החזקה ארוכה"],
      en: ["buy and hold", "buy & hold", "buy-and-hold"],
    },
  },
  {
    id: "dollar-cost-averaging",
    name: {
      he: "מיצוע עלויות (DCA)",
      en: "Dollar-Cost Averaging",
    },
    description: {
      he: "השקעת סכום קבוע במרווחי זמן קבועים - למשל כל חודש - בלי קשר למחיר הנכס באותו רגע.",
      en: "Investing a fixed amount at fixed intervals - for example every month - regardless of the asset's price at that moment.",
    },
    philosophy: {
      he: "הפילוסופיה: אי אפשר לדעת מתי המחיר נמוך או גבוה. הפקדה קבועה קונה יותר יחידות כשהמחיר נמוך ופחות כשהוא גבוה, ומורידה את הסיכון של כניסה חד-פעמית ברגע גרוע.",
      en: "The philosophy: nobody knows when prices are low or high. A fixed deposit buys more units when prices are low and fewer when they are high, reducing the risk of a badly timed one-time entry.",
    },
    suitableFor: {
      he: "מי שמשקיע מהשכר באופן שוטף ורוצה משמעת אוטומטית בלי ניסיונות תזמון.",
      en: "Those investing regularly from their salary who want automatic discipline without timing attempts.",
    },
    riskProfile: {
      level: 4,
      label: { he: "סיכון נמוך-בינוני", en: "Low-to-moderate risk" },
    },
    timeHorizon: ["medium", "long"],
    assetTypes: ["index_funds", "etfs", "stocks"],
    rules: [
      {
        he: "קובעים סכום קבוע ותאריך קבוע להפקדה.",
        en: "Set a fixed amount and a fixed deposit date.",
      },
      {
        he: "ממשיכים לפי התוכנית גם כשהשוק יורד.",
        en: "Stick to the plan even when the market falls.",
      },
      {
        he: "לא משנים את הסכום לפי תחושות על השוק.",
        en: "Do not change the amount based on market feelings.",
      },
    ],
    metrics: [
      {
        key: "average_cost",
        name: { he: "עלות ממוצעת ליחידה", en: "Average cost per unit" },
        description: {
          he: "המחיר הממוצע ששולם על כל יחידה לאורך כל ההפקדות.",
          en: "The average price paid per unit across all deposits.",
        },
      },
      {
        key: "contribution_consistency",
        name: { he: "עקביות הפקדות", en: "Contribution consistency" },
        description: {
          he: "כמה ההפקדות בפועל עקביות עם התוכנית שנקבעה.",
          en: "How closely actual deposits follow the planned schedule.",
        },
      },
    ],
    historicalContext: {
      he: "המושג נטוע בלימודי השקעות מאז אמצע המאה ה-20 ומופיע בספרות של בנג'מין גרהם. מחקרים מראים שהשקעה חד-פעמית הניבה היסטורית לרוב יותר בממוצע, אבל מיצוע מפחית את הסיכון הפסיכולוגי של כניסה ברגע גרוע.",
      en: "The concept has been taught since the mid-20th century and appears in Benjamin Graham's writings. Studies show lump-sum investing has historically returned more on average, but averaging lowers the psychological risk of a badly timed entry.",
    },
    strengths: [
      { he: "מוריד את סיכון התזמון", en: "Reduces timing risk" },
      { he: "בונה הרגל חיסכון אוטומטי", en: "Builds an automatic saving habit" },
      { he: "מתאים להפקדות שוטפות מהמשכורת", en: "Fits regular deposits from salary" },
    ],
    limitations: [
      { he: "אינו מבטיח תשואה טובה יותר מהשקעה חד-פעמית", en: "Does not guarantee a better return than a lump sum" },
      { he: "כסף שמחכה בצד לא מושקע ולא צובר תשואה", en: "Cash waiting on the side is not invested and earns nothing" },
      { he: "דורש עקביות ארוכת שנים", en: "Requires years of consistency" },
    ],
    educationalNotes: {
      he: "זו הדרך שבה רוב האנשים בפועל חוסכים בפנסיה ובקופות, ולכן היא קלה להמחשה במחשבון ההשקעות.",
      en: "This is how most people actually save in pensions and funds, so it is easy to demonstrate in the investment calculator.",
    },
    dataRequirements: ["price_history"],
    exampleAssets: ["VTI", "VOO"],
    keywordsList: {
      he: ["מיצוע", "מיצוע עלויות", "אסטרטגיית מיצוע"],
      en: ["dollar-cost averaging", "dollar cost averaging", "dca"],
    },
  },
  {
    id: "value",
    name: {
      he: "השקעת ערך",
      en: "Value Investing",
    },
    description: {
      he: "חיפוש חברות שנראות \"זולות\" ביחס לרווחים, לנכסים או לתזרים שלהן, מתוך אמונה שהשוק מתמחר אותן בחסר.",
      en: "Searching for companies that look 'cheap' relative to their earnings, assets, or cash flow, based on the belief that the market undervalues them.",
    },
    philosophy: {
      he: "הפילוסופיה: המחיר הוא מה שמשלמים, הערך הוא מה שמקבלים. אם הניתוח נכון, קנייה בהנחה ביחס לערך הפנימי יוצרת \"מרווח ביטחון\".",
      en: "The philosophy: price is what you pay, value is what you get. If the analysis is right, buying at a discount to intrinsic value creates a 'margin of safety'.",
    },
    suitableFor: {
      he: "משקיעים שמוכנים ללמוד ניתוח פיננסי בסיסי, לקרוא דוחות ולהיות סבלניים מאוד.",
      en: "Investors willing to learn basic financial analysis, read reports, and be very patient.",
    },
    riskProfile: {
      level: 6,
      label: { he: "סיכון בינוני-גבוה", en: "Moderate-to-high risk" },
    },
    timeHorizon: ["long"],
    assetTypes: ["stocks", "etfs"],
    rules: [
      {
        he: "מעריכים את הערך הפנימי של החברה לפני הקנייה.",
        en: "Estimate the company's intrinsic value before buying.",
      },
      {
        he: "קונים רק כשיש פער משמעותי בין המחיר לערך המוערך.",
        en: "Buy only when there is a meaningful gap between price and estimated value.",
      },
      {
        he: "מוכנים להחזיק שנים עד שהשוק \"מתקן\" - אם בכלל.",
        en: "Be prepared to hold for years until the market 'corrects' - if it does.",
      },
    ],
    metrics: [
      {
        key: "pe_ratio",
        name: { he: "מכפיל רווח", en: "P/E ratio" },
        description: {
          he: "מחיר המניה חלקי הרווח למניה; מדד תמחור קלאסי, לא תחזית.",
          en: "Share price divided by earnings per share; a classic valuation gauge, not a forecast.",
        },
      },
      {
        key: "pb_ratio",
        name: { he: "מכפיל הון", en: "P/B ratio" },
        description: {
          he: "מחיר המניה ביחס לערך ההון העצמי בספרים.",
          en: "Share price relative to book value per share.",
        },
      },
    ],
    historicalContext: {
      he: "הגישה נוסחה על ידי בנג'מין גרהם ודיוויד דוד בספר \"ניתוח ניירות ערך\" (1934) וזכתה לפרסום עולמי בזכות תלמידו וורן באפט. היו תקופות ארוכות שבהן מניות ערך הניבו יותר ממניות צמיחה, ותקופות ארוכות שבהן ההפך קרה.",
      en: "The approach was formalized by Benjamin Graham and David Dodd in 'Security Analysis' (1934) and made world-famous by Graham's student Warren Buffett. There have been long periods when value stocks outperformed growth stocks, and long periods of the reverse.",
    },
    strengths: [
      { he: "מרווח ביטחון אפשרי אם הניתוח נכון", en: "Possible margin of safety if the analysis is right" },
      { he: "מבוסס על נתונים פיננסיים, לא על הייפ", en: "Based on financial data, not hype" },
    ],
    limitations: [
      { he: "דורש ידע וניתוח - קל לטעות בהערכת הערך", en: "Requires knowledge and analysis - value is easy to misjudge" },
      { he: "מלכודת ערך: חברה \"זולה\" יכולה להישאר זולה או להתדרדר", en: "Value trap: a 'cheap' company can stay cheap or deteriorate" },
      { he: "דורש סבלנות רבה בלי ודאות שהשוק יתקן", en: "Demands great patience with no certainty the market will correct" },
    ],
    educationalNotes: {
      he: "הגישה מלמדת קריאה ביקורתית של דוחות והפרדה בין מחיר לערך.",
      en: "This approach teaches critical reading of reports and separating price from value.",
    },
    dataRequirements: ["fundamentals", "price_history"],
    exampleAssets: ["BRK.B", "JPM", "VTV"],
    keywordsList: {
      he: ["השקעת ערך", "אסטרטגיית ערך", "משקיע ערך"],
      en: ["value investing", "value strategy", "value investor"],
    },
  },
  {
    id: "growth",
    name: {
      he: "השקעת צמיחה",
      en: "Growth Investing",
    },
    description: {
      he: "השקעה בחברות שצפויות לגדול מהר מהממוצע, גם אם אינן רווחיות עדיין ואינן מחלקות דיבידנד.",
      en: "Investing in companies expected to grow faster than average, even if they are not yet profitable and pay no dividends.",
    },
    philosophy: {
      he: "הפילוסופיה: חברה שצומחת מהר יכולה להצדיק מחיר גבוה היום, כי הרווחים העתידיים צפויים להיות גדולים בהרבה. המחיר הוא תנודתיות ותלות בציפיות.",
      en: "The philosophy: a fast-growing company can justify a high price today because future earnings are expected to be much larger. The cost is volatility and dependence on expectations.",
    },
    suitableFor: {
      he: "משקיעים עם אופק ארוך וסיבולת סיכון גבוהה שמסוגלים לספוג ירידות חדות בדרך.",
      en: "Investors with a long horizon and high risk tolerance who can absorb sharp declines along the way.",
    },
    riskProfile: {
      level: 8,
      label: { he: "סיכון גבוה", en: "High risk" },
    },
    timeHorizon: ["long"],
    assetTypes: ["stocks", "etfs"],
    rules: [
      {
        he: "מחפשים חברות עם קצב צמיחת הכנסות גבוה מהשוק.",
        en: "Look for companies with revenue growth well above the market.",
      },
      {
        he: "בודקים שהצמיחה נתמכת בשוק אמיתי ולא רק בסיפור.",
        en: "Check that growth is backed by a real market, not just a story.",
      },
      {
        he: "מכירים מראש שהמחיר יכול ליפול חדות כשהציפיות משתנות.",
        en: "Accept in advance that the price can fall sharply when expectations change.",
      },
    ],
    metrics: [
      {
        key: "revenue_growth",
        name: { he: "צמיחת הכנסות", en: "Revenue growth" },
        description: {
          he: "קצב גידול ההכנסות לאורך זמן; לב הגישה.",
          en: "The pace of revenue growth over time; the heart of the approach.",
        },
      },
      {
        key: "ps_ratio",
        name: { he: "מכפיל מכירות", en: "P/S ratio" },
        description: {
          he: "מחיר ביחס למכירות - שימושי כשאין עדיין רווחים.",
          en: "Price relative to sales - useful when there are no earnings yet.",
        },
      },
    ],
    historicalContext: {
      he: "השקעת צמיחה תועדה בספרות ההשקעות לפחות מאז שנות ה-50 (פיליפ פישר, \"מניות רגילות ורווחים בלתי רגילים\"). היסטורית היו תקופות שצמיחה הובילה את השוק (למשל בטכנולוגיה) ותקופות של קריסות חדות כשהציפיות לא התממשו, כמו בועת הדוט-קום ב-2000.",
      en: "Growth investing has been documented since at least the 1950s (Philip Fisher, 'Common Stocks and Uncommon Profits'). Historically growth led the market in some periods (such as technology booms) and crashed hard when expectations failed, as in the 2000 dot-com bust.",
    },
    strengths: [
      { he: "פוטנציאל תשואה גבוה לטווח ארוך", en: "High long-term return potential" },
      { he: "חשיפה לחדשנות ולסקטורים מתפתחים", en: "Exposure to innovation and emerging sectors" },
    ],
    limitations: [
      { he: "תנודתיות גבוהה מאוד", en: "Very high volatility" },
      { he: "רגישות חריפה לשינויי ריבית וציפיות", en: "Acute sensitivity to interest rates and expectations" },
      { he: "אפשר לשלם יותר מדי גם על חברה טובה", en: "You can overpay even for a good company" },
    ],
    educationalNotes: {
      he: "הגישה ממחישה למה ציפיות גבוהות מייקרות מניה ומגדילות את הנפילה האפשרית.",
      en: "This approach shows why high expectations make a stock expensive and increase the possible fall.",
    },
    dataRequirements: ["fundamentals", "price_history"],
    exampleAssets: ["NVDA", "MSFT", "AAPL", "QQQ"],
    keywordsList: {
      he: ["השקעת צמיחה", "אסטרטגיית צמיחה", "משקיע צמיחה"],
      en: ["growth investing", "growth strategy", "growth investor"],
    },
  },
  {
    id: "dividend",
    name: {
      he: "השקעת דיבידנדים",
      en: "Dividend Investing",
    },
    description: {
      he: "התמקדות בחברות וקרנות שמחלקות חלק מהרווח כתשלום שוטף (דיבידנד) לבעלי המניות.",
      en: "Focusing on companies and funds that distribute part of their earnings as regular payments (dividends) to shareholders.",
    },
    philosophy: {
      he: "הפילוסופיה: תזרים שוטף מדיבידנדים נותן הכנסה גם בלי למכור את ההחזקה, וחברות שמחלקות באופן עקבי נוטות להיות יציבות ובוגרות.",
      en: "The philosophy: a steady dividend stream provides income without selling the holding, and companies that pay consistently tend to be stable and mature.",
    },
    suitableFor: {
      he: "משקיעים שמחפשים הכנסה שוטפת, למשל בקרבת פרישה, ומעדיפים תנודתיות נמוכה יחסית.",
      en: "Investors seeking regular income, for example near retirement, who prefer relatively lower volatility.",
    },
    riskProfile: {
      level: 4,
      label: { he: "סיכון נמוך-בינוני", en: "Low-to-moderate risk" },
    },
    timeHorizon: ["medium", "long"],
    assetTypes: ["stocks", "etfs"],
    rules: [
      {
        he: "בודקים יציבות ויכולת כיסוי של הדיבידנד, לא רק את גובהו.",
        en: "Check the dividend's stability and coverage, not just its size.",
      },
      {
        he: "זוכרים שדיבידנד אינו מובטח ויכול להיפסק או להיקצץ.",
        en: "Remember a dividend is not guaranteed and can be cut or stopped.",
      },
      {
        he: "שוקלים השקעה מחדש של הדיבידנדים לצבירה.",
        en: "Consider reinvesting dividends for accumulation.",
      },
    ],
    metrics: [
      {
        key: "dividend_yield",
        name: { he: "תשואת דיבידנד", en: "Dividend yield" },
        description: {
          he: "הדיבידנד השנתי חלקי מחיר המניה; גבוה מדי יכול לאותת על סיכון.",
          en: "Annual dividend divided by share price; too high can signal risk.",
        },
      },
      {
        key: "payout_ratio",
        name: { he: "יחס חלוקה", en: "Payout ratio" },
        description: {
          he: "איזה חלק מהרווח מחולק כדיבידנד; יחס גבוה מאוד מקשה לשמור על הדיבידנד.",
          en: "What share of earnings is paid out; a very high ratio makes the dividend hard to sustain.",
        },
      },
    ],
    historicalContext: {
      he: "דיבידנדים היו חלק מרכזי מתשואת המניות במאה ה-20, ו\"אצולת הדיבידנדים\" הפכה למושג מוכר. במשברים כמו 2008 ו-2020 חברות רבות קיצצו דיבידנדים - תזכורת שהם אינם מובטחים.",
      en: "Dividends were a major part of stock returns in the 20th century, and 'dividend aristocrats' became a well-known concept. In crises like 2008 and 2020 many companies cut dividends - a reminder they are not guaranteed.",
    },
    strengths: [
      { he: "הכנסה שוטפת פוטנציאלית בלי למכור", en: "Potential steady income without selling" },
      { he: "לרוב חברות יציבות ובוגרות", en: "Usually stable, mature companies" },
    ],
    limitations: [
      { he: "פחות פוטנציאל צמיחה מהיר", en: "Lower rapid-growth potential" },
      { he: "הדיבידנד יכול להיקצץ בדיוק במשבר", en: "Dividends can be cut exactly in a crisis" },
      { he: "ריכוזיות בסקטורים מסוימים", en: "Concentration in certain sectors" },
    ],
    educationalNotes: {
      he: "הגישה מלמדת את ההבדל בין תשואה מהון לתשואה מתזרים, ואת הסיכון ב\"תשואת דיבידנד גבוהה\".",
      en: "This approach teaches the difference between capital returns and income returns, and the risk in a 'high dividend yield'.",
    },
    dataRequirements: ["dividend_history", "fundamentals"],
    exampleAssets: ["JNJ", "PG", "KO", "SCHD"],
    keywordsList: {
      he: ["דיבידנד", "דיבידנדים", "השקעת דיבידנד"],
      en: ["dividend investing", "dividend strategy", "dividends"],
    },
  },
  {
    id: "momentum",
    name: {
      he: "השקעת מומנטום",
      en: "Momentum",
    },
    description: {
      he: "קניית נכסים שעלו בצורה יחסית חזקה לאחרונה ומכירת נכסים שירדו, מתוך תצפית שמגמות נוטות להימשך זמן מה.",
      en: "Buying assets that recently rose relatively strongly and selling those that fell, based on the observation that trends tend to persist for a while.",
    },
    philosophy: {
      he: "הפילוסופיה: \"המגמה היא חברתך\" - תנועת מחירים חזקה נוטה להימשך בגלל התנהגות המשקיעים, ולכן עדיף לנסוע עם המגמה מאשר נגדה.",
      en: "The philosophy: 'the trend is your friend' - strong price moves tend to continue because of investor behavior, so it is better to ride the trend than fight it.",
    },
    suitableFor: {
      he: "משקיעים מנוסים עם משמעת גבוהה וזמן למעקב שוטף; פחות מתאים למתחילים.",
      en: "Experienced investors with strong discipline and time for regular monitoring; less suited to beginners.",
    },
    riskProfile: {
      level: 8,
      label: { he: "סיכון גבוה", en: "High risk" },
    },
    timeHorizon: ["short", "medium"],
    assetTypes: ["stocks", "etfs"],
    rules: [
      {
        he: "מדרגים נכסים לפי ביצועים יחסיים בתקופה אחרונה.",
        en: "Rank assets by relative performance over a recent period.",
      },
      {
        he: "מחזיקים את החזקים ומחליפים את החלשים לפי כלל קבוע.",
        en: "Hold the strong ones and replace the weak ones by a fixed rule.",
      },
      {
        he: "קובעים מראש כלל יציאה ומקיימים אותו בלי רגש.",
        en: "Set an exit rule in advance and follow it without emotion.",
      },
    ],
    metrics: [
      {
        key: "relative_strength",
        name: { he: "חוזק יחסי", en: "Relative strength" },
        description: {
          he: "ביצועי הנכס ביחס לנכסים אחרים או למדד באותה תקופה.",
          en: "The asset's performance versus other assets or an index over the same period.",
        },
      },
      {
        key: "lookback_return",
        name: { he: "תשואת תקופת מבט לאחור", en: "Lookback-period return" },
        description: {
          he: "התשואה בחלון הזמן שמשמש לדירוג המומנטום.",
          en: "The return over the time window used for momentum ranking.",
        },
      },
    ],
    historicalContext: {
      he: "תופעת המומנטום תועדה במחקר אקדמי, בין השאר בעבודתם של ג'גדיש וטיטמן מ-1993, ונחקרה בשווקים רבים. היא נוטה לעבוד עד שלא - \"קריסות מומנטום\" חדות התרחשו בהיפוכי שוק, כמו ב-2009.",
      en: "The momentum effect was documented in academic research, including Jegadeesh and Titman's 1993 work, and studied across many markets. It tends to work until it does not - sharp 'momentum crashes' occurred at market reversals, such as in 2009.",
    },
    strengths: [
      { he: "מבוסס על תופעה מתועדת במחקר", en: "Based on a researched, documented effect" },
      { he: "כללים ברורים שאפשר לבדוק", en: "Clear rules that can be tested" },
    ],
    limitations: [
      { he: "קריסות חדות בהיפוכי מגמה", en: "Sharp crashes at trend reversals" },
      { he: "עלויות מסחר ומיסים גבוהים בגלל מחזור תכוף", en: "Higher trading costs and taxes due to frequent turnover" },
      { he: "דורש משמעת, זמן ומעקב - קשה ליישום עצמי", en: "Demands discipline, time, and monitoring - hard to do yourself" },
    ],
    educationalNotes: {
      he: "הגישה ממחישה היטב את ההבדל בין תצפית סטטיסטית לבין הבטחה, ואת מחיר המסחר התכוף.",
      en: "This approach illustrates well the difference between a statistical observation and a promise, and the cost of frequent trading.",
    },
    dataRequirements: ["price_history", "market_breadth"],
    exampleAssets: ["MTUM"],
    keywordsList: {
      he: ["מומנטום", "אסטרטגיית מומנטום", "חוזק יחסי"],
      en: ["momentum", "momentum investing", "momentum strategy"],
    },
  },
  {
    id: "trend-following",
    name: {
      he: "מעקב מגמה",
      en: "Trend Following",
    },
    description: {
      he: "כניסה להשקעה כשמזוהה מגמת עלייה ויציאה כשהמגמה מתהפכת, לפי אותות טכניים קבועים מראש כמו ממוצעים נעים.",
      en: "Entering an investment when an uptrend is identified and exiting when the trend reverses, using predefined technical signals such as moving averages.",
    },
    philosophy: {
      he: "הפילוסופיה: לא מנסים לנבא את השוק, אלא להגיב למה שקורה בפועל. מפסידים מעט בקטנים ומקווים להרוויח במגמות הגדולות.",
      en: "The philosophy: do not try to predict the market, only react to what is actually happening. Lose a little on the small moves and hope to gain on the big trends.",
    },
    suitableFor: {
      he: "משקיעים מסודרים שמסוגלים לעבוד לפי מערכת כללים ולקבל הרבה אותות שווא בדרך.",
      en: "Methodical investors who can follow a rule system and accept many false signals along the way.",
    },
    riskProfile: {
      level: 7,
      label: { he: "סיכון בינוני-גבוה", en: "Moderate-to-high risk" },
    },
    timeHorizon: ["short", "medium", "long"],
    assetTypes: ["stocks", "etfs", "index_funds"],
    rules: [
      {
        he: "מגדירים אות כניסה ואות יציאה מראש, למשל חציית ממוצע נע.",
        en: "Define entry and exit signals in advance, such as a moving-average crossover.",
      },
      {
        he: "פועלים לפי האות גם כשהתחושה אומרת אחרת.",
        en: "Act on the signal even when intuition says otherwise.",
      },
      {
        he: "מגבילים את גודל כל עסקה כדי לשרוד רצף אותות שווא.",
        en: "Limit the size of each position to survive a run of false signals.",
      },
    ],
    metrics: [
      {
        key: "moving_average",
        name: { he: "ממוצע נע", en: "Moving average" },
        description: {
          he: "ממוצע המחירים בחלון זמן; משמש לזיהוי כיוון המגמה.",
          en: "The average price over a time window; used to identify trend direction.",
        },
      },
      {
        key: "drawdown",
        name: { he: "ירידה מהשיא", en: "Drawdown" },
        description: {
          he: "הירידה המקסימלית מהשיא - מדד מרכזי לסיכון במערכת מגמה.",
          en: "The maximum fall from the peak - a central risk metric for a trend system.",
        },
      },
    ],
    historicalContext: {
      he: "מעקב מגמה נהגה בעיקר בעולם הסוחרים המקצועיים ונכסי החוזים, ובולט בדמויות כמו ריצ'רד דונציאן וניסיון \"סוחרי הצבים\" בשנות ה-80. מערכות מגמה ידועות ברצפי הפסדים קטנים ארוכים לצד רווחים גדולים מעטים.",
      en: "Trend following was shaped mainly in professional trading and futures markets, associated with figures like Richard Donchian and the 1980s 'Turtle Traders' experiment. Trend systems are known for long runs of small losses alongside a few large gains.",
    },
    strengths: [
      { he: "כללים מוגדרים שמסירים רגש מההחלטה", en: "Defined rules that remove emotion from decisions" },
      { he: "יכול להגן מפני ירידות ממושכות", en: "Can protect against prolonged declines" },
    ],
    limitations: [
      { he: "אותות שווא רבים בשוק תנודתי ללא כיוון", en: "Many false signals in a choppy, directionless market" },
      { he: "דורש הקפדה טכנית ומשמעת", en: "Requires technical precision and discipline" },
      { he: "ביצועי עבר של אות אינם מבטיחים עתיד", en: "A signal's past performance guarantees nothing" },
    ],
    educationalNotes: {
      he: "הגישה ממחישה את ההבדל בין תגובה מבוססת כלל לבין ניבוי, ואת משמעות הירידה מהשיא כמדד סיכון.",
      en: "This approach illustrates the difference between rule-based reaction and prediction, and the meaning of drawdown as a risk measure.",
    },
    dataRequirements: ["price_history"],
    exampleAssets: ["SPY", "QQQ"],
    keywordsList: {
      he: ["מעקב מגמה", "אסטרטגיית מגמה", "ממוצע נע"],
      en: ["trend following", "trend-following", "trend strategy", "moving average crossover"],
    },
  },
  {
    id: "risk-based-allocation",
    name: {
      he: "הקצאה מבוססת סיכון",
      en: "Risk-Based Allocation",
    },
    description: {
      he: "בניית תיק לפי רמת הסיכון שהמשקיע מסוגל ומוכן לשאת, עם חלוקה מכוונת בין מניות, אג\"ח ונכסים אחרים, ואיזון מחדש תקופתי.",
      en: "Building a portfolio around the level of risk the investor can and will bear, with a deliberate split between stocks, bonds, and other assets, plus periodic rebalancing.",
    },
    philosophy: {
      he: "הפילוסופיה: ההחלטה החשובה ביותר היא לא איזה נכס לקנות אלא איזה סיכון לקחת. הקצאת הנכסים היא המנוע המרכזי של תנודתיות התיק.",
      en: "The philosophy: the most important decision is not which asset to buy but how much risk to take. Asset allocation is the main driver of a portfolio's volatility.",
    },
    suitableFor: {
      he: "כל משקיע שרוצה שהתיק ישקף את פרופיל הסיכון האמיתי שלו, במיוחד לטווחים בינוניים וארוכים.",
      en: "Any investor who wants the portfolio to reflect their true risk profile, especially over medium and long horizons.",
    },
    riskProfile: {
      level: 4,
      label: { he: "תלוי בהקצאה", en: "Depends on allocation" },
    },
    timeHorizon: ["medium", "long"],
    assetTypes: ["mixed", "stocks", "bonds", "index_funds", "cash_equivalents"],
    rules: [
      {
        he: "קובעים תחילה את רמת הסיכון המתאימה ורק אז את הנכסים.",
        en: "Set the appropriate risk level first, and only then the assets.",
      },
      {
        he: "מחלקים את התיק בין נכסים עם מאפייני סיכון שונים.",
        en: "Split the portfolio among assets with different risk characteristics.",
      },
      {
        he: "מאזנים מחדש מדי תקופה בחזרה להקצאה המקורית.",
        en: "Rebalance periodically back to the original allocation.",
      },
    ],
    metrics: [
      {
        key: "allocation_weights",
        name: { he: "משקלי הקצאה", en: "Allocation weights" },
        description: {
          he: "אחוז התיק בכל סוג נכס; הביטוי המעשי של רמת הסיכון.",
          en: "The percentage of the portfolio in each asset type; the practical expression of risk level.",
        },
      },
      {
        key: "volatility",
        name: { he: "תנודתיות התיק", en: "Portfolio volatility" },
        description: {
          he: "מדד לתנודתיות הכוללת של התיק לאורך זמן.",
          en: "A measure of the portfolio's overall fluctuation over time.",
        },
      },
    ],
    historicalContext: {
      he: "חשיבות הקצאת הנכסים נטענה במחקר המפורסם של ברינסון, הוד וביבאואר מ-1986, ותורת התיקים של מרקוביץ (1952) הניחה את הבסיס לקשר בין סיכון, תשואה ופיזור - עבודה שזיכתה אותו בפרס נובל.",
      en: "The importance of asset allocation was argued in the well-known 1986 Brinson, Hood, and Beebower study, and Markowitz's portfolio theory (1952) laid the foundation for linking risk, return, and diversification - work that earned him a Nobel Prize.",
    },
    strengths: [
      { he: "מתאים את התיק לפרופיל המשקיע בפועל", en: "Aligns the portfolio with the investor's actual profile" },
      { he: "איזון מחדש כופה משמעת של קנייה בזול ומכירה ביוקר", en: "Rebalancing enforces buy-low/sell-high discipline" },
    ],
    limitations: [
      { he: "הערכת סיכון שגויה מובילה להקצאה שגויה", en: "A wrong risk estimate leads to a wrong allocation" },
      { he: "איזון מחדש יכול לייצר אירועי מס", en: "Rebalancing can create tax events" },
      { he: "לא מונע הפסדים בירידות כלליות", en: "Does not prevent losses in broad declines" },
    ],
    educationalNotes: {
      he: "זו הגישה שמקשרת את פרופיל הסיכון שנבנה בשלב הקודם של המערכת להקצאת התיק ההיפותטית.",
      en: "This is the approach that connects the risk profile built in the earlier phase of the app to the hypothetical portfolio allocation.",
    },
    dataRequirements: ["price_history"],
    exampleAssets: ["VTI", "BND"],
    keywordsList: {
      he: ["הקצאת נכסים", "הקצאה מבוססת סיכון", "איזון מחדש"],
      en: ["risk-based allocation", "asset allocation", "risk parity", "rebalancing"],
    },
  },
  {
    id: "diversification",
    name: {
      he: "פיזור",
      en: "Diversification",
    },
    description: {
      he: "פיזור ההשקעה בין נכסים, סקטורים, שווקים ומטבעות שונים כדי לצמצם את התלות בנכס יחיד.",
      en: "Spreading investments across different assets, sectors, markets, and currencies to reduce dependence on any single one.",
    },
    philosophy: {
      he: "הפילוסופיה: \"אל תשים את כל הביצים בסל אחד\". נכסים שונים מגיבים באופן שונ לאותו אירוע, ולכן שילוב שלהם יכול למתן את תנודת התיק הכולל.",
      en: "The philosophy: 'don't put all your eggs in one basket'. Different assets react differently to the same event, so combining them can soften the whole portfolio's swings.",
    },
    suitableFor: {
      he: "כמעט כל משקיע, בכל רמת סיכון ובכל אופק - זהו עיקרון יסוד, לא רק אסטרטגיה.",
      en: "Almost every investor at any risk level and horizon - it is a foundation principle, not just a strategy.",
    },
    riskProfile: {
      level: 3,
      label: { he: "מפחית סיכון", en: "Risk reducing" },
    },
    timeHorizon: ["short", "medium", "long"],
    assetTypes: ["mixed", "stocks", "bonds", "etfs", "index_funds"],
    rules: [
      {
        he: "מפזרים בין סוגי נכסים שונים, לא רק בין מניות שונות.",
        en: "Diversify across asset types, not just across different stocks.",
      },
      {
        he: "בודקים שהנכסים באמת שונים זה מזה ולא נעים יחד.",
        en: "Check the assets are truly different and do not move together.",
      },
      {
        he: "זוכרים שפיזור מצמצם סיכון אבל לא מבטל אותו.",
        en: "Remember diversification reduces risk but does not eliminate it.",
      },
    ],
    metrics: [
      {
        key: "correlation",
        name: { he: "מתאם", en: "Correlation" },
        description: {
          he: "כמה שני נכסים נעים יחד; מתאם נמוך מחזק את הפיזור.",
          en: "How much two assets move together; lower correlation strengthens diversification.",
        },
      },
      {
        key: "concentration",
        name: { he: "ריכוזיות", en: "Concentration" },
        description: {
          he: "איזה חלק מהתיק תלוי בנכס או סקטור יחיד.",
          en: "How much of the portfolio depends on a single asset or sector.",
        },
      },
    ],
    historicalContext: {
      he: "הפיזור הוא אבן היסוד של תורת התיקים המודרנית של הארי מרקוביץ מ-1952, שזיכתה אותו בפרס נובל. במשברים עולמיים (כמו 2008) מתאמים נוטים לקפוץ ביחד, ולכן הפיזור מוגבל בדיוק ברגעים הקשים.",
      en: "Diversification is the cornerstone of Harry Markowitz's 1952 modern portfolio theory, which earned him a Nobel Prize. In global crises (like 2008) correlations tend to jump together, so diversification is limited exactly in the hardest moments.",
    },
    strengths: [
      { he: "מצמצם נזק מאירוע נקודתי", en: "Limits damage from a single event" },
      { he: "עיקרון פשוט שקל ליישם", en: "A simple principle that is easy to apply" },
    ],
    limitations: [
      { he: "לא מגן מפני משבר מערכתי רחב", en: "Does not protect against a broad systemic crisis" },
      { he: "פיזור יתר יכול לדלל תשואה בלי תועלת", en: "Over-diversifying can dilute returns with no benefit" },
    ],
    educationalNotes: {
      he: "הפיזור הוא הבסיס שעליו נבנות שאר האסטרטגיות, ולכן הוא מופיע גם בכרטיסי הלמידה ובשאלון.",
      en: "Diversification is the base the other strategies build on, so it also appears in the learning cards and the quiz.",
    },
    dataRequirements: ["price_history", "market_breadth"],
    exampleAssets: ["VTI", "BND", "GLD"],
    keywordsList: {
      he: ["פיזור", "אסטרטגיית פיזור", "השקעה מפוזרת"],
      en: ["diversification", "diversified portfolio", "diversification strategy"],
    },
  },
];
