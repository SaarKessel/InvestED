import { useLanguage } from "@/context/languageContext";
import { formatUsd, type FilingsResult } from "@/lib/copilot/filingsDesk";

/** Latest Form 13F holdings of one manager, as reported to the SEC. Shows the report and filing dates and says what 13F is not. */
export function ChatFilingsCard({ data }: { data: FilingsResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  const lang = he ? "he" : "en";
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs" data-testid="filings-card">
      <p className="font-semibold">{data.managerName[lang]} · {he ? "החזקות לפי טופס 13F" : "Holdings per Form 13F"}</p>
      <p className="mt-1 text-muted-foreground" dir="ltr">
        {he ? "נכון ל" : "As of "}{data.reportDate} · {he ? "הוגש" : "filed"} {data.filingDate}
        {data.reportedTotalValueUsd !== null && <> · {he ? "סך מדווח" : "reported total"} {formatUsd(data.reportedTotalValueUsd)}</>}
        {data.reportedEntryCount !== null && <> · {data.reportedEntryCount} {he ? "שורות" : "entries"}</>}
      </p>
      <div className="mt-2 overflow-x-auto" dir="ltr">
        <table className="w-full text-start">
          <thead className="text-muted-foreground"><tr><th className="pe-3 text-start font-medium">{he ? "חברה" : "Issuer"}</th><th className="pe-3 text-end font-medium">{he ? "מניות" : "Shares"}</th><th className="pe-3 text-end font-medium">{he ? "שווי" : "Value"}</th><th className="text-end font-medium">%</th></tr></thead>
          <tbody>
            {data.holdings.map((h) => (
              <tr key={`${h.cusip}-${h.titleOfClass}`} className="border-t border-border/50">
                <td className="py-1 pe-3">{h.issuer}</td>
                <td className="pe-3 text-end">{h.shares.toLocaleString("en-US")}</td>
                <td className="pe-3 text-end">{formatUsd(h.valueUsd)}</td>
                <td className="text-end">{h.weightPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-muted-foreground">
        {he ? "מוצגות 10 ההחזקות הגדולות. 13F מדווח באיחור של עד 45 יום, כולל רק פוזיציות לונג בניירות אמריקאיים, ואינו תיק חי. ערכים כפי שדווחו, בלי הערכות." : "Top 10 holdings shown. 13F is filed up to 45 days after quarter end, covers long positions in US-listed securities only, and is not a live portfolio. Values as reported, nothing estimated."}
        {data.sourceUrl && <> <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="underline" dir="ltr">SEC</a></>}
      </p>
    </div>
  );
}
