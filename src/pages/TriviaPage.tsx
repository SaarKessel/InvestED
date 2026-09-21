import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Check,
  X,
  RotateCcw,
  Trophy,
  Sparkles,
  ListChecks,
} from "lucide-react";

import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import { useQuizBank, type QuizQuestion } from "@/lib/quizBank";
import { getBestQuizScore, recordQuizScore, type QuizBestScore } from "@/lib/quizProgressStorage";
import { cn } from "@/lib/utils";

function shuffle<T>(items: T[]): T[] {
  return [...items]
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.value);
}

interface AnsweredQuestion {
  question: QuizQuestion;
  selectedIndex: number;
}

type Phase = "setup" | "playing" | "finished";

const COUNT_OPTIONS = [5, 10, 25];

export default function TriviaPage() {
  const { t } = useLanguage();
  const quizBank = useQuizBank();

  const [phase, setPhase] = useState<Phase>("setup");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [best, setBest] = useState<QuizBestScore | null>(null);

  const current = questions[step] ?? null;
  const score = useMemo(
    () => answers.filter((a) => a.selectedIndex === a.question.correctIndex).length,
    [answers]
  );
  const missed = useMemo(
    () => answers.filter((a) => a.selectedIndex !== a.question.correctIndex),
    [answers]
  );

  function refreshBest(count: number) {
    setBest(getBestQuizScore(count));
  }

  function startQuiz() {
    setQuestions(shuffle(quizBank).slice(0, Math.min(questionCount, quizBank.length)));
    setStep(0);
    setSelected(null);
    setAnswers([]);
    setPhase("playing");
  }

  function handleAnswer(index: number) {
    if (selected !== null || !current) return;
    setSelected(index);
    setAnswers((prev) => [...prev, { question: current, selectedIndex: index }]);
  }

  function handleNext() {
    if (step + 1 >= questions.length) {
      setBest(recordQuizScore(questions.length, score));
      setPhase("finished");
      return;
    }
    setStep((s) => s + 1);
    setSelected(null);
  }

  const progressPct = questions.length > 0 ? (answers.length / questions.length) * 100 : 0;

  return (
    <Layout>
      <section className="container max-w-3xl py-8 md:py-12">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
            <Brain className="h-4 w-4" />
            {t("trivia_page_tag")}
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t("trivia_page_title")}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{t("trivia_page_subtitle")}</p>
        </div>

        <AnimatePresence mode="wait">
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <p className="text-sm font-semibold">{t("trivia_choose_count")}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {COUNT_OPTIONS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setQuestionCount(count);
                          refreshBest(count);
                        }}
                        className={cn(
                          "rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors",
                          questionCount === count
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {count === quizBank.length
                          ? t("trivia_all_questions").replace("{n}", String(count))
                          : count}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>
                      {t("trivia_best_score")}:{" "}
                      {best ? `${best.score} / ${best.total}` : t("trivia_no_best")}
                    </span>
                  </div>

                  <Button size="lg" className="mt-8 gap-2 rounded-xl" onClick={startQuiz}>
                    <Sparkles className="h-4 w-4" />
                    {t("trivia_start")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {phase === "playing" && current && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>
                      {t("trivia_question_label")} {step + 1} {t("trivia_of_label")} {questions.length}
                    </span>
                    <span>
                      {score} / {answers.length}
                    </span>
                  </div>
                  <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <h2 className="text-lg font-bold leading-8 sm:text-xl">{current.question}</h2>

                  <div className="mt-6 space-y-3">
                    {current.options.map((option, index) => {
                      const isCorrect = index === current.correctIndex;
                      const isSelected = index === selected;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAnswer(index)}
                          disabled={selected !== null}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-start text-sm font-medium transition-colors",
                            selected === null && "border-border bg-background hover:border-primary/50 hover:bg-primary/5",
                            selected !== null && isCorrect && "border-green-500/60 bg-green-500/10 text-foreground",
                            selected !== null && isSelected && !isCorrect && "border-red-500/60 bg-red-500/10 text-foreground",
                            selected !== null && !isSelected && !isCorrect && "border-border bg-background opacity-60"
                          )}
                        >
                          <span>{option}</span>
                          {selected !== null && isCorrect && <Check className="h-4 w-4 shrink-0 text-green-500" />}
                          {selected !== null && isSelected && !isCorrect && <X className="h-4 w-4 shrink-0 text-red-500" />}
                        </button>
                      );
                    })}
                  </div>

                  {selected !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <p className={cn("text-sm font-bold", selected === current.correctIndex ? "text-green-500" : "text-red-500")}>
                        {selected === current.correctIndex ? t("trivia_correct_label") : t("trivia_wrong_label")}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        <span className="font-semibold text-foreground">{t("trivia_explanation_label")}: </span>
                        {current.explanation}
                      </p>
                      <Button className="mt-4 gap-2 rounded-xl" onClick={handleNext}>
                        {step + 1 >= questions.length ? t("trivia_finish") : t("trivia_next")}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {phase === "finished" && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card>
                <CardContent className="p-6 text-center sm:p-10">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Trophy className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-bold">{t("trivia_result_title")}</h2>
                  <p className="mt-2 font-display text-4xl font-extrabold">
                    {score} / {questions.length}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {score === questions.length
                      ? t("quiz_perfect")
                      : score >= questions.length / 2
                        ? t("quiz_good")
                        : t("quiz_okay")}
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button className="gap-2 rounded-xl" onClick={startQuiz}>
                      <RotateCcw className="h-4 w-4" />
                      {t("trivia_restart")}
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl"
                      onClick={() => {
                        setPhase("setup");
                        refreshBest(questionCount);
                      }}
                    >
                      <ListChecks className="h-4 w-4" />
                      {t("trivia_change_count")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-base font-bold">{t("trivia_review_title")}</h3>
                  {missed.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">{t("trivia_review_empty")}</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {missed.map((item) => (
                        <div key={item.question.id} className="rounded-xl border border-border bg-muted/30 p-4">
                          <p className="text-sm font-bold">{item.question.question}</p>
                          <p className="mt-2 text-sm text-red-500">
                            {t("trivia_your_answer")}: {item.question.options[item.selectedIndex]}
                          </p>
                          <p className="mt-1 text-sm text-green-600 dark:text-green-500">
                            {t("trivia_correct_answer")}: {item.question.options[item.question.correctIndex]}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.question.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <DisclaimerBanner className="mt-8" />
      </section>
    </Layout>
  );
}
