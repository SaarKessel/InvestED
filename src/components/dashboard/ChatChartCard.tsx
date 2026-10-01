// Side-panel price chart on TradingView Lightweight Charts (Apache-2.0, attribution logo kept).
// Real provider history only, labeled with source and freshness. Range and line/candle controls;
// zoom and crosshair come from the library. If history is unavailable nothing is drawn.
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/languageContext";
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import type { MarketAsset } from "@/types";

type Range = "3mo" | "1y" | "10y";
const RANGES: { id: Range; label: string }[] = [{ id: "3mo", label: "3M" }, { id: "1y", label: "1Y" }, { id: "10y", label: "10Y" }];

function LwChart({ asset, mode }: { asset: MarketAsset; mode: "line" | "candle" }) {
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
      const up = asset.history[asset.history.length - 1].price >= asset.history[0].price;
      const rows = asset.history.filter((h) => typeof h.date === "string");
      if (mode === "candle") {
        const s = chart.addSeries(lw.CandlestickSeries, { upColor: "#10b981", downColor: "#ef4444", borderVisible: false, wickUpColor: "#10b981", wickDownColor: "#ef4444" });
        s.setData(rows.map((h) => ({ time: h.date as string, open: h.open, high: h.high, low: h.low, close: h.price })));
      } else {
        const s = chart.addSeries(lw.LineSeries, { color: up ? "#10b981" : "#ef4444", lineWidth: 2 });
        s.setData(rows.map((h) => ({ time: h.date as string, value: h.price })));
      }
      chart.timeScale().fitContent();
      dispose = () => chart.remove();
    });
    return () => { cancelled = true; dispose?.(); };
  }, [asset, mode]);
  return <div ref={box} className="h-[190px] w-full" dir="ltr" />;
}

export function ChatChartCard({ symbol }: { symbol: string }) {
  const { t } = useLanguage();
  const [range, setRange] = useState<Range>("3mo");
  const [mode, setMode] = useState<"line" | "candle">("line");
  const [asset, setAsset] = useState<MarketAsset | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setAsset(undefined);
    void fetchMarketAssetBySymbol(symbol, range, undefined, { allowSimulated: false }).then((a) => { if (live) setAsset(a); }).catch(() => { if (live) setAsset(null); });
    return () => { live = false; };
  }, [symbol, range]);
  if (asset === undefined) return <div className="h-40 animate-pulse rounded-xl bg-muted/40" aria-hidden="true" />;
  if (!asset || asset.history.length < 2) return <p className="rounded-xl border border-border/60 p-3 text-xs text-muted-foreground">{symbol}: {t("panel_chart_unavailable")}</p>;
  const canCandle = asset.history.every((h) => h.ohlcAvailable !== false && Number.isFinite(h.open) && Number.isFinite(h.high) && Number.isFinite(h.low));
  const pill = (active: boolean) => `rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`;
  return (
    <figure className="rounded-xl border border-border/60 bg-background/60 p-3" aria-label={`${symbol} ${t("panel_chart_title")}`}>
      <figcaption className="mb-1 flex flex-wrap items-center justify-between gap-1 text-xs">
        <span className="font-bold" dir="ltr">{symbol}</span>
        <span className="flex items-center gap-1" dir="ltr">
          {RANGES.map((r) => <button key={r.id} type="button" aria-pressed={range === r.id} onClick={() => setRange(r.id)} className={pill(range === r.id)}>{r.label}</button>)}
          {canCandle && <button type="button" aria-pressed={mode === "candle"} onClick={() => setMode(mode === "candle" ? "line" : "candle")} className={pill(mode === "candle")}>{mode === "candle" ? "Candles" : "Line"}</button>}
        </span>
      </figcaption>
      <LwChart asset={asset} mode={canCandle ? mode : "line"} />
      <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">{asset.dataSource} · {asset.history[0].date} → {asset.history[asset.history.length - 1].date}</p>
    </figure>
  );
}
