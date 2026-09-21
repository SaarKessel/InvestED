import { Link } from "react-router-dom";
import { Brain, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import { useQuizBank } from "@/lib/quizBank";
import { getBestQuizScore } from "@/lib/quizProgressStorage";

export function TriviaPromoCard() {
  const { t, dir } = useLanguage();
  const bank = useQuizBank();
  const best = getBestQuizScore(bank.length);

  return (
    <Link to="/trivia" className="block">
      <Card className="group h-full border-primary/20 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="flex items-center gap-4 p-5 sm:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Brain className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold">{t("trivia_card_title")}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("trivia_card_desc")}</p>
            {best && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Trophy className="h-3.5 w-3.5" />
                {t("trivia_best_score")}: {best.score} / {best.total}
              </p>
            )}
          </div>
          <span className="shrink-0 text-sm font-semibold text-primary transition-transform duration-200 group-hover:scale-105" dir={dir}>
            {t("trivia_card_cta")} {dir === "rtl" ? "←" : "→"}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
