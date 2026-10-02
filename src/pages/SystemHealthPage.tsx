import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/context/languageContext";
import { clearTraces, loadTraces, summarize } from "@/lib/intelligence/traceStore";

/** Observability: how recent questions on this device were answered. Reads the device-local trace log only; questions are stored as hashes, so none appear here. */
export default function SystemHealthPage() {
  const { language } = useLanguage();
  const he = language === "he";
  const [traces, setTraces] = useState(() => loadTraces());
  const sum = summarize(traces);
  const recent = [...traces].reverse().slice(0, 20);
  return (
    <Layout>
      <section className="container max-w-4xl py-10" dir={he ? "rtl" : "ltr"}>
        <h1 className="text-3xl font-extrabold">{he ? "בריאות המערכת" : "System health"}</h1>
        <p className="mt-3 text-muted-foreground">{he ? "איך נענו השאלות האחרונות במכשיר הזה. השאלות עצמן לא נשמרות, רק סימן קצר." : "How recent questions on this device were answered. The questions themselves are not stored, only a short mark."}</p>
        {traces.length === 0 ? <p className="mt-6" data-testid="health-empty">{he ? "עדיין אין נתונים. שאלו שאלת מחקר מעמיק כדי לראות כאן תוצאות." : "No data yet. Ask a deep research question to see results here."}</p> : (
          <>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="health-summary">
              <div className="rounded-xl border p-4"><dt className="text-xs text-muted-foreground">{he ? "תשובות" : "Answers"}</dt><dd className="text-2xl font-bold">{sum.count}</dd></div>
              <div className="rounded-xl border p-4"><dt className="text-xs text-muted-foreground">{he ? "עברו בדיקה עצמית" : "Passed self-check"}</dt><dd className="text-2xl font-bold">{Math.round((sum.okRate ?? 0) * 100)}%</dd></div>
              <div className="rounded-xl border p-4"><dt className="text-xs text-muted-foreground">{he ? "זמן חציוני (מ״ש)" : "Median time (ms)"}</dt><dd className="text-2xl font-bold">{sum.p50}</dd></div>
              <div className="rounded-xl border p-4"><dt className="text-xs text-muted-foreground">p95 (ms)</dt><dd className="text-2xl font-bold">{sum.p95}</dd></div>
            </dl>
            {Object.keys(sum.failures).length > 0 && <p className="mt-4 text-sm">{he ? "בדיקות שנכשלו: " : "Failed checks: "}{Object.entries(sum.failures).map(([k, v]) => `${k} (${v})`).join(", ")}</p>}
            <table className="mt-6 w-full text-sm">
              <thead><tr className="text-start"><th className="p-2 text-start">{he ? "זמן" : "Time"}</th><th className="p-2 text-start">{he ? "מסלול" : "Route"}</th><th className="p-2 text-start">ms</th><th className="p-2 text-start">{he ? "תוצאה" : "Result"}</th></tr></thead>
              <tbody>{recent.map((t, i) => <tr key={i} className="border-t"><td className="p-2">{new Date(t.at).toLocaleString(he ? "he-IL" : "en-US")}</td><td className="p-2">{t.route}</td><td className="p-2">{t.ms}</td><td className="p-2">{t.ok ? (he ? "עבר" : "passed") : t.failedChecks.join(", ")}</td></tr>)}</tbody>
            </table>
            <button type="button" onClick={() => { clearTraces(); setTraces([]); }} className="mt-6 rounded-xl border border-destructive/40 px-4 py-2 text-sm font-bold text-destructive">{he ? "מחיקת הנתונים" : "Clear this data"}</button>
          </>
        )}
      </section>
    </Layout>
  );
}
