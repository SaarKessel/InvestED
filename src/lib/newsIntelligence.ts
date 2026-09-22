export type EventType="earnings"|"guidance"|"merger_acquisition"|"regulatory"|"macroeconomic"|"analyst_action"|"management_change"|"corporate_announcement"|"market_move"|"unknown";export interface RawNewsItem{title:string;url:string;source:string;publishedAt:string;summary?:string}
export interface NewsEvent extends RawNewsItem{id:string;symbols:string[];eventType:EventType;classificationSource:"deterministic_headline_rules";implicationsSource:"invested_educational_template"|"none";sentiment:null;sentimentReason:"not_configured"}
const rules:Array<[EventType,RegExp]>=[["earnings",/earnings|quarterly results|תוצאות/i],["guidance",/guidance|outlook|תחזית/i],["merger_acquisition",/merger|acquisition|acquire|buyout|takeover|מיזוג|רכישת/i],["regulatory",/regulat|sec |antitrust|רגולט/i],["macroeconomic",/inflation|interest rate|fed |gdp|jobs report|treasury|rate hikes?|rate cuts?|אינפלציה|ריבית/i],["analyst_action",/upgrade|downgrade|price target|rating|initiated|reasons to (buy|sell|watch)|reasons investors|\\d+\\s+reasons|is risky|upside|bulls or bears|דירוג/i],["management_change",/ceo|cfo|resign|appoint|מנכ/i],["market_move",/(surges?|soars?|rall(?:y|ies|ied)|jumps?|plunges?|slumps?|tumbles?|rebounds?|gains?|falls|drops?|rises?|tops?|hits?|record (?:high|low))[^.]{0,80}(nasdaq|dow jones|\bdow\b|s&p|index|indexes|indices|market|markets|stocks|equities|bitcoin|crypto|oil|gold|yields?|futures)|(nasdaq|dow jones|\bdow\b|s&p|index|indexes|indices|market|markets|stocks|equities|bitcoin|crypto|oil|gold|yields?|futures)[^.]{0,80}(surges?|soars?|rall(?:y|ies|ied)|jumps?|plunges?|slumps?|tumbles?|rebounds?|gains?|falls|drops?|rises?|tops?|hits?|record (?:high|low))/i]];
export function normalizeNews(item:RawNewsItem,knownSymbols:string[]):NewsEvent|null{if(!item.title.trim()||!/^https?:\/\//.test(item.url)||!item.source.trim()||Number.isNaN(Date.parse(item.publishedAt)))return null;const entityText=`${item.title} ${item.summary??""}`;const classificationText=item.title;let symbols=knownSymbols.filter(s=>new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(entityText));const extra=new Set<string>();for(const m of entityText.matchAll(/\(([A-Z]{1,5})\)|\$([A-Z]{1,5})\b/g)){const sym=m[1]??m[2];if(sym&&!symbols.includes(sym))extra.add(sym);}symbols=[...symbols,...extra];const eventType=rules.find(([,re])=>re.test(classificationText))?.[0]??"unknown";return{...item,id:`${item.source}:${item.publishedAt}:${item.title}`.toLowerCase(),symbols,eventType,classificationSource:"deterministic_headline_rules",implicationsSource:eventType==="unknown"?"none":"invested_educational_template",sentiment:null,sentimentReason:"not_configured"}}
export function normalizeNewsFeed(items:RawNewsItem[],knownSymbols:string[]){return items.map(i=>normalizeNews(i,knownSymbols)).filter((i):i is NewsEvent=>i!==null).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))}

// ---------------------------------------------------------------------------
// News enrichment (key facts + supported implications)
//
// Everything here is deterministic and conservative: key facts state only
// what the provider payload itself supports, and implications are templated
// EDUCATIONAL notes keyed to the event classification — never a claim about
// what this specific article proves. "unknown" events get no implications
// rather than speculation.
// ---------------------------------------------------------------------------

export type NewsLanguage = "he" | "en";

export interface NewsKeyFact { label: string; value: string }
export interface NewsImplication { scope: "company" | "transaction" | "sector" | "macro"; text: string }

const EVENT_LABELS: Record<EventType, Record<NewsLanguage, string>> = {
  earnings: { he: "דוחות כספיים", en: "Earnings" },
  guidance: { he: "תחזית חברה", en: "Guidance" },
  merger_acquisition: { he: "מיזוג/רכישה", en: "M&A" },
  regulatory: { he: "רגולציה", en: "Regulatory" },
  macroeconomic: { he: "מאקרו", en: "Macro" },
  analyst_action: { he: "פעולת אנליסטים", en: "Analyst action" },
  management_change: { he: "שינוי הנהלה", en: "Management change" },
  corporate_announcement: { he: "הודעת חברה", en: "Corporate announcement" },
  market_move: { he: "תנועת שוק", en: "Market move" },
  unknown: { he: "כללי", en: "General" },
};

export function eventTypeLabel(eventType: EventType, language: NewsLanguage): string {
  return EVENT_LABELS[eventType][language];
}

/** Facts the provider payload itself supports — nothing inferred. */
export function buildKeyFacts(event: NewsEvent, language: NewsLanguage): NewsKeyFact[] {
  const facts: NewsKeyFact[] = [
    {
      label: language === "he" ? "מקור" : "Source",
      value: event.source,
    },
    {
      label: language === "he" ? "פורסם" : "Published",
      value: new Date(event.publishedAt).toLocaleString(language === "he" ? "he-IL" : "en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      }),
    },
    {
      label: language === "he" ? "סיווג" : "Classification",
      value: eventTypeLabel(event.eventType, language),
    },
  ];
  if (event.symbols.length > 0) {
    facts.push({
      label: language === "he" ? "סמלים שזוהו" : "Detected symbols",
      value: event.symbols.join(", "),
    });
  }
  return facts;
}

const IMPLICATIONS: Record<Exclude<EventType, "unknown">, Record<NewsLanguage, NewsImplication[]>> = {
  earnings: {
    en: [
      { scope: "company", text: "Earnings reports can move the company's share price in either direction; the actual figures, not the headline, drive the impact." },
      { scope: "sector", text: "One company's results can hint at sector-wide demand trends, but they do not prove them." },
    ],
    he: [
      { scope: "company", text: "דוחות כספיים יכולים להזיז את מחיר המניה לשני הכיוונים; הנתונים עצמם, לא הכותרת, קובעים את ההשפעה." },
      { scope: "sector", text: "תוצאות של חברה אחת יכולות לרמז על מגמות ביקוש בכלל הסקטור, אך אינן מוכיחות אותן." },
    ],
  },
  guidance: {
    en: [
      { scope: "company", text: "Guidance changes how investors form expectations about the company's coming quarters." },
      { scope: "sector", text: "A guidance cut or raise can color sentiment toward peer companies with similar exposure." },
    ],
    he: [
      { scope: "company", text: "תחזית חברה משנה את הציפיות של משקיעים לרבעונים הקרובים שלה." },
      { scope: "sector", text: "הורדה או העלאה של תחזית יכולה להשפיע על הסנטימנט כלפי חברות דומות עם חשיפה דומה." },
    ],
  },
  merger_acquisition: {
    en: [
      { scope: "transaction", text: "M&A events usually move both parties' prices around deal terms, timing and approval odds — all of which can change." },
      { scope: "sector", text: "A large deal can signal consolidation pressure across the sector." },
    ],
    he: [
      { scope: "transaction", text: "אירועי מיזוג ורכישה מזיזים בדרך כלל את מחירי שני הצדדים סביב תנאי העסקה, התזמון וסיכויי האישור — וכל אלה יכולים להשתנות." },
      { scope: "sector", text: "עסקה גדולה יכולה לאותת על לחץ קונסולידציה בכלל הסקטור." },
    ],
  },
  regulatory: {
    en: [
      { scope: "company", text: "Regulatory actions can change a company's costs, constraints or timeline; the specific decision matters more than the headline." },
      { scope: "sector", text: "A ruling aimed at one company often sets expectations for the whole sector." },
    ],
    he: [
      { scope: "company", text: "פעולות רגולטוריות יכולות לשנות עלויות, מגבלות או לוחות זמנים של חברה; ההחלטה הספציפית חשובה יותר מהכותרת." },
      { scope: "sector", text: "פסיקה שמכוונת לחברה אחת מעצבת לעיתים ציפיות לכלל הסקטור." },
    ],
  },
  macroeconomic: {
    en: [
      { scope: "macro", text: "Macro data (inflation, rates, growth) shifts the discount rates and expectations behind all asset prices." },
      { scope: "sector", text: "Rate-sensitive sectors (real estate, growth tech, financials) usually react first to macro surprises." },
    ],
    he: [
      { scope: "macro", text: "נתוני מאקרו (אינפלציה, ריבית, צמיחה) משנים את שיעורי ההיוון והציפיות שמאחורי מחירי כל הנכסים." },
      { scope: "sector", text: "סקטורים רגישים לריבית (נדל\"ן, טכנולוגיית צמיחה, פיננסים) מגיבים בדרך כלל ראשונים להפתעות מאקרו." },
    ],
  },
  analyst_action: {
    en: [
      { scope: "company", text: "Analyst upgrades/downgrades reflect one firm's opinion; they can move short-term sentiment but are not new facts about the company." },
    ],
    he: [
      { scope: "company", text: "שדרוגים והורדות דירוג משקפים דעה של גוף אחד; הם יכולים להזיז סנטימנט קצר-טווח אך אינם עובדה חדשה על החברה." },
    ],
  },
  management_change: {
    en: [
      { scope: "company", text: "Leadership changes can alter strategy and execution risk; markets usually price the uncertainty before the outcome is known." },
    ],
    he: [
      { scope: "company", text: "שינויי הנהלה יכולים לשנות אסטרטגיה וסיכון ביצוע; השוק בדרך כלל מתמחר את אי-הודאות לפני שהתוצאה ידועה." },
    ],
  },
  market_move: {
    en: [
      { scope: "macro", text: "A broad market move reflects many forces at once; a single day does not establish a trend." },
      { scope: "sector", text: "When one sector leads a market-wide move, it often signals where investors currently see growth or safety." },
    ],
    he: [
      { scope: "macro", text: "תנועת שוק רחבה משקפת כוחות רבים בו-זמנית; יום אחד אינו מוכיח מגמה." },
      { scope: "sector", text: "כאשר סקטור אחד מוביל תנועה כלל-שוקית, הוא מרמז היכן משקיעים רואים כרגע צמיחה או מקלט." },
    ],
  },
  corporate_announcement: {
    en: [
      { scope: "company", text: "Company announcements vary widely; the details of the actual filing or statement matter more than the headline." },
    ],
    he: [
      { scope: "company", text: "הודעות חברה מגוונות מאוד; הפרטים בדיווח או בהצהרה עצמה חשובים יותר מהכותרת." },
    ],
  },
};

/** Templated EDUCATIONAL implications. "unknown" yields none — never speculation. */
export function buildImplications(event: NewsEvent, language: NewsLanguage): NewsImplication[] {
  if (event.eventType === "unknown") return [];
  return IMPLICATIONS[event.eventType][language];
}
