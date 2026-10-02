import { Link } from "react-router-dom";
import { ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import { recommendPath, type TopicId } from "@/lib/learningPath";
import type { LearningDiagnostic } from "@/lib/learningJourney";

/** Ordered list of weak topics, from plain rules over the diagnostic. */
export function RecommendedPath({ diagnostic, quiz }: { diagnostic: LearningDiagnostic; quiz: { score: number; total: number } | null }) {
  const { t } = useLanguage();
  const result = recommendPath({
    level: diagnostic.level, goal: diagnostic.goal, minutesPerWeek: diagnostic.minutesPerWeek,
    knownTopics: (diagnostic.knownTopics ?? []) as TopicId[], quiz,
  });
  return <Card className="mb-6 border-primary/20" data-testid="recommended-path"><CardContent className="p-6">
    <div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><ListChecks className="h-5 w-5" /></div><h3 className="text-lg font-extrabold">{t("learn_rec_title")}</h3></div>
    {result.allKnown ? <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("learn_rec_none")}</p> : <>
      <ol className="mt-4 space-y-2">{result.steps.map((step, index) => <li key={step.topic} className="flex items-start gap-3 text-sm">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
        <span><span className="font-semibold">{t(`learn_topic_${step.topic}`)}</span><span className="text-muted-foreground"> - {t(`learn_rec_why_${step.reason}`)}</span></span>
      </li>)}</ol>
      {result.weakCount > result.steps.length && <p className="mt-3 text-xs text-muted-foreground">{t("learn_rec_more").replace("{n}", String(result.weakCount - result.steps.length))}</p>}
      <Link to="/chat" className="mt-4 inline-block text-sm font-semibold text-primary underline">{t("learn_rec_ask")}</Link>
    </>}
  </CardContent></Card>;
}
