import { useLanguage } from "@/context/languageContext";
import { fmt, type MathDeskResult } from "@/lib/copilot/mathDesk";

/** Plain arithmetic result with its steps. Fixed parser, no model. */
export function ChatMathCard({ data }: { data: MathDeskResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  if (!data.ok) {
    const msg = data.error === "divide_by_zero" ? (he ? "אי אפשר לחלק באפס." : "Division by zero has no answer.")
      : data.error === "too_large" ? (he ? "התוצאה גדולה מדי להצגה." : "The result is too large to show.")
      : (he ? "לא הצלחתי לקרוא את החישוב הזה בצורה בטוחה, ולכן לא חישבתי כלום. נסו לכתוב אותו עם סוגריים, למשל (100+50)*2." : "I could not read this calculation safely, so I did not calculate anything. Try writing it with brackets, for example (100+50)*2.");
    return <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs"><p className="font-semibold">{msg}</p></div>;
  }
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
      <p className="font-semibold">{he ? "חישוב" : "Calculation"}</p>
      <p className="mt-1 font-mono text-muted-foreground" dir="ltr">{data.expression}</p>
      <p className="mt-2 text-lg font-semibold" dir="ltr">= {fmt(Number((data.value ?? 0).toFixed(4)))}</p>
      {/\b(?:cagr|pmt|fv|real)\s*\(/i.test(data.expression) && <p className="mt-2 text-muted-foreground">{he ? "הנוסחאות: pmt = תשלום חודשי קבוע, fv = ערך עתידי (ריבית חודשית, הפקדה בסוף חודש), cagr = תשואה שנתית ממוצעת באחוזים, real = תשואה ריאלית אחרי אינפלציה." : "Formulas: pmt = fixed monthly payment, fv = future value (monthly compounding, deposits at month end), cagr = average yearly growth in percent, real = return after inflation."}</p>}
      {data.steps.length > 1 && (
        <details className="mt-2">
          <summary className="cursor-pointer select-none font-medium text-muted-foreground hover:text-foreground">{he ? "איך חושב" : "How it was calculated"}</summary>
          <ol className="mt-1.5 list-decimal space-y-1 ps-5 font-mono text-muted-foreground" dir="ltr">{data.steps.map((s, i) => <li key={i}>{s.expr} = {fmt(s.value)}</li>)}</ol>
        </details>
      )}
    </div>
  );
}
