import { BrainCircuit, ChartNoAxesCombined, GitCompareArrows, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/languageContext";

/** Illustrated learning paths, not market data or a prediction. */
export function LearningConstellation() {
  const { language } = useLanguage();
  const he = language === "he";
  const paths = [
    { Icon: ChartNoAxesCombined, label: he ? "להבין נתונים" : "Explore data", detail: he ? "מקור ועדכניות" : "Source and freshness" },
    { Icon: GitCompareArrows, label: he ? "להשוות תרחישים" : "Compare scenarios", detail: he ? "הנחות גלויות" : "Visible assumptions" },
    { Icon: BrainCircuit, label: he ? "ללמוד עם AI" : "Learn with AI", detail: he ? "הסבר, לא המלצה" : "Explanation, not advice" },
  ];
  return <div className="learning-constellation relative mx-auto mt-14 w-full max-w-4xl overflow-hidden rounded-[2rem] border border-primary/25 p-5 text-start shadow-[0_24px_90px_-35px_hsl(var(--primary)/0.45)] sm:p-7" aria-label={he ? "מסלולי הלמידה של InvestED" : "InvestED learning paths"}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.14),transparent_65%)]" aria-hidden="true" />
    <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-primary/15 pb-5">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary"><span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />INVESTED / LEARNING MAP</div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" />{he ? "כלי לימודי, לא ייעוץ" : "Education, not advice"}</span>
    </div>
    <div className="relative grid gap-3 pt-5 sm:grid-cols-3">
      {paths.map(({ Icon, label, detail }, index) => <div key={label} className="group relative rounded-2xl border border-primary/15 bg-card/75 p-5 transition-colors hover:border-primary/50">
        <div className="mb-5 flex items-center justify-between"><span className="text-xs tabular-nums text-muted-foreground">0{index + 1} / 03</span><Icon className="h-5 w-5 text-primary" aria-hidden="true" /></div>
        <h2 className="text-base font-bold text-foreground">{label}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-primary/10" aria-hidden="true"><div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${48 + index * 17}%` }} /></div>
      </div>)}
    </div>
    <p className="relative mt-4 text-xs text-muted-foreground">{he ? "המחשה של מסלולי למידה, לא נתוני שוק" : "Learning-path illustration, not market data"}</p>
  </div>;
}
