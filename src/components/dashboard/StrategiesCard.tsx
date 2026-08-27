import { motion } from "framer-motion";
import { Layers, Check, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import { STRATEGIES } from "@/lib/strategies";
import { useLanguage } from "@/context/languageContext";

function getRiskStyle(level: number) {
  if (level <= 3) {
    return "bg-success/10 text-success border-success/20";
  }

  if (level <= 6) {
    return "bg-warning/10 text-warning border-warning/20";
  }

  return "bg-danger/10 text-danger border-danger/20";
}

export function StrategiesCard() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.15,
      }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              {t("strategies_title", "אסטרטגיות השקעה")}
            </span>
          </div>

          <CardTitle className="text-xl">
            {t("strategies_subtitle", "היכרות עם סגנונות השקעה מרכזיים")}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-5 md:grid-cols-2">
            {STRATEGIES.map((strategy) => (
              <div
                key={strategy.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">
                    {strategy.name}
                  </h3>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${getRiskStyle(strategy.riskLevel)}`}
                  >
                    {t("strategies_risk_label", "סיכון {level}/10").replace("{level}", String(strategy.riskLevel))}
                  </span>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {strategy.whatItIs}
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-sm font-bold text-success">
                      <Check className="h-4 w-4" />
                      {t("strategies_pros", "יתרונות")}
                    </p>

                    <ul className="space-y-2">
                      {strategy.pros.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1 text-sm font-bold text-danger">
                      <X className="h-4 w-4" />
                      {t("strategies_cons", "חסרונות")}
                    </p>

                    <ul className="space-y-2">
                      {strategy.cons.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <X className="mt-0.5 h-3 w-3 shrink-0 text-danger" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <span className="font-bold text-foreground">
                      {t("strategies_suitable", "למי זה מתאים:")}
                    </span>{" "}
                    {strategy.suitableFor}
                  </p>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-bold text-muted-foreground">
                    {t("strategies_stocks_label", "דוגמאות מוכרות לנכסים בסגנון הזה ")}{" "}
                    <span className="text-primary">{t("strategies_learning_only", "*לימוד בלבד*")}</span>
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {strategy.stocks.map((stock) => (
                      <span
                        key={stock}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                      >
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
