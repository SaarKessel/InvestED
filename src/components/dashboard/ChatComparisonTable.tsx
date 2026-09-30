// Facelift phase 2: in-chat comparison table. Renders the validated
// AssetAnalysis set the deterministic engines compared - the same numbers
// the answer text carries, with provenance (source + freshness) on the
// table. Simulated data is always labeled.
import { TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import type { AssetAnalysis } from "@/types";

export function ChatComparisonTable({ assets }: { assets: AssetAnalysis[] }) {
  const { t, language } = useLanguage();
  if (assets.length < 2) return null;
  const locale = language === "he" ? "he-IL" : "en-US";
  const sources = [...new Set(assets.map((asset) => asset.dataSource))];
  const freshnessValues = [...new Set(assets.map((asset) => asset.freshness ?? "unavailable"))];
  const timestamps = assets.map((asset) => asset.timestamp).filter((value): value is string => Boolean(value));
  const latestTimestamp = timestamps.sort().at(-1);
  const hasSimulated = assets.some((asset) => asset.isMock || asset.freshness === "simulated");
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs">
      <p className="mb-2 font-semibold">{t("copilot_compare_title")}</p>
      <table className="w-full text-start">
        <thead>
          <tr className="text-muted-foreground">
            <th scope="col" className="pb-1 text-start font-medium">{t("copilot_compare_symbol")}</th>
            <th scope="col" className="pb-1 text-end font-medium">{t("copilot_compare_price")}</th>
            <th scope="col" className="pb-1 text-end font-medium">{t("copilot_compare_change")}</th>
            <th scope="col" className="pb-1 text-end font-medium">{t("copilot_compare_volatility")}</th>
            <th scope="col" className="pb-1 text-end font-medium">{t("copilot_compare_rsi")}</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const up = asset.changePercent > 0;
            const down = asset.changePercent < 0;
            return (
              <tr key={asset.symbol} className="border-t border-border/50">
                <th scope="row" className="py-1 text-start font-bold" dir="ltr">{asset.symbol}</th>
                <td className="py-1 text-end font-mono" dir="ltr">
                  {asset.price.toLocaleString(locale, { maximumFractionDigits: 2 })}
                  {asset.currency ? ` ${asset.currency}` : ""}
                </td>
                <td className={`py-1 text-end font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : down ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} dir="ltr">
                  <span className="inline-flex items-center gap-1">
                    {up && <TrendingUp className="h-3 w-3" aria-hidden />}
                    {down && <TrendingDown className="h-3 w-3" aria-hidden />}
                    {asset.changePercent > 0 ? "+" : ""}{asset.changePercent.toFixed(2)}%
                  </span>
                </td>
                <td className="py-1 text-end font-mono" dir="ltr">{asset.volatilityPct.toFixed(2)}%</td>
                <td className="py-1 text-end font-mono" dir="ltr">{asset.rsi !== null ? asset.rsi.toFixed(1) : t("copilot_freshness_unavailable")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted-foreground" dir="ltr">
        {sources.join(" · ")} · {freshnessValues.map((value) => t(`copilot_freshness_${value}`, value)).join(" · ")}
      </p>
      {hasSimulated && <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">{t("market_data_mock")}</p>}
      {latestTimestamp && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(latestTimestamp).toLocaleString(locale, { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" })}
        </p>
      )}
    </div>
  );
}
