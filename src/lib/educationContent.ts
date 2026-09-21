import type { FinanceConcept, Mistake, RoadmapStage } from "@/types";

export const FINANCE_CONCEPTS: FinanceConcept[] = [
  {
    term: {
      he: "קרן סל (ETF)",
      en: "Exchange-Traded Fund (ETF)",
    },
    definition: {
      he: "קרן הנסחרת בבורסה, מחזיקה סל נכסים ונסחרת כמו מניה בודדת — מעניקה פיזור מיידי.",
      en: "A fund traded on the stock exchange that holds a basket of assets and trades like a single stock — providing instant diversification.",
    },
  },
  {
    term: {
      he: "קרן מדד (Index Fund)",
      en: "Index Fund",
    },
    definition: {
      he: "קרן שנועדה לעקוב אחרי מדד שוק, ולא לנסות לנצח אותו, לרוב בעלות נמוכה מאוד.",
      en: "A fund designed to track a market index rather than try to beat it, usually with very low costs.",
    },
  },
  {
    term: {
      he: "פיזור (Diversification)",
      en: "Diversification",
    },
    definition: {
      he: "פיזור השקעות בין נכסים, סקטורים וגאוגרפיות שונות, כדי שביצוע גרוע של השקעה אחת לא יטביע את כל התיק.",
      en: "Spreading investments across different assets, sectors, and geographies so that poor performance of one investment does not sink the entire portfolio.",
    },
  },
  {
    term: {
      he: "תנודתיות (Volatility)",
      en: "Volatility",
    },
    definition: {
      he: "כמה ומהר מחיר ההשקעה זז מעלה ומטה לאורך זמן.",
      en: "How much and how quickly an investment's price moves up and down over time.",
    },
  },
  {
    term: {
      he: "דמי ניהול (Expense Ratio)",
      en: "Expense Ratio",
    },
    definition: {
      he: "העמלה השנתית שקרן גובה, כאחוז מהנכסים — נמוך יותר, בדרך כלל טוב יותר.",
      en: "The annual fee a fund charges, expressed as a percentage of assets — lower is generally better.",
    },
  },
  {
    term: {
      he: "תשואת דיבידנד (Dividend Yield)",
      en: "Dividend Yield",
    },
    definition: {
      he: "היחס השנתי בין הדיבידנד שמחולק לבין מחיר המניה, המבטא כמה \"הכנסה\" מקבל המשקיע יחסית להשקעה.",
      en: "The annual ratio between the dividend paid and the stock price, expressing how much 'income' the investor receives relative to the investment.",
    },
  },
  {
    term: {
      he: "אג\"ח (Bond)",
      en: "Bond",
    },
    definition: {
      he: "הלוואה שאתה נותן לממשלה או לחברה בתמורה לריבית סדירה והחזר הקרן בסיום.",
      en: "A loan you give to a government or corporation in exchange for regular interest payments and return of principal at maturity.",
    },
  },
  {
    term: {
      he: "הקצאת נכסים (Asset Allocation)",
      en: "Asset Allocation",
    },
    definition: {
      he: "האופן שבו תיק מחולק בין מניות, אג\"ח ומזומן — גורם מרכזי בתשואה לטווח ארוך.",
      en: "How a portfolio is divided among stocks, bonds, and cash — a key driver of long-term returns.",
    },
  },
  {
    term: {
      he: "ריבית דריבית (Compounding)",
      en: "Compounding",
    },
    definition: {
      he: "הרווחת תשואה גם על התשואות שכבר הורווחו בעבר — המנוע מאחורי בניית הון לאורך זמן.",
      en: "Earning returns on past returns — the engine behind long-term wealth building.",
    },
  },
  {
    term: {
      he: "השקעה תקופתית (DCA)",
      en: "Dollar-Cost Averaging (DCA)",
    },
    definition: {
      he: "השקעת סכום קבוע במרווחים קבועים, ללא תלות במחיר, כדי להחליק את השפעת תזמון השוק.",
      en: "Investing a fixed amount at regular intervals regardless of price, to smooth out the impact of market timing.",
    },
  },
  {
    term: {
      he: "בטא (Beta)",
      en: "Beta",
    },
    definition: {
      he: "מדד לכמה נכס נע ביחס לשוק הכללי — מעל 1 תנודתי יותר מהשוק, מתחת ל-1 פחות תנודתי.",
      en: "A measure of how much an asset moves relative to the overall market — above 1 is more volatile than the market, below 1 is less volatile.",
    },
  },
  {
    term: {
      he: "שווי שוק (Market Cap)",
      en: "Market Capitalization",
    },
    definition: {
      he: "השווי הכולל של מניות החברה — משמש לסיווג חברות כ-Small/Mid/Large Cap.",
      en: "The total value of a company's outstanding shares — used to classify companies as Small/Mid/Large Cap.",
    },
  },
];

export const COMMON_MISTAKES: Mistake[] = [
  {
    title: {
      he: "חוסר פיזור",
      en: "Lack of Diversification",
    },
    detail: {
      he: "תיק צר מדי חשוף לסיכונים שפיזור רחב יותר היה מפחית.",
      en: "A portfolio that is too narrow is exposed to risks that broader diversification would reduce.",
    },
  },
  {
    title: {
      he: "השקעה לפי רגשות",
      en: "Investing Based on Emotions",
    },
    detail: {
      he: "החלטות מונעות פחד או התלהבות רגעית לרוב מובילות לקנייה יקרה ומכירה זולה.",
      en: "Decisions driven by fear or momentary excitement often lead to buying high and selling low.",
    },
  },
  {
    title: {
      he: "ניסיון לתזמן את השוק",
      en: "Trying to Time the Market",
    },
    detail: {
      he: "לחזות בעקביות שיאים ושפלים קשה מאוד, גם למקצוענים.",
      en: "Consistently predicting peaks and troughs is very difficult, even for professionals.",
    },
  },
  {
    title: {
      he: "חוסר הבנה של סיכון",
      en: "Not Understanding Risk",
    },
    detail: {
      he: "השקעה בנכסים תנודתיים מבלי להבין את טווח התנודות האפשרי מובילה למכירה בפאניקה.",
      en: "Investing in volatile assets without understanding the possible range of fluctuations often leads to panic selling.",
    },
  },
  {
    title: {
      he: "ריכוז יתר בנכס אחד",
      en: "Over-Concentration in a Single Asset",
    },
    detail: {
      he: "השקעת חלק גדול מהחיסכון בנכס בודד מגדילה את החשיפה לסיכון ספציפי שלו.",
      en: "Investing a large portion of savings in a single asset increases exposure to its specific risk.",
    },
  },
  {
    title: {
      he: "התעלמות מדמי ניהול",
      en: "Ignoring Fees",
    },
    detail: {
      he: "הבדלים קטנים בדמי ניהול מצטברים לאורך שנים להבדלים גדולים בתיק הסופי.",
      en: "Small differences in fees compound over years into large differences in the final portfolio.",
    },
  },
];

export const LEARNING_ROADMAP: RoadmapStage[] = [
  {
    stage: {
      he: "שלב 1",
      en: "Stage 1",
    },
    title: {
      he: "בסיס פיננסי",
      en: "Financial Basics",
    },
    topics: {
      he: ["מהי מניה, אג\"ח וקרן סל?", "סיכון מול תשואה", "בניית קרן חירום"],
      en: ["What is a stock, bond, and ETF?", "Risk vs. Return", "Building an emergency fund"],
    },
  },
  {
    stage: {
      he: "שלב 2",
      en: "Stage 2",
    },
    title: {
      he: "היכרות עם שוק ההון",
      en: "Getting to Know the Stock Market",
    },
    topics: {
      he: ["איך קוראים גרף מחיר", "מהם מדדי שוק מרכזיים", "הבנת דמי ניהול ועמלות"],
      en: ["How to read a price chart", "Key market indices", "Understanding management fees and commissions"],
    },
  },
  {
    stage: {
      he: "שלב 3",
      en: "Stage 3",
    },
    title: {
      he: "בניית אסטרטגיה",
      en: "Building a Strategy",
    },
    topics: {
      he: ["הקצאת נכסים אישית", "בחירת סגנון השקעה (פסיבי/דיבידנד/צמיחה/ערך)", "השקעה תקופתית (DCA)"],
      en: ["Personal asset allocation", "Choosing an investment style (passive/dividend/growth/value)", "Dollar-cost averaging (DCA)"],
    },
  },
  {
    stage: {
      he: "שלב 4",
      en: "Stage 4",
    },
    title: {
      he: "העמקה",
      en: "Advanced Topics",
    },
    topics: {
      he: ["מדדי תשואה מותאמי סיכון (Sharpe, Beta)", "פסיכולוגיה פיננסית והטיות התנהגותיות", "איזון מחדש של תיק"],
      en: ["Risk-adjusted return metrics (Sharpe, Beta)", "Financial psychology and behavioral biases", "Portfolio rebalancing"],
    },
  },
];
