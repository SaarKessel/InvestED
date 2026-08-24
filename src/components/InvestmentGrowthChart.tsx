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

interface ProjectionPoint {
  year: number;
  balance: number;
  contributed: number;
}

interface Props {
  data: ProjectionPoint[];
}

const currencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatAxisValue(value: number): string {
  const numericValue = Number(value);

  if (numericValue >= 1_000_000) {
    return `₪${(numericValue / 1_000_000).toFixed(1)}M`;
  }

  if (numericValue >= 1_000) {
    return `₪${Math.round(numericValue / 1_000)}K`;
  }

  return `₪${Math.round(numericValue)}`;
}

export function InvestmentGrowthChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <section
        dir="rtl"
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
          📈 צמיחת ההשקעה לאורך זמן
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          אין מספיק נתונים להצגת גרף הצמיחה.
        </p>
      </section>
    );
  }

  return (
    <section
      dir="rtl"
      aria-label="גרף צמיחת ההשקעה"
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
          📈 צמיחת ההשקעה לאורך זמן
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          השוואה בין הכסף שהופקד לבין השווי שנצבר מההשקעה לאורך השנים.
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
                value: "שנים",
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
                  ? "שווי תיק"
                  : "סה״כ הפקדות",
              ]}
              labelFormatter={(label) => `שנה ${label}`}
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
                  ? "שווי תיק"
                  : "סה״כ הפקדות"
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
            שווי תיק
          </p>

          <p className="mt-1 font-semibold">
            הכסף שהצטבר כולל צמיחת ההשקעה.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            סה״כ הפקדות
          </p>

          <p className="mt-1 font-semibold">
            הכסף שהושקע בפועל לאורך התקופה.
          </p>
        </div>
      </div>
    </section>
  );
}
