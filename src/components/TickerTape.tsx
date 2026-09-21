import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { fetchMarketMovers, type MarketMoversResult, type TickerMover } from "@/lib/marketMovers";

function formatPrice(mover: TickerMover): string {
  if (mover.price === null) return "—";
  const formatted = mover.price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return mover.currency ? `${formatted} ${mover.currency}` : formatted;
}

function formatChange(mover: TickerMover): string {
  if (mover.changePercent === null) return "—";
  const sign = mover.changePercent > 0 ? "+" : "";
  return `${sign}${mover.changePercent.toFixed(2)}%`;
}

function TickerItem({ mover }: { mover: TickerMover }) {
  const positive = (mover.changePercent ?? 0) >= 0;
  return (
    <span className="mx-4 inline-flex shrink-0 items-center gap-2 text-sm">
      <span className="font-bold tracking-wide">{mover.symbol}</span>
      <span className="text-muted-foreground">{formatPrice(mover)}</span>
      <span className={`inline-flex items-center gap-1 font-bold ${positive ? "text-green-500" : "text-red-500"}`}>
        {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {formatChange(mover)}
      </span>
    </span>
  );
}

export function TickerTape() {
  const { t, language } = useLanguage();
  const [result, setResult] = useState<MarketMoversResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMarketMovers()
      .then((payload) => {
        if (!cancelled) setResult(payload);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed || (result && !result.available)) {
    return (
      <div className="border-b border-border/60 bg-card/80" dir="ltr">
        <div className="container flex h-10 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Radio className="h-3.5 w-3.5" />
          {t("ticker_unavailable")}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="border-b border-border/60 bg-card/80" dir="ltr">
        <div className="container flex h-10 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          {t("ticker_loading")}
        </div>
      </div>
    );
  }

  const movers = [...result.gainers, ...result.losers];
  const latestTimestamp = movers
    .map((mover) => mover.timestamp)
    .filter((ts): ts is string => !!ts)
    .sort()
    .at(-1);
  const updatedLabel = latestTimestamp
    ? new Date(latestTimestamp).toLocaleString(language === "he" ? "he-IL" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const coverageLabel =
    result.coverage === "screener"
      ? t("ticker_coverage_screener")
      : t("ticker_coverage_watchlist").replace("{n}", String(result.watchlistSize ?? 0));

  // The strip duplicates the items so the marquee loops seamlessly.
  // Symbols are Latin, so the tape itself always runs LTR (Fox-style).
  const strip = [...movers, ...movers];

  return (
    <div className="border-b border-border/60 bg-card/80" dir="ltr">
      <div className="relative flex h-10 items-center overflow-hidden">
        <div className="ticker-tape flex whitespace-nowrap will-change-transform">
          {strip.map((mover, index) => (
            <TickerItem key={`${mover.symbol}-${index}`} mover={mover} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-card to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent" />
      </div>
      <div className="border-t border-border/40 bg-background/60" dir={language === "he" ? "rtl" : "ltr"}>
        <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 py-1 text-[10px] text-muted-foreground">
          <span>{coverageLabel}</span>
          {updatedLabel && (
            <>
              <span aria-hidden="true">•</span>
              <span>
                {t("ticker_updated")}: {updatedLabel}
              </span>
            </>
          )}
          <span aria-hidden="true">•</span>
          <span>{t("ticker_delay_note")}</span>
        </div>
      </div>
    </div>
  );
}
