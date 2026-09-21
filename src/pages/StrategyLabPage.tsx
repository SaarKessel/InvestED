import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/context/languageContext";
import { StrategyExplorer } from "@/components/strategyLab/StrategyExplorer";
import { StrategyDetail } from "@/components/strategyLab/StrategyDetail";
import { StrategyCompare } from "@/components/strategyLab/StrategyCompare";
import type { StrategyId } from "@/types";

/**
 * Phase 6: Strategy Lab - browse, search, filter, compare and
 * learn the ten educational investment strategies, powered by
 * the Strategy Engine (src/lib/strategy). Educational only.
 */
export default function StrategyLabPage() {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<StrategyId | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<StrategyId[]>([]);
  const [comparison, setComparison] = useState<[StrategyId, StrategyId] | null>(null);

  function toggleCompareSelection(id: StrategyId) {
    setComparison(null);
    setCompareSelection((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return [current[1], id];
      return [...current, id];
    });
  }

  return (
    <Layout>
      <section className="container max-w-6xl py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
            <FlaskConical className="h-3.5 w-3.5" />
            {t("slab_tag")}
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("slab_title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {t("slab_subtitle")}
          </p>
        </motion.div>

        <StrategyExplorer
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId((current) => (current === id ? null : id));
            setComparison(null);
          }}
          compareSelection={compareSelection}
          compareMode={compareMode}
          onToggleCompareMode={() => {
            setCompareMode((current) => !current);
            setCompareSelection([]);
            setComparison(null);
          }}
          onToggleCompareSelection={toggleCompareSelection}
          onRunComparison={() => {
            if (compareSelection.length === 2) {
              setComparison([compareSelection[0], compareSelection[1]]);
              setSelectedId(null);
            }
          }}
          onClearComparison={() => {
            setCompareSelection([]);
            setComparison(null);
          }}
        />

        {comparison && <StrategyCompare ids={comparison} />}

        {selectedId && !comparison && (
          <div key={selectedId}>
            <StrategyDetail strategyId={selectedId} />
          </div>
        )}

        <p className="mt-8 rounded-xl border border-border bg-muted/40 p-4 text-xs leading-6 text-muted-foreground">
          {t("slab_disclaimer")}
        </p>
      </section>
    </Layout>
  );
}
