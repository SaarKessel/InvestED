import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, BrainCircuit, Check, ChevronRight, Gauge, LockKeyhole, RotateCcw, Sparkles, Target, Trophy } from "lucide-react";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Badge, Button, Card, CardContent, Progress } from "@/components/ui/primitives";
import { useLanguage } from "@/context/languageContext";
import { cn } from "@/lib/utils";
import { type LearningGoal, type LearningJourneyState, type LearningLevel, type JourneyStepId, journeyProgress, nextJourneyStep, readLearningJourney, saveLearningJourney } from "@/lib/learningJourney";
import { getBestQuizScore } from "@/lib/quizProgressStorage";
import { getCurrentSimulation } from "@/lib/simulation/simulationStorage";


export default function LearnPage() {
  const { t } = useLanguage();
  const [state, setState] = useState<LearningJourneyState>(() => readLearningJourney());
  const [level, setLevel] = useState<LearningLevel>("foundation");
  const [goal, setGoal] = useState<LearningGoal>("confidence");
  const [minutes, setMinutes] = useState<30 | 60 | 120>(60);
  const quiz = getBestQuizScore(5);
  const simulation = getCurrentSimulation();
  const progress = journeyProgress(state);
  const next = nextJourneyStep(state);

  const insight = useMemo(() => {
    if (!state.diagnostic) return t("learn_feedback_before");
    if (state.completedSteps.includes("reflection")) return t("learn_feedback_complete");
    if (quiz && quiz.score < 3) return t("learn_feedback_quiz_review");
    if (simulation?.status === "active") return t("learn_feedback_sim_active");
    return t(`learn_feedback_${next}`);
  }, [next, quiz, simulation, state, t]);

  function update(nextState: LearningJourneyState) {
    setState(nextState);
    saveLearningJourney(nextState);
  }

  function finishDiagnostic() {
    update({ diagnostic: { level, goal, minutesPerWeek: minutes, completedAt: new Date().toISOString() }, completedSteps: [], reflection: "", updatedAt: "" });
  }

  function toggleStep(step: JourneyStepId) {
    const completed = state.completedSteps.includes(step)
      ? state.completedSteps.filter((item) => item !== step)
      : [...state.completedSteps, step];
    update({ ...state, completedSteps: completed });
  }

  const plan = [
    { id: "lesson" as const, icon: BookOpen, title: t("learn_step_lesson_title"), text: t(`learn_step_lesson_${state.diagnostic?.level ?? "foundation"}`), href: "/strategy-lab", action: t("learn_step_lesson_action") },
    { id: "practice" as const, icon: BrainCircuit, title: t("learn_step_practice_title"), text: t("learn_step_practice_text"), href: "/trivia", action: t("learn_step_practice_action") },
    { id: "simulation" as const, icon: Gauge, title: t("learn_step_sim_title"), text: t("learn_step_sim_text"), href: "/simulation", action: t("learn_step_sim_action") },
    { id: "reflection" as const, icon: Sparkles, title: t("learn_step_feedback_title"), text: t("learn_step_feedback_text"), href: "/chat", action: t("learn_step_feedback_action") },
  ];

  return <Layout>
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/10 via-background to-background">
      <div className="container max-w-6xl py-10 md:py-16">
        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_.6fr]">
          <div>
            <Badge><Sparkles className="h-3.5 w-3.5" />{t("learn_tag")}</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">{t("learn_title")}</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">{t("learn_subtitle")}</p>
          </div>
          <Card className="border-primary/20 bg-card/90 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between"><span className="text-sm font-bold">{t("learn_progress")}</span><span className="text-2xl font-extrabold text-primary">{progress}%</span></div>
              <Progress value={progress} className="mt-3" />
              <p className="mt-4 text-xs leading-6 text-muted-foreground"><LockKeyhole className="me-1 inline h-3.5 w-3.5" />{t("learn_local_note")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <section className="container max-w-6xl py-10 md:py-16">
      {!state.diagnostic ? <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-6 md:p-10">
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><Target className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-primary">{t("learn_diag_step")}</p><h2 className="text-2xl font-extrabold">{t("learn_diag_title")}</h2></div></div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{t("learn_diag_text")}</p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <Choice title={t("learn_diag_level")} value={level} onChange={(v) => setLevel(v as LearningLevel)} options={[["foundation",t("learn_level_foundation")],["builder",t("learn_level_builder")],["advanced",t("learn_level_advanced")]]} />
            <Choice title={t("learn_diag_goal")} value={goal} onChange={(v) => setGoal(v as LearningGoal)} options={[["confidence",t("learn_goal_confidence")],["portfolio",t("learn_goal_portfolio")],["analysis",t("learn_goal_analysis")]]} />
            <Choice title={t("learn_diag_time")} value={String(minutes)} onChange={(v) => setMinutes(Number(v) as 30|60|120)} options={[["30",t("learn_time_30")],["60",t("learn_time_60")],["120",t("learn_time_120")]]} />
          </div>
          <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={finishDiagnostic}>{t("learn_build_path")}<ChevronRight className="h-4 w-4" /></Button>
        </CardContent>
      </Card> : <>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">{t("learn_path_eyebrow")}</p><h2 className="mt-2 text-3xl font-extrabold">{t(`learn_path_${state.diagnostic.goal}`)}</h2><p className="mt-2 text-sm text-muted-foreground">{t("learn_path_schedule").replace("{minutes}", String(state.diagnostic.minutesPerWeek))}</p></div><Button variant="outline" size="sm" onClick={() => update({ diagnostic: null, completedSteps: [], reflection: "", updatedAt: "" })}><RotateCcw className="h-4 w-4" />{t("learn_redo")}</Button></div>
        <div className="grid gap-5 lg:grid-cols-2">{plan.map((item, index) => { const done=state.completedSteps.includes(item.id); const current=next===item.id; const Icon=item.icon; return <Card key={item.id} className={cn("relative overflow-hidden",current&&"border-primary/50 shadow-lg",done&&"bg-primary/[.035]")}><CardContent className="p-6"><div className="flex items-start gap-4"><div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",done?"bg-primary text-white":"bg-primary/10 text-primary")}>{done?<Check className="h-5 w-5"/>:<Icon className="h-5 w-5"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-muted-foreground">{t("learn_stage")} {index+2}/5</span>{current&&<Badge>{t("learn_next")}</Badge>}{done&&<Badge variant="success">{t("learn_done")}</Badge>}</div><h3 className="mt-2 text-xl font-bold">{item.title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p><div className="mt-5 flex flex-wrap gap-2"><Link to={item.href}><Button size="sm">{item.action}<ChevronRight className="h-4 w-4" /></Button></Link><Button size="sm" variant="outline" onClick={()=>toggleStep(item.id)}>{done?t("learn_mark_not_done"):t("learn_mark_done")}</Button></div></div></div></CardContent></Card>})}</div>
        <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card"><CardContent className="p-6 md:p-8"><div className="flex items-start gap-4"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><BrainCircuit className="h-6 w-6" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold">{t("learn_coach_title")}</h2><Badge variant="outline">{t("learn_evidence_badge")}</Badge></div><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{insight}</p><p className="mt-3 text-xs text-muted-foreground">{t("learn_feedback_scope")}</p></div></div></CardContent></Card>
        {progress===100&&<Card className="mt-6 border-primary bg-primary text-white"><CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center"><Trophy className="h-9 w-9"/><div className="flex-1"><h2 className="text-xl font-extrabold text-white">{t("learn_cycle_complete_title")}</h2><p className="mt-1 text-sm text-white/80">{t("learn_cycle_complete_text")}</p></div><Button variant="secondary" onClick={()=>update({...state,completedSteps:[]})}>{t("learn_new_cycle")}</Button></CardContent></Card>}
      </>}
      <DisclaimerBanner className="mt-8" />
    </section>
  </Layout>;
}

function Choice({title,value,onChange,options}:{title:string;value:string;onChange:(value:string)=>void;options:string[][]}) {
  return <fieldset><legend className="mb-3 text-sm font-bold">{title}</legend><div className="space-y-2">{options.map(([id,label])=><button key={id} type="button" onClick={()=>onChange(id)} className={cn("w-full rounded-xl border px-4 py-3 text-start text-sm font-medium transition-colors",value===id?"border-primary bg-primary/10 text-primary":"border-border hover:border-primary/40")}>{label}</button>)}</div></fieldset>;
}
