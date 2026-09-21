import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import { STRATEGIES } from "@/lib/strategies";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/context/languageContext";

function localized(
  value: string | { he: string; en: string },
  language: string
): string {
  if (typeof value === "string") return value;
  return language === "he" ? value.he : value.en;
}

function localizedArray(
  value: string[] | { he: string[]; en: string[] },
  language: string
): string[] {
  if (Array.isArray(value)) return value;
  return language === "he" ? value.he : value.en;
}

const ROWS = (t: (key: string, fallback?: string) => string) => [
  {
    label: t("comparison_risk_label", "Risk Level"),
    render: (strategy: typeof STRATEGIES[number]) =>
      `${strategy.riskLevel}/10`,
  },

  {
    label: t("comparison_diversification_label", "Diversification"),
    render: (strategy: typeof STRATEGIES[number]) => {
      if (strategy.id === "passive")
        return t("comparison_diversification_very_high", "Very high");

      if (strategy.id === "growth")
        return t("comparison_diversification_medium_low", "Medium-low");

      return t("comparison_diversification_medium", "Medium");
    },
  },

  {
    label: t("comparison_feature_label", "Key Characteristic"),
    render: (strategy: typeof STRATEGIES[number]) => {
      switch (strategy.id) {
        case "passive":
          return t("comparison_feature_low_cost", "Low cost and simplicity");

        case "dividend":
          return t("comparison_feature_income", "Steady income");

        case "growth":
          return t("comparison_feature_growth", "High return potential");

        default:
          return t("comparison_feature_value", "Finding value in the market");
      }
    },
  },

  {
    label: t("comparison_main_advantage_label", "Main Advantage"),
    render: (strategy: typeof STRATEGIES[number], language: string) =>
      localizedArray(strategy.pros, language)[0] ?? "",
  },

  {
    label: t("comparison_main_disadvantage_label", "Main Disadvantage"),
    render: (strategy: typeof STRATEGIES[number], language: string) =>
      localizedArray(strategy.cons, language)[0] ?? "",
  },
];

export function ComparisonCard() {
  const [selected, setSelected] = useState<string[]>([
    "passive",
    "dividend",
    "growth",
  ]);

  const { t, language } = useLanguage();
  const rows = ROWS(t);

  const selectedStrategies = useMemo(
    () =>
      STRATEGIES.filter((strategy) =>
        selected.includes(strategy.id)
      ),

    [selected]

  );

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, id];
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Scale className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              {t("comparison_strategies_tag", "Strategy Comparison")}
            </span>
          </div>

          <CardTitle className="text-xl">
            {t("comparison_which_approach_title", "Which approach fits me better?")}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-5 flex flex-wrap gap-2">
            {STRATEGIES.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => toggle(strategy.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  selected.includes(strategy.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {localized(strategy.name, language)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 border-b border-border py-2 text-right text-xs font-semibold text-muted-foreground">
                    {t("comparison_feature_column", "Feature")}
                  </th>

                  {selectedStrategies.map((strategy) => (
                    <th
                      key={strategy.id}
                      className="border-b border-border py-2 text-right font-display font-bold"
                    >
                      {localized(strategy.name, language)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-3 pl-2 text-xs font-semibold text-muted-foreground">
                      {row.label}
                    </td>

                    {selectedStrategies.map((strategy) => (
                      <td
                        key={strategy.id}
                        className="py-3 pl-4 leading-relaxed"
                      >
                        {row.render(strategy, language)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
