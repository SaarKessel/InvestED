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

import { EXTRA_CONCEPTS } from "./conceptExplanations";

const BASE_CONCEPTS: ConceptEntry[] = [
  {
    patterns: [/קרן\s+נאמנות/i, /mutual\s+fund/i],
    heLabel: "קרן נאמנות",
    enLabel: "Mutual fund",
    he: "קרן נאמנות אוספת כסף מהרבה אנשים ומשקיעה אותו יחד לפי תוכנית קבועה. אתם מחזיקים יחידות בקרן, לא את המניות עצמן. בודקים במה היא משקיעה, כמה היא מסוכנת, מה דמי הניהול וכמה קל למכור.",
    en: "A mutual fund collects money from many people and invests it together, following a set plan. You own units of the fund, not the individual shares. Check what it invests in, its risk, its fees and how easily you can sell.",
  },
  {
    patterns: [/\betf\b/i, /קרן\s+סל/i, /תעודת\s+סל/i],
    heLabel: "קרן סל (ETF)",
    enLabel: "ETF",
    he: "קרן סל (ETF) היא סל של הרבה השקעות שקונים כפריט אחד בבורסה. רוב הקרנות האלה עוקבות אחרי מדד. קנייה אחת מפזרת את הכסף על הרבה השקעות. היא עדיין יכולה לרדת בערכה, והיא גובה דמי ניהול שנתיים.",
    en: "An ETF is a basket of many investments that you buy as one item on the stock exchange. Most ETFs follow an index. One purchase spreads your money over many investments. It can still lose value, and it charges a yearly fee.",
  },
  {
    patterns: [/קרן\s+מדד|קרן\s+עוקבת\s+מדד/i, /index\s+fund/i],
    heLabel: "קרן מדד",
    enLabel: "Index fund",
    he: "קרן מחקה מדד מעתיקה מדד שוק, כמו S&P 500, ולא מנסה לנצח אותו. היא זולה ומפזרת את הכסף רחב. היא גם יורדת כשהמדד יורד.",
    en: "An index fund copies a market index, such as the S&P 500, instead of trying to beat it. It is cheap and spreads your money widely. It also falls when the index falls.",
  },
  {
    patterns: [/אג["״']?ח|אגרת\s+חוב|איגרת\s+חוב/i, /\bbond(?:s)?\b/i],
    heLabel: "איגרת חוב",
    enLabel: "Bond",
    he: "אג״ח היא הלוואה שאתם נותנים למדינה או לחברה. הם מבטיחים לשלם לכם ריבית ולהחזיר את הכסף במועד קבוע. גם אג״ח יכולה לרדת בערכה. המנפיק עלול לא לשלם, ועליית ריבית יכולה להוריד את המחיר.",
    en: "A bond is a loan you give to a government or a company. They promise to pay you interest and give the money back on a set date. Bonds can lose value too. The issuer might not pay, or rising interest rates can push the price down.",
  },
  {
    patterns: [/ריבית\s+דריבית/i, /compound(?:ing|ed)?\s+interest/i],
    heLabel: "ריבית דריבית",
    enLabel: "Compound interest",
    he: "ריבית דריבית אומרת שמרוויחים תשואה גם על התשואה. הכסף גדל מהר יותר ככל שמשאירים אותו זמן רב יותר. תשואות אמיתיות בשוק לא מובטחות, אז כל מספר הוא רק דוגמה.",
    en: "Compound interest means you earn returns on your returns. Your money grows faster the longer you leave it. Real market returns are not guaranteed, so treat any number as an example.",
  },
  {
    patterns: [/שווי\s+שוק/i, /market\s+cap(?:italization)?/i],
    heLabel: "שווי שוק",
    enLabel: "Market cap",
    he: "שווי שוק הוא מחיר מניה אחת כפול מספר המניות. הוא מראה כמה החברה גדולה בבורסה. הוא לא המחיר ההוגן של החברה.",
    en: "Market cap is the price of one share times the number of shares. It shows how big a company is on the stock exchange. It is not the fair price of the company.",
  },
  {
    patterns: [/תשואת\s+דיבידנד/i, /dividend\s+yield/i],
    heLabel: "תשואת דיבידנד",
    enLabel: "Dividend yield",
    he: "תשואת דיבידנד היא הדיבידנד השנתי חלקי מחיר המניה, באחוזים. תשואה גבוהה יכולה לבוא גם מכך שהמחיר ירד. כדאי לבדוק שהחברה יכולה להמשיך לשלם.",
    en: "Dividend yield is the yearly dividend divided by the share price, as a percent. A high yield can also mean the price fell. Check that the company can keep paying.",
  },
  {
    patterns: [/דיבידנד/i, /\bdividend(?:s)?\b/i],
    heLabel: "דיבידנד",
    enLabel: "Dividend",
    he: "דיבידנד הוא תשלום שחברה מעבירה לבעלי המניות שלה מהרווח. הוא לא מובטח, והחברה יכולה לשנות אותו. מחיר המניה בדרך כלל יורד בערך בסכום הזה אחרי יום התשלום.",
    en: "A dividend is a payment a company makes to its shareholders from its profit. It is not guaranteed, and the company can change it. The share price usually drops by about that amount after the payment date.",
  },
  {
    patterns: [/מכפיל\s+רווח/i, /\bp\/?e\b|price[ -]to[ -]earnings/i],
    heLabel: "מכפיל רווח",
    enLabel: "P/E ratio",
    he: "מכפיל רווח (P/E) הוא מחיר המניה חלקי הרווח למניה. הוא עוזר להשוות חברות ברמה בסיסית. הוא לא מספיק לבדו כדי להחליט.",
    en: "The P/E ratio is the share price divided by the profit per share. It helps compare companies at a basic level. It is not enough on its own to decide anything.",
  },
  {
    patterns: [/רווח\s+למניה/i, /\beps\b|earnings\s+per\s+share/i],
    heLabel: "רווח למניה (EPS)",
    enLabel: "EPS",
    he: "רווח למניה (EPS) הוא הרווח של חברה חלקי מספר המניות שלה. הוא הבסיס למכפיל הרווח. פריטים חד-פעמיים יכולים לעוות אותו.",
    en: "Earnings per share (EPS) is a company's profit divided by its number of shares. It is the base of the P/E ratio. One-time items can distort it.",
  },
  {
    patterns: [/דמי\s+ניהול|יחס\s+הוצאות/i, /expense\s+ratio|management\s+fee/i],
    heLabel: "דמי ניהול",
    enLabel: "Expense ratio",
    he: "דמי ניהול הם המחיר השנתי שקרן גובה מהכסף שלכם. הפרש קטן מצטבר לאורך שנים רבות. משווים את העלות יחד עם מה שהקרן משקיעה בו ועד כמה היא עוקבת טוב.",
    en: "Management fees are the yearly price a fund charges, taken from your money. A small difference adds up over many years. Compare the fee together with what the fund invests in and how well it tracks.",
  },
  {
    patterns: [/תנודתיות/i, /volatil(?:ity|e)/i],
    heLabel: "תנודתיות",
    enLabel: "Volatility",
    he: "תנודתיות היא כמה המחיר זז למעלה ולמטה. תנודתיות גבוהה אומרת טווח תוצאות רחב יותר, לטובה או לרעה. זה לא אומר תשואה גבוהה יותר.",
    en: "Volatility is how much a price moves up and down. High volatility means a bigger range of results, good or bad. It does not mean a higher return.",
  },
  {
    patterns: [/\brsi\b/i],
    heLabel: "RSI",
    enLabel: "RSI",
    he: "RSI הוא מספר בין 0 ל-100 שמשווה עליות אחרונות לירידות אחרונות. הוא מתאר את העבר. הוא לא תחזית ולא הוראת קנייה או מכירה.",
    en: "RSI is a number from 0 to 100 that compares recent rises with recent falls. It describes the past. It is not a forecast and not a buy or sell order.",
  },
  {
    patterns: [/פיזור/i, /diversif(?:ication|y)/i],
    heLabel: "פיזור",
    enLabel: "Diversification",
    he: "פיזור אומר לא לשים את כל הכסף במקום אחד. אם השקעה אחת יורדת, האחרות יכולות לרכך את המכה. זה לא מונע הפסדים, אבל אירוע רע אחד פוגע פחות.",
    en: "Diversification means not putting all your money in one place. If one investment falls, the others can soften the hit. It does not stop losses, but it makes one bad event hurt less.",
  },
  {
    patterns: [/פיצול\s+מניה|פיצול/i, /stock\s+split|\bsplit\b/i],
    heLabel: "פיצול מניה",
    enLabel: "Stock split",
    he: "פיצול מניה חותך כל מניה לכמה מניות במחיר נמוך יותר. בפיצול 1:10, מניה של 1,000 הופכת ל-10 מניות של 100. הערך הכולל שלכם לא משתנה מהפיצול.",
    en: "A stock split cuts each share into several shares at a lower price. In a 10-for-1 split, one $1,000 share becomes ten $100 shares. Your total value does not change from the split.",
  },
  {
    patterns: [/(?:what\s+is|what's|explain)\s+(?:the\s+)?(?:stock|capital)\s+market|(?:מה\s+זה|מהו|הסבר)\s+(?:ה)?שוק\s+ההון|(?:מה\s+זה|מהו)\s+שוק\s+המניות/i],
    heLabel: "שוק ההון",
    enLabel: "Stock market",
    he: "שוק ההון הוא המקום שבו קונים ומוכרים מניות ואג״ח. המחירים נקבעים לפי ביקוש והיצע. בישראל הבורסה המרכזית היא הבורסה לניירות ערך בתל אביב. אפשר להרוויח בו וגם להפסיד.",
    en: "The stock market is where people buy and sell shares and bonds. Prices move with supply and demand. In Israel the main exchange is the Tel Aviv Stock Exchange. You can gain there and you can lose.",
  },
  {
    patterns: [/(?<![א-ת])מניה(?![א-ת])|מניות/i, /\bstock(?:s)?\b|\bshare(?:s)?\b/i],
    heLabel: "מניה",
    enLabel: "Stock",
    he: "מניה היא חלק קטן מהבעלות על חברה. המחיר שלה עולה ויורד לפי קונים ומוכרים. אפשר להרוויח מעליית מחיר ומדיבידנדים. אפשר גם להפסיד, עד כל הסכום.",
    en: "A stock is a small piece of ownership in a company. Its price goes up and down with buyers and sellers. You can earn from a rising price and from dividends. You can also lose money, up to the whole amount.",
  },
  {
    patterns: [/(?<!צמוד\s)(?<!צמודה\sל)(?<![א-ת])מדד(?![א-ת])/i, /\bindex\b|indices/i],
    heLabel: "מדד",
    enLabel: "Index",
    he: "מדד הוא מספר שעוקב אחרי קבוצת מניות, כמו S&P 500 או תל אביב 35. אי אפשר לקנות מדד ישירות. משקיעים דרך קרנות שעוקבות אחריו.",
    en: "An index is a number that follows a group of shares, such as the S&P 500 or the TA-35. You cannot buy an index directly. You invest through funds that follow it.",
  },
  {
    patterns: [/\bipo\b|הנפקה\s+ראשונית|הנפקה/i, /initial\s+public\s+offering/i],
    heLabel: "הנפקה (IPO)",
    enLabel: "IPO",
    he: "הנפקה ראשונה (IPO) היא כשחברה מוכרת את המניות שלה לציבור בפעם הראשונה. מניות חדשות יכולות לזוז הרבה בימים הראשונים.",
    en: "An IPO (initial public offering) is when a company sells its shares to the public for the first time. New shares can swing a lot in the first days.",
  },
  {
    patterns: [/אינפלציה/i, /inflation/i],
    heLabel: "אינפלציה",
    enLabel: "Inflation",
    he: "אינפלציה אומרת שהמחירים עולים עם הזמן, אז אותו כסף קונה פחות. כדי שהכסף באמת יגדל, התשואה צריכה להיות גבוהה מהאינפלציה.",
    en: "Inflation means prices go up over time, so the same money buys less. To really grow your money, your return has to be higher than inflation.",
  },
  {
    patterns: [/ריבית(?!.*דריבית)/i, /interest\s+rate/i],
    heLabel: "ריבית",
    enLabel: "Interest rate",
    he: "ריבית היא המחיר של כסף. זה מה שלווה משלם, או מה שחוסך מרוויח. כשהריבית משתנה, משתנים גם מחירי אג״ח, משכנתאות ופיקדונות.",
    en: "An interest rate is the price of money. It is what a borrower pays, or what a saver earns. When rates change, bond prices, mortgages and savings deposits change too.",
  },
  {
    patterns: [/נזילות/i, /liquidity|liquid/i],
    heLabel: "נזילות",
    enLabel: "Liquidity",
    he: "נזילות היא כמה מהר אפשר להפוך משהו למזומן בלי להפסיד מערכו. מזומן ומניות גדולות נזילים. נדל״ן והחזקות פרטיות פחות.",
    en: "Liquidity is how fast you can turn something into cash without losing value. Cash and big stocks are liquid. Real estate and private holdings are less liquid.",
  },
  {
    patterns: [/שוק\s+שורי/i, /bull\s+market/i],
    heLabel: "שוק שורי",
    enLabel: "Bull market",
    he: "שוק שורי הוא תקופה ארוכה של עליות מחירים. אנשים אופטימיים. הוא לא נמשך לנצח, אז מתכננים גם לירידות.",
    en: "A bull market is a long stretch of rising prices. People feel optimistic. It does not last forever, so plan for the drops too.",
  },
  {
    patterns: [/שוק\s+דובי/i, /bear\s+market/i],
    heLabel: "שוק דובי",
    enLabel: "Bear market",
    he: "שוק דובי הוא ירידה ארוכה במחירים, בדרך כלל 20% ויותר מהשיא. ירידות כאלה הן חלק רגיל מהשוק. כמה זמן אתם יכולים לחכות קובע כמה הן חשובות.",
    en: "A bear market is a long fall in prices, usually 20% or more from the top. Falls like this are a normal part of markets. How long you can wait decides how much they matter.",
  },
  {
    patterns: [/מינוף/i, /leverage/i],
    heLabel: "מינוף",
    enLabel: "Leverage",
    he: "מינוף הוא השקעה בכסף שאול. הוא מגדיל רווחים וגם הפסדים. בירידה ייתכן שתצטרכו להוסיף כסף.",
    en: "Leverage means investing with borrowed money. It makes gains bigger and losses bigger too. In a fall you may need to add more money.",
  },
  {
    patterns: [/שורט|מכירה\s+בחסר/i, /short\s+selling|short\s+sale|\bshort(?:ing)?\b/i],
    heLabel: "מכירה בחסר (שורט)",
    enLabel: "Short selling",
    he: "מכירה בחסר היא הימור שמחיר יירד. שואלים מניה, מוכרים אותה ומקווים לקנות אותה בחזרה בזול. ההפסד יכול להיות בלי גבול, כי מחיר יכול להמשיך לעלות.",
    en: "Short selling is a bet that a price will fall. You borrow a share, sell it, and hope to buy it back cheaper. The loss can be unlimited, because a price can keep rising.",
  },
  {
    patterns: [/פקודת\s+שוק|הוראת\s+שוק/i, /market\s+order/i],
    heLabel: "פקודת שוק",
    enLabel: "Market order",
    he: "פקודת שוק קונה או מוכרת עכשיו במחיר הטוב ביותר שמוצע. כמעט תמיד היא מתבצעת, אבל המחיר יכול לזוז לפני כן.",
    en: "A market order buys or sells right now at the best price on offer. It almost always goes through, but the price can move before it does.",
  },
  {
    patterns: [/פקודת\s+לימיט|הוראת\s+לימיט|לימיט/i, /limit\s+order/i],
    heLabel: "פקודת לימיט",
    enLabel: "Limit order",
    he: "פקודת לימיט קובעת את המחיר הגבוה ביותר שתשלמו או הנמוך ביותר שתקבלו. אתם שולטים במחיר. היא עלולה לא להתבצע אם השוק לא מגיע אליו.",
    en: "A limit order sets the highest price you will pay or the lowest price you will accept. You control the price. It may not go through if the market never gets there.",
  },
  {
    patterns: [/מרווח|ספרד|ספְרֵאד/i, /\bspread\b|bid[ -]ask/i],
    heLabel: "מרווח (ספרד)",
    enLabel: "Spread",
    he: "המרווח הוא הפער בין מחיר הקנייה למחיר המכירה. פער רחב הוא עלות נסתרת, בעיקר בדברים שמעט אנשים סוחרים בהם.",
    en: "The spread is the gap between the price to buy and the price to sell. A wide gap is a hidden cost, especially for things that few people trade.",
  },
  {
    patterns: [/ברוקר/i, /broker/i],
    heLabel: "ברוקר",
    enLabel: "Broker",
    he: "ברוקר הוא החברה שדרכה קונים ומוכרים השקעות. משווים עמלות מסחר, עמלות המרת מטבע, איכות ביצוע, הגנה על הכסף ושירות.",
    en: "A broker is the company you use to buy and sell investments. Compare trading fees, currency fees, how well orders run, protection for your money, and service.",
  },
  {
    patterns: [/מניות\s+חלקיות|שבר\s+מניה/i, /fractional\s+share/i],
    heLabel: "מניות חלקיות",
    enLabel: "Fractional shares",
    he: "מניות חלקיות מאפשרות לקנות חלק ממניה בסכום כסף קבוע. לא כל ברוקר מציע זאת. זכויות ההצבעה שלכם עשויות להיות מוגבלות.",
    en: "Fractional shares let you buy part of a share for a set amount of money. Not every broker offers it. Your voting rights may be limited.",
  },
  {
    patterns: [/\bdrip\b|השקעה\s+מחדש\s+של\s+דיבידנד/i, /dividend\s+reinvest/i],
    heLabel: "השקעת דיבידנד מחדש (DRIP)",
    enLabel: "DRIP",
    he: "תוכנית DRIP קונה בדיבידנדים שלכם מניות נוספות אוטומטית. זה מאיץ את ריבית הדריבית. המס על הדיבידנד בדרך כלל עדיין חל.",
    en: "A DRIP uses your dividends to buy more shares automatically. That speeds up compounding. Tax on the dividend usually still applies.",
  },
  {
    patterns: [/יום\s+האקס|תאריך\s+אקס/i, /ex[ -]dividend/i],
    heLabel: "יום האקס",
    enLabel: "Ex-dividend date",
    he: "יום האקס הוא היום הראשון שבו קונה חדש לא מקבל את הדיבידנד הקרוב. מחיר המניה בדרך כלל יורד באותו יום בערך בסכום הדיבידנד.",
    en: "The ex-dividend date is the first day a new buyer does not get the next dividend. The share price usually drops that day by about the dividend amount.",
  },
  {
    patterns: [/תשואה\s+כוללת/i, /total\s+return/i],
    heLabel: "תשואה כוללת",
    enLabel: "Total return",
    he: "תשואה כוללת סופרת את שינוי המחיר ואת הדיבידנדים שהושקעו מחדש. מדד שמציג מחיר בלבד, כמו S&P 500, נראה חלש יותר מגרסת התשואה הכוללת שלו.",
    en: "Total return counts the price change and the dividends you reinvested. An index that shows price only, like the S&P 500, looks weaker than its total-return version.",
  },
  {
    patterns: [/תשואה\s+ריאלית|תשואה\s+נומינלית|ריאלי|נומינלי/i, /real\s+return|nominal\s+return/i],
    heLabel: "תשואה נומינלית מול ריאלית",
    enLabel: "Nominal vs real return",
    he: "תשואה נומינלית היא השינוי באחוזים כמו שהוא. תשואה ריאלית מורידה את האינפלציה, ולכן מראה כמה אפשר באמת לקנות. תשואה של 5% עם אינפלציה של 3% היא כ-2% ריאלית.",
    en: "Nominal return is the plain percent change. Real return takes inflation off, so it shows what you can really buy. A 5% return with 3% inflation is about 2% real.",
  },
  {
    patterns: [/מס\s+רווחי\s+הון|מס\s+רווח\s+הון/i, /capital\s+gains\s+tax/i],
    heLabel: "מס רווחי הון",
    enLabel: "Capital gains tax",
    he: "מס רווחי הון הוא מס על הרווח כשמוכרים השקעה. בישראל, רוב מי שמוכר מניות וקרנות סחירות משלם 25% על הרווח הריאלי, אחרי אינפלציה. יש חריגים ופטורים, והחוק יכול להשתנות. דיבידנדים וריבית ממוסים אחרת. זה הסבר כללי, לא ייעוץ מס.",
    en: "Capital gains tax is tax on the profit when you sell an investment. In Israel, most people who sell listed shares and funds pay 25% on the real profit, after inflation. There are exceptions and exemptions, and the law can change. Dividends and interest are taxed differently. This is general education, not tax advice.",
  },
  {
    patterns: [/רווח\s+הון/i, /capital\s+gain/i],
    heLabel: "רווח הון",
    enLabel: "Capital gain",
    he: "רווח הון הוא הרווח כשמוכרים ביותר ממה ששילמתם. הוא נחשב רק כשמוכרים. ברוב המדינות הוא ממוסה, והשיעור תלוי בחוק המקומי.",
    en: "A capital gain is the profit when you sell for more than you paid. It counts only when you sell. Most countries tax it, and the rate depends on local law.",
  },
  
  {
    patterns: [/פנסיה|קרן\s+פנסיה/i, /pension/i],
    heLabel: "פנסיה",
    enLabel: "Pension",
    he: "קרן פנסיה היא חיסכון ארוך לפרישה. יש הטבת מס על מה שמפקידים. כדאי לבדוק שלושה דברים: דמי הניהול, מסלול ההשקעה, וביטוח שמגיע יחד איתה.",
    en: "A pension fund is long-term saving for your retirement. You get a tax benefit on what you put in. Check three things: the management fee, the investment track, and any insurance that comes bundled with it.",
  },
  {
    patterns: [/קרן\s+השתלמות/i, /keren\s+hishtalmut/i],
    heLabel: "קרן השתלמות",
    enLabel: "Keren Hishtalmut",
    he: "קרן השתלמות היא קרן חיסכון ישראלית. הרווחים פטורים ממס רווחי הון עד תקרה, ואפשר למשוך את הכסף אחרי שש שנים. היא נחשבת לאחת הדרכים הכי משתלמות במס לחיסכון לטווח בינוני בישראל.",
    en: "Keren Hishtalmut is an Israeli savings fund. Profits are free of capital gains tax up to a limit, and you can take the money out after six years. It is seen as one of the most tax-friendly ways to save for the medium term in Israel.",
  },
  {
    patterns: [/קופת\s+גמל|קופ״ג/i, /provident\s+fund|kupat\s+gemel/i],
    heLabel: "קופת גמל",
    enLabel: "Kupat Gemel",
    he: "קופת גמל היא חיסכון ישראלי גמיש יותר מקרן פנסיה. יש תקרה להפקדה בשנה. משיכה חד-פעמית כפופה לכללי מס שמשתנים מדי פעם.",
    en: "A provident fund (kupat gemel) is Israeli saving that is more flexible than a pension fund. There is a yearly limit on deposits. Taking out a lump sum follows tax rules that change from time to time.",
  },
  {
    patterns: [/קרן\s+חירום|קופת\s+חירום/i, /emergency\s+fund/i],
    heLabel: "קרן חירום",
    enLabel: "Emergency fund",
    he: "קרן חירום היא מזומן שאפשר להגיע אליו מהר, מספיק ל-3 עד 6 חודשי הוצאות. היא נועדה להפתעות. בונים אותה לפני שמשקיעים, כדי שלא תצטרכו למכור ברגע גרוע.",
    en: "An emergency fund is cash you can reach fast, enough for 3 to 6 months of spending. It is for surprises. Build it before you invest, so you never have to sell at a bad time.",
  },
  {
    patterns: [/הקצאת\s+נכסים/i, /asset\s+allocation/i],
    heLabel: "הקצאת נכסים",
    enLabel: "Asset allocation",
    he: "הקצאת נכסים היא איך מחלקים את הכסף בין מניות, אג״ח, מזומן ודברים אחרים. היא משפיעה על הסיכון ועל התשואה הצפויה יותר מכל בחירה בודדת.",
    en: "Asset allocation is how you split your money between stocks, bonds, cash and other things. It affects your risk and your expected return more than any single pick.",
  },
  {
    patterns: [/איזון\s+(?:מחדש\s+)?של\s+תיק|איזון\s+תיק|ריבלאנס/i, /\brebalanc/i],
    heLabel: "איזון תיק",
    enLabel: "Rebalancing",
    he: "איזון מחדש אומר להחזיר את ההשקעות לחלוקה המקורית שלהן. למשל, מוכרים חלק ממה שעלה וקונים ממה שירד. אפשר לעשות זאת בתאריך קבוע, או כשהחלוקה זזה רחוק מהתוכנית.",
    en: "Rebalancing means putting your investments back to your original mix. For example, you sell some of what went up and buy what went down. You can do it on a set date, or when the mix has moved far from your plan.",
  },
  {
    patterns: [/מיצוע\s+עלויות|מיצוע|ממוצע\s+עלות(?:\s+דולרית)?/i, /dollar.?cost\s+averag|\bdca\b/i],
    heLabel: "מיצוע עלויות (DCA)",
    enLabel: "Dollar-cost averaging",
    he: "ממוצע עלות דולרית אומר להשקיע אותו סכום בקביעות, למשל כל חודש. קונים יותר כשהמחיר נמוך ופחות כשהוא גבוה. לא צריך לנחש מה היום הכי טוב לקנות.",
    en: "Dollar-cost averaging means investing the same amount on a regular schedule, for example every month. You buy more when prices are low and less when they are high. You do not have to guess the best day to buy.",
  },
  {
    patterns: [/קנה\s+והחזק/i, /buy\s+and\s+hold/i],
    heLabel: "קנה והחזק",
    enLabel: "Buy and hold",
    he: "קנה והחזק אומר להחזיק השקעות שנים ולא לנסות לנחש מתי הכי טוב להיכנס או לצאת. זה מוריד עלויות ומסים. זה דורש סבלנות כשהמחירים יורדים.",
    en: "Buy and hold means keeping your investments for years and not trying to guess the best time to get in or out. It lowers costs and taxes. It takes patience when prices fall.",
  },
  {
    patterns: [/סכום\s+חד[\s-]?פעמי|לומפ\s*סאם/i, /lump\s+sum/i],
    heLabel: "השקעה חד-פעמית",
    enLabel: "Lump sum",
    he: "השקעה חד-פעמית היא להכניס את כל הכסף בבת אחת. ממוצע עלות דולרית מכניס אותו קצת בכל פעם. ברוב התקופות בעבר ההשקעה החד-פעמית הצליחה יותר, אבל להתקדם לאט יכול להרגיש קל יותר כשהמחירים יורדים.",
    en: "A lump sum means putting in all the money at once. Dollar-cost averaging puts it in a bit at a time. In most past periods the lump sum did better, but going slowly can feel easier when prices fall.",
  },
  {
    patterns: [/השקעה\s+פסיבית|השקעה\s+אקטיבית|פסיבי|אקטיבי/i, /passive\s+invest|active\s+invest/i],
    heLabel: "פסיבי מול אקטיבי",
    enLabel: "Passive vs active",
    he: "השקעה פסיבית עוקבת אחרי מדד בעלות נמוכה. השקעה אקטיבית מנסה לנצח את השוק בבחירת מניות. אחרי דמי ניהול, רוב הקרנות האקטיביות מפגרות אחרי המדד לאורך זמן.",
    en: "Passive investing follows an index at low cost. Active investing tries to beat the market by picking shares. After fees, most active funds do worse than their index over time.",
  },
  {
    patterns: [/קרן\s+גידור/i, /hedge\s+fund/i],
    heLabel: "קרן גידור",
    enLabel: "Hedge fund",
    he: "קרן גידור היא קרן פרטית למוסדות גדולים ולמשקיעים עשירים. היא משתמשת בשיטות גמישות, כולל הלוואות ומכירה בחסר. הדמי ניהול גבוהים וקשה למשוך כסף.",
    en: "A hedge fund is a private fund for big institutions and rich investors. It uses flexible methods, including borrowing and short selling. Fees are high and it is hard to take money out.",
  },
  {
    patterns: [/\brit\b|קרן\s+ריט|נדל"ן\s+סחיר/i, /\breit/i],
    heLabel: "קרן ריט (REIT)",
    enLabel: "REIT",
    he: "קרן ריט היא קרן שמחזיקה נדל״ן שמניב שכירות, ומחלקת את רוב הרווח כדיבידנד. מקבלים חשיפה לנדל״ן בלי לקנות נכס. היא רגישה לשינויי ריבית.",
    en: "A REIT is a fund that owns real estate that earns rent, and pays out most of its profit as dividends. You get real estate without buying a property. It reacts to interest rates.",
  },
  {
    patterns: [/אופצי/i, /\boption(?:s)?\b/i],
    heLabel: "אופציות",
    enLabel: "Options",
    he: "אופציה היא זכות, לא חובה, לקנות (call) או למכור (put) משהו במחיר קבוע עד תאריך מסוים. משתמשים בה להגנה או לספקולציה. הערך שלה מצטמצם ככל שהזמן עובר.",
    en: "An option is a right, not a duty, to buy (call) or sell (put) something at a set price by a set date. People use it to protect or to speculate. Its value shrinks as time passes.",
  },
  {
    patterns: [/חוזים\s+עתידיים|חוזה\s+עתידי/i, /\bfutures?\b/i],
    heLabel: "חוזים עתידיים",
    enLabel: "Futures",
    he: "חוזה עתידי הוא התחייבות לקנות או למכור משהו במחיר קבוע בתאריך עתידי קבוע. הוא כולל הרבה מינוף ומתאים בעיקר לסוחרים מקצועיים.",
    en: "A futures contract is a promise to buy or sell something at a set price on a set future date. It uses a lot of borrowing and mostly suits professional traders.",
  },
  {
    patterns: [/מק["״]?מ/i, /treasury\s+bill|t[ -]bill/i],
    heLabel: "מק\"מ",
    enLabel: "T-bill",
    he: "מק״מ הוא הלוואה קצרה למדינה, עד שנה. הסיכוי שלא ישלמו קטן מאוד. הרבה אנשים משתמשים בו כדי לחנות מזומן.",
    en: "A T-bill (makam in Israel) is a short loan to the government, up to one year. The chance of not being paid is very small. Many people use it to park cash.",
  },
  {
    patterns: [/קופון/i, /coupon/i],
    heLabel: "קופון",
    enLabel: "Coupon",
    he: "קופון הוא הריבית הקבועה שאג״ח משלמת לבעליה. התשואה האמיתית של האג״ח תלויה גם במחיר ששילמתם עליה לעומת הערך הנקוב.",
    en: "A coupon is the fixed interest a bond pays its owner. The bond's real yield also depends on the price you paid compared with its face value.",
  },
  {
    patterns: [/פדיון|מועד\s+פירעון/i, /maturity/i],
    heLabel: "פדיון",
    enLabel: "Maturity",
    he: "מועד פדיון הוא התאריך שבו אג״ח מחזירה את הכסף שהלוויתם. ככל שהוא רחוק יותר, מחיר האג״ח מגיב יותר לשינויי ריבית.",
    en: "Maturity is the date a bond pays back the money you lent. The further away it is, the more the bond's price reacts when interest rates change.",
  },
  {
    patterns: [/דירוג\s+אשראי/i, /credit\s+rating/i],
    heLabel: "דירוג אשראי",
    enLabel: "Credit rating",
    he: "דירוג אשראי הוא ציון מחברות כמו S&P ו-Moody's לכמה סביר שלווה יחזיר, מ-AAA ומטה. ציון נמוך אומר תשואה גבוהה יותר וסיכון גבוה יותר.",
    en: "A credit rating is a grade from firms like S&P and Moody's for how likely a borrower is to pay back, from AAA downward. A lower grade means a higher yield and a higher risk.",
  },
  {
    patterns: [/(?<![א-ת])בטא(?![א-ת])|\bbeta\b/i],
    heLabel: "בטא",
    enLabel: "Beta",
    he: "בטא מראה כמה מניה זזה לעומת השוק. בטא 1.5 אומרת שהיא נוטה לזוז פי 1.5 מהמדד. היא מודדת כמה הדרך משובשת, לא את הסיכוי להפסד.",
    en: "Beta shows how much a stock moves compared with the market. A beta of 1.5 means it tends to move 1.5 times as much as the index. It measures how bumpy the ride is, not the chance of loss.",
  },
  {
    patterns: [/ירידה\s+מהשיא|דראו\s*דאון/i, /drawdown/i],
    heLabel: "ירידה מהשיא (Drawdown)",
    enLabel: "Drawdown",
    he: "ירידה מהשיא (drawdown) היא הירידה באחוזים מהערך הגבוה ביותר שלכם לנמוך הבא. הפסד של 50% דורש עלייה של 100% רק כדי לחזור לנקודת ההתחלה.",
    en: "A drawdown is the drop in percent from your highest value to the next lowest. A 50% loss needs a 100% gain just to get back to even.",
  },
  
  {
    patterns: [/רכישה\s+עצמית|ריי?באק/i, /buyback|share\s+repurchase/i],
    heLabel: "רכישה עצמית",
    enLabel: "Buyback",
    he: "רכישה עצמית היא כשחברה קונה בחזרה מניות שלה. נשארות פחות מניות, כך שכל מניה היא פרוסה גדולה יותר. זה מחזיר ערך כמו דיבידנד, אבל אין מס עד שמוכרים.",
    en: "A buyback is when a company buys its own shares. There are fewer shares left, so each share is a bigger slice. It gives value back like a dividend, but you pay no tax until you sell.",
  },
  {
    patterns: [/סיבולת\s+סיכון|סיכון\s+שלי/i, /risk\s+tolerance|risk\s+appetite/i],
    heLabel: "סיבולת סיכון",
    enLabel: "Risk tolerance",
    he: "סיבולת סיכון היא כמה הפסד אתם יכולים לשאת, בכסף וברגש, בלי למכור בפאניקה. חלוקה מתאימה היא כזו שאפשר להחזיק גם בירידות.",
    en: "Risk tolerance is how much loss you can handle, in your money and in your feelings, without selling in a panic. A fitting mix is one you can keep through the falls.",
  },
  {
    patterns: [/אופק\s+השקעה|אופק\s+זמן/i, /time\s+horizon|investment\s+horizon/i],
    heLabel: "אופק השקעה",
    enLabel: "Time horizon",
    he: "אופק ההשקעה הוא הזמן עד שתצטרכו את הכסף. אופק ארוך משאיר זמן להתאושש, ולכן אפשר להחזיק יותר מניות. כסף שתצטרכו בקרוב לא שייך למניות.",
    en: "Your time horizon is how long until you need the money. A long horizon leaves time to recover, so it can hold more stocks. Money you need soon does not belong in stocks.",
  },
  {
    patterns: [/כלל\s+(?:ה[\s-]?)?4\s*%|כלל\s+ארבעת\s+האחוזים/i, /4%\s+rule|safe\s+withdrawal/i],
    heLabel: "כלל ה-4%",
    enLabel: "The 4% rule",
    he: "כלל ה-4% הוא כלל אצבע ממחקר. בפרישה מושכים 4% מהחיסכון כל שנה ומעלים לפי האינפלציה. בעבר זה החזיק 30 שנה. זו הערכה גסה, לא הבטחה, וסדר התשואות משפיע.",
    en: "The 4% rule is a rule of thumb from research. In retirement you take out 4% of your savings each year and raise it with inflation. In the past that lasted 30 years. It is a rough guide, not a promise, and the order of returns matters.",
  },
  {
    patterns: [/כלל\s+(?:ה[\s-]?)?72/i, /rule\s+of\s+72/i],
    heLabel: "כלל ה-72",
    enLabel: "Rule of 72",
    he: "כלל ה-72 הוא הערכה מהירה. מחלקים 72 בתשואה השנתית ומקבלים בכמה שנים הכסף מוכפל. ב-8% בשנה זה בערך 9 שנים.",
    en: "The rule of 72 is a quick estimate. Divide 72 by the yearly return to get the years it takes to double your money. At 8% a year, that is about 9 years.",
  },
  {
    patterns: [/משכנתא/i, /mortgage/i],
    heLabel: "משכנתא",
    enLabel: "Mortgage",
    he: "משכנתא היא הלוואה לקניית דירה, בדרך כלל ל-20 עד 30 שנה. היא מחולקת למסלולים, כמו פריים, קבועה ומשתנה. משווים בין המסלולים ומסתכלים על הסכום הכולל שתחזירו, לא רק על ההחזר החודשי.",
    en: "A mortgage is a loan to buy a home, usually for 20 to 30 years. It is split into tracks, such as prime, fixed and variable. Compare the tracks and look at the total you will pay back, not only the monthly payment.",
  },
  {
    patterns: [/שפיצר|סילוקין/i, /amortiz/i],
    heLabel: "לוח שפיצר",
    enLabel: "Amortization",
    he: "לוח שפיצר מחזיר הלוואה בהחזר חודשי קבוע. בהתחלה רוב ההחזר הוא ריבית, ובהמשך רובו קרן. בלוח סילוקין חלק הקרן קבוע, ולכן ההחזרים קטנים עם הזמן.",
    en: "A Shpitzer schedule repays a loan with the same payment every month. At first most of it is interest, later most of it is principal. In a Silukin schedule the principal part is fixed, so the payments get smaller over time.",
  },
  {
    patterns: [/שער\s+חליפין|שער\s+המטבע|המרת\s+מטבע|מט["״]?ח/i, /exchange\s+rate|\bfx\b|currency\s+conversion/i],
    heLabel: "שער חליפין",
    enLabel: "Exchange rate",
    he: "שער חליפין הוא המחיר של מטבע אחד במטבע אחר. הוא משתנה כל הזמן. בנק או ברוקר בדרך כלל מוסיפים פער ועמלה מעל השער האמיתי בשוק.",
    en: "An exchange rate is the price of one currency in another currency. It changes all the time. A bank or broker usually adds a gap and a fee on top of the real market rate.",
  },
  {
    patterns: [/גידור/i, /\bhedg/i],
    heLabel: "גידור",
    enLabel: "Hedging",
    he: "גידור הוא הקטנת סיכון שכבר יש לכם, למשל הגנה מפני ירידה במטבע או במניות. הוא עולה כסף, והוא גם מקטין חלק מהרווח האפשרי.",
    en: "Hedging means cutting a risk you already have, for example by protecting against a currency or stock drop. It costs money, and it also cuts some of the possible gain.",
  },
  {
    patterns: [/צמוד\s+מדד|צמודה\s+למדד/i, /inflation[ -]linked|\btips\b/i],
    heLabel: "צמוד מדד",
    enLabel: "Inflation-linked",
    he: "נכס צמוד מדד משנה את ערכו עם האינפלציה, כמו אג״ח צמודות או חלק ממסלולי המשכנתא. הוא מגן על מה שהכסף יכול לקנות. במשכנתא צמודה, החוב שלכם גדל עם המדד.",
    en: "An inflation-linked asset changes its value with inflation, like CPI-linked bonds or some mortgage tracks. It protects what your money can buy. In a CPI-linked mortgage, the amount you owe grows with the index.",
  },
  {
    patterns: [/צ['׳]?יפ\s+כחול|שבב\s+כחול/i, /blue[ -]chip/i],
    heLabel: "מניות צ'יפ כחול",
    enLabel: "Blue chip",
    he: "מניות כחולות (בלו צ'יפ) הן מניות של חברות גדולות, ותיקות ויציבות יחסית, כמו אלה במדדים המובילים. הן נחשבות בטוחות יותר, אבל גם הן יכולות לרדת.",
    en: "Blue-chip stocks are shares in large, established, fairly steady companies, like those in the leading indexes. They are seen as safer, but they can still fall.",
  },
  {
    patterns: [/מניית\s+צמיחה/i, /growth\s+stock/i],
    heLabel: "מניית צמיחה",
    enLabel: "Growth stock",
    he: "מניית צמיחה היא מניה של חברה שצומחת מהר. המחיר שלה גבוה כי מצפים ממנה להרבה. היא יכולה לרדת חזק בחדשות רעות או כשהריבית עולה.",
    en: "A growth stock is a share in a company that grows fast. Its price is high because people expect a lot. It can drop hard on bad news or when interest rates rise.",
  },
  {
    patterns: [/מניית\s+ערך/i, /value\s+stock/i],
    heLabel: "מניית ערך",
    enLabel: "Value stock",
    he: "מניית ערך היא מניה במחיר נמוך ביחס לרווח או למה שהחברה מחזיקה. הרעיון הוא שהיא זולה ביחס לשווי. לפעמים היא זולה מסיבה, כי העסק בצרה.",
    en: "A value stock has a low price compared with its profit or what the company owns. The idea is that it is cheap for what it is worth. Sometimes it is cheap for a reason, because the business is in trouble.",
  },
  {
    patterns: [/\bnav\b|שווי\s+נכסי/i, /net\s+asset\s+value/i],
    heLabel: "שווי נכסי (NAV)",
    enLabel: "NAV",
    he: "שווי נכסי (NAV) הוא מה שהקרן מחזיקה פחות מה שהיא חייבת, חלקי מספר היחידות. קרן סל יכולה להיסחר מעט מעל או מתחת ל-NAV.",
    en: "NAV (net asset value) is what a fund owns minus what it owes, divided by its units. An ETF can trade a little above or below its NAV.",
  },
  {
    patterns: [/סקטור/i, /\bsector\b/i],
    heLabel: "סקטור",
    enLabel: "Sector",
    he: "סקטור הוא קבוצת חברות מאותו תחום, כמו טכנולוגיה או אנרגיה. להשקיע יותר מדי בסקטור אחד מוסיף סיכון, ולכן בודקים פיזור גם בין סקטורים.",
    en: "A sector is a group of companies in the same field, like technology or energy. Putting too much in one sector adds risk, so spreading is also checked across sectors.",
  },
  {
    patterns: [/פיקדון|פק["״]?מ/i, /\bcd\b|certificate\s+of\s+deposit|deposit\s+rate/i],
    heLabel: "פיקדון",
    enLabel: "Deposit / CD",
    he: "פיקדון בנקאי נועל את הכסף לזמן קבוע בריבית שידועה מראש. הסיכון נמוך מאוד. החיסרון הוא שאי אפשר להגיע לכסף בקלות, ולטווח ארוך התשואה בדרך כלל נמוכה מהשוק.",
    en: "A bank deposit locks your money for a set time at a rate you know in advance. The risk is very low. The downside is that you cannot reach the money easily, and over the long run the return is usually lower than the market.",
  },
  {
    patterns: [/(?:what\s+is|what's|explain)\s+(?:the\s+)?s&p\s*500(?!\s*(?:price|level|quote|today|now|index\s+price))|(?:מה\s+זה|מהו|הסבר)\s+(?:ה)?-?s&p\s*500(?!\s*(?:היום|עכשיו|מחיר))/i],
    heLabel: "S&P 500",
    enLabel: "S&P 500",
    he: "S&P 500 הוא מדד שעוקב אחרי כ-500 חברות גדולות הנסחרות בארה״ב. החברות הגדולות יותר משפיעות עליו יותר. אי אפשר לקנות מדד ישירות, אבל יש קרנות וקרנות סל שעוקבות אחריו. גם הוא יורד לפעמים, ועבר אינו הבטחה.",
    en: "The S&P 500 is an index that follows about 500 large companies listed in the US. Bigger companies move it more. You cannot buy an index directly, but there are funds and ETFs that track it. It falls sometimes too, and the past is no promise.",
  },
  {
    patterns: [/robo.?advis/i, /יועץ\s+השקעות\s+אוטומטי|רובו.?אדוויזר|ייעוץ\s+אוטומטי/i],
    heLabel: "יועץ השקעות אוטומטי",
    enLabel: "Robo-advisor",
    he: "יועץ השקעות אוטומטי הוא שירות דיגיטלי שבוחר לך השקעות לפי שאלון קצר, ולרוב שומר לבד על החלוקה. הוא בדרך כלל זול מייעוץ אישי, אבל גובה דמי ניהול והכסף עדיין יכול לאבד מערכו. זה לא ייעוץ אישי של InvestED+‎.",
    en: "A robo-advisor is a digital service that picks your investments from a short questionnaire and usually keeps the mix on track for you. It is often cheaper than a personal adviser, but it still charges fees and your money can still lose value. This is not personal advice from InvestED+.",
  },
  {
    patterns: [/(?:where|how)\s+(?:do\s+i\s+|should\s+i\s+|to\s+)?(?:start|begin)\s*(?:investing)?|getting\s+started\s+(?:with\s+)?invest/i, /(?:מאיפה|איך)\s+(?:ו)?מתחיל(?:ים)?\s*(?:להשקיע)?|איפה\s+מתחיל/i],
    heLabel: "איך מתחילים",
    enLabel: "Where to start",
    he: "כך אפשר להתחיל, כלימוד ולא כייעוץ: 1) קרן חירום של כמה חודשי הוצאות. 2) להבין שלושה דברים: סיכון, דמי ניהול וזמן. 3) לבדוק מה יש לך כבר בפנסיה ובקופת גמל. 4) להשקיע רק כסף שלא תצטרך בקרוב. בלשונית ״התחל ללמוד״ יש מסלול קצר שעובר על זה צעד אחר צעד.",
    en: "A simple way to start, as learning and not advice: 1) Build an emergency fund of a few months of spending. 2) Understand three things: risk, fees and time. 3) Check what you already have in pension and provident funds. 4) Only invest money you will not need soon. The Start Learning page has a short path that walks through this step by step.",
  },
  {
    patterns: [/(?:what\s+is|what's|explain)\s+(?:the\s+)?(?:investment\s+|investing\s+)?risk(?:s)?\b(?!\s+tolerance)/i, /(?:מה\s+זה|מהו|הסבר)\s+סיכון(?:ים)?(?!\s+שלי)/i],
    heLabel: "סיכון",
    enLabel: "Risk",
    he: "סיכון בהשקעות הוא הסיכוי שהתוצאה תהיה שונה ממה שציפית, כולל הפסד. יש כמה סוגים: ירידת מחירים בשוק, אינפלציה, שינוי בריבית, הימור על מעט נכסים וקושי למכור. פיזור וזמן ארוך מקטינים סיכון אבל לא מוחקים אותו. בדרך כלל תשואה גבוהה באה עם סיכון גבוה.",
    en: "Risk in investing is the chance that the result is different from what you expected, including a loss. There are a few kinds: falling market prices, inflation, interest-rate changes, betting on too few assets, and trouble selling. Spreading your money and a long time horizon reduce risk but do not remove it. Higher possible return usually comes with higher risk.",
  },
];

const CONCEPTS: ConceptEntry[] = [...BASE_CONCEPTS, ...EXTRA_CONCEPTS];




/** The stored plain-language answer for a concept, by its English label (used by the concept registry). */
export function conceptAnswerByLabel(enLabel: string, language: ConversationLanguage): string | null {
  const concept = CONCEPTS.find((entry) => entry.enLabel === enLabel);
  if (!concept) return null;
  return language === "en" ? concept.en : concept.he;
}

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
