import { useLanguage } from "@/context/languageContext";
import type { MarketEventResult } from "@/lib/simulator/marketEvents";

const KEY_MONTHS = (n: number) => [0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n];

/** The only surface for the invented market simulator. The label is shown at the top, inside the chart and at the bottom, in the active language, and the colours differ from every real-data card. */
export function ChatMarketSimCard({ data }: { data: MarketEventResult }) {
  const { language } = useLanguage();
  const he = language === "he";
  const l = he ? "he" : "en";
  const fmt = (n: number) => n.toLocaleString(he ? "he-IL" : "en-US", { maximumFractionDigits: 0 });
  const pts = data.points;
  const W = 300, H = 120;
  const max = Math.max(...pts.map((p) => p.level)), min = Math.min(...pts.map((p) => p.level));
  const x = (m: number) => (m / (pts.length - 1)) * W;
  const y = (v: number) => H - 8 - ((v - min) / Math.max(1, max - min)) * (H - 16);
  const line = pts.map((p) => `${x(p.month).toFixed(1)},${y(p.level).toFixed(1)}`).join(" ");
  const Banner = ({ id }: { id: string }) => (
    <div role="note" data-testid={id} className="rounded-lg border-2 border-dashed border-amber-500 bg-amber-500/15 px-3 py-2 text-center font-extrabold text-amber-700 dark:text-amber-300">
      <p dir={he ? "rtl" : "ltr"} lang={he ? "he" : "en"} className="text-base">{he ? data.label.he : data.label.en}</p>
    </div>
  );
  return (
    <div className="mt-3 space-y-2 rounded-xl border-2 border-dashed border-amber-500/70 bg-background/70 p-3" data-testid="market-sim-card">
      <Banner id="market-sim-label-top" />
      <p className="text-sm font-bold">{data.title[l]} · <span className="font-normal text-muted-foreground">{data.index[l]}</span></p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${data.label[l]}. ${data.title[l]}`}>
        <rect x="0" y="0" width={W} height={H} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 3" />
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="15" fontWeight="800" fill="currentColor" opacity="0.1" transform={`rotate(-12 ${W / 2} ${H / 2})`}>{he ? data.label.he : data.label.en}</text>
        <polyline points={line} fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="6 3" />
      </svg>
      <table className="w-full text-xs">
        <thead><tr className="text-muted-foreground"><th className="text-start font-semibold">{he ? "חודש" : "Month"}</th><th className="text-end font-semibold">{he ? "שווי מומצא" : "Invented value"}</th></tr></thead>
        <tbody>
          {KEY_MONTHS(pts.length - 1).map((m) => <tr key={m}><td>{m}</td><td className="text-end tabular-nums">{fmt(pts[m].value)}</td></tr>)}
        </tbody>
      </table>
      <ul className="text-xs leading-5">
        <li>{he ? "סכום התחלתי מומצא" : "Invented starting amount"}: <b className="tabular-nums">{fmt(data.startAmount)}</b> → <b className="tabular-nums">{fmt(data.endValue)}</b> ({data.returnPct > 0 ? "+" : ""}{data.returnPct}%)</li>
        <li>{he ? "ירידה מקסימלית מהשיא" : "Largest fall from a high"}: <b>{data.maxDrawdownPct}%</b></li>
        <li>{he ? "עלייה הדרושה מהשפל כדי לחזור לשיא" : "Rise needed from the low to get back to that high"}: <b>{data.recoveryNeededPct}%</b></li>
      </ul>
      <ul className="list-disc space-y-1 ps-5 text-xs leading-5">{data.lessons.map((x, i) => <li key={i}>{x[l]}</li>)}</ul>
      <Banner id="market-sim-label-bottom" />
    </div>
  );
}
