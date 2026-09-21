import { ExternalLink, Landmark } from "lucide-react";
import { BROKERS } from "@/lib/brokers";
import { InfoBadge } from "@/components/ui/InfoBadge";
import { FeeDragCalculator } from "./FeeDragCalculator";
import { useLanguage } from "@/context/languageContext";

export function BrokerComparisonTable() {
  const { t, language } = useLanguage();

  function localized(
    value: string | { he: string; en: string },
    lang: string
  ): string {
    if (typeof value === "string") return value;
    return lang === "he" ? value.he : value.en;
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Landmark className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wide">
          {t("broker_title_small", "Where you can open an investment account")}
        </span>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <h4 className="font-display text-base font-bold">
          {t("broker_title", "Brokerage and Trading App Comparison")}
        </h4>
        <InfoBadge description={t("broker_info", "A tool for comparing trading fees and management fees at Israeli and international banks and brokerages, to help you save money.")} />
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        {t("broker_disclaimer", "General table for orientation only — fees and management fees change frequently (promotions, signup bonuses). Check the latest conditions on each brokerage's official site before making decisions. This is not a recommendation to prefer one broker over another.")}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-right text-xs font-bold">
                {t("broker_th_name", "Brokerage")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold">
                {t("broker_th_app", "App")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold">
                {t("broker_th_trading_fee", "Trading Fee")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold">
                {t("broker_th_management_fee", "Management Fee")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold">
                {t("broker_th_signup", "Sign up")}
              </th>
            </tr>
          </thead>
          <tbody>
            {BROKERS.map((broker) => (
              <tr key={localized(broker.name, language)} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-semibold">{localized(broker.name, language)}</p>
                  {broker.highlight && <p className="mt-0.5 text-[11px] text-muted-foreground">{localized(broker.highlight, language)}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{localized(broker.app, language)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{localized(broker.tradingFee, language)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{localized(broker.managementFee, language)}</td>
                <td className="px-4 py-3">
                  <a
                    href={broker.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    {t("broker_visit_site", "Visit site")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FeeDragCalculator />
    </div>
  );
}
