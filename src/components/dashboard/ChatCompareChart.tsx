// Normalised comparison: each symbol's real provider closes rebased to 100 on the first shared date.
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/languageContext";
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import { rebaseToHundred, type RebasedSeries } from "@/lib/rebase";

const COLORS = ["#2563eb", "#B8862B"];
type Range = "3mo" | "1y" | "10y";
const RANGES: { id: Range; label: string }[] = [{ id: "3mo", label: "3M" }, { id: "1y", label: "1Y" }, { id: "10y", label: "10Y" }];

function Lines({ series }: { series: RebasedSeries[] }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let dispose: (() => void) | null = null;
    let cancelled = false;
    void import("lightweight-charts").then((lw) => {
      if (cancelled || !box.current) return;
      const dark = document.documentElement.classList.contains("dark");
      const chart = lw.createChart(box.current, {
        autoSize: true, height: 190,
        layout: { background: { type: lw.ColorType.Solid, color: "transparent" }, textColor: dark ? "#9aa4b5" : "#5b6472", fontSize: 11 },
        grid: { vertLines: { visible: false }, horzLines: { color: dark ? "#243044" : "#e6eaf0" } },
        rightPriceScale: { borderVisible: false }, timeScale: { borderVisible: false },
      });
      series.forEach((s, i) => chart.addSeries(lw.LineSeries, { color: COLORS[i % COLORS.length], lineWidth: 2 }).setData(s.points.map((p) => ({ time: p.date, value: p.value }))));
      chart.timeScale().fitContent();
      dispose = () => chart.remove();
    });
    return () => { cancelled = true; dispose?.(); };
  }, [series]);
  return <div ref={box} className="h-[190px] w-full" dir="ltr" />;
}

export function ChatCompareChart({ symbols }: { symbols: [string, string] }) {
  const { t } = useLanguage();
  const [range, setRange] = useState<Range>("1y");
  const [state, setState] = useState<{ series: RebasedSeries[]; source: string } | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setState(undefined);
    void Promise.all(symbols.map((s) => fetchMarketAssetBySymbol(s, range, undefined, { allowSimulated: false })))
      .then((assets) => {
        if (!live) return;
        const ok = assets.every((a) => a && a.history.length >= 2);
        const series = ok ? rebaseToHundred(assets.map((a, i) => ({ symbol: symbols[i], history: a!.history.map((h) => ({ date: h.date as string, price: h.price })) }))) : null;
        setState(series ? { series, source: String(assets[0]!.dataSource ?? "") } : null);
      }).catch(() => { if (live) setState(null); });
    return () => { live = false; };
  }, [symbols, range]);
  if (state === undefined) return <div className="h-40 animate-pulse rounded-xl bg-muted/40" aria-hidden="true" />;
  if (!state) return <p className="rounded-xl border border-border/60 p-3 text-xs text-muted-foreground">{symbols.join(" / ")}: {t("compare_unavailable")}</p>;
  const first = state.series[0].points[0].date; const last = state.series[0].points[state.series[0].points.length - 1].date;
  return (
    <figure className="rounded-xl border border-border/60 bg-background/60 p-3" aria-label={t("compare_title")}>
      <figcaption className="mb-1 flex flex-wrap items-center justify-between gap-1 text-xs">
        <span className="font-bold">{t("compare_title")}</span>
        <span className="flex items-center gap-1" dir="ltr">{RANGES.map((r) => <button key={r.id} type="button" aria-pressed={range === r.id} onClick={() => setRange(r.id)} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${range === r.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{r.label}</button>)}</span>
      </figcaption>
      <ul className="mb-1 flex gap-3 text-[11px]" dir="ltr">{state.series.map((s, i) => <li key={s.symbol} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden="true" /><b>{s.symbol}</b> {s.points[s.points.length - 1].value.toFixed(1)}</li>)}</ul>
      <Lines series={state.series} />
      <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">{t("compare_note")} · {state.source} · {first} → {last}</p>
    </figure>
  );
}
