import { useMemo, useState } from "react";
import { GitCompareArrows, RotateCcw, Search } from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import {
  assetTypeLabel,
  filterStrategies,
  horizonLabel,
  localize,
  searchStrategies,
} from "@/lib/strategy/strategyEngine";
import type { StrategyAssetType, StrategyId, StrategyTimeHorizon } from "@/types";

interface StrategyExplorerProps {
  selectedId: StrategyId | null;
  onSelect: (id: StrategyId) => void;
  compareSelection: StrategyId[];
  compareMode: boolean;
  onToggleCompareMode: () => void;
  onToggleCompareSelection: (id: StrategyId) => void;
  onRunComparison: () => void;
  onClearComparison: () => void;
}

const HORIZONS: StrategyTimeHorizon[] = ["short", "medium", "long"];
const ASSET_TYPES: StrategyAssetType[] = ["index_funds", "etfs", "stocks", "bonds", "cash_equivalents", "mixed"];

function riskTone(level: number): string {
  if (level <= 3) return "bg-success/10 text-success border-success/20";
  if (level <= 6) return "bg-warning/10 text-warning border-warning/20";
  return "bg-danger/10 text-danger border-danger/20";
}

/**
 * Browse / search / filter / pick-for-compare over the
 * Strategy Engine universe. Pure view: all logic is engine calls.
 */
export function StrategyExplorer({
  selectedId,
  onSelect,
  compareSelection,
  compareMode,
  onToggleCompareMode,
  onToggleCompareSelection,
  onRunComparison,
  onClearComparison,
}: StrategyExplorerProps) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const [query, setQuery] = useState("");
  const [maxRisk, setMaxRisk] = useState<number | null>(null);
  const [horizon, setHorizon] = useState<StrategyTimeHorizon | null>(null);
  const [assetType, setAssetType] = useState<StrategyAssetType | null>(null);

  const results = useMemo(() => {
    const searched = searchStrategies(query);
    return filterStrategies(
      {
        maxRiskLevel: maxRisk ?? undefined,
        timeHorizon: horizon ?? undefined,
        assetType: assetType ?? undefined,
      },
      searched
    );
  }, [query, maxRisk, horizon, assetType]);

  const filtersActive = query.trim() !== "" || maxRisk !== null || horizon !== null || assetType !== null;

  function resetFilters() {
    setQuery("");
    setMaxRisk(null);
    setHorizon(null);
    setAssetType(null);
  }

  const selectClass =
    "rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      {/* Controls */}
      <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("slab_search_placeholder")}
            aria-label={t("slab_search_aria")}
            className="w-full rounded-xl border border-border bg-background py-2.5 pe-3 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            {t("slab_filter_risk_label")}
            <select
              value={maxRisk === null ? "" : String(maxRisk)}
              onChange={(event) => setMaxRisk(event.target.value === "" ? null : Number(event.target.value))}
              className={selectClass}
            >
              <option value="">{t("slab_filter_all")}</option>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <option key={level} value={level}>{level}/10</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            {t("slab_filter_horizon_label")}
            <select
              value={horizon ?? ""}
              onChange={(event) => setHorizon((event.target.value || null) as StrategyTimeHorizon | null)}
              className={selectClass}
            >
              <option value="">{t("slab_filter_all")}</option>
              {HORIZONS.map((item) => (
                <option key={item} value={item}>{horizonLabel(item, lang)}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            {t("slab_filter_asset_label")}
            <select
              value={assetType ?? ""}
              onChange={(event) => setAssetType((event.target.value || null) as StrategyAssetType | null)}
              className={selectClass}
            >
              <option value="">{t("slab_filter_all")}</option>
              {ASSET_TYPES.map((item) => (
                <option key={item} value={item}>{assetTypeLabel(item, lang)}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">
          {t("slab_results_count", "{count} strategies").replace("{count}", String(results.length))}
        </p>
        <div className="flex items-center gap-2">
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
            >
              <RotateCcw className="h-3 w-3" /> {t("slab_reset_filters")}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleCompareMode}
            aria-pressed={compareMode}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              compareMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            <GitCompareArrows className="h-3.5 w-3.5" /> {t("slab_compare_mode")}
          </button>
        </div>
      </div>

      {compareMode && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs">
          <span className="text-muted-foreground">
            {compareSelection.length === 2
              ? t("slab_compare_selected", "Selected: {first} + {second}")
                  .replace("{first}", localize(results.find((s) => s.id === compareSelection[0])?.name ?? { he: compareSelection[0], en: compareSelection[0] }, lang))
                  .replace("{second}", localize(results.find((s) => s.id === compareSelection[1])?.name ?? { he: compareSelection[1], en: compareSelection[1] }, lang))
              : t("slab_compare_hint")}
          </span>
          {compareSelection.length === 2 && (
            <button
              type="button"
              onClick={onRunComparison}
              className="rounded-lg bg-primary px-3 py-1.5 font-bold text-primary-foreground"
            >
              {t("slab_compare_run")}
            </button>
          )}
          {compareSelection.length > 0 && (
            <button
              type="button"
              onClick={onClearComparison}
              className="rounded-lg border border-border px-3 py-1.5 font-semibold text-muted-foreground hover:bg-accent"
            >
              {t("slab_compare_clear")}
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-bold">{t("slab_empty_title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("slab_empty_body")}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((strategy) => {
            const isSelected = selectedId === strategy.id;
            const isCompareSelected = compareSelection.includes(strategy.id);
            return (
              <li key={strategy.id}>
                <div
                  className={`flex h-full flex-col rounded-2xl border bg-card p-5 transition-shadow ${
                    isSelected ? "border-primary shadow-md ring-1 ring-primary/30" : "border-border hover:shadow-sm"
                  } ${isCompareSelected ? "ring-2 ring-primary/40" : ""}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold leading-6">
                      {localize(strategy.name, lang)}
                    </h3>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${riskTone(strategy.riskProfile.level)}`}>
                      {strategy.riskProfile.level}/10
                    </span>
                  </div>
                  <p className="mb-3 flex-1 text-xs leading-6 text-muted-foreground">
                    {localize(strategy.description, lang)}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {strategy.timeHorizon.map((item) => (
                      <Badge key={item} variant="outline" className="text-[10px]">{horizonLabel(item, lang)}</Badge>
                    ))}
                  </div>
                  {compareMode ? (
                    <button
                      type="button"
                      onClick={() => onToggleCompareSelection(strategy.id)}
                      aria-pressed={isCompareSelected}
                      aria-label={`${t("slab_select_for_compare_aria")}: ${localize(strategy.name, lang)}`}
                      className={`mt-auto w-full rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                        isCompareSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                      }`}
                    >
                      {t("slab_compare_mode")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(strategy.id)}
                      aria-label={`${t("slab_card_open_aria")}: ${localize(strategy.name, lang)}`}
                      aria-expanded={isSelected}
                      className="mt-auto w-full rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                    >
                      {localize(strategy.name, lang)}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
