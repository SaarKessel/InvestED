import { isExtremeMove } from "@/lib/marketMovers";
import { useLanguage } from "@/context/languageContext";
import type { DataDeskResult } from "@/lib/copilot/dataDesk";

const pct = (v: number | null) => (v === null ? "-" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`);

/** Read-only data card: values verbatim from the endpoint, with status and source shown. */
export function ChatDataDesk({ data }: { data: DataDeskResult }) {
  const { t } = useLanguage();
  const box = "mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs";
  if (data.kind === "movers") {
    if (!data.available) return <div className={box}><p className="font-semibold">{t("desk_movers_title")}</p><p className="mt-1 text-muted-foreground">{t("desk_unavailable")}</p></div>;
    const col = (title: string, rows: typeof data.gainers) => <div><p className="font-semibold">{title}</p><ul className="mt-1 space-y-0.5">{rows.map((m) => <li key={m.symbol} className="flex justify-between gap-3" dir="ltr"><span className="font-mono">{m.symbol}</span><span>{pct(m.changePercent)}{isExtremeMove(m.changePercent) ? " ⚠" : ""}</span></li>)}</ul></div>;
    return <div className={box}><p className="font-semibold">{t("desk_movers_title")}</p><div className="mt-2 grid gap-3 sm:grid-cols-2">{col(t("desk_gainers"), data.gainers)}{col(t("desk_losers"), data.losers)}</div>{[...data.gainers, ...data.losers].some((m) => isExtremeMove(m.changePercent)) && <p className="mt-2 text-muted-foreground">⚠ {t("movers_extreme_note")}</p>}<p className="mt-2 text-muted-foreground">{t("desk_source_yahoo")}</p><p className="text-muted-foreground">{data.coverage === "watchlist" ? t("ticker_coverage_watchlist").replace("{n}", String(data.watchlistSize ?? "")) : t("ticker_coverage_screener")}{data.fetchedAt ? ` · ${data.fetchedAt.slice(0, 16).replace("T", " ")} UTC` : ""}</p></div>;
  }
  if (data.kind === "policy_rate") {
    const pts = data.result.points; const last = pts[pts.length - 1];
    if (data.result.status === "unavailable" || !last) return <div className={box}><p className="font-semibold">{t("desk_rate_title")}</p><p className="mt-1 text-muted-foreground">{t("desk_unavailable")}</p></div>;
    return <div className={box}><p className="font-semibold">{t("desk_rate_title")}</p><p className="mt-1" dir="ltr">{last.month}: {last.rate}%</p><p className="mt-1 text-muted-foreground">{t("desk_source_bis")} ({data.result.status})</p></div>;
  }
  if (data.status === "unavailable" || !data.top.length) return <div className={box}><p className="font-semibold">{t("desk_insurance_title")}</p><p className="mt-1 text-muted-foreground">{t("desk_unavailable")}</p></div>;
  return <div className={box}><p className="font-semibold">{t("desk_insurance_title")}</p><ul className="mt-1 space-y-0.5">{data.top.map((r) => <li key={r.fundId} className="flex justify-between gap-3"><span>{r.name}</span><span dir="ltr">{pct(r.yearToDateYield)}</span></li>)}</ul><p className="mt-2 text-muted-foreground">{t("desk_insurance_note")}{data.reportPeriod ? ` (${data.reportPeriod})` : ""}</p></div>;
}
