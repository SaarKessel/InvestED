import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import { compareStrategies } from "@/lib/strategy/strategyEngine";
import type { StrategyId } from "@/types";

/**
 * Side-by-side strategy comparison, rendered from the
 * Strategy Engine's comparison result.
 */
export function StrategyCompare({ ids }: { ids: [StrategyId, StrategyId] }) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const comparison = compareStrategies(ids, lang);
  if (!comparison) return null;

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl">
          {comparison.strategies.map((strategy) => strategy.name).join(language === "he" ? " מול " : " vs ")}
        </CardTitle>
        <p className="text-sm leading-7 text-muted-foreground">{comparison.summary}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-start">
                <th scope="col" className="py-2 pe-4 text-start text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {t("slab_compare_col_dimension")}
                </th>
                {comparison.strategies.map((strategy) => (
                  <th key={strategy.strategy.id} scope="col" className="py-2 pe-4 text-start font-bold">
                    {strategy.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.dimension} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-3 pe-4 text-start text-xs font-bold text-muted-foreground">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={index} className="py-3 pe-4 text-sm leading-6 text-muted-foreground">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs leading-6 text-muted-foreground">
          {comparison.disclaimer}
        </p>
      </CardContent>
    </Card>
  );
}
