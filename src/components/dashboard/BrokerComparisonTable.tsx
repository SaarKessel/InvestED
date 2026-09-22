import { ExternalLink, Landmark } from "lucide-react";
import { BROKERS } from "@/lib/brokers";
import { InfoBadge } from "@/components/ui/InfoBadge";
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
        <InfoBadge description={t("broker_info", "A directory of official brokerage websites for independent verification of current terms.")} />
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        {t("broker_disclaimer", "Official-link directory only. Fees, eligibility, minimums, tax treatment and promotions change by account and jurisdiction; verify all current terms on the provider website. Inclusion is not a recommendation or endorsement.")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BROKERS.map((broker) => (
          <a
            key={localized(broker.name, language)}
            href={broker.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-accent/30"
          >
            <span>{localized(broker.name, language)}</span>
            <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
          </a>
        ))}
      </div>
    </div>
  );
}
