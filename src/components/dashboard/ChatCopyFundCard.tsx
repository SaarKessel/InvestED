import { useLanguage } from "@/context/languageContext";
import type { CopyFundResult } from "@/lib/copilot/copyFundDesk";

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

/** "What if you had copied this fund's 13F": buy-and-hold on real closes vs SPY, with the filing lag and every limit stated. Educational simulation, not advice. */
export function ChatCopyFundCard({ data }: { data: CopyFundResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  const lang = he ? "he" : "en";
  const f = data.copy.fromFilingDate, q = data.copy.fromQuarterEnd;
  return (
    <div className="mt-3 rounded-lg border-2 border-dashed border-amber-500/70 bg-background/70 p-3 text-xs" data-testid="copyfund-card">
      <p className="font-semibold">{data.managerName[lang]} · {he ? "מה אם היית מעתיק את ה-13F" : "What if you had copied the 13F"}</p>
      <p className="mt-1 font-bold text-amber-700 dark:text-amber-300">{he ? "סימולציה לימודית, לא ייעוץ השקעות" : "Educational simulation, not investment advice"}</p>
      <p className="mt-1 text-muted-foreground" dir="ltr">{he ? "דוח נכון ל" : "Report as of "}{data.reportDate} · {he ? "הוגש" : "filed"} {data.filingDate} · {he ? "כיסוי" : "coverage"} {data.copy.coveragePct.toFixed(0)}% {he ? `מ-${data.topCount} ההחזקות הגדולות` : `of the top ${data.topCount} holdings`}</p>
      {f ? (
        <div className="mt-2" data-testid="copyfund-result">
          <p dir="ltr">{he ? "קנייה בסגירה הראשונה אחרי ההגשה" : "Buying at the first close after filing"} ({f.entryDate}) → {f.latestDate}: <b>{pct(f.portfolioReturnPct)}</b> · SPY {pct(f.spyReturnPct)}</p>
          {q && <p className="text-muted-foreground" dir="ltr">{he ? "בהסתכלות לאחור בלבד, קנייה בסגירת הרבעון" : "Hindsight only, buying at quarter end"} ({q.entryDate}): {pct(q.portfolioReturnPct)} · SPY {pct(q.spyReturnPct)}. {he ? "אף אחד מבחוץ לא יכול היה לעשות את זה." : "Nobody outside the fund could have done this."}</p>}
          <div className="mt-2 overflow-x-auto" dir="ltr">
            <table className="w-full text-start">
              <thead className="text-muted-foreground"><tr><th className="pe-3 text-start font-medium">{he ? "סימול" : "Ticker"}</th><th className="pe-3 text-end font-medium">{he ? "משקל" : "Weight"}</th><th className="text-end font-medium">{he ? "תשואה" : "Return"}</th></tr></thead>
              <tbody>{f.legs.map((l) => <tr key={l.ticker} className="border-t border-border/50"><td className="py-1 pe-3">{l.ticker}</td><td className="pe-3 text-end">{l.weightPct.toFixed(1)}%</td><td className="text-end">{pct(l.returnPct)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : <p className="mt-2" role="status">{he ? "אין עדיין מספיק מחירי סגירה אמיתיים כדי לחשב, ולכן לא מציגה תוצאה." : "There are not enough real closing prices yet to compute this, so no result is shown."}</p>}
      {(data.unmatched.length > 0 || data.copy.notPriced.length > 0) && (
        <p className="mt-2 text-muted-foreground" data-testid="copyfund-excluded">{he ? "לא נכללו (לא הותאמו בוודאות לסימול או שאין מחיר אמיתי): " : "Left out (not matched to one ticker with certainty, or no real price): "}<span dir="ltr">{[...data.unmatched.map((u) => u.issuer), ...data.copy.notPriced].join(", ")}</span></p>
      )}
      <ul className="mt-2 list-disc space-y-0.5 ps-5 text-muted-foreground">
        <li>{he ? "13F מוגש עד 45 יום אחרי סוף הרבעון, ולכן ההחזקות כבר ישנות כשהן מתפרסמות." : "A 13F is due up to 45 days after quarter end, so the holdings are already old when published."}</li>
        <li>{he ? "רק פוזיציות לונג במניות אמריקאיות. פוזיציות שורט לא מדווחות." : "Long positions in US-listed equities only. Short positions are not reported."}</li>
        <li>{he ? "החזקה שנעלמה מדוח מאוחר יותר איננה הוכחה למכירה." : "A position missing from a later filing is not proof of a sale."}</li>
        <li>{he ? "בלי מחירי ביצוע מנוחשים: מחירי סגירה יומיים בלבד, בלי עמלות, מסים ודיבידנדים. משקלים לפי הערכים המדווחים." : "No execution prices are inferred: daily closes only, no costs, taxes or dividends. Weights follow the reported values."}</li>
      </ul>
      {data.sourceUrl && <p className="mt-1"><a href={data.sourceUrl} target="_blank" rel="noreferrer" className="underline" dir="ltr">SEC</a></p>}
    </div>
  );
}
