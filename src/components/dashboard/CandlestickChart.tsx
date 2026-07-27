import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip } from "recharts";

interface CandleDatum {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  price: number;
}

// Recharts אין לו סוג גרף "נרות" מובנה, אז בונים אותו ידנית:
// - Bar עם dataKey שמחזיר טווח [min(open,close), max(open,close)] מצייר את "הגוף".
// - שני Line בלתי נראים (high/low) רק כדי שסקאלת ה-Y תכלול את הטווח המלא.
// - בתוך ה-shape המותאם, מחשבים את יחס הפיקסלים-ליחידת-מחיר מתוך גובה
//   הגוף שה-Bar כבר חישב, וממנו מציירים את הפתיל (wick) במיקום המדויק
//   של ה-high/low האמיתיים.
function Candle(props: { x?: number; y?: number; width?: number; height?: number; payload?: CandleDatum }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload || payload.open == null || payload.close == null || payload.high == null || payload.low == null) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "#22c55e" : "#ef4444";

  const bodyTop = Math.min(y, y + height);
  const bodyHeight = Math.max(Math.abs(height), 1);
  const centerX = x + width / 2;

  const priceRange = Math.abs(close - open);
  const pixelsPerUnit = priceRange > 0 ? bodyHeight / priceRange : 0;

  const wickTop = pixelsPerUnit > 0 ? bodyTop - (high - Math.max(open, close)) * pixelsPerUnit : bodyTop - 4;
  const wickBottom =
    pixelsPerUnit > 0 ? bodyTop + bodyHeight + (Math.min(open, close) - low) * pixelsPerUnit : bodyTop + bodyHeight + 4;

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={wickTop} y2={wickBottom} stroke={color} strokeWidth={1.2} />
      <rect x={x} y={bodyTop} width={Math.max(width, 2)} height={bodyHeight} fill={color} rx={1} />
    </g>
  );
}

export function CandlestickChart({ data }: { data: CandleDatum[] }) {
  const chartData = data.map((d) => ({
    ...d,
    bodyRange: d.open != null && d.close != null ? [Math.min(d.open, d.close), Math.max(d.open, d.close)] : [0, 0],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
        {/* סדרות בלתי נראות רק כדי שסקאלת ה-Y תכלול את טווח ה-high/low המלא */}
        <Line dataKey="high" stroke="none" dot={false} activeDot={false} isAnimationActive={false} />
        <Line dataKey="low" stroke="none" dot={false} activeDot={false} isAnimationActive={false} />
        <RTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as CandleDatum;
            return (
              <div className="rounded-xl border border-border bg-card px-3 py-2 text-[11px] shadow-lg">
                <p className="mb-1 font-bold">{d.date}</p>
                <p>פתיחה: ${d.open?.toFixed(2)}</p>
                <p>סגירה: ${d.close?.toFixed(2)}</p>
                <p>גבוה: ${d.high?.toFixed(2)}</p>
                <p>נמוך: ${d.low?.toFixed(2)}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="bodyRange" shape={<Candle />} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
