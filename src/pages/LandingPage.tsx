import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  LineChart,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  PenLine,
  Rocket,
  Code2,
  Bot,
} from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";

export function LandingPage() {
  const { dir, t } = useLanguage();
  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;
  const arrowHoverClass = dir === "rtl" ? "group-hover:-translate-x-1" : "group-hover:translate-x-1";

  const features = [
    {
      icon: Brain,
      title: t("feature_ai_title"),
      desc: t("feature_ai_desc"),
    },
    {
      icon: ShieldCheck,
      title: t("feature_xai_title"),
      desc: t("feature_xai_desc"),
    },
    {
      icon: LineChart,
      title: t("feature_portfolio_title"),
      desc: t("feature_portfolio_desc"),
    },
    {
      icon: GraduationCap,
      title: t("feature_roadmap_title"),
      desc: t("feature_roadmap_desc"),
    },
  ];

  const audience = [
    t("audience_item_1"),
    t("audience_item_2"),
    t("audience_item_3"),
    t("audience_item_4"),
  ];

  const steps = [
    {
      icon: PenLine,
      title: t("step_1_title"),
      desc: t("step_1_desc"),
    },
    {
      icon: Brain,
      title: t("step_2_title"),
      desc: t("step_2_desc"),
    },
    {
      icon: Sparkles,
      title: t("step_3_title"),
      desc: t("step_3_desc"),
    },
  ];

  const techStack = [
    {
      icon: Bot,
      title: t("tech_ai_title"),
      desc: t("tech_ai_desc"),
    },
    {
      icon: Code2,
      title: t("tech_stack_title"),
      desc: t("tech_stack_desc"),
    },
    {
      icon: Rocket,
      title: t("tech_fintech_title"),
      desc: t("tech_fintech_desc"),
    },
  ];

  return (
    <Layout>
      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative isolate overflow-hidden bg-background">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[-10rem] top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-[-10rem] h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Subtle overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />

        <div className="container relative flex flex-col items-center px-4 py-24 text-center sm:px-6 md:py-32 lg:py-36">
          {/* Product Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>

            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("hero_badge")}
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl text-balance font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {t("hero_title_prefix", "הכירו את סגנון ההשקעה שלכם")}
            <br />
            <span className="gradient-text">
              {t("hero_title_highlight", "בעזרת AI")}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-7 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
          >
            {t(
              "hero_desc",
              "InvestED turns the complex world of ETFs, diversification, risk and asset allocation into a clear, interactive, personalized learning experience."
            )}

            <span className="mt-3 block text-xs sm:text-sm">
              {t("hero_disclaimer", "For educational purposes only — not investment advice.")}
            </span>
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Link to="/start" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="group h-12 w-full gap-2 rounded-xl px-7 sm:w-auto"
              >
                {t("hero_cta_start", "גלו את הפרופיל שלכם")}
                <ArrowIcon
                  className={`h-4 w-4 transition-transform duration-200 ${arrowHoverClass}`}
                />
              </Button>
            </Link>

            <Link to="/about" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl px-7 sm:w-auto"
              >
                {t("hero_cta_about", "על הפרויקט")}
              </Button>
            </Link>
          </motion.div>

          {/* Product Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {t("hero_signal_ai", "Explainable AI")}
            </span>

            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />

            <span className="flex items-center gap-1.5">
              <LineChart className="h-3.5 w-3.5 text-primary" />
              {t("hero_signal_sim", "Financial Simulation")}
            </span>

            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />

            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              {t("hero_signal_edu", "Financial Education")}
            </span>
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}

      <section className="border-t border-border/60 bg-background py-24">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("features_title", "מה זה InvestED?")}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {t(
                "features_subtitle",
                "Combining AI, finance, and UX design to make investing more understandable."
              )}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full p-1">
                  <CardContent className="pt-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <feature.icon className="h-5 w-5" />
                    </div>

                    <h3 className="mb-2 font-display font-bold text-foreground">
                      {feature.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}

      <section className="border-t border-border/60 bg-muted/30 py-24">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("how_it_works_title", "איך זה עובד?")}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {t("how_it_works_subtitle", "שלושה שלבים פשוטים וקבלת דשבורד לימודי אישי.")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full gradient-brand text-lg font-bold text-white">
                  {index + 1}
                </div>

                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" />
                </div>

                <h3 className="mb-2 font-display text-lg font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          WHO IS IT FOR
      ========================================================= */}

      <section className="border-t border-border/60 bg-background py-24">
        <div className="container grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="mb-3 inline-block text-sm font-semibold text-primary">
              {t("audience_badge", "למידה פיננסית בגובה העיניים")}
            </span>

            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("audience_title", "למי זה מתאים?")}
            </h2>

            <p className="mt-4 text-muted-foreground">
              {t(
                "audience_subtitle",
                "InvestED was built for people who want to understand the world of investing before making decisions."
              )}
            </p>

            <ul className="mt-7 space-y-3">
              {audience.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-foreground"
                >
                  <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/start" className="mt-8 inline-block">
              <Button size="lg" className="group gap-2 rounded-xl">
                {t("audience_cta", "התחילו עכשיו")}
                <ArrowIcon
                  className={`h-4 w-4 transition-transform duration-200 ${arrowHoverClass}`}
                />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl" />

            <Card className="overflow-hidden p-2">
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("sample_card_tag", "InvestED Analysis")}
                    </span>

                    <span className="mt-1 block text-sm font-semibold text-foreground">
                      {t("sample_card_title", "דוגמה לפרופיל משקיע")}
                    </span>
                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {t("sample_card_risk", "8/10 סיכון")}
                  </span>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                    <span>{t("sample_card_risk_label", "רמת סיכון")}</span>
                    <span>{t("sample_card_risk_high", "גבוהה")}</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-4/5 rounded-full gradient-brand" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: t("sample_card_asset_us", "מניות ארה״ב"),
                      value: "50%",
                    },
                    {
                      label: t("sample_card_asset_intl", "בינלאומי"),
                      value: "20%",
                    },
                    {
                      label: t("sample_card_asset_tech", "טכנולוגיה"),
                      value: "15%",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border bg-muted/20 p-3 text-center transition-colors hover:bg-accent"
                    >
                      <div className="text-xs text-muted-foreground">
                        {item.label}
                      </div>

                      <div className="mt-1 font-display font-bold text-foreground">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("sample_card_insight_tag", "AI Insight")}
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(
                      "sample_card_insight_text",
                      "A long investment horizon allows compound interest to significantly impact wealth growth."
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* =========================================================
          TECH STACK
      ========================================================= */}

      <section className="border-t border-border/60 bg-muted/30 py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">
              {t("tech_title", "בנוי בטכנולוגיות מודרניות")}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {t(
                "tech_subtitle",
                "A personal FinTech project combining software development, AI, and financial education."
              )}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {techStack.map((item) => (
              <Card
                key={item.title}
                className="transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>

                  <h3 className="font-bold text-foreground">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}

      <section className="border-t border-border/60 bg-background py-24">
        <div className="container text-center">
          <Card className="mx-auto max-w-3xl overflow-hidden">
            <CardContent className="relative p-10 sm:p-12">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />

              <div className="relative">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>

                <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                  {t("final_cta_title", "מוכנים להכיר את פרופיל ההשקעה שלכם?")}
                </h2>

                <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
                  {t(
                    "final_cta_subtitle",
                    "Write a few sentences about yourself and get a personalized AI-based financial analysis in under a minute."
                  )}
                </p>

                <Link to="/start" className="mt-8 inline-block">
                  <Button
                    size="lg"
                    className="group gap-2 rounded-xl px-7"
                  >
                    {t("final_cta_button", "Start AI Analysis")}
                    <ArrowIcon
                      className={`h-4 w-4 transition-transform duration-200 ${arrowHoverClass}`}
                    />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
