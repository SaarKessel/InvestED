import { useLanguage } from "@/context/languageContext";
import { formatUsd } from "@/lib/copilot/filingsDesk";
import type { EtfResult } from "@/lib/copilot/etfDesk";

/** Top holdings of one ETF or fund from its latest public N-PORT filing. The report date leads the card; the lag is stated. */
export function ChatEtfCard({ data }: { data: EtfResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs" data-testid="etf-card">
      <p className="font-semibold" dir="ltr">{data.ticker} · {data.seriesName}</p>
      <p className="mt-1 font-semibold text-amber-700 dark:text-amber-400" dir="ltr">
        {he ? "נתוני החזקות נכון ל-" : "Holdings as of "}{data.reportDate}
        <span className="font-normal text-muted-foreground"> · {he ? "הוגש" : "filed"} {data.filingDate}</span>
      </p>
      <p className="mt-1 text-muted-foreground" dir="ltr">
        {data.totalHoldingCount} {he ? "שורות" : "rows"}
        {data.netAssetsUsd !== null && <> · {he ? "נכסים נטו" : "net assets"} {formatUsd(data.netAssetsUsd)}</>}
        {" · "}{he ? "10 הגדולות מכסות" : "top 10 cover"} {data.shownWeightPct}%
      </p>
      <div className="mt-2 overflow-x-auto" dir="ltr">
        <table className="w-full text-start">
          <thead className="text-muted-foreground"><tr><th className="pe-3 text-start font-medium">{he ? "נייר" : "Holding"}</th><th className="pe-3 text-end font-medium">{he ? "שווי" : "Value"}</th><th className="text-end font-medium">%</th></tr></thead>
          <tbody>
            {data.holdings.map((h, i) => (
              <tr key={`${h.cusip || h.name}-${i}`} className="border-t border-border/50">
                <td className="py-1 pe-3">{h.name}{h.cusip && <span className="ms-1 text-muted-foreground">{h.cusip}</span>}</td>
                <td className="pe-3 text-end">{formatUsd(h.valueUsd)}</td>
                <td className="text-end">{h.weightPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-muted-foreground">
        {he ? "מקור: דוח N-PORT של הקרן ל-SEC. רק דוחות סוף רבעון פומביים, כ-60 יום אחרי הרבעון, ולכן ההרכב עשוי להיות בן חודשים. אחוזים מהנכסים נטו, כפי שדווחו. בלי הערכות ובלי המרה לסימולים." : "Source: the fund's N-PORT report to the SEC. Only quarter-end reports are public, about 60 days after quarter end, so the mix can be months old. Percent of net assets as reported. Nothing estimated, no ticker guessing."}
        {data.sourceUrl && <> <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="underline" dir="ltr">SEC</a></>}
      </p>
    </div>
  );
}
