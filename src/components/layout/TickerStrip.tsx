import { useEffect, useState } from "react";
import { useLanguage } from "@/context/languageContext";
import { newestTime, parseTickerQuotes, shouldShowTicker, tickerPhase, TICKER_SYMBOLS, type TickerQuote } from "@/lib/tickerStrip";

const preview = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("ticker") === "preview";

/** Slim strip under the top bar: US stock prices scroll while the market is open and in after-market, then it folds away. */
export function TickerStrip() {
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState<TickerQuote[]>([]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 30_000); return () => window.clearInterval(id); }, []);
  const phase = tickerPhase(now);
  const wanted = preview() || phase !== "closed";
  useEffect(() => {
    if (!wanted) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/market-quote?symbols=${TICKER_SYMBOLS.join(",")}&range=3mo`);
        if (r.ok && alive) setQuotes(parseTickerQuotes(await r.json()));
      } catch { /* keep the last real quotes; the strip hides itself when they go stale */ }
    };
    void load();
    const id = window.setInterval(load, 90_000);
    return () => { alive = false; window.clearInterval(id); };
  }, [wanted]);
  const show = wanted && shouldShowTicker(now, quotes, preview());
  const label = preview() && phase === "closed" ? t("ticker_preview") : phase === "after" ? t("ticker_after") : t("ticker_open");
  const items = quotes.map((q) => {
    const up = q.changePercent >= 0;
    return (
      <span key={q.symbol} className="inline-flex items-center gap-1.5 px-4">
        <span className="font-semibold tracking-wide text-foreground">{q.symbol}</span>
        <span className="tabular-nums text-foreground/90">{q.price.toFixed(2)}</span>
        <span className={`inline-flex items-center gap-0.5 tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}><span aria-hidden="true">{up ? "▲" : "▼"}</span>{Math.abs(q.changePercent).toFixed(2)}%</span>
        <span aria-hidden="true" className="ms-3 h-1 w-1 rounded-full bg-[#E0B253]/60" />
      </span>
    );
  });
  return (
    <div className={`overflow-hidden transition-[max-height,opacity] duration-700 ease-out ${show ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`} aria-hidden={!show}>
      <div dir="ltr" className="ticker-strip flex h-9 items-center border-y border-primary/15 bg-gradient-to-r from-[#070d1d] via-[#0b1630] to-[#070d1d] text-xs" role="region" aria-label={t("ticker_label")}>
        <div className="z-10 flex shrink-0 items-center gap-2 bg-[#070d1d] px-3 text-[10px] font-semibold uppercase tracking-wider text-[#E0B253]">
          <span className="ticker-dot h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />{label}
          <span className="hidden font-normal normal-case tracking-normal text-muted-foreground sm:inline">{t("ticker_note")} {newestTime(quotes)} ET</span>
        </div>
        <div className="ticker-mask relative min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track flex w-max whitespace-nowrap">{items}{items}</div>
        </div>
      </div>
    </div>
  );
}
