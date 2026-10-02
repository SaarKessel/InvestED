import { useState } from "react";
import { calibrate, MIN_FORECASTS } from "@/lib/lessons/calibration";
import { circuitBreaker, HUMILITY_STREAK, shouldShowHumility, trailingMisses } from "@/lib/lessons/humility";
import { Edu, inputCls, Num, parseNum, Section } from "./shared";

interface Row { p: string; outcome: "" | "1" | "0" }
const rowOk = (r: Row) => { const p = parseNum(r.p); return p !== null && p >= 0 && p <= 100 && r.outcome !== ""; };
export function CalibrationLesson({ he }: { he: boolean }) {
  const [rows, setRows] = useState<Row[]>([{ p: "", outcome: "" }]);
  const [equity, setEquity] = useState("");
  const [limit, setLimit] = useState("");
  const valid = rows.filter(rowOk);
  const forecasts = valid.map((r) => ({ probability: (parseNum(r.p) as number) / 100, outcome: Number(r.outcome) as 0 | 1 }));
  const cal = calibrate(forecasts);
  // A forecast at exactly 50% says nothing either way, so it is neither a hit nor a miss.
  const history = forecasts.map((f, i) => ({ f, i })).filter(({ f }) => f.probability !== 0.5).map(({ f, i }) => ({ resolvedAt: new Date(Date.UTC(2000, 0, 1 + i)).toISOString(), hit: (f.probability > 0.5) === (f.outcome === 1) }));
  const eq = equity.split(/[\s,]+/).filter(Boolean).map(Number);
  const lim = parseNum(limit);
  const br = lim !== null ? circuitBreaker(eq, lim) : null;
  return (
    <>
      <Section title={he ? "כיול: האם 70% שלכם באמת התממש ב-70%?" : "Calibration: did your 70% really happen 70% of the time?"}>
        <p className="text-sm">{he ? "לכל תחזית הזינו את הסיכוי שנתתם (0-100) ואת מה שקרה. ציון בריר הוא ממוצע של (סיכוי פחות תוצאה) בריבוע: 0 מושלם, ו-0.25 זה הניחוש של 50% תמיד." : "For each forecast, enter the chance you gave (0-100) and what happened. The Brier score is the average of (chance minus outcome) squared: 0 is perfect, and 0.25 is what always saying 50% scores."}</p>
        <div className="space-y-2" dir="ltr">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input aria-label={he ? "סיכוי באחוזים" : "Chance in percent"} type="number" min="0" max="100" value={r.p} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, p: e.target.value } : x)))} className={inputCls} />
              <select aria-label={he ? "מה קרה" : "What happened"} value={r.outcome} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, outcome: e.target.value as Row["outcome"] } : x)))} className={inputCls}><option value="">{he ? "בחרו" : "Pick"}</option><option value="1">{he ? "קרה" : "Happened"}</option><option value="0">{he ? "לא קרה" : "Did not happen"}</option></select>
              <button type="button" disabled={rows.length === 1} onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={he ? "הסר שורה" : "Remove row"} className="rounded-lg border px-3 text-sm disabled:opacity-40">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows([...rows, { p: "", outcome: "" }])} className="rounded-lg border px-3 py-1.5 text-sm">{he ? "הוסף תחזית" : "Add forecast"}</button>
        {!cal && <p role="status" className="text-sm text-muted-foreground">{he ? `צריך לפחות ${MIN_FORECASTS} תחזיות שהתממשו או לא כדי לתת ציון.` : `At least ${MIN_FORECASTS} resolved forecasts are needed for a score.`}</p>}
        {cal && (
          <div className="space-y-2 text-sm" data-testid="brier-result">
            <p>{he ? "ציון בריר" : "Brier score"}: <b dir="ltr" data-testid="brier">{cal.brier.toFixed(3)}</b> · {he ? "ניחוש 50% תמיד" : "always 50%"}: <b dir="ltr">0.250</b></p>
            <p>{cal.verdict === "better_than_coin_flip" ? (he ? "טוב יותר מהטלת מטבע." : "Better than a coin flip.") : cal.verdict === "worse_than_coin_flip" ? (he ? "גרוע מהטלת מטבע: כנראה ביטחון יתר." : "Worse than a coin flip: that usually means overconfidence.") : (he ? "זהה להטלת מטבע." : "Same as a coin flip.")}</p>
            <table className="w-full text-xs" dir="ltr"><thead><tr><th className="text-start">{he ? "טווח" : "Range"}</th><th className="text-end">{he ? "תחזיות" : "Forecasts"}</th><th className="text-end">{he ? "ממוצע שנתתם" : "Avg you said"}</th><th className="text-end">{he ? "קרה בפועל" : "Actually happened"}</th></tr></thead>
              <tbody>{cal.bins.map((b) => <tr key={b.from} className="border-t border-border/50"><td>{Math.round(b.from * 100)}-{Math.round(b.to * 100)}%</td><td className="text-end">{b.count}</td><td className="text-end">{(b.meanForecast * 100).toFixed(0)}%</td><td className="text-end">{(b.observedRate * 100).toFixed(0)}%</td></tr>)}</tbody></table>
          </div>
        )}
        {shouldShowHumility(history) && (
          <div role="status" data-testid="humility-note" className="rounded-lg border border-amber-400/60 bg-amber-400/10 p-3 text-sm">
            <p className="font-semibold">{he ? `${trailingMisses(history)} פספוסים ברצף` : `${trailingMisses(history)} misses in a row`}</p>
            <p>{he ? `אחרי ${HUMILITY_STREAK} פספוסים ברצף כדאי לעצור ולבדוק: האם הסיכויים שנתתם היו גבוהים מדי? פספוסים ברצף קורים גם לטובים, ועדיין הם סימן להקטין ביטחון ולבדוק את ההנחות. זה שיעור, לא הוראה לפעול.` : `After ${HUMILITY_STREAK} misses in a row it is worth pausing to ask whether your stated chances were too high. Streaks happen even to good forecasters, but they are a cue to lower confidence and recheck assumptions. This is a lesson, not an instruction to act.`}</p>
          </div>
        )}
        <Edu he={he} />
      </Section>
      <Section title={he ? "מפסק זרם: מתי עוצרים הפסד" : "Circuit breaker: when a loss stops the game"}>
        <p className="text-sm">{he ? "הזינו סדרת שווי תיק (מופרדת בפסיקים) ואת הסף שלכם באחוזים. נראה מתי הירידה מהשיא חוצה אותו. הסף הוא שלכם: אין כאן המלצה." : "Enter a series of portfolio values (comma separated) and your own limit in percent. We show when the fall from the peak first crosses it. The limit is yours: nothing here is a recommendation."}</p>
        <label className="block text-sm font-medium">{he ? "שווי לאורך זמן" : "Values over time"}<input dir="ltr" value={equity} onChange={(e) => setEquity(e.target.value)} placeholder="100, 112, 108, 95" className={inputCls} /></label>
        <Num label={he ? "סף ירידה מהשיא, %" : "Drawdown limit, %"} value={limit} set={setLimit} />
        {lim !== null && !br && <p role="alert" className="text-sm text-rose-300">{he ? "צריך לפחות שני ערכים חיוביים וסף בין 0 ל-100." : "Needs at least two positive values and a limit between 0 and 100."}</p>}
        {br && <p data-testid="breaker-result" className="text-sm">{br.tripped ? (he ? `המפסק נחתך בנקודה ${br.trippedAtIndex! + 1}: ירידה של ${br.drawdownPct}% מהשיא ${br.peak}. בשלב הזה המשחק עוצר ולומדים מה קרה.` : `The breaker trips at point ${br.trippedAtIndex! + 1}: down ${br.drawdownPct}% from the peak of ${br.peak}. This is where the game pauses so you can study what happened.`) : (he ? "המפסק לא נחתך: הירידה מהשיא נשארה מתחת לסף." : "The breaker never trips: the fall from the peak stayed under your limit.")}</p>}
      </Section>
    </>
  );
}
