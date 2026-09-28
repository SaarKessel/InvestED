import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketAsset } from "@/types";
import { useLanguage } from "@/context/languageContext";

type WindowSize = 22 | 66 | "all";

/** Visualize provider-backed closing prices only. The range controls slice observations, not calendar days. */
export function ResearchHistoryChart({ history, currency }: { history: NonNullable<MarketAsset["history"]>; currency: string | null }) {
  const { language, t } = useLanguage();
  const [windowSize, setWindowSize] = useState<WindowSize>("all");
  const [showDataTable, setShowDataTable] = useState(false);
  const points = useMemo(() => windowSize === "all" ? history : history.slice(-windowSize), [history, windowSize]);
  const range = points.length ? `${points[0].date} – ${points[points.length - 1].date}` : "";
  const windows: { size: WindowSize; label: string }[] = [
    { size: 22, label: language === "he" ? "22 תצפיות" : "22 points" },
    { size: 66, label: language === "he" ? "66 תצפיות" : "66 points" },
    { size: "all", label: language === "he" ? "הכול" : "All" },
  ];
  if (!history.length) return <p>{language === "he" ? "הנתונים אינם זמינים" : "Data unavailable"}</p>;

  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">{language === "he" ? "מחירי סגירה היסטוריים בלבד, לא תחזית" : "Historical closing prices only, not a forecast"} · <span dir="ltr">{range}</span></p>
      <div className="inline-flex rounded-xl border border-border bg-background/70 p-1" role="group" aria-label={language === "he" ? "טווח תצפיות" : "Observation range"}>
        {windows.filter(({ size }) => size === "all" || history.length > size).map(({ size, label }) => <button key={size} type="button" aria-pressed={windowSize === size} onClick={() => setWindowSize(size)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${windowSize === size ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>)}
      </div>
    </div>
    <button type="button" aria-expanded={showDataTable} aria-controls="research-history-data-table" onClick={() => setShowDataTable(current => !current)} className="mb-3 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      {showDataTable ? (language === "he" ? "הסתר נתונים" : "Hide data") : (language === "he" ? "הצג נתונים בטבלה" : "View data as table")}
    </button>
    <div className="h-72 w-full" role="img" aria-label={`${t("research_history_chart")}. ${points.length} ${language === "he" ? "תצפיות" : "observations"}. ${range}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
          <defs><linearGradient id="research-price-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false} opacity={0.65}/>
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={28} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}/>
          <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={54} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}/>
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} formatter={(value: number) => [`${value.toLocaleString(language === "he" ? "he-IL" : "en-US", { maximumFractionDigits: 2 })} ${currency ?? ""}`, language === "he" ? "מחיר סגירה" : "Close"]}/>
          <Area type="monotone" dataKey="close" stroke="hsl(var(--primary))" fill="url(#research-price-fill)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }} isAnimationActive={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
    {showDataTable && <div id="research-history-data-table" className="mt-4 max-h-80 overflow-auto rounded-xl border border-border" tabIndex={0}>
      <table className="w-full min-w-[260px] border-collapse text-sm tabular-nums">
        <caption className="sr-only">{language === "he" ? "מחירי סגירה היסטוריים בטווח הנבחר" : "Historical closing prices for the selected range"}</caption>
        <thead className="sticky top-0 bg-card"><tr className="border-b border-border"><th scope="col" className="p-2 text-start">{language === "he" ? "תאריך" : "Date"}</th><th scope="col" className="p-2 text-end">{language === "he" ? "מחיר סגירה" : "Close"}</th></tr></thead>
        <tbody>{points.map((point, index) => <tr key={`${point.date}-${index}`} className="border-b border-border/50 last:border-0"><th scope="row" className="p-2 text-start font-medium" dir="ltr">{point.date}</th><td className="p-2 text-end" dir="ltr">{point.close.toLocaleString(language === "he" ? "he-IL" : "en-US", { maximumFractionDigits: 2 })} {currency ?? ""}</td></tr>)}</tbody>
      </table>
    </div>}
  </div>;
}
