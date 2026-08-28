import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";
import { useAnalysis } from "@/context/useAnalysis";
import { useLanguage } from "@/context/languageContext";

export function InputPage() {
  const [text, setText] = useState("");
  const { analyze, isAnalyzing } = useAnalysis();
  const { t } = useLanguage();

  const navigate = useNavigate();

  const chipGroups = [
    {
      label: t("input_chip_risk"),
      chips: [
        t("input_chip_risk_low"),
        t("input_chip_risk_medium"),
        t("input_chip_risk_high"),
      ],
    },
    {
      label: t("input_chip_horizon"),
      chips: [
        t("input_chip_horizon_short"),
        t("input_chip_horizon_medium"),
        t("input_chip_horizon_long"),
      ],
    },
    {
      label: t("input_chip_knowledge"),
      chips: [
        t("input_chip_knowledge_beginner"),
        t("input_chip_knowledge_some"),
        t("input_chip_knowledge_experienced"),
      ],
    },
    {
      label: t("input_chip_interests"),
      chips: [
        t("input_chip_interest_tech"),
        t("input_chip_interest_health"),
        t("input_chip_interest_realestate"),
        t("input_chip_interest_sp500"),
      ],
    },
    {
      label: t("input_chip_preferences"),
      chips: [
        t("input_chip_pref_dividend"),
        t("input_chip_pref_etf"),
        t("input_chip_pref_lowfee"),
        t("input_chip_pref_no_crypto"),
      ],
    },
  ];

  const handleSubmit = async () => {
    if (!text.trim() || isAnalyzing) return;

    try {
      await analyze(text.trim());
      navigate("/dashboard");
    } catch (error) {
      console.error("Analysis error:", error);
    }
  };

  const addChip = (chip: string) => setText((currentText) => (currentText ? `${currentText}\n${chip}.` : `${chip}.`));

  return (
    <Layout>
      <section className="container max-w-3xl py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("input_step_badge")}
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">
            {t("input_title")}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {t("input_subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="mt-10 p-1">
            <CardContent className="pt-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("input_placeholder")}
                rows={8}
                className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm leading-relaxed outline-none transition-shadow focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground/60"
              />

              <div className="mt-5 space-y-3.5">
                {chipGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.chips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => addChip(chip)}
                          className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  {text.trim().length === 0
                    ? t("input_chips_hint")
                    : `${text.trim().length} ${t("input_chars")}`}
                </span>
                <Button size="lg" disabled={!text.trim() || isAnalyzing} onClick={handleSubmit} className="gap-2">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("input_button_analyzing")}
                    </>
                  ) : (
                    t("input_button_submit")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <DisclaimerBanner className="mt-6" />
      </section>
    </Layout>
  );
}
