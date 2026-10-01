// Side-panel price chart: real provider history only, labeled with source and
// freshness. If history is unavailable nothing is drawn (no invented data).
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/context/languageContext";
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import type { MarketAsset } from "@/types";

export function ChatChartCard({ symbol }: { symbol: string }) {
  const { t } = useLanguage();
  const [asset, setAsset] = useState<MarketAsset | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setAsset(undefined);
    void fetchMarketAssetBySymbol(symbol, "3mo", undefined, { allowSimulated: false }).then((a) => { if (live) setAsset(a); }).catch(() => { if (live) setAsset(null); });
    return () => { live = false; };
  }, [symbol]);
  if (asset === undefined) return <div className="h-40 animate-pulse rounded-xl bg-muted/40" aria-hidden="true" />;
  if (!asset || asset.history.length < 2) return <p className="rounded-xl border border-border/60 p-3 text-xs text-muted-foreground">{symbol}: {t("panel_chart_unavailable")}</p>;
  const first = asset.history[0].price;
  const last = asset.history[asset.history.length - 1].price;
  const up = last >= first;
  return (
    <figure className="rounded-xl border border-border/60 bg-background/60 p-3" aria-label={`${symbol} ${t("panel_chart_title")}`}>
      <figcaption className="mb-1 flex items-baseline justify-between text-xs"><span className="font-bold" dir="ltr">{symbol}</span><span className="text-muted-foreground">{t("panel_chart_title")}</span></figcaption>
      <div className="h-36" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={asset.history}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", fontSize: "12px" }} />
            <Line type="monotone" dataKey="price" dot={false} strokeWidth={2} stroke={up ? "#10b981" : "#ef4444"} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">{asset.dataSource} · {asset.history[0].date} → {asset.history[asset.history.length - 1].date}</p>
    </figure>
  );
}
