// ---------------------------------------------------------------------------
// InvestED — Investment Growth Chart
// Portfolio Growth Visualization
// ---------------------------------------------------------------------------
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
          {t("investment_chart_title", "📈 צמיחת ההשקעה לאורך זמן")}
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
      aria-label={t("investment_chart_aria", "גרף צמיחת ההשקעה")}
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {t("investment_chart_title", "📈 צמיחת ההשקעה לאורך זמן")}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {t("investment_chart_subtitle", "השוואה בין הכסף שהופקד לבין השווי שנצבר מההשקעה לאורך השנים.")}
        </p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
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
                value: t("investment_chart_xaxis", "שנים"),
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
                  ? t("investment_chart_tooltip_balance", "שווי תיק")
                  : t("investment_chart_tooltip_contributed", "סה״כ הפקדות"),
              ]}
              labelFormatter={(label) => `${t("investment_chart_label_year", "שנה")} ${label}`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
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
                  ? t("investment_chart_balance_label", "שווי תיק")
                  : t("investment_chart_contributed_label", "סה״כ הפקדות")
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
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            {t("investment_chart_balance_label", "שווי תיק")}
          </p>

          <p className="mt-1 font-semibold">
            {t("investment_chart_balance_desc", "הכסף שהצטבר כולל צמיחת ההשקעה.")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            {t("investment_chart_contributed_label", "סה״כ הפקדות")}
          </p>

          <p className="mt-1 font-semibold">
            {t("investment_chart_contributed_desc", "הכסף שהושקע בפועל לאורך התקופה.")}
          </p>
        </div>
      </div>
    </section>
  );
}
