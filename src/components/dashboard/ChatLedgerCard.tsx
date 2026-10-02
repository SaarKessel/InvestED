import { useLanguage } from "@/context/languageContext";
import type { LedgerResult } from "@/lib/predictions/ledgerDesk";

const pct = (n: number | undefined) => (typeof n === "number" ? `${n >= 0 ? "+" : ""}${n.toFixed(1)}%` : "-");

/** Prediction ledger: the call just saved, settled results, Brier score and the calibration table. Educational simulation, not advice. */
export function ChatLedgerCard({ data }: { data: LedgerResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  const settled = data.predictions.filter((p) => p.status === "settled");
  const open = data.predictions.filter((p) => p.status === "open");
  const msg = data.reason === "help"
    ? (he ? "כדי לרשום תחזית כתבו: סימול, כיוון (עולה/יורדת), אחוז ביטחון (50-99%) ואופק (7 עד 365 ימים). למשל: \"תחזית: AAPL תעלה תוך 30 ימים, 70%, צמיחה בשירותים\"." : "To log a call, write a symbol, a direction (up or down), a confidence (50-99%) and a horizon (7 to 365 days). Example: \"prediction: AAPL up in 30 days, 70% sure, services growth\".")
    : data.reason === "signin" ? (he ? "צריך להתחבר כדי לשמור תחזיות. הן נשמרות בחשבון שלכם בלבד." : "Sign in to keep predictions. They are saved to your account only.")
    : data.reason === "closes_unavailable" ? (he ? "לא הצלחתי לטעון עכשיו מחירי סגירה אמיתיים, ולכן לא שמרתי כלום. נסו שוב בעוד רגע." : "I could not load real closing prices right now, so nothing was saved. Try again in a moment.")
    : data.reason === "save_failed" ? (he ? "לא הצלחתי לשמור או לקרוא את הרשומה. נסו שוב." : "I could not save or read the ledger. Try again.")
    : null;
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs" data-testid="ledger-card">
      <p className="font-semibold">{he ? "רשומת תחזיות וכיול" : "Prediction ledger and calibration"}</p>
      {msg && <p className="mt-1" role="status">{msg}</p>}
      {data.created && (
        <p className="mt-2" dir="ltr" data-testid="ledger-created">
          {he ? "נשמר: " : "Saved: "}{data.created.symbol} {data.created.direction === "up" ? "↑" : "↓"} {data.created.confidence}% · {he ? "סגירה בסיס" : "base close"} {data.created.entryClose} ({data.created.entryDate}) · {he ? "ייסגר ב" : "settles on"} {data.created.dueDate}
        </p>
      )}
      {data.settledNow > 0 && <p className="mt-1">{he ? `${data.settledNow} תחזיות נסגרו כעת מול מחירי סגירה אמיתיים.` : `${data.settledNow} call(s) settled just now against real closing prices.`}</p>}
      {settled.length > 0 && (
        <div className="mt-2 overflow-x-auto" dir="ltr">
          <table className="w-full text-start">
            <thead className="text-muted-foreground"><tr><th className="pe-3 text-start font-medium">{he ? "סימול" : "Symbol"}</th><th className="pe-3 text-end font-medium">{he ? "ביטחון" : "Stated"}</th><th className="pe-3 text-end font-medium">{he ? "תוצאה" : "Result"}</th><th className="pe-3 text-end font-medium">{he ? "תשואה" : "Return"}</th><th className="text-end font-medium">SPY</th></tr></thead>
            <tbody>{settled.slice(0, 10).map((p) => (
              <tr key={p.id} className="border-t border-border/50"><td className="py-1 pe-3">{p.symbol} {p.direction === "up" ? "↑" : "↓"}</td><td className="pe-3 text-end">{p.confidence}%</td><td className="pe-3 text-end">{p.hit ? (he ? "פגיעה" : "hit") : (he ? "החמצה" : "miss")}</td><td className="pe-3 text-end">{pct(p.returnPct)}</td><td className="text-end">{pct(p.spyReturnPct)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {open.length > 0 && <p className="mt-2 text-muted-foreground" dir="ltr">{he ? "פתוחות: " : "Open: "}{open.map((p) => `${p.symbol} ${p.direction === "up" ? "↑" : "↓"} ${p.confidence}% → ${p.dueDate}`).join(" · ")}</p>}
      {settled.length > 0 && (
        <div className="mt-2" data-testid="ledger-calibration">
          <p className="font-medium">{he ? "ציון Brier" : "Brier score"}: <span dir="ltr">{data.brier === null ? "-" : data.brier.toFixed(3)}</span> <span className="text-muted-foreground">{he ? "(0 מושלם, 0.25 כמו תמיד לומר 50%)" : "(0 is perfect, 0.25 is always saying 50%)"}</span></p>
          <table className="mt-1 w-full text-start" dir="ltr">
            <thead className="text-muted-foreground"><tr><th className="pe-3 text-start font-medium">{he ? "ביטחון מוצהר" : "Stated"}</th><th className="pe-3 text-end font-medium">{he ? "תחזיות" : "Calls"}</th><th className="pe-3 text-end font-medium">{he ? "התגשמו בפועל" : "Came true"}</th></tr></thead>
            <tbody>{data.bins.filter((b) => b.n > 0).map((b) => (
              <tr key={b.label} className="border-t border-border/50"><td className="py-1 pe-3">{b.label}</td><td className="pe-3 text-end">{b.n}</td><td className="pe-3 text-end">{b.hitRate === null ? "-" : `${b.hitRate.toFixed(0)}%`}{!b.enough && <span className="text-muted-foreground"> ({he ? "מעט מדי כדי לשפוט" : "too few to judge"})</span>}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {!msg && settled.length === 0 && <p className="mt-2 text-muted-foreground">{he ? "עוד אין תחזיות שנסגרו. הציון והכיול יופיעו אחרי הסגירה הראשונה." : "No call has settled yet. The score and calibration appear after the first one does."}</p>}
      <p className="mt-2 text-muted-foreground">{he ? "סימולציה לימודית, לא ייעוץ השקעות. הסגירה נעשית מול מחירי סגירה יומיים אמיתיים של Yahoo Finance, בלי דיבידנדים, לפי הסגירה האחרונה שהושלמה." : "Educational simulation, not investment advice. Settled against real Yahoo Finance daily closes, dividends not included, using the last completed close."}</p>
    </div>
  );
}
