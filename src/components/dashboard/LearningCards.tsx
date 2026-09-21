import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, AlertOctagon, Milestone, Info } from "lucide-react";

import type { AnalysisResult } from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import {
  Accordion,
  Tooltip,
} from "@/components/ui/interactive";

import {
  FINANCE_CONCEPTS,
  COMMON_MISTAKES,
  LEARNING_ROADMAP,
} from "@/lib/educationContent";

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

export function ConceptsCard() {
  const { t, language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              {t("learning_title", "Concepts to Learn")}
            </span>
          </div>

          <CardTitle className="text-xl">
            {t("learning_terms_label", "Quick Glossary")}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FINANCE_CONCEPTS.map((concept) => {
              const term = localized(concept.term, language);
              const definition = localized(concept.definition, language);

              return (
                <Tooltip key={term} label={definition}>
                  <span className="w-full cursor-help rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-semibold transition-colors hover:bg-accent">
                    {term}
                  </span>
                </Tooltip>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MistakesCard() {
  const { t, language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-danger">
            <AlertOctagon className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              {t("learning_mistakes_title", "Common Mistakes")}
            </span>
          </div>

          <CardTitle className="text-xl">
            {t("learning_mistakes_subtitle", "What to avoid")}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {COMMON_MISTAKES.map((mistake) => {
              const title = localized(mistake.title, language);
              const detail = localized(mistake.detail, language);

              return (
                <div
                  key={title}
                  className="rounded-xl border border-danger/25 bg-danger/5 p-4"
                >
                  <p className="mb-1 text-sm font-bold text-danger">{title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {detail}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RoadmapCard({
  result,
}: {
  result: AnalysisResult;
}) {
  const { t, language } = useLanguage();

  const orderedStages = useMemo(() => {
    const knowledge = result.flags.knowledgeLevel;
    const base = LEARNING_ROADMAP ?? [];

    if (knowledge === "experienced") {
      return [
        ...base.slice(2),
        {
          ...base[0],
          title: `${localized(base[0]?.title, language) ?? t("learning_default_title", "Basics")} (${t("learning_optional_refresh", "Optional refresh")})`,
        },
        {
          ...base[1],
          title: `${localized(base[1]?.title, language) ?? t("learning_default_title", "Basics")} (${t("learning_optional_refresh", "Optional refresh")})`,
        },
      ];
    }

    if (knowledge === "some") {
      return base.slice(1);
    }

    return base;
  }, [result.flags.knowledgeLevel, language, t]);

  const explanation =
    result.flags.knowledgeLevel === "experienced"
      ? t(
          "learning_note_experienced",
          "We identified that you already have financial knowledge — so the track starts from advanced stages, and the basics appear at the end as an optional refresh only."
        )
      : result.flags.knowledgeLevel === "some"
        ? t(
            "learning_note_some",
            "Since you indicated you already have some basic knowledge, we skipped the introductory stage and started from the stock market familiarization stage."
          )
        : t(
            "learning_note_unknown",
            "Since you did not indicate a previous financial knowledge level, we built you a full track starting from the basics."
          );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Milestone className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              {t("learning_roadmap_title", "Personal Learning Track")}
            </span>
          </div>

          <CardTitle className="text-xl">
            {t("learning_where_to_start", "Where to start?")}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {explanation}
          </div>

          <Accordion
            items={orderedStages.map((stage) => {
              const stageName = localized(stage.stage, language);
              const title = localized(stage.title, language);
              const topics = localizedArray(stage.topics, language);

              return {
                id: `${stageName}-${title}`,
                title: (
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {stageName.replace("Stage ", "").replace("שלב ", "")}
                    </span>
                    {title}
                  </span>
                ),
                content: (
                  <ul className="space-y-1.5">
                    {topics.map((topic) => (
                      <li
                        key={topic}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                ),
              };
            })}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
