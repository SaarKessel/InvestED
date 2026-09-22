import type { AssetAnalysis } from "@/types";
import type { ConversationLanguage } from "./conversationContext";

export interface HoldingRequest {
  quantity: number;
  symbol: string | null;
}

export interface HoldingValuation {
  quantity: number;
  symbol: string;
  price: number;
  currency: string | null;
  total: number;
  dataSource: AssetAnalysis["dataSource"];
  freshness: AssetAnalysis["freshness"];
  timestamp: string | null;
  available: boolean;
  reason: "simulated" | "unavailable" | null;
}

interface ConceptEntry {
  patterns: RegExp[];
  heLabel: string;
  enLabel: string;
  he: string;
  en: string;
}

const CONCEPTS: ConceptEntry[] = [
  {
    patterns: [/קרן\s+נאמנות/i, /mutual\s+fund/i],
    heLabel: "קרן נאמנות",
    enLabel: "Mutual fund",
    he: "קרן נאמנות היא כלי השקעה שמרכז כסף ממשקיעים רבים ומנוהל לפי מדיניות מוגדרת. הקרן קונה סל של ניירות ערך, והמשקיע מחזיק יחידות בקרן ולא את הנכסים ישירות. לפני השקעה בודקים בין היתר מדיניות השקעה, רמת סיכון, דמי ניהול, ביצועי עבר ונזילות. ביצועי עבר אינם מבטיחים תשואה עתידית.",
    en: "A mutual fund pools money from many investors and invests it under a defined policy. Investors own units in the fund rather than the underlying securities directly. Key checks include its mandate, risk level, fees, past performance, and liquidity. Past performance does not guarantee future returns.",
  },
  {
    patterns: [/\betf\b/i, /קרן\s+סל/i, /תעודת\s+סל/i],
    heLabel: "קרן סל (ETF)",
    enLabel: "ETF",
    he: "ETF (קרן סל) היא קרן שעוקבת בדרך כלל אחרי מדד או סל נכסים ונסחרת בבורסה לאורך יום המסחר כמו מניה. היא יכולה לספק פיזור בעסקה אחת, אך כרוכה בסיכון, דמי ניהול ולעיתים פער עקיבה.",
    en: "An ETF is a fund that usually tracks an index or basket of assets and trades on an exchange throughout the day like a stock. It can provide diversification in one holding, but it still has risk, fees, and possible tracking error.",
  },
  {
    patterns: [/קרן\s+מדד|קרן\s+עוקבת\s+מדד/i, /index\s+fund/i],
    heLabel: "קרן מדד",
    enLabel: "Index fund",
    he: "קרן מדד היא קרן שמטרתה לשחזר את תשואת מדד מסוים (למשל S&P 500) בעלות נמוכה, בלי לנסות להכות את השוק. היא מספקת פיזור רחב, אך עוקבת גם אחרי ירידות המדד.",
    en: "An index fund aims to replicate the return of a specific index (such as the S&P 500) at low cost, without trying to beat the market. It provides broad diversification but also follows the index down.",
  },
  {
    patterns: [/אג["״']?ח|אגרת\s+חוב|איגרת\s+חוב/i, /\bbond(?:s)?\b/i],
    heLabel: "איגרת חוב",
    enLabel: "Bond",
    he: "איגרת חוב היא הלוואה לממשלה, חברה או גוף אחר. המנפיק מתחייב לתשלומי ריבית ולהחזר הקרן לפי התנאים, אך קיימים סיכוני אשראי, ריבית, אינפלציה ונזילות.",
    en: "A bond is a loan to a government, company, or other issuer. The issuer promises interest and principal payments under stated terms, but bonds carry credit, interest-rate, inflation, and liquidity risk.",
  },
  {
    patterns: [/ריבית\s+דריבית/i, /compound(?:ing|ed)?\s+interest/i],
    heLabel: "ריבית דריבית",
    enLabel: "Compound interest",
    he: "ריבית דריבית היא צמיחה שבה התשואה מצטברת גם על הסכום המקורי וגם על תשואות קודמות. הזמן וקצב התשואה משפיעים מאוד, אבל תשואה בשוק אינה מובטחת.",
    en: "Compound interest is growth earned on both the original amount and prior gains. Time and the rate of return matter greatly, but market returns are not guaranteed.",
  },
  {
    patterns: [/שווי\s+שוק/i, /market\s+cap(?:italization)?/i],
    heLabel: "שווי שוק",
    enLabel: "Market cap",
    he: "שווי שוק של חברה הוא מחיר מניה כפול מספר המניות הקיימות. זהו מדד לגודל החברה בבורסה, לא המחיר ההוגן שלה ולא שווי הפעילות ללא התאמות.",
    en: "Market capitalization is share price multiplied by shares outstanding. It measures a public company's equity-market size, not necessarily fair value or enterprise value.",
  },
  {
    patterns: [/תשואת\s+דיבידנד/i, /dividend\s+yield/i],
    heLabel: "תשואת דיבידנד",
    enLabel: "Dividend yield",
    he: "תשואת דיבידנד היא הדיבידנד השנתי חלקי מחיר המניה, באחוזים. תשואה גבוהה יכולה לנבוע גם ממחיר שירד, ולכן בודקים גם יציבות החלוקה ואת היכולת של החברה להמשיך אותה.",
    en: "Dividend yield is the annual dividend divided by the share price, in percent. A high yield can also result from a falling price, so check the dividend's stability and the company's ability to sustain it.",
  },
  {
    patterns: [/דיבידנד/i, /\bdividend(?:s)?\b/i],
    heLabel: "דיבידנד",
    enLabel: "Dividend",
    he: "דיבידנד הוא חלוקת מזומן או נכסים מחברה לבעלי המניות. הוא אינו מובטח, יכול להשתנות, ומחיר המניה בדרך כלל מתואם כלפי מטה ביום האקס.",
    en: "A dividend is a distribution of cash or assets from a company to shareholders. It is not guaranteed, can change, and the share price normally adjusts on the ex-dividend date.",
  },
  {
    patterns: [/מכפיל\s+רווח/i, /\bp\/?e\b|price[ -]to[ -]earnings/i],
    heLabel: "מכפיל רווח",
    enLabel: "P/E ratio",
    he: "מכפיל רווח (P/E) הוא מחיר המניה חלקי הרווח למניה. הוא מאפשר השוואה בסיסית בין חברות, אך מושפע מצמיחה צפויה, איכות הרווח והענף, ואינו מספיק לבדו להחלטה.",
    en: "The P/E ratio is share price divided by earnings per share. It supports basic comparisons, but depends on expected growth, earnings quality, and industry and is not sufficient by itself.",
  },
  {
    patterns: [/רווח\s+למניה/i, /\beps\b|earnings\s+per\s+share/i],
    heLabel: "רווח למניה (EPS)",
    enLabel: "EPS",
    he: "רווח למניה (EPS) הוא הרווח הנקי של חברה חלקי מספר המניות. הוא מרכיב מרכזי במכפיל הרווח, אך יכול להיות מושפע מפריטים חד-פעמיים ומדיניות חשבונאית.",
    en: "Earnings per share (EPS) is a company's net income divided by its share count. It is a key input to the P/E ratio, but can be affected by one-off items and accounting policy.",
  },
  {
    patterns: [/דמי\s+ניהול|יחס\s+הוצאות/i, /expense\s+ratio|management\s+fee/i],
    heLabel: "דמי ניהול",
    enLabel: "Expense ratio",
    he: "דמי ניהול הם העלות השנתית שקרן גובה מנכסיה. גם פער קטן מצטבר לאורך זמן, ולכן משווים את העלות לצד מדיניות הקרן, עקיבה, סיכון ושירות.",
    en: "An expense ratio is the annual cost a fund deducts from its assets. Small differences compound over time, so compare cost together with mandate, tracking, risk, and service.",
  },
  {
    patterns: [/תנודתיות/i, /volatil(?:ity|e)/i],
    heLabel: "תנודתיות",
    enLabel: "Volatility",
    he: "תנודתיות מתארת את גודל ותדירות שינויי המחיר. תנודתיות גבוהה פירושה טווח תוצאות רחב יותר, לא בהכרח תשואה גבוהה יותר.",
    en: "Volatility describes the size and frequency of price changes. Higher volatility means a wider range of outcomes, not necessarily a higher return.",
  },
  {
    patterns: [/\brsi\b/i],
    heLabel: "RSI",
    enLabel: "RSI",
    he: "RSI הוא מדד מומנטום בין 0 ל-100 שמשווה את עוצמת העליות והירידות האחרונות. הוא כלי תיאורי, לא תחזית ולא הוראת קנייה או מכירה.",
    en: "RSI is a 0-100 momentum indicator that compares the strength of recent gains and losses. It is descriptive, not a forecast or a buy/sell instruction.",
  },
  {
    patterns: [/פיזור/i, /diversif(?:ication|y)/i],
    heLabel: "פיזור",
    enLabel: "Diversification",
    he: "פיזור מפחית תלות בנכס, חברה או שוק יחיד. הוא אינו מונע הפסדים, אך יכול לצמצם את הפגיעה מאירוע נקודתי.",
    en: "Diversification reduces dependence on one asset, company, or market. It cannot prevent losses, but it can limit the impact of a single event.",
  },
  {
    patterns: [/פיצול\s+מניה|פיצול/i, /stock\s+split|\bsplit\b/i],
    heLabel: "פיצול מניה",
    enLabel: "Stock split",
    he: "פיצול מניה מחלק כל מניה למספר מניות במחיר יחסי - למשל פיצול 1:10 הופך מניה של 1,000 ל-10 מניות של 100. שווי ההחזקה לא משתנה מהפיצול עצמו.",
    en: "A stock split divides each share into more shares at a proportional price - a 10-for-1 split turns one $1,000 share into ten $100 shares. The holding's value does not change from the split itself.",
  },
  {
    patterns: [/\bמניה\b|מניות/i, /\bstock(?:s)?\b|\bshare(?:s)?\b/i],
    heLabel: "מניה",
    enLabel: "Stock",
    he: "מניה היא יחידת בעלות בחברה. מחירה משתנה לפי ביקוש והיצע בבורסה, והתשואה יכולה לבוא מעליית מחיר ומדיבידנדים - אבל גם הפסד אפשרי, כולל מלוא הקרן.",
    en: "A stock is a unit of ownership in a company. Its price moves with supply and demand, and returns can come from price gains and dividends - but losses, up to the full amount, are possible.",
  },
  {
    patterns: [/(?<!צמוד\s)(?<!צמודה\sל)\bמדד\b/i, /\bindex\b|indices/i],
    heLabel: "מדד",
    enLabel: "Index",
    he: "מדד הוא מדד סטטיסטי שעוקב אחרי סל ניירות ערך, למשל S&P 500 או תל אביב 35. אי אפשר לקנות מדד ישירות - משקיעים בו דרך קרנות עוקבות.",
    en: "An index is a statistical measure tracking a basket of securities, such as the S&P 500 or the TA-35. You cannot buy an index directly - you invest through tracking funds.",
  },
  {
    patterns: [/\bipo\b|הנפקה\s+ראשונית|הנפקה/i, /initial\s+public\s+offering/i],
    heLabel: "הנפקה (IPO)",
    enLabel: "IPO",
    he: "הנפקה ראשונית (IPO) היא התהליך שבו חברה מנפיקה מניות לציבור בפעם הראשונה. מחירי מניות חדשות יכולים להיות תנודתיים במיוחד בימים הראשונים.",
    en: "An IPO (initial public offering) is when a company sells shares to the public for the first time. Newly listed stocks can be especially volatile in their first days.",
  },
  {
    patterns: [/אינפלציה/i, /inflation/i],
    heLabel: "אינפלציה",
    enLabel: "Inflation",
    he: "אינפלציה היא עליית מחירים כללית ששוחקת את כוח הקנייה של הכסף. כדי שהשקעה תשמר ערך ריאלי, התשואה הנומינלית צריכה לעלות על קצב האינפלציה.",
    en: "Inflation is a general rise in prices that erodes the purchasing power of money. For an investment to keep real value, its nominal return must beat the inflation rate.",
  },
  {
    patterns: [/ריבית(?!.*דריבית)/i, /interest\s+rate/i],
    heLabel: "ריבית",
    enLabel: "Interest rate",
    he: "ריבית היא המחיר של כסף: מה שמלווה גובה על הלוואה או שפיקדון משלם לחוסך. שינויי ריבית משפיעים על אג\"ח, משכנתאות, פיקדונות ועל שוק המניות.",
    en: "An interest rate is the price of money: what a lender charges or a deposit pays. Rate changes affect bonds, mortgages, deposits, and the stock market.",
  },
  {
    patterns: [/נזילות/i, /liquidity|liquid/i],
    heLabel: "נזילות",
    enLabel: "Liquidity",
    he: "נזילות היא המהירות והקלות שבהן אפשר להמיר נכס למזומן בלי לפגוע במחיר. מזומן ומניות גדולות נזילים; נדל\"ן ונכסים פרטיים פחות.",
    en: "Liquidity is how quickly and easily an asset converts to cash without hurting its price. Cash and large stocks are liquid; real estate and private assets less so.",
  },
  {
    patterns: [/שוק\s+שורי/i, /bull\s+market/i],
    heLabel: "שוק שורי",
    enLabel: "Bull market",
    he: "שוק שורי הוא תקופה של עליות מחירים מתמשכות ואופטימיות. הוא אינו נמשך לנצח, ולכן מתכננים גם לתקופות ירידות.",
    en: "A bull market is a period of sustained price rises and optimism. It does not last forever, so planning also covers downturns.",
  },
  {
    patterns: [/שוק\s+דובי/i, /bear\s+market/i],
    heLabel: "שוק דובי",
    enLabel: "Bear market",
    he: "שוק דובי הוא ירידה מתמשכת, בדרך כלל 20% ומעלה מהשיא. ירידות כאלה חלק טבעי מהשוק, ואופק ההשקעה קובע כמה הן משנות.",
    en: "A bear market is a sustained decline, usually 20% or more from the peak. Such declines are a normal part of markets, and your time horizon decides how much they matter.",
  },
  {
    patterns: [/מינוף/i, /leverage/i],
    heLabel: "מינוף",
    enLabel: "Leverage",
    he: "מינוף הוא השקעה בכסף שאול כדי להגדיל חשיפה. הוא מגדיל רווחים והפסדים כאחד, ועלול לדרוש הון נוסף בעת ירידות.",
    en: "Leverage is investing with borrowed money to increase exposure. It magnifies gains and losses alike, and can require extra capital in downturns.",
  },
  {
    patterns: [/שורט|מכירה\s+בחסר/i, /short\s+selling|short\s+sale|\bshort(?:ing)?\b/i],
    heLabel: "מכירה בחסר (שורט)",
    enLabel: "Short selling",
    he: "מכירה בחסר היא הימור על ירידת מחיר: שואלים מניה, מוכרים אותה ומקווים לקנותה בחזרה בזול. ההפסד אינו מוגבל תאורטית, כי מחיר יכול לעלות בלי גבול.",
    en: "Short selling bets on a price drop: you borrow a share, sell it, and hope to buy it back cheaper. Losses are theoretically unlimited because a price can rise without bound.",
  },
  {
    patterns: [/פקודת\s+שוק|הוראת\s+שוק/i, /market\s+order/i],
    heLabel: "פקודת שוק",
    enLabel: "Market order",
    he: "פקודת שוק מבצעת קנייה או מכירה מיידית במחיר הזמין הטוב ביותר. הביצוע מובטח כמעט תמיד, אבל המחיר עלול לסטות בשוק תנודתי.",
    en: "A market order buys or sells immediately at the best available price. Execution is nearly guaranteed, but the price can slip in a volatile market.",
  },
  {
    patterns: [/פקודת\s+לימיט|הוראת\s+לימיט|לימיט/i, /limit\s+order/i],
    heLabel: "פקודת לימיט",
    enLabel: "Limit order",
    he: "פקודת לימיט קובעת מחיר מקסימלי לקנייה או מינימלי למכירה. היא שולטת במחיר, אבל אינה מבטיחה ביצוע אם השוק לא מגיע למחיר.",
    en: "A limit order sets a maximum buy price or minimum sell price. It controls the price but does not guarantee execution if the market never reaches it.",
  },
  {
    patterns: [/מרווח|ספרד|ספְרֵאד/i, /\bspread\b|bid[ -]ask/i],
    heLabel: "מרווח (ספרד)",
    enLabel: "Spread",
    he: "המרווח הוא הפער בין מחיר הקנייה (ask) למחיר המכירה (bid) ברגע נתון. מרווח רחב הוא עלות מסחר נסתרת, בעיקר בנכסים דלי מסחר.",
    en: "The spread is the gap between the buy (ask) and sell (bid) prices at a moment. A wide spread is a hidden trading cost, especially in thinly traded assets.",
  },
  {
    patterns: [/ברוקר/i, /broker/i],
    heLabel: "ברוקר",
    enLabel: "Broker",
    he: "ברוקר הוא הגוף שדרכו מבצעים פעולות בבורסה. כדאי להשוות עמלות מסחר והמרה, איכות ביצוע, ביטוח על הכסף והשירות.",
    en: "A broker is the firm through which you place trades. Compare trading and FX fees, execution quality, account insurance, and service.",
  },
  {
    patterns: [/מניות\s+חלקיות|שבר\s+מניה/i, /fractional\s+share/i],
    heLabel: "מניות חלקיות",
    enLabel: "Fractional shares",
    he: "מניות חלקיות מאפשרות לקנות חלק ממניה לפי סכום כסף ולא יחידה שלמה. לא כל ברוקר מציע זאת, וזכויות ההצבעה עשויות להיות מוגבלות.",
    en: "Fractional shares let you buy part of a share by dollar amount instead of whole units. Not every broker offers them, and voting rights may be limited.",
  },
  {
    patterns: [/\bdrip\b|השקעה\s+מחדש\s+של\s+דיבידנד/i, /dividend\s+reinvest/i],
    heLabel: "השקעת דיבידנד מחדש (DRIP)",
    enLabel: "DRIP",
    he: "תוכנית DRIP משקיעה דיבידנדים מחדש אוטומטית ברכישת מניות נוספות, מה שמאיץ את אפקט הריבית דריבית. בישראל המס על הדיבידנד חל גם כשהוא מושקע מחדש.",
    en: "A DRIP automatically reinvests dividends into more shares, accelerating compounding. Dividend tax generally still applies even when reinvested.",
  },
  {
    patterns: [/יום\s+האקס|תאריך\s+אקס/i, /ex[ -]dividend/i],
    heLabel: "יום האקס",
    enLabel: "Ex-dividend date",
    he: "יום האקס הוא היום שממנו קונה המניה כבר אינו זכאי לדיבידנד הקרוב. מחיר המניה בדרך כלל יורד באותו יום בערך בגובה הדיבידנד.",
    en: "The ex-dividend date is the first day a buyer no longer receives the upcoming dividend. The share price usually drops that day by roughly the dividend amount.",
  },
  {
    patterns: [/תשואה\s+כוללת/i, /total\s+return/i],
    heLabel: "תשואה כוללת",
    enLabel: "Total return",
    he: "תשואה כוללת כוללת גם שינוי מחיר וגם דיבידנדים שהושקעו מחדש. מדד כמו S&P 500 במחירים בלבד נראה חלש יותר ממדד התשואה הכוללת שלו.",
    en: "Total return includes both price change and reinvested dividends. A price-only index like the S&P 500 looks weaker than its total-return version.",
  },
  {
    patterns: [/תשואה\s+ריאלית|תשואה\s+נומינלית|ריאלי|נומינלי/i, /real\s+return|nominal\s+return/i],
    heLabel: "תשואה נומינלית מול ריאלית",
    enLabel: "Nominal vs real return",
    he: "תשואה נומינלית היא השינוי במספרים, ותשואה ריאלית מנכה אינפלציה ומשקפת את כוח הקנייה האמיתי. תשואה של 5% עם אינפלציה של 3% היא תשואה ריאלית של כ-2%.",
    en: "Nominal return is the raw percentage change; real return subtracts inflation and reflects true purchasing power. A 5% return with 3% inflation is about 2% real.",
  },
  {
    patterns: [/מס\s+רווחי\s+הון|מס\s+רווח\s+הון/i, /capital\s+gains\s+tax/i],
    heLabel: "מס רווחי הון",
    enLabel: "Capital gains tax",
    he: "מס רווחי הון חל על הרווח ממכירת נכס. בישראל השיעור לרוב המשקיעים בניירות ערך סחירים הוא בדרך כלל 25% על הרווח הריאלי, אך יש חריגים, פטורים ושינויי חוק - ודיבידנדים וריבית ממוסים אחרת. זו הסברה כללית, לא ייעוץ מס.",
    en: "Capital gains tax applies to profit from selling an asset. In Israel, most investors in listed securities generally pay 25% on the real gain, with exceptions, exemptions, and law changes; dividends and interest are taxed differently. This is general education, not tax advice.",
  },
  {
    patterns: [/רווח\s+הון/i, /capital\s+gain/i],
    heLabel: "רווח הון",
    enLabel: "Capital gain",
    he: "רווח הון הוא ההפרש בין מחיר המכירה למחיר הקנייה של נכס. הוא מתממש רק במכירה, וברוב המדינות חייב במס בשיעור שתלוי בחוק המקומי ובנסיבות.",
    en: "A capital gain is the difference between an asset's sale and purchase price. It is realized only on sale, and most countries tax it at a rate that depends on local law and circumstances.",
  },
  
  {
    patterns: [/פנסיה|קרן\s+פנסיה/i, /pension/i],
    heLabel: "פנסיה",
    enLabel: "Pension",
    he: "קרן פנסיה היא חיסכון פרטני להכנסה בפרישה, עם הטבות מס בהפקדה. כדאי לבדוק דמי ניהול, מסלול השקעה, וכיסויים ביטוחיים נלווים.",
    en: "A pension fund is long-term retirement saving with tax benefits on contributions. Check management fees, the investment track, and bundled insurance coverage.",
  },
  {
    patterns: [/קרן\s+השתלמות/i, /keren\s+hishtalmut/i],
    heLabel: "קרן השתלמות",
    enLabel: "Keren Hishtalmut",
    he: "קרן השתלמות היא חיסכון ישראלי עם פטור ממס רווחי הון עד תקרה, שנזיל לאחר שש שנים. היא נחשבת אחד הכלי היעילים בישראל לחיסכון בינוני-ארוך.",
    en: "Keren Hishtalmut is an Israeli savings vehicle with a capital-gains tax exemption up to a cap, liquid after six years. It is considered one of Israel's most tax-efficient medium-term savings tools.",
  },
  {
    patterns: [/קופת\s+גמל|קופ״ג/i],
    heLabel: "קופת גמל",
    enLabel: "Kupat Gemel",
    he: "קופת גמל היא חיסכון פנסיוני ישראלי גמיש יותר מקרן פנסיה. ההפקדה מוגבלת בתקרות, והמשיכה החד-פעמית כפופה לכללי מס שמשתנים מדי פעם.",
    en: "Kupat Gemel is an Israeli retirement savings vehicle more flexible than a pension fund. Contributions are capped, and lump-sum withdrawals follow tax rules that change over time.",
  },
  {
    patterns: [/קרן\s+חירום|קופת\s+חירום/i, /emergency\s+fund/i],
    heLabel: "קרן חירום",
    enLabel: "Emergency fund",
    he: "קרן חירום היא מזומן נזיל שמכסה הוצאות של 3-6 חודשים לאירועים לא מתוכננים. היא באה לפני השקעה בשוק, כדי שלא יאלצו למכור בהפסד ברגע רע.",
    en: "An emergency fund is liquid cash covering 3-6 months of expenses for unplanned events. It comes before market investing, so you are never forced to sell at a bad time.",
  },
  {
    patterns: [/הקצאת\s+נכסים/i, /asset\s+allocation/i],
    heLabel: "הקצאת נכסים",
    enLabel: "Asset allocation",
    he: "הקצאת נכסים היא חלוקת התיק בין מניות, אג\"ח, מזומן ונכסים אחרים. היא קובעת את רמת הסיכון והתשואה הצפויה יותר מכל בחירת נייר בודד.",
    en: "Asset allocation is how a portfolio splits across stocks, bonds, cash, and other assets. It drives risk and expected return more than any single security choice.",
  },
  {
    patterns: [/איזון\s+(?:מחדש\s+)?של\s+תיק|איזון\s+תיק|ריבלאנס/i, /\brebalanc/i],
    heLabel: "איזון תיק",
    enLabel: "Rebalancing",
    he: "איזון תיק הוא החזרת ההקצאה ליעד המקורי, למשל מכירת חלק ממה שעלה וקניית מה שירד. מבצעים אותו במועד קבוע או כשהסטייה מהיעד גדולה.",
    en: "Rebalancing returns a portfolio to its target allocation - selling part of what rose and buying what fell. It is done on a schedule or when drift from target is large.",
  },
  {
    patterns: [/מיצוע\s+עלויות|מיצוע/i, /dollar.?cost\s+averag|\bdca\b/i],
    heLabel: "מיצוע עלויות (DCA)",
    enLabel: "Dollar-cost averaging",
    he: "מיצוע עלויות הוא השקעת סכום קבוע במרווחי זמן קבועים. כך קונים יותר יחידות כשהמחיר נמוך ופחות כשהוא גבוה, בלי לנסות לתזמן את השוק.",
    en: "Dollar-cost averaging means investing a fixed amount on a regular schedule. You buy more units when prices are lower and fewer when they are higher, without trying to time the market.",
  },
  {
    patterns: [/קנה\s+והחזק/i, /buy\s+and\s+hold/i],
    heLabel: "קנה והחזק",
    enLabel: "Buy and hold",
    he: "קנה והחזק היא אסטרטגיה של החזקת השקעות לאורך שנים בלי ניסיון לתזמן יציאה וכניסה. היא מפחיתה עלויות ומסים, אבל דורשת סבלנות בתקופות ירידות.",
    en: "Buy and hold means keeping investments for years without trying to time exits and entries. It cuts costs and taxes, but demands patience through downturns.",
  },
  {
    patterns: [/סכום\s+חד[\s-]?פעמי|לומפ\s*סאם/i, /lump\s+sum/i],
    heLabel: "השקעה חד-פעמית",
    enLabel: "Lump sum",
    he: "השקעה חד-פעמית מכניסה את כל הסכום לשוק בבת אחת, ומיצוע מפזר את הכניסה לאורך זמן. היסטורית סכום חד-פעמי ניצח ברוב התקופות, אבל מיצוע נוח יותר פסיכולוגית בירידות.",
    en: "A lump sum invests the whole amount at once, while dollar-cost averaging spreads entry over time. Historically lump sum won in most periods, but averaging is psychologically easier in downturns.",
  },
  {
    patterns: [/השקעה\s+פסיבית|השקעה\s+אקטיבית|פסיבי|אקטיבי/i, /passive\s+invest|active\s+invest/i],
    heLabel: "פסיבי מול אקטיבי",
    enLabel: "Passive vs active",
    he: "השקעה פסיבית עוקבת אחרי מדד בעלות נמוכה; אקטיבית מנסה להכות את השוק בבחירת ניירות. רוב הקרנות האקטיביות לא מכות את המדד לאורך זמן אחרי עמלות.",
    en: "Passive investing tracks an index at low cost; active investing tries to beat the market by picking securities. Most active funds underperform their index over time after fees.",
  },
  {
    patterns: [/קרן\s+גידור/i, /hedge\s+fund/i],
    heLabel: "קרן גידור",
    enLabel: "Hedge fund",
    he: "קרן גידור היא קרן פרטית למשקיעים מוסדיים ועשירים, עם אסטרטגיות גמישות כולל מינוף ושורט. העמלות גבוהות והנזילות נמוכה.",
    en: "A hedge fund is a private fund for institutions and wealthy investors, using flexible strategies including leverage and shorting. Fees are high and liquidity is low.",
  },
  {
    patterns: [/\brit\b|קרן\s+ריט|נדל"ן\s+סחיר/i, /\breit/i],
    heLabel: "קרן ריט (REIT)",
    enLabel: "REIT",
    he: "קרן ריט משקיעה בנדל\"ן מניב ומחלקת את רוב הרווחים כדיבידנד. היא מאפשרת חשיפה לנדל\"ן בלי לקנות נכס, אבל רגישה לריבית.",
    en: "A REIT invests in income-producing real estate and distributes most profits as dividends. It offers real-estate exposure without buying property, but is rate-sensitive.",
  },
  {
    patterns: [/אופצי/i, /\boption(?:s)?\b/i],
    heLabel: "אופציות",
    enLabel: "Options",
    he: "אופציה היא זכות, לא חובה, לקנות (call) או למכור (put) נכס במחיר קבוע עד תאריך מסוים. היא יכולה לשמש לגידור או לספקולציה, וערכה מתכלה עם הזמן.",
    en: "An option is the right, not the obligation, to buy (call) or sell (put) an asset at a set price by a set date. It can hedge or speculate, and its value decays with time.",
  },
  {
    patterns: [/חוזים\s+עתידיים|חוזה\s+עתידי/i, /\bfutures?\b/i],
    heLabel: "חוזים עתידיים",
    enLabel: "Futures",
    he: "חוזה עתידי הוא התחייבות לקנות או למכור נכס במחיר קבוע במועד עתידי. הוא כרוך במינוף גבוה ומתאים בעיקר לסוחרים מקצועיים.",
    en: "A futures contract is a commitment to buy or sell an asset at a set price on a future date. It involves high leverage and suits mostly professional traders.",
  },
  {
    patterns: [/מק["״]?מ/i, /treasury\s+bill|t[ -]bill/i],
    heLabel: "מק\"מ",
    enLabel: "T-bill",
    he: "מק\"מ היא איגרת חוב ממשלתית לטווח קצר (עד שנה) הנסחרת בישראל. היא נחשבת כמעט חסרת סיכון אשראי, ומשמשת חניה למזומן.",
    en: "T-bills (makam in Israel) are short-term government debt up to one year. They are nearly free of credit risk and serve as a parking place for cash.",
  },
  {
    patterns: [/קופון/i, /coupon/i],
    heLabel: "קופון",
    enLabel: "Coupon",
    he: "קופון הוא תשלום הריבית הקבועה שאיגרת חוב משלמת למחזיקיה. תשואת האג\"ח האמיתית תלויה גם במחיר ששילמת עליה ביחס לערך הנקוב.",
    en: "A coupon is the fixed interest payment a bond pays its holders. A bond's true yield also depends on the price you paid relative to face value.",
  },
  {
    patterns: [/פדיון|מועד\s+פירעון/i, /maturity/i],
    heLabel: "פדיון",
    enLabel: "Maturity",
    he: "מועד פדיון הוא התאריך שבו איגרת חוב מחזירה את הקרן. ככל שהפדיון רחוק יותר, מחיר האג\"ח רגיש יותר לשינויי ריבית.",
    en: "Maturity is the date a bond repays its principal. The longer the maturity, the more the bond's price reacts to interest-rate changes.",
  },
  {
    patterns: [/דירוג\s+אשראי/i, /credit\s+rating/i],
    heLabel: "דירוג אשראי",
    enLabel: "Credit rating",
    he: "דירוג אשראי הוא הערכה של חברות כמו S&P ו-Moody's ליכולת מנפיק להחזיר חוב, מ-AAA ומטה. דירוג נמוך פירושו תשואה גבוהה יותר וסיכון גבוה יותר.",
    en: "A credit rating is an assessment by firms like S&P and Moody's of an issuer's ability to repay debt, from AAA down. Lower ratings mean higher yields and higher risk.",
  },
  {
    patterns: [/\bבטא\b|\bbeta\b/i],
    heLabel: "בטא",
    enLabel: "Beta",
    he: "בטא מודד כמה מניה נעה ביחס לשוק: בטא 1.5 פירושה שהיא נוטה לזוז פי 1.5 מהמדד. היא מודדת תנודתיות יחסית, לא סיכוי להפסד.",
    en: "Beta measures how much a stock moves relative to the market: a beta of 1.5 means it tends to move 1.5x the index. It measures relative volatility, not the chance of loss.",
  },
  {
    patterns: [/ירידה\s+מהשיא|דראו\s*דאון/i, /drawdown/i],
    heLabel: "ירידה מהשיא (Drawdown)",
    enLabel: "Drawdown",
    he: "ירידה מהשיא (drawdown) היא הפער באחוזים בין שיא התיק לשפל הבא. ירידה של 50% דורשת עלייה של 100% רק כדי לחזור לנקודת הפתיחה.",
    en: "A drawdown is the percentage drop from a portfolio's peak to its next trough. A 50% loss needs a 100% gain just to get back to even.",
  },
  
  {
    patterns: [/רכישה\s+עצמית|ריי?באק/i, /buyback|share\s+repurchase/i],
    heLabel: "רכישה עצמית",
    enLabel: "Buyback",
    he: "רכישה עצמית היא קניית מניות של החברה בידי החברה עצמה, מה שמקטין את מספר המניות ומגדיל את חלקו של כל בעל מניות. היא מחזירה ערך כמו דיבידנד, אבל בלי אירוע מס מיידי למשקיע.",
    en: "A buyback is a company repurchasing its own shares, shrinking the share count and raising each holder's stake. It returns value like a dividend, but without an immediate tax event for the investor.",
  },
  {
    patterns: [/סיבולת\s+סיכון|סיכון\s+שלי/i, /risk\s+tolerance|risk\s+appetite/i],
    heLabel: "סיבולת סיכון",
    enLabel: "Risk tolerance",
    he: "סיבולת סיכון היא היכולת הכלכלית והרגשית לספוג ירידות בלי למכור בפאניקה. תיק תואם סיבולת הוא כזה שאפשר לישון איתו בלילה גם בירידות.",
    en: "Risk tolerance is your financial and emotional capacity to absorb losses without panic-selling. A matching portfolio is one you can hold through downturns.",
  },
  {
    patterns: [/אופק\s+השקעה|אופק\s+זמן/i, /time\s+horizon|investment\s+horizon/i],
    heLabel: "אופק השקעה",
    enLabel: "Time horizon",
    he: "אופק ההשקעה הוא הזמן עד שצריכים את הכסף. אופק ארוך מאפשר יותר מניות כי יש זמן להתאושש מירידות; כסף לטווח קצר לא מקומו בשוק המניות.",
    en: "The time horizon is how long until you need the money. A long horizon allows more stocks since there is time to recover; short-term money does not belong in the stock market.",
  },
  {
    patterns: [/כלל\s+(?:ה[\s-]?)?4\s*%|כלל\s+ארבעת\s+האחוזים/i, /4%\s+rule|safe\s+withdrawal/i],
    heLabel: "כלל ה-4%",
    enLabel: "The 4% rule",
    he: "כלל ה-4% הוא כלל אצבע מחקרי: משיכה שנתית של 4% מהתיק בפרישה, מתואמת לאינפלציה, הכילה היסטורית תיק ל-30 שנה. הוא הנחה גסה, לא הבטחה, ותלוי בסדר התשואות.",
    en: "The 4% rule is a research heuristic: withdrawing 4% of a portfolio yearly in retirement, inflation-adjusted, historically lasted 30 years. It is a rough guide, not a guarantee, and depends on the sequence of returns.",
  },
  {
    patterns: [/כלל\s+(?:ה[\s-]?)?72/i, /rule\s+of\s+72/i],
    heLabel: "כלל ה-72",
    enLabel: "Rule of 72",
    he: "כלל ה-72 הוא קירוב מהיר: מחלקים 72 בשיעור התשואה השנתי ומקבלים בכמה שנים הכסף מוכפל. ב-8% לשנה זה כ-9 שנים.",
    en: "The rule of 72 is a quick estimate: divide 72 by the annual return rate to get the years needed to double money. At 8% a year that is about 9 years.",
  },
  {
    patterns: [/משכנתא/i, /mortgage/i],
    heLabel: "משכנתא",
    enLabel: "Mortgage",
    he: "משכנתא היא הלוואה לרכישת דירה, בדרך כלל ל-20-30 שנה, שמחולקת למסלולים (פריים, קבועה צמודה, משתנה). כדאי להשוות ריביות ומסלולים ולבדוק את סך ההחזר, לא רק את ההחזר החודשי.",
    en: "A mortgage is a home loan, usually over 20-30 years, split into tracks (prime-linked, fixed CPI-linked, variable). Compare rates and tracks and look at total repayment, not just the monthly payment.",
  },
  {
    patterns: [/שפיצר|סילוקין/i, /amortiz/i],
    heLabel: "לוח שפיצר",
    enLabel: "Amortization",
    he: "לוח שפיצר הוא מסלול החזר הלוואה בהחזר חודשי קבוע: בהתחלה רוב התשלום הוא ריבית, ובסוף רובו קרן. בסילוקין הקרן קבועה וההחזר יורד עם הזמן.",
    en: "An amortization (Shpitzer) schedule repays a loan in equal monthly payments: early payments are mostly interest, later ones mostly principal. In equal-principal (Sillukin) the principal is fixed and payments fall over time.",
  },
  {
    patterns: [/שער\s+חליפין|שער\s+המטבע|המרת\s+מטבע|מט["״]?ח/i, /exchange\s+rate|\bfx\b|currency\s+conversion/i],
    heLabel: "שער חליפין",
    enLabel: "Exchange rate",
    he: "שער חליפין הוא מחיר מטבע אחד במטבע אחר, והוא משתנה כל הזמן. המרה בברוקר או בבנק כוללת בדרך כלל מרווח ועמלה מעבר לשער הרציף.",
    en: "An exchange rate is the price of one currency in another, moving constantly. Converting at a broker or bank usually adds a spread and fee on top of the mid-market rate.",
  },
  {
    patterns: [/גידור/i, /\bhedg/i],
    heLabel: "גידור",
    enLabel: "Hedging",
    he: "גידור הוא פעולה שמקטינה סיכון קיים, למשל ביטוח חשיפת מטבע או מניות בעזרת נגזרים. הוא עולה כסף ומקטין גם את הפוטנציאל לרווח.",
    en: "Hedging reduces an existing risk, such as insuring currency or stock exposure with derivatives. It costs money and also trims upside.",
  },
  {
    patterns: [/צמוד\s+מדד|צמודה\s+למדד/i, /inflation[ -]linked|\btips\b/i],
    heLabel: "צמוד מדד",
    enLabel: "Inflation-linked",
    he: "נכס צמוד מדד מתאים את ערכו לאינפלציה, כמו אג\"ח צמודות או חלק ממסלולי המשכנתא. הוא מגן על כוח הקנייה, אבל במסלול משכנתא הקרן עצמה גדלה עם המדד.",
    en: "An inflation-linked asset adjusts its value with inflation, like CPI-linked bonds or some mortgage tracks. It protects purchasing power, but a CPI-linked mortgage's principal grows with the index.",
  },
  {
    patterns: [/צ['׳]?יפ\s+כחול|שבב\s+כחול/i, /blue[ -]chip/i],
    heLabel: "מניות צ'יפ כחול",
    enLabel: "Blue chip",
    he: "מניות צ'יפ כחול הן מניות של חברות גדולות, ותיקות ויציבות יחסית, כמו אלה במדדים המובילים. הן נחשבות סולידיות יותר, אבל גם הן יכולות לרדת.",
    en: "Blue-chip stocks are shares of large, established, relatively stable companies, such as those in leading indexes. They are considered sturdier, but they can still fall.",
  },
  {
    patterns: [/מניית\s+צמיחה/i, /growth\s+stock/i],
    heLabel: "מניית צמיחה",
    enLabel: "Growth stock",
    he: "מניית צמיחה היא של חברה שצומחת מהר ונסחרת במכפילים גבוהים על בסיס ציפיות עתידיות. היא רגישה מאוד לאכזבות ולשינויי ריבית.",
    en: "A growth stock belongs to a fast-growing company trading at high multiples on future expectations. It is very sensitive to disappointments and rate changes.",
  },
  {
    patterns: [/מניית\s+ערך/i, /value\s+stock/i],
    heLabel: "מניית ערך",
    enLabel: "Value stock",
    he: "מניית ערך נסחרת במכפילים נמוכים יחסית לרווחים או לנכסים. הרעיון הוא שהמחיר זול ביחס לשווי, אבל לפעמים הזליגה מוצדקת כי העסק בצרה.",
    en: "A value stock trades at low multiples relative to earnings or assets. The idea is that the price is cheap versus worth, but sometimes cheap is justified because the business is troubled.",
  },
  {
    patterns: [/\bnav\b|שווי\s+נכסי/i, /net\s+asset\s+value/i],
    heLabel: "שווי נכסי (NAV)",
    enLabel: "NAV",
    he: "שווי נכסי (NAV) הוא שווי נכסי הקרן פחות התחייבויותיה, חלקי מספר היחידות. קרן סל יכולה לסחור בפרמיה או בהנחה קטנה ביחס ל-NAV.",
    en: "Net asset value (NAV) is a fund's assets minus liabilities, divided by units. An ETF can trade at a small premium or discount to NAV.",
  },
  {
    patterns: [/סקטור/i, /\bsector\b/i],
    heLabel: "סקטור",
    enLabel: "Sector",
    he: "סקטור הוא קבוצת חברות מאותו תחום, כמו טכנולוגיה או אנרגיה. ריכוז בסקטור אחד מגדיל סיכון, ולכן מודדים פיזור גם בין סקטורים.",
    en: "A sector is a group of companies in the same field, like technology or energy. Concentrating in one sector raises risk, so diversification is measured across sectors too.",
  },
  {
    patterns: [/פיקדון|פק["״]?מ/i, /\bcd\b|certificate\s+of\s+deposit|deposit\s+rate/i],
    heLabel: "פיקדון",
    enLabel: "Deposit / CD",
    he: "פיקדון בנקאי נועל כסף לתקופה בריבית ידועה מראש, עם סיכון נמוך מאוד. החסרון: נזילות מוגבלת ותשואה שלרוב נמוכה מהשוק לטווח ארוך.",
    en: "A bank deposit or CD locks money for a term at a known rate, with very low risk. The trade-off: limited liquidity and returns usually below the market over the long run.",
  },
];




export function explainFinancialConcept(message: string, language: ConversationLanguage): string | null {
  const concept = CONCEPTS.find((entry) => entry.patterns.some((pattern) => pattern.test(message)));
  if (!concept) return null;
  return language === "en" ? concept.en : concept.he;
}

const DIFFERENCE_MARKER =
  /difference\s+between|מה\s+ההבדל|מה\s+השוני|הבדל\s+בין|\bvs\.?\b|versus|מול/i;

function findMatchingConcepts(message: string): ConceptEntry[] {
  return CONCEPTS.filter((entry) => entry.patterns.some((pattern) => pattern.test(message)));
}

/**
 * Broader concept lookup: answers "what is the difference between X and Y"
 * by explaining both concepts with labels, otherwise explains the first
 * matching concept. Used by the copilot instead of the single-concept lookup.
 */
export function explainFinancialConcepts(message: string, language: ConversationLanguage): string | null {
  const matches = findMatchingConcepts(message);
  if (matches.length === 0) return null;
  if (matches.length >= 2 && DIFFERENCE_MARKER.test(message)) {
    const en = language === "en";
    const [first, second] = matches;
    return en
      ? `${first.enLabel}: ${first.en} ${second.enLabel}: ${second.en}`
      : `${first.heLabel}: ${first.he} ${second.heLabel}: ${second.he}`;
  }
  return language === "en" ? matches[0].en : matches[0].he;
}


// ---------------------------------------------------------------------------
// Special-question detectors (tricky-question honesty)
//
// Free-form chats attract prediction requests ("will TSLA go up tomorrow?")
// and guarantee requests ("a safe investment with high returns"). Both are
// detected here so the copilot can answer honestly instead of implying an
// answer it cannot support.
// ---------------------------------------------------------------------------

const PREDICTION_RE =
  /\bwill\b.*\b(go up|rise|rally|fall|drop|crash|go down|recover)\b|\bpredict\b|\bforecast\b|\bprice target\b|תחזית|יעלה|יירד|ירד\?|מה\s+יהיה|מה\s+תהיה|צפוי\s+ל/i;

export function isPredictionQuestion(message: string): boolean {
  return PREDICTION_RE.test(message);
}

const GUARANTEE_RE =
  /\bguarantee(?:d|s)?\b|\brisk[ -]?free\b|safe.{0,20}high.{0,10}return|מובטח|בטוח.{0,20}תשואה|תשואה.{0,20}מובטחת|תבטיח(?:י)?|הבטח(?:י)?|בלי\s+סיכון|ללא\s+סיכון/i;

export function isGuaranteeQuestion(message: string): boolean {
  return GUARANTEE_RE.test(message);
}

const HOLDING_PATTERNS = [
  /(?:^|[\s,(])([\d,.]+)\s+([A-Z][A-Z0-9.-]{0,9})\s+(?:shares?|units?|מניות|יחידות)\b/i,
  /(?:יש\s+לי|מחזיק(?:ה)?(?:\s+ב)?)\s*([\d,.]+)\s*(?:מניות|יחידות)(?:\s*(?:(?:של|ב)[-\s]*)?([A-Z][A-Z0-9.-]{0,9}))?/i,
  /([\d,.]+)\s*(?:מניות|יחידות)\s*(?:של|ב)?\s*([A-Z][A-Z0-9.-]{0,9})/i,
  /(?:i\s+(?:have|own|hold)|my)\s*([\d,.]+)\s*(?:shares?|units?)\s*(?:of|in)?\s*([A-Z][A-Z0-9.-]{0,9})?/i,
  /([\d,.]+)\s*(?:shares?|units?)\s*(?:of|in)?\s*([A-Z][A-Z0-9.-]{0,9})/i,
];

const HOLDING_SYMBOL_STOPWORDS = new Set(["AT", "THE", "OF", "IN", "ON", "AN", "TO", "A"]);

export function parseHoldingRequest(message: string): HoldingRequest | null {
  for (const pattern of HOLDING_PATTERNS) {
    const match = message.match(pattern);
    if (!match) continue;
    if (match[2] && HOLDING_SYMBOL_STOPWORDS.has(match[2].toUpperCase())) continue;
    const quantity = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000_000) return null;
    return { quantity, symbol: match[2] ? match[2].toUpperCase().replace(/\.+$/, "") : null };
  }
  return null;
}

export function valueHolding(request: HoldingRequest, asset: AssetAnalysis | undefined): HoldingValuation {
  const symbol = request.symbol ?? asset?.symbol ?? "";
  if (!asset) return { quantity: request.quantity, symbol, price: 0, currency: null, total: 0, dataSource: "mock", freshness: "unavailable", timestamp: null, available: false, reason: "unavailable" };
  if (asset.isMock || asset.freshness === "simulated") return { quantity: request.quantity, symbol: asset.symbol, price: asset.price, currency: asset.currency ?? null, total: 0, dataSource: asset.dataSource, freshness: asset.freshness, timestamp: asset.timestamp ?? null, available: false, reason: "simulated" };
  return { quantity: request.quantity, symbol: asset.symbol, price: asset.price, currency: asset.currency ?? null, total: request.quantity * asset.price, dataSource: asset.dataSource, freshness: asset.freshness, timestamp: asset.timestamp ?? null, available: true, reason: null };
}

export interface PurchasePowerRequest {
  amount: number;
  sourceCurrency: "ILS" | "USD" | "EUR" | "GBP";
  symbol: string;
}

export interface PurchasePowerResult extends PurchasePowerRequest {
  available: boolean;
  assetPrice: number | null;
  assetCurrency: string | null;
  fxSymbol: string | null;
  fxRate: number | null;
  convertedBudget: number | null;
  wholeShares: number | null;
  residualAssetCurrency: number | null;
  residualSourceCurrency: number | null;
  asset: AssetAnalysis | null;
  fx: AssetAnalysis | null;
  reason: "market_unavailable" | "unsupported_currency_pair" | null;
}

const PURCHASE_PATTERNS = [
  // Statement-first: "יש לי 10,000 דולר, כמה מניות של VOO אפשר לקנות?"
  /(?:יש\s+לי|עם)\s*(?<amount>[\d,.]+)\s*(?<multiplier>אלף|מיליון)?\s*(?<currency>שקל|ש["״']?ח|ILS|NIS|דולר|USD|יורו|EUR|פאונד|GBP).*?(?:כמה|how many).*?(?:מניות|יחידות|shares?|units?).*?(?<symbol>[A-Z][A-Z0-9.-]{0,9})/i,
  /(?:i\s+have|with)\s*(?<amount>[\d,.]+)\s*(?<multiplier>thousand|million)?\s*(?<currency>ILS|NIS|USD|dollars?|EUR|euros?|GBP|pounds?).*?(?:how many).*?(?:shares?|units?).*?(?<symbol>[A-Z][A-Z0-9.-]{0,9})/i,
  // Question-first: "כמה מניות של VOO אפשר לקנות ב-10,000 דולר?"
  /כמה\s*(?:מניות|יחידות)\s*(?:של|ב)\s*(?<symbol>[A-Z][A-Z0-9.-]{0,9})\s*.*?(?:לקנות|אקנה|קונה)\s*(?:ב|עם|באמצעות)?\s*[-–—]?\s*(?<amount>[\d,.]+)\s*(?<multiplier>אלף|מיליון)?\s*(?<currency>שקלים|שקל|ש["״']?ח|₪|ILS|NIS|דולרים|דולר|USD|יורו|EUR|פאונד|GBP)/i,
  // Question-first English: "how many VOO shares can I buy with $10,000?"
  /how\s+many\s+(?:(?:shares?|units?)\s+(?:of\s+)?)?(?<symbol>[A-Z][A-Z0-9.-]{0,9})\s+(?:(?:shares?|units?)\s+)?(?:can|could)\s+(?:i|we)\s+(?:buy|get|afford)\s+(?:with|for)\s*\$?\s*(?<amount>[\d,.]+)\s*(?<multiplier>thousand|million)?\s*(?<currency>ILS|NIS|USD|dollars?|EUR|euros?|GBP|pounds?)?/i,
];

function currencyCode(raw: string): PurchasePowerRequest["sourceCurrency"] | null {
  if (/שקל|ש["״']?ח|ILS|NIS/i.test(raw)) return "ILS";
  if (/דולר|USD|dollars?|\$/i.test(raw)) return "USD";
  if (/יורו|EUR|euros?/i.test(raw)) return "EUR";
  if (/פאונד|GBP|pounds?/i.test(raw)) return "GBP";
  return null;
}

const PURCHASE_SYMBOL_STOPWORDS = new Set(["AT", "THE", "OF", "IN", "ON", "AN", "TO", "A", "I", "CAN", "HOW", "MANY", "BUY", "WITH", "FOR"]);

export function parsePurchasePowerRequest(message: string): PurchasePowerRequest | null {
  for (const pattern of PURCHASE_PATTERNS) {
    const match = message.match(pattern);
    if (!match?.groups) continue;
    const rawSymbol = match.groups.symbol?.toUpperCase().replace(/\.+$/, "") ?? "";
    if (!rawSymbol || PURCHASE_SYMBOL_STOPWORDS.has(rawSymbol)) continue;
    const multiplierRaw = match.groups.multiplier ?? "";
    const multiplier = /אלף|thousand/i.test(multiplierRaw) ? 1_000 : /מיליון|million/i.test(multiplierRaw) ? 1_000_000 : 1;
    const amount = Number((match.groups.amount ?? "").replace(/,/g, "")) * multiplier;
    // A bare "$" in the matched text counts as USD; otherwise a currency word is required.
    const currencyRaw = match.groups.currency ?? (/\$\s*\d|\d[\d,.]*\s*\$/.test(match[0]) ? "USD" : "");
    const sourceCurrency = currencyCode(currencyRaw);
    if (!sourceCurrency || !Number.isFinite(amount) || amount <= 0) return null;
    return { amount, sourceCurrency, symbol: rawSymbol };
  }
  return null;
}

export function fxSymbolFor(source: string, target: string): { symbol: string; divide: boolean } | null {
  if (source === target) return { symbol: "", divide: false };
  if (target === "USD" && ["ILS", "EUR", "GBP"].includes(source)) return { symbol: `USD${source}=X`, divide: true };
  if (source === "USD" && ["ILS", "EUR", "GBP"].includes(target)) return { symbol: `USD${target}=X`, divide: false };
  return null;
}

export function calculatePurchasePower(request: PurchasePowerRequest, asset: AssetAnalysis | undefined, fx: AssetAnalysis | undefined): PurchasePowerResult {
  const target = asset?.currency ?? null;
  const pair = target ? fxSymbolFor(request.sourceCurrency, target) : null;
  const realAsset = asset && !asset.isMock && asset.freshness !== "simulated";
  const needsFx = request.sourceCurrency !== target;
  const realFx = !needsFx || (fx && !fx.isMock && fx.freshness !== "simulated" && fx.price > 0);
  if (!realAsset || !pair || !realFx) return { ...request, available: false, assetPrice: asset?.price ?? null, assetCurrency: target, fxSymbol: pair?.symbol ?? null, fxRate: fx?.price ?? null, convertedBudget: null, wholeShares: null, residualAssetCurrency: null, residualSourceCurrency: null, asset: asset ?? null, fx: fx ?? null, reason: pair ? "market_unavailable" : "unsupported_currency_pair" };
  const convertedBudget = needsFx ? (pair.divide ? request.amount / fx!.price : request.amount * fx!.price) : request.amount;
  const wholeShares = Math.floor(convertedBudget / asset!.price);
  const residualAssetCurrency = convertedBudget - wholeShares * asset!.price;
  const residualSourceCurrency = needsFx ? (pair.divide ? residualAssetCurrency * fx!.price : residualAssetCurrency / fx!.price) : residualAssetCurrency;
  return { ...request, available: true, assetPrice: asset!.price, assetCurrency: target, fxSymbol: pair.symbol || null, fxRate: needsFx ? fx!.price : 1, convertedBudget, wholeShares, residualAssetCurrency, residualSourceCurrency, asset: asset!, fx: needsFx ? fx! : null, reason: null };
}
