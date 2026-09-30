// Facelift phase 2: in-chat quote cards. Renders the validated AssetAnalysis
// set the deterministic engines produced - the same numbers the answer text
// carries, with provenance (source + freshness) on every card. Simulated
// data is always labeled.
import { TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import type { AssetAnalysis } from "@/types";

export function ChatAssetCards({ assets }: { assets: AssetAnalysis[] }) {
  const { t, language } = useLanguage();
  if (assets.length === 0) return null;
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {assets.map((asset) => {
        const up = asset.changePercent > 0;
        const down = asset.changePercent < 0;
        return (
          <div key={asset.symbol} className="rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold" dir="ltr">{asset.symbol}</span>
              <span className="font-mono text-sm font-semibold" dir="ltr">
                {asset.price.toLocaleString(language === "he" ? "he-IL" : "en-US", { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1 font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : down ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} dir="ltr">
                {up && <TrendingUp className="h-3 w-3" aria-hidden />}
                {down && <TrendingDown className="h-3 w-3" aria-hidden />}
                {asset.changePercent > 0 ? "+" : ""}{asset.changePercent.toFixed(2)}%
              </span>
              <span className="text-[11px] text-muted-foreground" dir="ltr">
                {asset.dataSource} · {t(`copilot_freshness_${asset.freshness ?? "unavailable"}`, asset.freshness ?? "unavailable")}
              </span>
            </div>
            {asset.isMock && <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">{t("market_data_mock")}</p>}
            {asset.timestamp && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(asset.timestamp).toLocaleString(language === "he" ? "he-IL" : "en-US", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
