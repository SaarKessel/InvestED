import type { Strategy } from "@/types";

export const STRATEGIES: Strategy[] = [
  {
    id: "passive",
    name: {
      he: "השקעה פסיבית במדדים",
      en: "Passive Index Investing",
    },
    whatItIs: {
      he: "השקעה בקרנות העוקבות אחרי מדד רחב (כמו S&P 500) במקום ניסיון לבחור מניות בודדות שינצחו את השוק.",
      en: "Investing in broad-market index funds (like the S&P 500) instead of trying to pick individual stocks that will beat the market.",
    },
    pros: {
      he: ["דמי ניהול נמוכים", "פיזור רחב אוטומטי", "פשוט לתחזוקה לאורך זמן", "ביצועים היסטוריים תחרותיים"],
      en: ["Low fees", "Automatic broad diversification", "Simple to maintain over time", "Competitive historical performance"],
    },
    cons: {
      he: ["אין אפשרות \"לנצח\" את השוק", "התיק יורד יחד עם השוק בירידות", "פחות גמישות להתאמה אישית"],
      en: ["Cannot 'beat' the market", "Portfolio falls with the market during downturns", "Less flexibility for personal customization"],
    },
    riskLevel: 5,
    suitableFor: {
      he: "משקיעים לטווח ארוך שרוצים גישה פשוטה, זולה ופחות מתוחכמת.",
      en: "Long-term investors who want a simple, low-cost, and low-maintenance approach.",
    },
    stocks: ["VOO", "VTI", "SPY", "IVV"],
  },
  {
    id: "dividend",
    name: {
      he: "השקעת דיבידנדים",
      en: "Dividend Investing",
    },
    whatItIs: {
      he: "התמקדות בחברות וקרנות שמחלקות חלק מהרווח כתשלום שוטף (דיבידנד) לבעלי המניות.",
      en: "Focusing on companies and funds that distribute part of their earnings as regular payments (dividends) to shareholders.",
    },
    pros: {
      he: ["הכנסה שוטפת פוטנציאלית", "לרוב חברות יציבות ובוגרות", "תחושת \"תזרם\" מוחשית למשקיע"],
      en: ["Potential steady income", "Generally stable and mature companies", "Sense of tangible 'cash flow' for the investor"],
    },
    cons: {
      he: ["פחות פוטנציאל צמיחה מהיר", "דיבידנד אינו מובטח ויכול להיפסק", "חשיפה מוגברת לסקטורים מסוימים"],
      en: ["Lower rapid growth potential", "Dividends are not guaranteed and can be cut", "Concentrated exposure to certain sectors"],
    },
    riskLevel: 4,
    suitableFor: {
      he: "משקיעים שמחפשים הכנסה שוטפת ופחות תנודתיות מקיצונית.",
      en: "Investors seeking regular income and lower short-term volatility.",
    },
    stocks: ["JNJ", "PG", "KO", "SCHD"],
  },
  {
    id: "growth",
    name: {
      he: "השקעת צמיחה",
      en: "Growth Investing",
    },
    whatItIs: {
      he: "השקעה בחברות שצפויות לגדול מהר מהממוצע, גם אם אינן רווחיות עדיין או שאינן מחלקות דיבידנד.",
      en: "Investing in companies expected to grow faster than average, even if they are not yet profitable or do not pay dividends.",
    },
    pros: {
      he: ["פוטנציאל תשואה גבוה לטווח ארוך", "חשיפה לחדשנות וסקטורים מתפתחים"],
      en: ["High long-term return potential", "Exposure to innovation and emerging sectors"],
    },
    cons: {
      he: ["תנודתיות גבוהה משמעותית", "רגישות גבוהה לשינויי ריבית וסנטימנט שוק", "לא מתאים לטווח קצר"],
      en: ["Significant volatility", "High sensitivity to interest rate changes and market sentiment", "Not suitable for short horizons"],
    },
    riskLevel: 8,
    suitableFor: {
      he: "משקיעים עם אופק ארוך וסיבולת סיכון גבוהה.",
      en: "Investors with a long time horizon and high risk tolerance.",
    },
    stocks: ["NVDA", "MSFT", "AAPL", "QQQ"],
  },
  {
    id: "value",
    name: {
      he: "השקעת ערך",
      en: "Value Investing",
    },
    whatItIs: {
      he: "חיפוש חברות שנראות \"זולות\" ביחס לרווחים, לנכסים או לפוטנציאל שלהן, מתוך אמונה שהשוק מתמחר אותן בחסר.",
      en: "Searching for companies that appear 'cheap' relative to earnings, assets, or potential, based on the belief that the market undervalues them.",
    },
    pros: {
      he: ["פוטנציאל \"מרווח ביטחון\" אם הניתוח נכון", "לרוב פחות תנודתי מצמיחה טהורה"],
      en: ["Potential 'margin of safety' if analysis is correct", "Usually less volatile than pure growth"],
    },
    cons: {
      he: ["דורש ניתוח וסבלנות", "חברה \"זולה\" יכולה להישאר זולה זמן רב", "לא תמיד השוק \"מתקן\" את המחיר"],
      en: ["Requires analysis and patience", "A 'cheap' company can stay cheap for a long time", "The market does not always 'correct' the price"],
    },
    riskLevel: 6,
    suitableFor: {
      he: "משקיעים שמוכנים ללמוד ניתוח פיננסי בסיסי ולהיות סבלניים.",
      en: "Investors willing to learn basic financial analysis and be patient.",
    },
    stocks: ["BRK.B", "JPM", "VTV"],
  },
];
