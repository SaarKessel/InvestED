import { useLanguage } from "@/context/languageContext";
import { imfLabel, type MacroResult } from "@/lib/copilot/macroDesk";

/** ECB policy rate with the date of each decision, or IMF WEO figures with estimates and projections marked. */
export function ChatMacroCard({ data }: { data: MacroResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  if (data.kind === "ecb_rate") {
    return (
      <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs" data-testid="macro-card">
        <p className="font-semibold">{he ? "ריבית המדיניות של ה-ECB (פעולות מימון מרכזיות)" : "ECB main refinancing operations rate"}</p>
        <p className="mt-1 text-sm font-semibold" dir="ltr">{data.rate.latest.ratePct}% · {he ? "בתוקף מ-" : "effective"} {data.rate.latest.date}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" dir="ltr">
          {data.rate.series.map((p) => <div key={p.date}><p className="text-muted-foreground">{p.date}</p><p className="font-semibold">{p.ratePct}%</p></div>)}
        </div>
        <p className="mt-2 text-muted-foreground">{he ? "מוצגות ההחלטות האחרונות על שינוי הריבית." : "The most recent rate decisions are shown."}</p>
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs" data-testid="macro-card">
      <p className="font-semibold">{data.countryName[he ? "he" : "en"]} · {imfLabel(data.indicator)[he ? "he" : "en"]}</p>
      <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6" dir="ltr">
        {data.points.map((p) => <div key={p.year}><p className="text-muted-foreground">{p.year}{p.projected ? (he ? " (הערכת IMF)" : " (IMF est.)") : ""}</p><p className="mt-0.5 text-sm font-semibold">{Number(p.value.toFixed(1))}%</p></div>)}
      </div>
      <p className="mt-2 text-muted-foreground">{he ? "מקור: קרן המטבע הבינלאומית, World Economic Outlook. שנים מסומנות כהערכת IMF הן הערכות והקרנות של ה-IMF, לא נתונים שדווחו ולא תחזית של InvestED." : "Source: IMF World Economic Outlook. Years marked IMF est. are IMF estimates and projections, not reported data and not an InvestED forecast."}</p>
    </div>
  );
}
