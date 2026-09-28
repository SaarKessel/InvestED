// ---------------------------------------------------------------------------
// InvestED — Investment Growth Chart
// Portfolio Growth Visualization
// ---------------------------------------------------------------------------
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLanguage } from "@/context/languageContext";
import { getCurrencyByCode } from "@/lib/currencies";

interface ProjectionPoint {
  year: number;
  balance: number;
  contributed: number;
}

interface Props {
  data: ProjectionPoint[];
  currency?: string;
}

export function InvestmentGrowthChart({ data, currency = "ILS" }: Props) {
  const { t, language } = useLanguage();
  const [windowYears, setWindowYears] = useState<number | "all">("all");
  const [showDataTable, setShowDataTable] = useState(false);
  const lastYear = data.at(-1)?.year ?? 0;
  const visibleData = useMemo(() => windowYears === "all" ? data : data.filter(point => point.year >= lastYear - windowYears), [data, lastYear, windowYears]);
  const windows = [5, 10].filter(years => lastYear > years);

  const locale = language === "he" ? "he-IL" : "en-US";

  const currencyInfo = getCurrencyByCode(currency);

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyInfo.currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatAxisValue(value: number): string {
    const numericValue = Number(value);

    if (numericValue >= 1_000_000) {
      return `${currencyInfo.symbol}${(numericValue / 1_000_000).toFixed(1)}M`;
    }

    if (numericValue >= 1_000) {
      return `${currencyInfo.symbol}${Math.round(numericValue / 1_000)}K`;
    }

    return `${currencyInfo.symbol}${Math.round(numericValue)}`;
  }

  if (!data || data.length === 0) {
    return (
    <section
      dir={language === "he" ? "rtl" : "ltr"}
      className="
          mt-8
          rounded-3xl
          border
          border-border
          bg-card
          p-6
          shadow-soft
        "
      >
        <h2 className="text-2xl font-bold">
          {t("investment_chart_title", "📈 Investment Growth Over Time")}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {t("investment_chart_empty", "Not enough data to display the growth chart.")}
        </p>
      </section>
    );
  }

  return (
    <section
      dir={language === "he" ? "rtl" : "ltr"}
      aria-label={t("investment_chart_aria", "Investment growth chart")}
      className="projection-surface mt-8 rounded-3xl border border-primary/20 bg-card p-4 shadow-soft sm:p-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {t("investment_chart_title", "📈 Investment Growth Over Time")}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {t("investment_chart_subtitle", "Comparison between the money contributed and the value accumulated from the investment over the years.")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{language === "he" ? "סימולציה לפי ההנחות שהוזנו, לא תשואה מובטחת" : "Simulation from entered assumptions, not guaranteed returns"}</p>
          {windows.length > 0 && <div role="group" aria-label={language === "he" ? "טווח שנות הסימולציה" : "Simulation year range"} className="inline-flex rounded-xl border border-border bg-background/80 p-1">
            {windows.map(years => <button type="button" key={years} aria-pressed={windowYears === years} onClick={() => setWindowYears(years)} className={`rounded-lg px-3 py-1 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${windowYears === years ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{years} {language === "he" ? "שנים" : "years"}</button>)}
            <button type="button" aria-pressed={windowYears === "all"} onClick={() => setWindowYears("all")} className={`rounded-lg px-3 py-1 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${windowYears === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{language === "he" ? "הכול" : "All"}</button>
          </div>}
        </div>
        <button type="button" aria-expanded={showDataTable} aria-controls="projection-data-table" onClick={() => setShowDataTable(current => !current)} className="mt-4 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          {showDataTable ? (language === "he" ? "הסתר נתונים" : "Hide data") : (language === "he" ? "הצג נתונים בטבלה" : "View data as table")}
        </button>
      </div>

      <div className="h-[320px] w-full min-w-0 sm:h-[350px]" role="img" aria-label={`${t("investment_chart_aria", "Investment growth chart")}. ${language === "he" ? "שנים" : "Years"} ${visibleData[0]?.year ?? 0}–${visibleData.at(-1)?.year ?? 0}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleData}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
            />

            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => `${value}`}
              label={{
                value: t("investment_chart_xaxis", "Years"),
                position: "insideBottom",
                offset: -5,
              }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatAxisValue}
              width={70}
            />

            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === "balance"
                  ? t("investment_chart_tooltip_balance", "Portfolio Value")
                  : t("investment_chart_tooltip_contributed", "Total Contributions"),
              ]}
              labelFormatter={(label) => `${t("investment_chart_label_year", "Year")} ${label}`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{
                fontWeight: 600,
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              height={36}
              formatter={(value) =>
                value === "balance"
                  ? t("investment_chart_balance_label", "Portfolio Value")
                  : t("investment_chart_contributed_label", "Total Contributions")
              }
            />

            <Line
              type="monotone"
              dataKey="balance"
              name="balance"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="contributed"
              name="contributed"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showDataTable && <div id="projection-data-table" className="mt-4 max-h-80 overflow-auto rounded-xl border border-border" tabIndex={0}>
        <table className="w-full min-w-[340px] border-collapse text-sm tabular-nums">
          <caption className="sr-only">{language === "he" ? "ערכי הסימולציה לפי שנה, בהתאם לטווח הנבחר" : "Simulated annual values for the selected range"}</caption>
          <thead className="sticky top-0 bg-card"><tr className="border-b border-border text-start"><th scope="col" className="p-3 text-start">{t("investment_chart_label_year", "Year")}</th><th scope="col" className="p-3 text-end">{t("investment_chart_balance_label", "Portfolio Value")}</th><th scope="col" className="p-3 text-end">{t("investment_chart_contributed_label", "Total Contributions")}</th></tr></thead>
          <tbody>{visibleData.map(point => <tr key={point.year} className="border-b border-border/50 last:border-0"><th scope="row" className="p-3 text-start font-semibold">{point.year}</th><td className="p-3 text-end" dir="ltr">{formatCurrency(point.balance)}</td><td className="p-3 text-end" dir="ltr">{formatCurrency(point.contributed)}</td></tr>)}</tbody>
        </table>
      </div>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            {t("investment_chart_balance_label", "Portfolio Value")}
          </p>

          <p className="mt-1 font-semibold">
            {t("investment_chart_balance_desc", "The accumulated value including investment growth.")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            {t("investment_chart_contributed_label", "Total Contributions")}
          </p>

          <p className="mt-1 font-semibold">
            {t("investment_chart_contributed_desc", "The money actually invested over the period.")}
          </p>
        </div>
      </div>
    </section>
  );
}
