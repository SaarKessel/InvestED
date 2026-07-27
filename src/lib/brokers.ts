export interface BrokerInfo {
  name: string;
  app: string;
  tradingFee: string;
  managementFee: string;
  minDeposit: string;
  url: string;
  highlight?: string;
  // --- שדות מספריים אינדיקטיביים, לצורך מחשבון העמלות הדינמי בלבד ---
  monthlyFeeILS: number; // דמי ניהול/טיפול חודשיים מוערכים בש"ח
  perTradeFeeILS: number; // עלות מוערכת לעסקה בודדת (קנייה/מכירה) בש"ח
  fxSpreadPct: number; // מרווח המרת מט"ח מוערך, כאחוז מהסכום המומר
}

// ---------------------------------------------------------------------------
// הערה חשובה: העמלות ודמי הניהול של בתי השקעות משתנים חדשות לבקרים
// (מבצעים, הטבות זמניות, שינויי תמחור). המספרים כאן — כולל השדות
// המספריים ששמשים את מחשבון העמלות — הם אינדיקטיביים בלבד, מבוססים על
// מידע פומבי בעת כתיבת הקוד, ואינם מהווים ייעוץ להעדפת ברוקר אחד על
// פני אחר. חובה לבדוק את התנאים המעודכנים באתר הרשמי של כל בית השקעות
// לפני פתיחת חשבון.
// ---------------------------------------------------------------------------

export const BROKERS: BrokerInfo[] = [
  {
    name: "Interactive Brokers (ישראל)",
    app: "IBKR Mobile",
    tradingFee: "כ-1 סנט למניה (מינ׳ כ-1$-2$ לעסקה)",
    managementFee: "ללא דמי ניהול קבועים",
    minDeposit: "ללא מינימום רשמי",
    url: "https://www.interactivebrokers.com",
    highlight: "עמלות מהנמוכות בשוק, פלטפורמה מקצועית",
    monthlyFeeILS: 0,
    perTradeFeeILS: 7,
    fxSpreadPct: 0.2,
  },
  {
    name: "eToro",
    app: "eToro",
    tradingFee: "0% עמלת מסחר על מניות (מרווח שער בהמרת מט\"ח)",
    managementFee: "ללא דמי ניהול, יש עמלת אי-פעילות",
    minDeposit: "כ-50$-100$ בהתאם למדינה",
    url: "https://www.etoro.com",
    highlight: "פשוט למתחילים, כולל מסחר חלקי במניות",
    monthlyFeeILS: 0,
    perTradeFeeILS: 0,
    fxSpreadPct: 1.0,
  },
  {
    name: "מיטב טרייד",
    app: "Meitav Trade",
    tradingFee: "כ-1 סנט למניה, מינ׳ כ-5$-7.5$ לעסקה",
    managementFee: "כ-15 ₪ דמי טיפול חודשיים (בכפוף להטבות)",
    minDeposit: "כ-5,000 ₪",
    url: "https://www.meitavtrade.co.il",
    highlight: "בית השקעות ישראלי ותיק ומוכר",
    monthlyFeeILS: 15,
    perTradeFeeILS: 27,
    fxSpreadPct: 0.5,
  },
  {
    name: "פסגות טרייד",
    app: "Psagot Trade",
    tradingFee: "מהעמלות הנמוכות למסחר בת\"א; עמלה על מסחר בחו\"ל",
    managementFee: "פטור מדמי ניהול ומדמי משמרת",
    minDeposit: "כ-5,000-10,000 ₪ (בהתאם למסלול)",
    url: "https://www.psagot-trade.co.il",
    highlight: "פופולרי למסחר עצמאי בבורסת ת\"א",
    monthlyFeeILS: 0,
    perTradeFeeILS: 20,
    fxSpreadPct: 0.5,
  },
  {
    name: "בלינק טרייד",
    app: "Blink",
    tradingFee: "עמלה תחרותית למסחר בארץ ובחו\"ל",
    managementFee: "מבצעים תקופתיים לפטור מדמי ניהול",
    minDeposit: "ללא מינימום קבוע",
    url: "https://www.blink.co.il",
    highlight: "פלטפורמת מסחר עצמאית עם ממשק ידידותי למתחילים",
    monthlyFeeILS: 0,
    perTradeFeeILS: 25,
    fxSpreadPct: 0.6,
  },
  {
    name: "IBI טרייד",
    app: "IBI Trade",
    tradingFee: "עמלות דורגות לפי סוג הנכס והשוק",
    managementFee: "בכפוף למסלול שנבחר",
    minDeposit: "כ-5,000 ₪",
    url: "https://www.ibi.co.il",
    highlight: "בית השקעות ישראלי מוביל עם מגוון אפיקים",
    monthlyFeeILS: 15,
    perTradeFeeILS: 25,
    fxSpreadPct: 0.5,
  },
];
