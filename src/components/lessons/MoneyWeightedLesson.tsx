import { useState } from "react";
import { moneyWeightedReturn, type CashFlow } from "@/lib/lessons/moneyWeighted";
import { Edu, Num, Section } from "./shared";
import { inputCls, parseNum } from "./sharedUtil";

interface Row { date: string; amount: string }
export function MoneyWeightedLesson({ he }: { he: boolean }) {
  const [rows, setRows] = useState<Row[]>([{ date: "", amount: "" }]);
  const [ending, setEnding] = useState("");
  const [endDate, setEndDate] = useState("");
  const flows: CashFlow[] = rows.filter((r) => r.date && parseNum(r.amount) !== null).map((r) => ({ date: r.date, amount: parseNum(r.amount) as number }));
  const end = parseNum(ending);
  const result = flows.length > 0 && end !== null && endDate ? moneyWeightedReturn(flows, end, endDate) : null;
  const fmt = (n: number) => n.toLocaleString(he ? "he-IL" : "en-US", { maximumFractionDigits: 2 });
  return (
    <Section title={he ? "האם התיק גדל, או שסתם הפקדתי עוד?" : "Did my portfolio grow, or did I just deposit more?"}>
      <p className="text-sm">{he ? "הזינו כל הפקדה (חיובי) או משיכה (שלילי) עם תאריך, ואת שווי התיק היום. תקבלו רווח נטו ותשואה שנתית משוקללת כסף." : "Enter each deposit (positive) or withdrawal (negative) with its date, plus what the portfolio is worth on the end date. You get net gain and a yearly money-weighted return."}</p>
      <div className="space-y-2" dir="ltr">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input aria-label={he ? "תאריך" : "Date"} type="date" value={r.date} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} className={inputCls} />
            <input aria-label={he ? "סכום" : "Amount"} type="number" step="any" value={r.amount} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} className={inputCls} />
            <button type="button" disabled={rows.length === 1} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="rounded-lg border px-3 text-sm disabled:opacity-40" aria-label={he ? "הסר שורה" : "Remove row"}>×</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setRows([...rows, { date: "", amount: "" }])} className="rounded-lg border px-3 py-1.5 text-sm">{he ? "הוסף שורה" : "Add row"}</button>
      <div className="grid gap-2 sm:grid-cols-2">
        <Num label={he ? "שווי התיק בתאריך הסיום" : "Portfolio value on the end date"} value={ending} set={setEnding} min="0" />
        <label className="block text-sm font-medium">{he ? "תאריך סיום" : "End date"}<input dir="ltr" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} /></label>
      </div>
      {result?.status === "invalid" && <p role="alert" className="text-sm text-rose-300">{{ dates: he ? "בדקו את התאריכים: כל תאריך חייב להיות תקין ולא אחרי תאריך הסיום." : "Check the dates: each must be valid and not after the end date.", amounts: he ? "סכומים חייבים להיות מספרים שאינם אפס, ושווי סופי לא שלילי." : "Amounts must be non-zero numbers and the ending value cannot be negative.", too_short: he ? "התקופה קצרה מיום אחד, אין תשואה שנתית לחשב." : "The period is under one day, so no yearly return can be computed.", no_flows: he ? "הוסיפו לפחות הפקדה אחת." : "Add at least one deposit." }[result.reason]}</p>}
      {result && result.status !== "invalid" && (
        <div className="space-y-2 text-sm" data-testid="mwr-result">
          <p>{he ? "הפקדות" : "Contributions"}: <b dir="ltr">{fmt(result.contributions)}</b> · {he ? "משיכות" : "Withdrawals"}: <b dir="ltr">{fmt(result.withdrawals)}</b> · {he ? "רווח נטו" : "Net gain"}: <b dir="ltr">{fmt(result.netGain)}</b></p>
          {result.status === "ok" && <p>{he ? "תשואה שנתית משוקללת כסף" : "Annual money-weighted return"}: <b dir="ltr" data-testid="mwr-rate">{(result.annualRate * 100).toFixed(2)}%</b></p>}
          {result.status === "no_solution" && <p role="status">{he ? "אין פתרון: מהנתונים האלה אי אפשר לחשב תשואה שנתית, ולכן לא מוצגת תשואה." : "No solution: these cash flows give no yearly return, so none is shown."}</p>}
          {result.status === "ambiguous" && <p role="status">{he ? "יותר מפתרון אחד: המשוואה נותנת כמה תשואות אפשריות, ולכן לא נבחרת אחת. פשטו את התזרים." : "Ambiguous: the cash flows fit more than one yearly return, so none is picked. Try a simpler timeline."}</p>}
          <table className="w-full text-xs" dir="ltr"><caption className="pb-1 text-start">{he ? "ציר תזרים" : "Cash-flow timeline"}</caption><tbody>{result.timeline.map((t, i) => <tr key={i} className="border-t border-border/50"><td>{t.date}</td><td className="text-end">{fmt(t.amount)}</td><td className="text-end">{fmt(t.cumulativeNet)}</td></tr>)}</tbody></table>
        </div>
      )}
      <Edu he={he} />
    </Section>
  );
}
