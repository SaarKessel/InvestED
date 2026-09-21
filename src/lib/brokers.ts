export interface BrokerInfo {
  name: string | { he: string; en: string };
  app: string | { he: string; en: string };
  tradingFee: string | { he: string; en: string };
  managementFee: string | { he: string; en: string };
  minDeposit: string | { he: string; en: string };
  url: string;
  highlight?: string | { he: string; en: string };
  // --- שדות מספריים אינדיקטיביים, לצורך מחשבון העמלות הדינמי בלבד ---
  monthlyFeeILS: number;
  perTradeFeeILS: number;
  fxSpreadPct: number;
}

export const BROKERS: BrokerInfo[] = [
  {
    name: { he: "Interactive Brokers (ישראל)", en: "Interactive Brokers" },
    app: { he: "IBKR Mobile", en: "IBKR Mobile" },
    tradingFee: { he: "כ-1 סנט למניה (מינימום כ-1$-2$ לעסקה)", en: "~1 cent per share (min ~$1-$2 per trade)" },
    managementFee: { he: "ללא דמי ניהול קבועים", en: "No fixed management fees" },
    minDeposit: { he: "ללא מינימום רשמי", en: "No official minimum" },
    url: "https://www.interactivebrokers.com",
    highlight: { he: "עמלות מהנמוכות בשוק, פלטפורמה מקצועית", en: "Among the lowest fees, professional platform" },
    monthlyFeeILS: 0,
    perTradeFeeILS: 7,
    fxSpreadPct: 0.2,
  },
  {
    name: { he: "eToro", en: "eToro" },
    app: { he: "eToro", en: "eToro" },
    tradingFee: { he: "0% עמלת מסחר על מניות (מרווח שער בהמרת מט\"ח)", en: "0% trading fee on stocks (FX spread applies)" },
    managementFee: { he: "ללא דמי ניהול, יש עמלת אי-פעילות", en: "No management fees, inactivity fee applies" },
    minDeposit: { he: "כ-50$-100$ בהתאם למדינה", en: "~$50-$100 depending on country" },
    url: "https://www.etoro.com",
    highlight: { he: "פשוט למתחילים, כולל מסחר חלקי במניות", en: "Simple for beginners, includes fractional stocks" },
    monthlyFeeILS: 0,
    perTradeFeeILS: 0,
    fxSpreadPct: 1.0,
  },
  {
    name: { he: "מיטב טרייד", en: "Meitav Trade" },
    app: { he: "Meitav Trade", en: "Meitav Trade" },
    tradingFee: { he: "כ-1 סנט למניה, מינימום כ-5$-7.5$ לעסקה", en: "~1 cent per share, min ~$5-$7.5 per trade" },
    managementFee: { he: "כ-15 ₪ דמי טיפול חודשיים (בכפוף להטבות)", en: "~15 NIS monthly custody fees (subject to benefits)" },
    minDeposit: { he: "כ-5,000 ₪", en: "~5,000 NIS" },
    url: "https://www.meitavtrade.co.il",
    highlight: { he: "בית השקעות ישראלי ותיק ומוכר", en: "Established Israeli brokerage" },
    monthlyFeeILS: 15,
    perTradeFeeILS: 27,
    fxSpreadPct: 0.5,
  },
  {
    name: { he: "פסגות טרייד", en: "Psagot Trade" },
    app: { he: "Psagot Trade", en: "Psagot Trade" },
    tradingFee: { he: "מהעמלות הנמוכות למסחר בת\"א; עמלה על מסחר בחו\"ל", en: "Low fees for TASE trading; fee for international trading" },
    managementFee: { he: "פטור מדמי ניהול ומדמי משמרת", en: "Exempt from management and custody fees" },
    minDeposit: { he: "כ-5,000-10,000 ₪ (בהתאם למסלול)", en: "~5,000-10,000 NIS (depending on plan)" },
    url: "https://www.psagot-trade.co.il",
    highlight: { he: "פופולרי למסחר עצמאי בבורסת ת\"א", en: "Popular for independent TASE trading" },
    monthlyFeeILS: 0,
    perTradeFeeILS: 20,
    fxSpreadPct: 0.5,
  },
  {
    name: { he: "בלינק טרייד", en: "Blink Trade" },
    app: { he: "Blink", en: "Blink" },
    tradingFee: { he: "עמלה תחרותית למסחר בארץ ובחו\"ל", en: "Competitive fees for local and international trading" },
    managementFee: { he: "מבצעים תקופתיים לפטור מדמי ניהול", en: "Periodic promotions for fee waivers" },
    minDeposit: { he: "ללא מינימום קבוע", en: "No fixed minimum" },
    url: "https://www.blink.co.il",
    highlight: { he: "פלטפורמת מסחר עצמאית עם ממשק ידידותי למתחילים", en: "Independent trading platform with beginner-friendly interface" },
    monthlyFeeILS: 0,
    perTradeFeeILS: 25,
    fxSpreadPct: 0.6,
  },
  {
    name: { he: "IBI טרייד", en: "IBI Trade" },
    app: { he: "IBI Trade", en: "IBI Trade" },
    tradingFee: { he: "עמלות דורגות לפי סוג הנכס והשוק", en: "Tiered fees by asset type and market" },
    managementFee: { he: "בכפוף למסלול שנבחר", en: "Depends on chosen plan" },
    minDeposit: { he: "כ-5,000 ₪", en: "~5,000 NIS" },
    url: "https://www.ibi.co.il",
    highlight: { he: "בית השקעות ישראלי מוביל עם מגוון אפיקים", en: "Leading Israeli brokerage with diverse channels" },
    monthlyFeeILS: 15,
    perTradeFeeILS: 25,
    fxSpreadPct: 0.5,
  },
];
