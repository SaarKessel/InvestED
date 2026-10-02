/** Original InvestED teaching notes, not excerpts, full-book substitutes or model training.
 * A single record feeds the existing registry, explanation and retrieval paths.
 * Practice prompts and cautions are InvestED commentary on the public ideas.
 */
import type { ConceptEntry } from "../concepts/types";
import type { ExtraConcept } from "../../conceptExplanations";
type Bi = { en: string; he: string };
export interface ClassicNote {
  id: string; kind: "economics-model" | "book-synthesis"; title: Bi;
  attribution: Bi; aliases: string[]; category: ConceptEntry["category"]; related: string[];
  idea: Bi; why: Bi; practice: Bi; limits: Bi;
  sources: { label: string; url: string }[];
}
const b = (en: string, he: string): Bi => ({ en, he });
const s = (label: string, url: string) => [{ label, url }];
export const CLASSIC_NOTES: ClassicNote[] = [
{
 id: "markowitz-portfolio", kind: "economics-model", title: b("Markowitz portfolio selection", "בחירת תיק לפי מרקוביץ"),
 attribution: b("Harry Markowitz, economics laureate.", "הארי מרקוביץ, חתן פרס בכלכלה."), aliases: ["Markowitz", "modern portfolio theory", "mean variance", "מרקוביץ", "תורת התיק המודרנית"], category: "portfolio", related: ["diversification", "correlation", "portfolio-optimization"],
 idea: b("Portfolio risk depends on how assets move together, not only on the volatility of each holding.", "סיכון התיק תלוי באופן שבו נכסים נעים יחד, ולא רק בתנודתיות של כל החזקה."),
 why: b("Several holdings can still expose you to the same shock. Spreading money is not always spreading risk.", "גם החזקות שונות יכולות להיפגע מאותו אירוע. חלוקת כסף אינה תמיד פיזור סיכון."),
 practice: b("Compare asset mixes with stated return, volatility and correlation assumptions. Change those assumptions and examine the result again.", "השוו הרכבי נכסים עם הנחות מפורשות לתשואה, תנודתיות ומתאם. שנו את ההנחות ובחנו שוב את התוצאה."),
 limits: b("Estimates can shift sharply. Variance misses some risks, and an efficient frontier depends on its inputs. This is not a ready-made portfolio.", "אומדנים עלולים להשתנות בחדות. שונות אינה מודדת כל סיכון, והחזית היעילה תלויה בנתונים שהוזנו. זה אינו תיק מוכן."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/1990/press-release/"),
},
{
 id: "sharpe-capm", kind: "economics-model", title: b("Sharpe's capital asset pricing model", "מודל תמחור נכסי הון של שארפ"),
 attribution: b("William Sharpe, economics laureate and a leading CAPM contributor. This is different from the Sharpe ratio.", "ויליאם שארפ, חתן פרס בכלכלה ומפתח מרכזי של מודל תמחור נכסי הון. זה אינו יחס שארפ."), aliases: ["William Sharpe", "Sharpe CAPM", "Sharpe's CAPM", "ויליאם שארפ", "מודל שארפ"], category: "analysis", related: ["capm", "beta", "sharpe-ratio"],
 idea: b("CAPM links a required expected return to the risk-free rate plus beta times the expected market risk premium.", "המודל קושר תשואה צפויה נדרשת לריבית חסרת סיכון בתוספת בטא כפול פרמיית הסיכון הצפויה של השוק."),
 why: b("It separates market exposure from risks that diversification may reduce.", "הוא מפריד בין חשיפה לשוק לבין סיכונים שפיזור עשוי לצמצם."),
 practice: b("Use it as a teaching benchmark for a discount rate. State the market, measurement period and premium assumption first.", "השתמשו בו כנקודת ייחוס לימודית לשיעור היוון. ציינו קודם את השוק, תקופת המדידה והנחת הפרמיה."),
 limits: b("Beta is not total risk. The simplified model does not promise a realised return, and the full market portfolio is hard to observe.", "בטא אינה כל הסיכון. המודל המפושט אינו מבטיח תשואה בפועל, וקשה למדוד את תיק השוק המלא."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/1990/press-release/"),
},
{
 id: "prospect-theory", kind: "economics-model", title: b("Prospect theory", "תורת הערך"),
 attribution: b("Daniel Kahneman developed this with Amos Tversky. Kahneman received the economics prize; Tversky did not.", "דניאל כהנמן פיתח את התורה עם עמוס טברסקי. כהנמן קיבל את הפרס בכלכלה; טברסקי לא."), aliases: ["Kahneman", "Tversky", "כהנמן", "טברסקי", "תורת הסיכויים", "שנאת הפסד"], category: "personal", related: ["risk-tolerance", "drawdown", "rebalancing"],
 idea: b("People assess gains and losses against a reference point and may distort probabilities. A loss can feel heavier than a comparable gain.", "אנשים מעריכים רווח והפסד ביחס לנקודת ייחוס ועשויים לעוות הסתברויות. הפסד יכול להרגיש כבד יותר מרווח דומה."),
 why: b("The purchase price or the wording of a choice can influence a decision even when future cash flows have not changed.", "מחיר הקנייה או ניסוח הבחירה יכולים להשפיע על החלטה גם כשהתזרימים העתידיים לא השתנו."),
 practice: b("Describe the same choice as both gains and losses. Write down what evidence would change your view before emotions take over.", "תארו אותה החלטה במונחי רווח וגם הפסד. כתבו מראש איזה מידע ישנה את דעתכם, לפני שהרגש משתלט."),
 limits: b("This describes recurring patterns, not every person. It cannot diagnose someone or determine their suitable investment.", "התורה מתארת דפוסים חוזרים, לא כל אדם. היא אינה אבחון ואינה קובעת איזו השקעה מתאימה לכם."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/2002/popular-information/"),
},
{
 id: "thaler-choice", kind: "economics-model", title: b("Thaler's behavioural economics and nudges", "כלכלה התנהגותית ודחיפה קלה לפי ת'אלר"),
 attribution: b("Richard Thaler, economics laureate. Nudge was developed with Cass Sunstein, who is not an economics laureate.", "ריצ'רד ת'אלר, חתן פרס בכלכלה. גישת הדחיפה הקלה פותחה עם קאס סאנסטיין, שאינו חתן הפרס בכלכלה."), aliases: ["Thaler", "nudge", "mental accounting", "תאלר", "ת'אלר", "חשבונאות מנטלית", "דחיפה קלה"], category: "personal", related: ["budget", "pension", "risk-tolerance"],
 idea: b("Mental money buckets, self-control and defaults affect choices. Changing the presentation of options can influence behaviour while preserving choice.", "חלוקת כסף לתאים בראש, שליטה עצמית וברירות מחדל משפיעות על החלטות. שינוי הצגת האפשרויות יכול להשפיע תוך שמירה על הבחירה."),
 why: b("A sound savings plan can fail through delay or friction rather than bad arithmetic.", "תוכנית חיסכון טובה יכולה להיכשל בגלל דחיינות או חיכוך, ולא בגלל טעות בחשבון."),
 practice: b("Review an automatic savings default and keep opting out clear. Evaluate all money together before treating a bonus as money that does not count.", "בדקו ברירת מחדל לחיסכון אוטומטי והשאירו דרך ברורה לבטל אותה. בחנו את כל הכסף יחד לפני שמתייחסים לבונוס ככסף שלא נחשב."),
 limits: b("A nudge is not automatically ethical or effective. Test outcomes, preserve consent and ask who benefits.", "דחיפה אינה בהכרח מוסרית או יעילה. בדקו תוצאות, שמרו על הסכמה ושאלו מי מרוויח."),
 sources: [...s("NobelPrize.org", "https://www.nobelprize.org/prizes/economics/2017/press-release/"),
  ...s("Penguin Random House: Nudge", "https://www.penguinrandomhouse.com/books/690485/nudge-by-richard-h-thaler-and-cass-r-sunstein/")],
},
{
 id: "black-scholes-merton", kind: "economics-model", title: b("Black-Scholes-Merton option pricing", "תמחור אופציות לפי בלאק-שולס-מרטון"),
 attribution: b("Fischer Black, Myron Scholes and Robert C. Merton developed the framework. Scholes and Merton received the economics prize; Black did not.", "פישר בלאק, מיירון שולס ורוברט מרטון פיתחו את המסגרת. שולס ומרטון קיבלו את הפרס בכלכלה; בלאק לא."), aliases: ["Black Scholes", "Black-Scholes", "Black Scholes Merton", "בלאק שולס", "בלאק-שולס"], category: "analysis", related: ["options", "hedging", "volatility"],
 idea: b("Relate an option to a replicating position in the underlying asset and cash under stated market assumptions.", "מקשרים אופציה לתיק משכפל של נכס הבסיס ומזומן, תחת הנחות מפורשות על השוק."),
 why: b("Option value depends on time, volatility and contract terms, not only on a guess about price direction.", "שווי אופציה תלוי בזמן, בתנודתיות ובתנאי החוזה, ולא רק בניחוש כיוון המחיר."),
 practice: b("Study how changing an input changes theoretical value. Identify the exercise style before applying a pricing formula.", "למדו איך שינוי נתון משנה שווי תיאורטי. בדקו את סוג המימוש לפני שימוש בנוסחת תמחור."),
 limits: b("The basic formula assumes European exercise and simplified trading conditions. Jumps, varying volatility and fees can cause differences. This note does not price a contract.", "הנוסחה הבסיסית מניחה מימוש אירופי ותנאי מסחר מפושטים. קפיצות מחיר, תנודתיות משתנה ועמלות יכולות ליצור פערים. הרשומה אינה מתמחרת חוזה."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/1997/press-release/"),
},
{
 id: "fama-efficient-markets", kind: "economics-model", title: b("Fama and efficient markets", "פאמה ויעילות שווקים"),
 attribution: b("Eugene Fama, economics laureate for asset-price research.", "יוג'ין פאמה, חתן פרס בכלכלה על מחקר מחירי נכסים."), aliases: ["Fama", "efficient market hypothesis", "EMH", "פאמה", "השערת השוק היעיל", "יעילות שווקים"], category: "markets", related: ["index-fund", "passive-vs-active", "alpha", "shiller-exuberance"],
 idea: b("Prices absorb information quickly. Versions of efficiency differ in whether they consider past prices, public information or all information.", "מחירים קולטים מידע במהירות. גרסאות של יעילות נבדלות בשאלה אם הן בוחנות מחירי עבר, מידע ציבורי או כל המידע."),
 why: b("A widely known story is not automatically a trading advantage. Evaluate skill after costs and against a suitable benchmark.", "סיפור שמוכר לכולם אינו בהכרח יתרון במסחר. בחנו יכולת אחרי עלויות וביחס למדד מתאים."),
 practice: b("Compare an active strategy with a low-cost diversified benchmark. Ask what information advantage could survive competition.", "השוו אסטרטגיה פעילה למדד מפוזר וזול. שאלו איזה יתרון מידע יכול לשרוד תחרות."),
 limits: b("Efficiency does not mean prices are always correct or crashes cannot occur. Tests depend on a risk model, and information is costly.", "יעילות אינה אומרת שמחירים תמיד נכונים או שלא ייתכנו מפולות. בדיקות תלויות במודל סיכון, ומידע עולה כסף."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/2013/press-release/"),
},
{
 id: "shiller-exuberance", kind: "economics-model", title: b("Shiller and irrational exuberance", "שילר והתלהבות לא רציונלית"),
 attribution: b("Robert Shiller, economics laureate for empirical asset-pricing research.", "רוברט שילר, חתן פרס בכלכלה על מחקר אמפירי בתמחור נכסים."), aliases: ["Shiller", "irrational exuberance", "שילר", "התלהבות לא רציונלית"], category: "markets", related: ["valuation", "bull-market", "fama-efficient-markets"],
 idea: b("Prices can fluctuate more than a simple account of future dividends suggests. Shared enthusiasm can move valuations away from sober expectations.", "מחירים יכולים לנוע יותר מכפי שהסבר פשוט על דיבידנדים עתידיים מציע. התלהבות משותפת יכולה להרחיק תמחור מציפיות שקולות."),
 why: b("A rising price does not prove that a business improved by the same amount.", "מחיר עולה אינו הוכחה שהעסק השתפר באותה מידה."),
 practice: b("Separate the business case from the popular story. Test what earnings assumptions the price needs against a less optimistic scenario.", "הפרידו בין מצב העסק לבין הסיפור הפופולרי. בדקו אילו הנחות רווח המחיר דורש מול תרחיש פחות אופטימי."),
 limits: b("Valuation concerns cannot reliably time a crash. Expensive markets can stay expensive. This contains no current bubble diagnosis.", "חשש מתמחור אינו מתזמן מפולת באופן אמין. שוק יקר יכול להישאר יקר. הרשומה אינה מאבחנת בועה כיום."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/2013/press-release/"),
},
{
 id: "tobin-portfolio", kind: "economics-model", title: b("Tobin's portfolio choice and the real economy", "בחירת תיק והכלכלה הריאלית לפי טובין"),
 attribution: b("James Tobin, economics laureate for financial markets and their links to the real economy.", "ג'יימס טובין, חתן פרס בכלכלה על שווקים פיננסיים והקשרים שלהם לכלכלה הריאלית."), aliases: ["Tobin", "James Tobin", "טובין"], category: "portfolio", related: ["asset-allocation", "interest-rate", "liquidity"],
 idea: b("Households and firms choose across assets and debts by weighing risk and expected return. These choices link financial conditions to spending and investment.", "משקי בית וחברות בוחרים בין נכסים וחובות לפי סיכון ותשואה צפויה. הבחירות מחברות תנאים פיננסיים להוצאות ולהשקעות."),
 why: b("A rate change can affect borrowing, demand for assets and business investment, beyond its effect on a deposit.", "שינוי ריבית עשוי להשפיע על אשראי, ביקוש לנכסים והשקעות עסקיות, מעבר להשפעה על פיקדון."),
 practice: b("Map cash, investments and debts together. Consider how spending decisions could change if borrowing becomes more costly.", "מפו יחד מזומן, השקעות וחובות. חשבו איך החלטות הוצאה עשויות להשתנות אם האשראי מתייקר."),
 limits: b("Transmission depends on institutions and constraints. This broad model cannot prescribe a household's asset mix.", "מנגנון ההעברה תלוי במוסדות ובמגבלות. המודל הכללי אינו קובע את הרכב הנכסים של משפחה."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/1981/press-release/"),
},
{
 id: "modigliani-miller", kind: "economics-model", title: b("Modigliani-Miller capital structure", "מבנה הון לפי מודיליאני-מילר"),
 attribution: b("Franco Modigliani and Merton Miller, both economics laureates.", "פרנקו מודיליאני ומרטון מילר, שניהם חתני פרס בכלכלה."), aliases: ["Modigliani Miller", "Modigliani-Miller", "Merton Miller", "מודיליאני מילר"], category: "finance", related: ["leverage", "valuation", "discount-rate"],
 idea: b("In an ideal market without taxes and other frictions, changing the debt-equity mix alone does not change total firm value.", "בשוק אידיאלי ללא מסים וחיכוכים אחרים, שינוי היחס בין חוב להון בלבד אינו משנה את שווי החברה הכולל."),
 why: b("It forces you to identify why financing creates value instead of assuming more debt is always better.", "המודל מחייב לזהות למה מימון יוצר ערך, במקום להניח שיותר חוב תמיד טוב יותר."),
 practice: b("Start with the frictionless benchmark. Add tax effects, distress costs and incentives explicitly when comparing financing choices.", "התחילו מנקודת ייחוס ללא חיכוכים. הוסיפו במפורש השפעות מס, עלויות מצוקה ותמריצים כשמשווים אפשרויות מימון."),
 limits: b("Real firms face taxes, bankruptcy risk and information gaps. This benchmark is not a recommendation to borrow and does not erase leverage risk.", "חברות אמיתיות מתמודדות עם מסים, סיכון פשיטת רגל ופערי מידע. נקודת הייחוס אינה המלצה ללוות ואינה מבטלת סיכון מינוף."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/1990/press-release/"),
},
{
 id: "modigliani-life-cycle", kind: "economics-model", title: b("Modigliani's life-cycle saving", "חיסכון לאורך החיים לפי מודיליאני"),
 attribution: b("Franco Modigliani developed the hypothesis with Richard Brumberg. Modigliani received the economics prize.", "פרנקו מודיליאני פיתח את ההשערה עם ריצ'רד ברומברג. מודיליאני קיבל את הפרס בכלכלה."), aliases: ["life cycle hypothesis", "life-cycle saving", "Franco Modigliani", "מודיליאני", "השערת מחזור החיים"], category: "personal", related: ["pension", "time-horizon", "emergency-fund"],
 idea: b("People may save in earning years to support consumption when income falls, including retirement, rather than base spending only on today's income.", "אנשים עשויים לחסוך בשנות העבודה למימון צריכה כשההכנסה יורדת, כולל בפרישה, ולא לבסס הוצאות רק על ההכנסה היום."),
 why: b("It connects current spending with a lifetime budget and retirement needs.", "ההשערה מחברת הוצאות בהווה לתקציב חיים ולצרכים בפרישה."),
 practice: b("Sketch income and spending across life stages. Test interruptions to earnings and uncertain retirement expenses.", "שרטטו הכנסות והוצאות בשלבי החיים. בדקו הפסקות הכנסה והוצאות פרישה לא ודאיות."),
 limits: b("Credit constraints, inheritance goals and surprises alter behaviour. This is a teaching model, not a pension forecast.", "מגבלות אשראי, רצון להוריש והפתעות משנים התנהגות. זהו מודל לימודי, לא תחזית פנסיה."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/1985/press-release/"),
},
{
 id: "spence-signaling", kind: "economics-model", title: b("Spence's signaling", "איתות לפי ספנס"),
 attribution: b("Michael Spence, economics laureate for markets with asymmetric information.", "מייקל ספנס, חתן פרס בכלכלה על שווקים עם מידע לא סימטרי."), aliases: ["Spence", "signaling", "signalling", "ספנס", "איתות"], category: "careers", related: ["financial-statements", "investment-analyst", "akerlof-lemons"],
 idea: b("An informed participant takes an observable action to convey quality. A signal is credible when low-quality participants find it harder to imitate.", "משתתף שמחזיק מידע מבצע פעולה נראית כדי להעביר מסר על איכות. האיתות אמין כשקשה יותר למשתתפים באיכות נמוכה לחקות אותו."),
 why: b("Qualifications and business claims are evidence to assess, not quality itself.", "תעודות והצהרות עסקיות הן ראיות לבדיקה, ולא האיכות עצמה."),
 practice: b("Ask what makes a business claim costly to imitate and what independent evidence supports it.", "שאלו מה מקשה לחקות הצהרה עסקית ואיזה מידע בלתי תלוי תומך בה."),
 limits: b("Costly signals may waste resources or exclude capable people. Education also builds skills; the model does not reduce it to signaling.", "איתות יקר עלול לבזבז משאבים או להדיר אנשים מוכשרים. השכלה גם בונה כישורים; המודל אינו מצמצם אותה לאיתות."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/2001/press-release/"),
},
{
 id: "akerlof-lemons", kind: "economics-model", title: b("Akerlof's market for lemons", "שוק הלימונים של אקרלוף"),
 attribution: b("George Akerlof, economics laureate for markets with asymmetric information.", "ג'ורג' אקרלוף, חתן פרס בכלכלה על שווקים עם מידע לא סימטרי."), aliases: ["Akerlof", "market for lemons", "adverse selection", "אקרלוף", "שוק הלימונים", "ברירה שלילית"], category: "markets", related: ["insurance", "credit-rating", "spence-signaling"],
 idea: b("When sellers know more about quality, buyers may offer a price that drives good sellers away. The remaining mix can become worse.", "כשמוכרים יודעים יותר על איכות, הקונים עשויים להציע מחיר שמרחיק מוכרים טובים. תמהיל המוצרים שנשאר עלול להידרדר."),
 why: b("Missing information can damage a whole market, not only one transaction.", "מידע חסר עלול לפגוע בשוק שלם, ולא רק בעסקה אחת."),
 practice: b("Identify what one side knows and the other cannot verify. Compare warranties, independent checks and disclosure as possible remedies.", "זהו מה צד אחד יודע והצד השני אינו יכול לבדוק. השוו אחריות, בדיקות עצמאיות וגילוי מידע כפתרונות אפשריים."),
 limits: b("Not every information gap destroys a market. Institutions and repeated relationships may help. This is not proof that a seller is dishonest.", "לא כל פער מידע הורס שוק. מוסדות וקשרים מתמשכים עשויים לעזור. המודל אינו הוכחה שמוכר מסוים אינו ישר."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/2001/press-release/"),
},
{
 id: "stiglitz-screening", kind: "economics-model", title: b("Stiglitz's screening", "סינון לפי סטיגליץ"),
 attribution: b("Joseph Stiglitz, economics laureate for markets with asymmetric information.", "ג'וזף סטיגליץ, חתן פרס בכלכלה על שווקים עם מידע לא סימטרי."), aliases: ["Stiglitz", "screening theory", "סטיגליץ", "סינון מידע"], category: "finance", related: ["deductible", "premium", "akerlof-lemons"],
 idea: b("The less-informed side can offer different contracts and learn from the other side's choices, such as insurance with different deductibles.", "הצד בעל פחות מידע יכול להציע חוזים שונים וללמוד מבחירת הצד השני, למשל ביטוח עם השתתפויות עצמיות שונות."),
 why: b("A menu of terms may be designed to reveal information, not merely to offer variety.", "תפריט תנאים עשוי להיבנות כדי לחשוף מידע, ולא רק להציע מגוון."),
 practice: b("Compare the entire contract, including outcomes after a loss. Ask which customer types might choose each option.", "השוו את החוזה המלא, כולל תוצאות אחרי נזק. שאלו אילו סוגי לקוחות עשויים לבחור בכל אפשרות."),
 limits: b("Choices also reflect affordability and constraints. A contract choice does not reveal someone's risk type with certainty.", "בחירות משקפות גם יכולת כלכלית ומגבלות. בחירת חוזה אינה חושפת בוודאות את רמת הסיכון של אדם."),
 sources: s("NobelPrize.org", "https://www.nobelprize.org/prizes/economic-sciences/2001/press-release/"),
},
{
 id: "book-intelligent-investor", kind: "book-synthesis", title: b("The Intelligent Investor", "המשקיע הנבון"),
 attribution: b("Benjamin Graham. A selected-ideas teaching synthesis, not a chapter summary.", "בנג'מין גרהם. עיבוד לימודי של רעיונות נבחרים, לא סיכום פרקים."), aliases: ["Intelligent Investor", "המשקיע האינטליגנטי", "בנג'מין גרהם"], category: "investments", related: ["value-stock", "valuation", "risk-tolerance"],
 idea: b("Treat a share as a stake in a business. Distinguish its estimated value from its quoted price, and allow room for being wrong.", "התייחסו למניה כבעלות בעסק. הפרידו בין שווי מוערך למחיר בבורסה, והשאירו מרווח לטעות."),
 why: b("A low price is useful only when the estimate of value is sound. Emotional reactions to market moves can undermine research.", "מחיר נמוך מועיל רק כשהערכת השווי מבוססת. תגובות רגשיות לתנודות השוק עלולות לפגוע בניתוח."),
 practice: b("Write a conservative business case and list ways it could fail. Compare the price with a range of values, not a single confident target.", "כתבו ניתוח עסקי שמרני ורשימת דרכים שבהן הוא עלול להיכשל. השוו מחיר לטווח שווי, ולא ליעד יחיד ובטוח בעצמו."),
 limits: b("A margin of safety is an estimate, not insurance against loss. Cheap-looking businesses can deteriorate; this note does not identify a bargain.", "מרווח ביטחון הוא אומדן, לא ביטוח מפני הפסד. עסקים שנראים זולים יכולים להידרדר; הרשומה אינה מזהה מציאה."),
 sources: s("Investopedia: Graham's principles", "https://www.investopedia.com/articles/basics/07/grahamprinciples.asp"),
},
{
 id: "book-common-stocks", kind: "book-synthesis", title: b("Common Stocks and Uncommon Profits", "מניות רגילות ורווחים לא רגילים"),
 attribution: b("Philip Fisher. Selected ideas with InvestED practice prompts.", "פיליפ פישר. רעיונות נבחרים עם תרגול של InvestED."), aliases: ["Philip Fisher", "פיליפ פישר", "מניות רגילות ורווחים בלתי רגילים"], category: "investments", related: ["growth-stock", "fundamental-analysis", "financial-statements"],
 idea: b("Study the business behind growth: its products, people and ability to keep improving. Qualitative investigation complements financial figures.", "חקרו את העסק שמאחורי הצמיחה: מוצרים, אנשים ויכולת להמשיך להשתפר. בדיקה איכותנית משלימה את המספרים בדוחות."),
 why: b("Past growth alone does not explain whether a company can sustain its strengths.", "צמיחה בעבר לבדה אינה מסבירה אם חברה יכולה לשמור על יתרונותיה."),
 practice: b("Build a checklist about customers, competition and management. Compare independent accounts with company claims and financial statements.", "בנו רשימת בדיקה על לקוחות, תחרות והנהלה. השוו עדויות עצמאיות להצהרות החברה ולדוחות הכספיים."),
 limits: b("Interviews can be biased and strong businesses can be overpriced. Do not seek confidential information or confuse admiration with valuation.", "ראיונות עלולים להיות מוטים ועסקים חזקים עלולים להיות יקרים מדי. אל תחפשו מידע חסוי ואל תבלבלו הערכה לעסק עם הערכת שווי."),
 sources: s("Wiley-VCH", "https://www.wiley-vch.de/en/areas-interest/finance-economics-law/common-stocks-and-uncommon-profits-and-other-writings-978-0-471-44550-0"),
},
{
 id: "book-one-up", kind: "book-synthesis", title: b("One Up on Wall Street", "אחד למעלה בוול סטריט"),
 attribution: b("Peter Lynch with John Rothchild. Selected investing ideas, not a promise to outperform professionals.", "פיטר לינץ' עם ג'ון רוטצ'יילד. רעיונות השקעה נבחרים, לא הבטחה להכות אנשי מקצוע."), aliases: ["Peter Lynch", "פיטר לינץ'", "לינץ", "אחד מעל וול סטריט"], category: "investments", related: ["financial-statements", "growth-stock", "valuation"],
 idea: b("Everyday observations can suggest businesses to investigate. Familiarity starts research; it does not finish it.", "תצפיות מחיי היום-יום יכולות להציע עסקים למחקר. היכרות מתחילה את הבדיקה; היא אינה מסיימת אותה."),
 why: b("A popular product is not the same as a financially sound company or an attractive share price.", "מוצר פופולרי אינו אותו דבר כמו חברה יציבה או מחיר מניה מעניין."),
 practice: b("Turn an observation into a testable business question. Check debt, earnings and the source of future growth in the statements.", "הפכו תצפית לשאלה עסקית שאפשר לבדוק. בחנו בדוחות חוב, רווחים ומקור לצמיחה עתידית."),
 limits: b("Personal experience is a small sample. Knowing a brand does not justify concentrated holdings or guarantee returns.", "ניסיון אישי הוא מדגם קטן. היכרות עם מותג אינה מצדיקה ריכוז החזקות ואינה מבטיחה תשואה."),
 sources: s("Simon & Schuster", "https://www.simonandschuster.net/books/One-Up-On-Wall-Street/Peter-Lynch/9780743200400"),
},
{
 id: "book-psychology-money", kind: "book-synthesis", title: b("The Psychology of Money", "הפסיכולוגיה של הכסף"),
 attribution: b("Morgan Housel. A short synthesis of behavioural themes, not a retelling of the book's stories.", "מורגן האוסל. עיבוד קצר של רעיונות התנהגותיים, לא שחזור הסיפורים בספר."), aliases: ["Psychology of Money", "Morgan Housel", "מורגן האוסל", "פסיכולוגיה של הכסף"], category: "personal", related: ["compound-interest", "emergency-fund", "risk-tolerance", "prospect-theory"],
 idea: b("Financial decisions depend on habits, experiences and incentives as well as arithmetic. A workable plan must fit the person who follows it.", "החלטות פיננסיות תלויות בהרגלים, חוויות ותמריצים, לצד חשבון. תוכנית מעשית צריכה להתאים לאדם שפועל לפיה."),
 why: b("Two people can see the same numbers and react differently. Behaviour can decide whether a long-term plan lasts.", "שני אנשים יכולים לראות אותם מספרים ולהגיב אחרת. התנהגות עשויה לקבוע אם תוכנית ארוכת טווח תחזיק מעמד."),
 practice: b("Write what would make you abandon a plan under stress. Build a cash-buffer scenario and separate your goals from comparisons with others.", "כתבו מה יגרום לכם לנטוש תוכנית בלחץ. בנו תרחיש כרית מזומן והפרידו בין המטרות שלכם לבין השוואה לאחרים."),
 limits: b("Stories illustrate choices; they do not establish a universal rule. Behavioural lessons cannot replace calculations or current local rules.", "סיפורים ממחישים בחירות; הם אינם מוכיחים כלל אוניברסלי. תובנות התנהגותיות אינן מחליפות חישובים או כללים מקומיים עדכניים."),
 sources: s("Harriman House", "https://www.harriman-house.com/authors/morgan-housel/the-psychology-of-money/9780857197689"),
},
{
 id: "book-random-walk", kind: "book-synthesis", title: b("A Random Walk Down Wall Street", "הליכת אקראי בוול סטריט"),
 attribution: b("Burton Malkiel. Selected ideas about market prediction and indexing.", "ברטון מלכיאל. רעיונות נבחרים על חיזוי שוק והשקעה במדדים."), aliases: ["Random Walk Down Wall Street", "Burton Malkiel", "מלכיאל", "הליכה אקראית בוול סטריט"], category: "investments", related: ["index-fund", "expense-ratio", "fama-efficient-markets"],
 idea: b("Consistently identifying winning securities is difficult. Broad, low-cost indexing is an alternative to repeatedly betting on forecasting skill.", "קשה לזהות בעקביות ניירות ערך מנצחים. השקעה רחבה וזולה במדדים היא חלופה להימור חוזר על יכולת חיזוי."),
 why: b("Costs are measurable, while an expected forecasting advantage may disappear when tested.", "עלויות אפשר למדוד, בעוד שיתרון חיזוי צפוי עשוי להיעלם בבדיקה."),
 practice: b("Compare a proposed strategy with a diversified index benchmark after fees. Explain what evidence would distinguish skill from luck.", "השוו אסטרטגיה מוצעת למדד מפוזר לאחר עמלות. הסבירו איזה מידע יבדיל בין יכולת למזל."),
 limits: b("Index funds can lose value and differ in concentration and fees. Difficulty predicting prices does not make all markets equally efficient.", "קרנות מדד יכולות להפסיד ושונות בריכוזיות ובעמלות. קושי בחיזוי מחירים אינו הופך את כל השווקים ליעילים באותה מידה."),
 sources: s("Princeton faculty profile", "https://dof.princeton.edu/people/burton-gordon-malkiel"),
},
{
 id: "book-security-analysis", kind: "book-synthesis", title: b("Security Analysis", "ניתוח ניירות ערך"),
 attribution: b("Benjamin Graham and David Dodd. Selected value-investing ideas; editions have additional contributors.", "בנג'מין גרהם ודיוויד דוד. רעיונות נבחרים בהשקעות ערך; למהדורות שונות יש תורמים נוספים."), aliases: ["Graham and Dodd", "גרהם ודוד"], category: "analysis", related: ["financial-statements", "valuation", "credit-rating", "book-intelligent-investor"],
 idea: b("Analyse what stands behind a security: the business, its earning capacity and the claims held by lenders and owners. Price alone is insufficient.", "נתחו מה עומד מאחורי נייר ערך: העסק, יכולת הרווח והזכויות של מלווים ובעלים. המחיר לבדו אינו מספיק."),
 why: b("An apparently cheap security may hide weak finances or claims that leave little for its holder.", "נייר שנראה זול עשוי להסתיר מצב פיננסי חלש או זכויות שמשאירות מעט למחזיק בו."),
 practice: b("Read the balance sheet and earnings history together. Compare valuation under several business assumptions and note which facts are missing.", "קראו יחד את המאזן ואת היסטוריית הרווח. השוו שווי תחת הנחות עסקיות שונות וציינו אילו עובדות חסרות."),
 limits: b("Reported numbers can mislead and estimates can fail. Accounting and markets change; historical methods are not automatic modern trading rules.", "דוחות עלולים להטעות ואומדנים עלולים להיכשל. חשבונאות ושווקים משתנים; שיטות היסטוריות אינן כללי מסחר אוטומטיים להיום."),
 sources: s("McGraw Hill", "https://www.mheducation.com/highered/mhp/product/security-analysis-seventh-edition-principles-techniques.html"),
},
{
 id: "book-lean-startup", kind: "book-synthesis", title: b("The Lean Startup", "הסטארטאפ הרזה"),
 attribution: b("Eric Ries. Selected ideas about testing uncertain business assumptions.", "אריק ריס. רעיונות נבחרים על בדיקת הנחות עסקיות לא ודאיות."), aliases: ["Lean Startup", "Eric Ries", "אריק ריס", "סטארטאפ רזה", "הסטארט-אפ הרזה"], category: "careers", related: ["book-zero-to-one", "budget"],
 idea: b("Treat a new business as a set of assumptions to test. Small product experiments should produce evidence before a team commits to a larger build.", "התייחסו לעסק חדש כאוסף הנחות לבדיקה. ניסויי מוצר קטנים צריכים לייצר ראיות לפני שהצוות מתחייב לבנייה גדולה יותר."),
 why: b("Shipping many features is not the same as learning whether customers need the product.", "השקת תכונות רבות אינה אותו דבר כמו גילוי אם לקוחות צריכים את המוצר."),
 practice: b("Name one risky assumption, a safe small test and a success criterion. Measure behaviour and decide whether to continue or change direction.", "בחרו הנחה מסוכנת אחת, ניסוי קטן ובטוח וקריטריון הצלחה. מדדו התנהגות והחליטו אם להמשיך או לשנות כיוון."),
 limits: b("Small tests can mislead. A minimum viable product must still protect users and meet safety and legal duties, especially in finance.", "ניסויים קטנים עלולים להטעות. גם מוצר ראשוני חייב להגן על משתמשים ולעמוד בחובות בטיחות ומשפט, במיוחד בפיננסים."),
 sources: s("The Lean Startup methodology", "https://theleanstartup.com/principles"),
},
{
 id: "book-zero-to-one", kind: "book-synthesis", title: b("Zero to One", "מאפס לאחד"),
 attribution: b("Peter Thiel with Blake Masters. Selected ideas about creating a distinct business.", "פיטר ת'יל עם בלייק מאסטרס. רעיונות נבחרים על יצירת עסק מובחן."), aliases: ["Peter Thiel", "Blake Masters", "פיטר תיל", "פיטר ת'יל", "אפס לאחד"], category: "careers", related: ["book-lean-startup", "book-good-great"],
 idea: b("A new business can create value by solving a problem in a way that competitors cannot readily reproduce, rather than copying a crowded market.", "עסק חדש יכול ליצור ערך באמצעות פתרון שקשה למתחרים לשחזר, במקום להעתיק שוק צפוף."),
 why: b("Being different matters only if customers gain something they care about.", "שוני חשוב רק אם הלקוחות מקבלים משהו שחשוב להם."),
 practice: b("Describe the customer problem, the distinct solution and why imitation would be hard. Then test whether customers actually value the difference.", "תארו את בעיית הלקוח, הפתרון המובחן ולמה קשה לחקות אותו. אחר כך בדקו אם הלקוחות באמת מעריכים את ההבדל."),
 limits: b("Originality is not proof of demand. Competitive advantage must not be confused with permission for anti-competitive conduct or guaranteed business success.", "מקוריות אינה הוכחה לביקוש. יתרון תחרותי אינו היתר להתנהגות שפוגעת בתחרות ואינו מבטיח הצלחה עסקית."),
 sources: s("Penguin Random House", "https://www.penguinrandomhouse.com/books/234730/zero-to-one-by-peter-thiel-with-blake-masters/"),
},
{
 id: "book-good-great", kind: "book-synthesis", title: b("Good to Great", "מטוב למצוין"),
 attribution: b("Jim Collins. Selected organisational ideas, not a guaranteed formula for success.", "ג'ים קולינס. רעיונות ארגוניים נבחרים, לא נוסחה מובטחת להצלחה."), aliases: ["Jim Collins", "ג'ים קולינס", "טוב למצוין", "גלגל התנופה"], category: "careers", related: ["book-zero-to-one", "book-lean-startup"],
 idea: b("Sustained improvement can come from disciplined people and repeated actions that reinforce each other, rather than one dramatic change programme.", "שיפור מתמשך יכול לנבוע מאנשים ממושמעים ומפעולות חוזרות שמחזקות זו את זו, ולא מתוכנית שינוי דרמטית אחת."),
 why: b("Teams can mistake the announcement of a new strategy for the patient work that makes it function.", "צוותים יכולים לבלבל הכרזה על אסטרטגיה חדשה עם העבודה המתמשכת שגורמת לה לפעול."),
 practice: b("Map a cycle where one improvement supports the next. Assign responsibility and measure repeated results instead of celebrating announcements.", "מפו מעגל שבו שיפור אחד תומך בבא אחריו. הקצו אחריות ומדדו תוצאות חוזרות במקום לחגוג הכרזות."),
 limits: b("Studies of past winners do not prove causation. Survivorship bias and changing conditions limit how directly a framework transfers to another company.", "מחקר חברות שהצליחו בעבר אינו מוכיח סיבתיות. הטיית שורדים ותנאים משתנים מגבילים העברה ישירה של המסגרת לחברה אחרת."),
 sources: s("Jim Collins: Flywheel", "https://www.jimcollins.com/concepts/the-flywheel.html"),
},
];

export function classicExplanation(note: ClassicNote, lang: "en" | "he"): string {
  const labels = lang === "he"
    ? ["הרעיון", "למה זה חשוב", "תרגול לימודי", "מגבלות וביקורת", "מקורות לרעיונות ולייחוס"]
    : ["The idea", "Why it matters", "Learning exercise", "Limits and critiques", "Sources for ideas and attribution"];
  const scope = note.kind === "book-synthesis"
    ? b("Original InvestED synthesis of selected ideas, not the book's text or a full summary.", "עיבוד מקורי של InvestED לרעיונות נבחרים, לא טקסט מהספר או סיכום מלא.")
    : b("Original InvestED teaching note, not a calculation or market forecast.", "רשומת לימוד מקורית של InvestED, לא חישוב או תחזית שוק.");
  return [note.title[lang], note.attribution[lang], scope[lang],
    `${labels[0]}: ${note.idea[lang]}`, `${labels[1]}: ${note.why[lang]}`,
    `${labels[2]}: ${note.practice[lang]}`, `${labels[3]}: ${note.limits[lang]}`,
    `${labels[4]}: ${note.sources.map((source) => `${source.label} (⁦${source.url}⁩)`).join("; ")}`,
    lang === "he" ? "לימוד כללי בלבד, לא ייעוץ השקעות אישי." : "General education only, not personal investment advice.",
  ].join("\n\n");
}
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Boundary-aware patterns avoid matching names inside unrelated words. */
export const CLASSIC_EXPLANATIONS: ExtraConcept[] = CLASSIC_NOTES.map((note) => ({
  enLabel: note.title.en, heLabel: note.title.he,
  en: classicExplanation(note, "en"), he: classicExplanation(note, "he"),
  patterns: [note.title.en, note.title.he, ...note.aliases].map((name) => {
    const term = escape(name).replace(/[- ]+/g, "[- ]+");
    return /[א-ת]/.test(name)
      ? new RegExp(`(?<![א-ת])[הבלומשכ]?(?:${term})(?![א-ת])`, "u")
      : new RegExp(`(?<![A-Za-z0-9א-ת])(?:${term})(?![A-Za-z0-9א-ת])`, "iu");
  }),
}));
export const CLASSIC_CONCEPTS: ConceptEntry[] = CLASSIC_NOTES.map((note) => ({
  id: note.id, en: note.title.en, he: note.title.he, aliases: note.aliases,
  category: note.category, related: note.related, tools: [], explain: note.title.en,
}));
