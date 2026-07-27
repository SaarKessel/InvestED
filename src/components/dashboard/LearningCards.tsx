import { motion } from "framer-motion";
import { BookOpen, AlertOctagon, Milestone, Info } from "lucide-react";
import type { AnalysisResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { Accordion, Tooltip } from "@/components/ui/interactive";
import { FINANCE_CONCEPTS, COMMON_MISTAKES, LEARNING_ROADMAP } from "@/lib/educationContent";

export function ConceptsCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">מושגים שכדאי ללמוד</span>
          </div>
          <CardTitle className="text-xl">מילון מונחים מהיר</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FINANCE_CONCEPTS.map((c) => (
              <Tooltip key={c.term} label={c.definition}>
                <span className="w-full cursor-help rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-semibold transition-colors hover:bg-accent">
                  {c.term}
                </span>
              </Tooltip>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MistakesCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-danger">
            <AlertOctagon className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">טעויות נפוצות</span>
          </div>
          <CardTitle className="text-xl">מה כדאי להימנע ממנו</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {COMMON_MISTAKES.map((m) => (
              <div key={m.title} className="rounded-xl border border-danger/25 bg-danger/5 p-4">
                <p className="mb-1 text-sm font-bold text-danger">{m.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{m.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RoadmapCard({ result }: { result: AnalysisResult }) {
  const knowledge = result.flags.knowledgeLevel;

  // מסלול מותאם אישית: מתחילים מקבלים את המסלול המלא, מהבסיס ואילך.
  // מי שכבר מבין את החומר מקבל מסלול קצר יותר, שמתחיל מהשלבים
  // המתקדמים ורלוונטיים יותר, כשהבסיס מוצג כ"רענון" אופציונלי בסוף.
  const isExperienced = knowledge === "experienced";
  const isSome = knowledge === "some";

  let orderedStages = LEARNING_ROADMAP;
  let explanation =
    "מכיוון שלא ציינת רמת ידע פיננסית קודמת, בנינו לך מסלול מלא שמתחיל מהבסיס.";

  if (isExperienced) {
    orderedStages = [...LEARNING_ROADMAP].slice(2).reverse().concat([
      { ...LEARNING_ROADMAP[0], title: `${LEARNING_ROADMAP[0].title} (רענון אופציונלי)` },
      { ...LEARNING_ROADMAP[1], title: `${LEARNING_ROADMAP[1].title} (רענון אופציונלי)` },
    ]);
    explanation =
      "זיהינו שכבר יש לך ידע פיננסי — לכן המסלול מתחיל ישר מהשלבים המתקדמים, ושלבי הבסיס מופיעים בסוף כרענון אופציונלי בלבד.";
  } else if (isSome) {
    orderedStages = LEARNING_ROADMAP.slice(1);
    explanation = "מכיוון שציינת שיש לך כבר בסיס ידע, דילגנו על שלב המבוא והתחלנו משלב ההיכרות עם שוק ההון.";
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Milestone className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">מסלול למידה אישי</span>
          </div>
          <CardTitle className="text-xl">מאיפה להתחיל?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {explanation}
          </div>

          <Accordion
            items={orderedStages.map((stage) => ({
              id: stage.stage + stage.title,
              title: (
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {stage.stage.replace("שלב ", "")}
                  </span>
                  {stage.title}
                </span>
              ),
              content: (
                <ul className="space-y-1.5">
                  {stage.topics.map((topic) => (
                    <li key={topic} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {topic}
                    </li>
                  ))}
                </ul>
              ),
            }))}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
