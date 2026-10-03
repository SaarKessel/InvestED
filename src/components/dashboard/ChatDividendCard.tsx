import { useLanguage } from "@/context/languageContext";
import type { DividendResult } from "@/lib/copilot/dividendDesk";

const money = (v: number, cur: string) => `${cur === "USD" ? "$" : cur + " "}${v.toFixed(v < 1 ? 4 : 2).replace(/0+$/, "").replace(/\.$/, "")}`;
const total = (v: number, cur: string) => `${cur === "USD" ? "$" : cur + " "}${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Dividend history (real paid amounts) and a clearly labeled estimate. The estimate is never shown as a declared payout. */
export function ChatDividendCard({ data }: { data: DividendResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  const c = data.currency;
  const e = data.estimate;
  const sh = data.shares;
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs" data-testid="dividend-card">
      <p className="font-semibold" dir="ltr">{data.symbol} · {data.name}</p>
      {data.payments.length === 0 ? (
        <p className="mt-2" data-testid="dividend-none">{he ? "לא נמצאו דיבידנדים ששולמו בנתוני המקור. ייתכן שהנייר לא מחלק דיבידנד." : "No paid dividends were found in the source data. This security may not pay a dividend."}</p>
      ) : (
        <>
          <p className="mt-1 font-semibold" dir="ltr" data-testid="dividend-ttm">
            {he ? "שולם ב-12 החודשים האחרונים: " : "Paid in the last 12 months: "}{data.trailing12mCount > 0 ? `${money(data.trailing12mPerShare, c)} ${he ? "למניה" : "per share"} (${data.trailing12mCount} ${he ? "תשלומים" : "payments"})` : (he ? "אין תשלומים" : "no payments")}
          </p>
          {sh !== null && data.trailing12mCount > 0 && <p className="mt-1" dir="ltr" data-testid="dividend-shares-ttm">{he ? `על ${sh} מניות זה היה ` : `On ${sh} shares that was `}{total(data.trailing12mPerShare * sh, c)}</p>}
          {data.trailingYieldPct !== null && <p className="mt-1 text-muted-foreground" dir="ltr">{he ? "תשואת דיבידנד נגררת" : "Trailing yield"}: {data.trailingYieldPct}%{data.priceAsOf && <> ({he ? "מחיר" : "price"} {money(data.price ?? 0, c)} {data.priceAsOf})</>}</p>}
          <div className="mt-2 overflow-x-auto" dir="ltr">
            <table className="w-full text-start">
              <thead className="text-muted-foreground"><tr><th className="pe-3 text-start font-medium">{he ? "תאריך (ex-dividend)" : "Date (ex-dividend)"}</th><th className="text-end font-medium">{he ? "סכום למניה" : "Per share"}</th></tr></thead>
              <tbody>{data.recent.map((p) => (<tr key={p.date} className="border-t border-border/50"><td className="py-1 pe-3">{p.date}</td><td className="text-end">{money(p.amount, c)}</td></tr>))}</tbody>
            </table>
          </div>
          <div className="mt-3 rounded border border-amber-500/40 p-2" data-testid="dividend-expected">
            <p className="font-semibold text-amber-700 dark:text-amber-400">{he ? "צפוי (הערכה, לא הכרזה)" : "Expected (estimate, not a declared payout)"}</p>
            {e ? (
              <div dir="ltr">
                <p className="mt-1">{he ? `בקצב של ${e.perYear} תשלומים בשנה ובסכום האחרון ${money(e.lastAmount, c)}: ` : `At ${e.perYear} payments a year and the last amount ${money(e.lastAmount, c)}: `}<span className="font-semibold">{money(e.annualPerShare, c)} {he ? "למניה בשנה" : "per share a year"}</span></p>
                {sh !== null && <p className="mt-1" data-testid="dividend-shares-expected">{he ? `על ${sh} מניות: בערך ` : `On ${sh} shares: about `}{total(e.annualPerShare * sh, c)} {he ? "בשנה" : "a year"}</p>}
                {e.yieldPct !== null && <p className="mt-1 text-muted-foreground">{he ? "תשואה צפויה לפי המחיר הנוכחי" : "Implied yield at the current price"}: {e.yieldPct}%</p>}
                {e.nextDateApprox && <p className="mt-1 text-muted-foreground">{he ? "מועד משוער לתשלום הבא (לפי המרווח ההיסטורי): " : "Approximate next ex-dividend date (from the past spacing): "}{e.nextDateApprox}</p>}
              </div>
            ) : (
              <p className="mt-1">{data.stopped ? (he ? "התשלומים האחרונים ישנים מדי, ייתכן שהחלוקה הופסקה, ולכן אין הערכה." : "The last payment is too old and the dividend may have stopped, so there is no estimate.") : (he ? "אין מספיק היסטוריה להערכה." : "Not enough history to estimate.")}</p>
            )}
          </div>
        </>
      )}
      <p className="mt-2 text-muted-foreground">
        {he ? "מקור: Yahoo Finance (נתוני גרף ציבוריים), נכון ל-" : "Source: Yahoo Finance public chart data, as of "}<span dir="ltr">{data.asOf}</span>.{" "}
        {he ? "הסכומים ששולמו הם נתוני עבר. אין כאן סכום שהוכרז: חברות יכולות להעלות, להוריד או להפסיק דיבידנד. תוכן לימודי, לא ייעוץ השקעות." : "Paid amounts are past data. No declared amount is shown here: companies can raise, cut or stop a dividend. Educational content, not investment advice."}
      </p>
    </div>
  );
}
