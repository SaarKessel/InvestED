import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Database,
  History,
  LineChart,
  ListOrdered,
  Loader2,
  BookOpen,
  X,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import {
  assetTypeLabel,
  explainStrategy,
  getStrategyRequirements,
  horizonLabel,
  loadStrategyMarketExamples,
  type StrategyMarketExample,
} from "@/lib/strategy/strategyEngine";
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import type { StrategyId } from "@/types";
import { StrategyAskCopilot } from "./StrategyAskCopilot";

type MarketState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; examples: StrategyMarketExample[] }
  | { status: "error" };

/**
 * Strategy detail panel. All content comes from the Strategy
 * Engine; this component renders, it does not compute.
 */
export function StrategyDetail({ strategyId }: { strategyId: StrategyId }) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const explanation = explainStrategy(strategyId, lang);
  const requirements = getStrategyRequirements(strategyId);
  const [market, setMarket] = useState<MarketState>({ status: "idle" });

  if (!explanation || !requirements) return null;

  async function loadMarketExamples() {
    if (!explanation) return;
    setMarket({ status: "loading" });
    try {
      // Market data comes only through the existing client service;
      // unavailable symbols are reported, never invented.
      const examples: StrategyMarketExample[] = await loadStrategyMarketExamples(
        strategyId,
        (symbol) => fetchMarketAssetBySymbol(symbol),
        { limit: 3 }
      );
      setMarket({ status: "ready", examples });
    } catch {
      setMarket({ status: "error" });
    }
  }

  const riskTone =
    explanation.riskLevel <= 3
      ? "bg-success/10 text-success border-success/20"
      : explanation.riskLevel <= 6
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-danger/10 text-danger border-danger/20";

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl">{explanation.name}</CardTitle>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${riskTone}`}>
            {t("slab_risk_label", "Risk {level}/10").replace("{level}", String(explanation.riskLevel))} · {explanation.riskLabel}
          </span>
        </div>
        <p className="text-sm leading-7 text-muted-foreground">{explanation.description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {explanation.timeHorizon.map((horizon) => (
            <Badge key={horizon} variant="outline">{horizonLabel(horizon, lang)}</Badge>
          ))}
          {explanation.assetTypes.map((assetType) => (
            <Badge key={assetType} variant="outline">{assetTypeLabel(assetType, lang)}</Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-sm leading-7">
          <span className="font-bold">{t("slab_suitable")}</span> {explanation.suitableFor}
        </p>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <BookOpen className="h-4 w-4" /> {t("slab_section_philosophy")}
          </h3>
          <p className="text-sm leading-7 text-muted-foreground">{explanation.philosophy}</p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
              <ListOrdered className="h-4 w-4" /> {t("slab_section_rules")}
            </h3>
            <ol className="list-decimal space-y-1.5 ps-5 text-sm leading-6 text-muted-foreground">
              {explanation.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ol>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
              <LineChart className="h-4 w-4" /> {t("slab_section_metrics")}
            </h3>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              {explanation.metrics.map((metric) => (
                <li key={metric.key}>
                  <span className="font-semibold text-foreground">{metric.name}:</span> {metric.description}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-success">
              <Check className="h-4 w-4" /> {t("slab_section_strengths")}
            </h3>
            <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
              {explanation.strengths.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-1 h-3 w-3 shrink-0 text-success" /> {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-danger">
              <AlertTriangle className="h-4 w-4" /> {t("slab_section_limitations")}
            </h3>
            <ul className="space-y-1.5 text-sm leading-6 text-muted-foreground">
              {explanation.limitations.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <X className="mt-1 h-3 w-3 shrink-0 text-danger" /> {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <History className="h-4 w-4" /> {t("slab_section_history")}
          </h3>
          <p className="text-sm leading-7 text-muted-foreground">{explanation.historicalContext}</p>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <BookOpen className="h-4 w-4" /> {t("slab_section_notes")}
          </h3>
          <p className="text-sm leading-7 text-muted-foreground">{explanation.educationalNotes}</p>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <Database className="h-4 w-4" /> {t("slab_section_requirements")}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold text-muted-foreground">{t("slab_requirements_inputs")}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {requirements.userInputs.map((input) => <li key={input.en}>· {lang === "he" ? input.he : input.en}</li>)}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-muted-foreground">{t("slab_requirements_data")}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {requirements.dataRequirementNotes.map((note) => <li key={note.en}>· {lang === "he" ? note.he : note.en}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section aria-live="polite">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <LineChart className="h-4 w-4" /> {t("slab_section_market")}
          </h3>
          {market.status === "idle" && (
            <button
              type="button"
              onClick={loadMarketExamples}
              className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              {t("slab_market_load")}
            </button>
          )}
          {market.status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("slab_market_loading")}
            </p>
          )}
          {market.status === "error" && (
            <p role="alert" className="text-sm text-danger">{t("slab_market_error")}</p>
          )}
          {market.status === "ready" && (
            <div className="space-y-2">
              <ul className="flex flex-wrap gap-2">
                {market.examples.map((example) => (
                  <li
                    key={example.symbol}
                    className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs"
                  >
                    <span className="font-bold">{example.symbol}</span>{" "}
                    {example.available ? (
                      <>
                        <span>{example.price?.toFixed(2)} ({(example.changePercent ?? 0).toFixed(2)}%)</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {example.dataSource?.replace("_", " ")} · {t(`copilot_freshness_${example.freshness ?? "unavailable"}`, example.freshness ?? "unavailable")}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{t("slab_market_unavailable")}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground">{t("slab_market_learning_only")}</p>
            </div>
          )}
        </section>

        <p className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs leading-6 text-muted-foreground">
          {explanation.disclaimer}
        </p>

        <StrategyAskCopilot strategyName={explanation.name} />
      </CardContent>
    </Card>
  );
}
