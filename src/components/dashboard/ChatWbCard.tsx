import { useLanguage } from "@/context/languageContext";
import { fmt } from "@/lib/copilot/mathDesk";
import { wbLabel, type WbResult } from "@/lib/copilot/worldBankDesk";

/** Yearly country statistic with the year of every value and the source line (World Bank, CC BY 4.0). */
export function ChatWbCard({ data }: { data: WbResult }) {
  const { language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
      <p className="font-semibold">{data.countryName[lang]} · {wbLabel(data.indicator)[lang]}</p>
      <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6" dir="ltr">
        {data.points.map((p) => <div key={p.year}><p className="text-muted-foreground">{p.year}</p><p className="mt-0.5 text-sm font-semibold">{fmt(Number(p.value.toFixed(1)))}%</p></div>)}
      </div>
      <p className="mt-2 text-muted-foreground">{lang === "he" ? `מקור: The World Bank: World Development Indicators (רישיון CC BY 4.0). נתונים שנתיים שמתפרסמים באיחור${data.lastUpdated ? `, עודכן ${data.lastUpdated}` : ""}.` : `Source: The World Bank: World Development Indicators (CC BY 4.0). Yearly values, published with a delay${data.lastUpdated ? `, updated ${data.lastUpdated}` : ""}.`}</p>
    </div>
  );
}
