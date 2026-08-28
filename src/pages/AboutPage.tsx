import { motion } from "framer-motion";
import {
  GraduationCap,
  Sparkles,
  Code2,
  LineChart,
  Palette,
  Linkedin,
  Layers,
  Cpu,
  Cloud,
  Paintbrush,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";

const PILLARS = [
  { icon: Sparkles, label: "Artificial Intelligence" },
  { icon: GraduationCap, label: "Financial Education" },
  { icon: LineChart, label: "Data Visualization" },
  { icon: Palette, label: "Product Thinking" },
  { icon: Code2, label: "Full Stack Development" },
];

export function AboutPage() {
  const { t } = useLanguage();

  const TECH_STACK = [
    {
      icon: Layers,
      title: t("about_section_arch_title"),
      items: ["React 18", "TypeScript", "Vite", "React Router"],
      desc: t("about_section_arch_desc"),
    },
    {
      icon: Paintbrush,
      title: t("about_section_ui_title"),
      items: t("about_section_ui_items").split(", "),
      desc: t("about_section_ui_desc"),
    },
    {
      icon: BarChart3,
      title: t("about_section_viz_title"),
      items: t("about_section_viz_items").split(", "),
      desc: t("about_section_viz_desc"),
    },
    {
      icon: Cpu,
      title: t("about_section_ai_title"),
      items: t("about_section_ai_items").split(", "),
      desc: t("about_section_ai_desc"),
    },
    {
      icon: Cloud,
      title: t("about_stack_market_title"),
      items: t("about_stack_market_items").split(", "),
      desc: t("about_stack_market_desc"),
    },
  ];

  return (
    <Layout>
      <section className="container max-w-3xl py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("about_hero_badge_full")}
          </span>

          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">{t("about_hero_title")}</h1>

          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p>{t("about_p1")}</p>
            <p>{t("about_p2")}</p>
            <p>{t("about_p3")}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://www.linkedin.com/in/saarkessel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
            >
              <Linkedin className="h-4 w-4 text-primary" />
              {t("about_linkedin_btn")}
            </a>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary" />
              {t("about_bank_exp")}
            </span>
          </div>

          <Card className="mt-10">
            <CardContent className="pt-6">
              <p className="mb-4 text-sm font-bold">{t("about_pillars_intro")}</p>
              <div className="flex flex-wrap gap-3">
                {PILLARS.map((p) => (
                  <span
                    key={p.label}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-semibold"
                  >
                    <p.icon className="h-3.5 w-3.5 text-primary" />
                    {p.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-14">
            <h2 className="font-display text-2xl font-bold">{t("about_stack_title_full")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("about_stack_subtitle_full")}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {TECH_STACK.map((tItem) => (
                <div key={tItem.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <tItem.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 font-display font-bold">{tItem.title}</h3>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{tItem.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tItem.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm leading-relaxed">
            {t("about_disclaimer_full")}
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
