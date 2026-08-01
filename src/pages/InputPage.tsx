import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";
import { useAnalysis } from "@/context/useAnalysis";

const EXAMPLE =
  `אני בן 27.\nאני רוצה להשקיע לטווח ארוך.\nאין לי הרבה ידע בהשקעות.\nאני מוכן לקחת סיכון בינוני.\nאני מתעניין בטכנולוגיה ובריאות.\nאני רוצה להבין איך לבנות תיק השקעות.`;

const CHIP_GROUPS: { label: string; chips: string[] }[] = [
  {
    label: "רמת סיכון",
    chips: ["אני שמרן ומעדיף סיכון נמוך", "אני מוכן לקחת סיכון בינוני", "אני מוכן לקחת סיכון גבוה"],
  },
  {
    label: "אופק השקעה",
    chips: ["האופק שלי קצר, עד 3 שנים", "האופק שלי הוא כ-5 שנים", "האופק שלי הוא 20 שנה ומעלה"],
  },
  {
    label: "ידע פיננסי",
    chips: ["אין לי ידע פיננסי בכלל", "יש לי קצת ידע בסיסי", "אני משקיע עם ניסיון"],
  },
  {
    label: "תחומי עניין",
    chips: ["מתעניין בטכנולוגיה", "מתעניין בבריאות", "מתעניין בנדל\"ן ואנרגיה", "מתעניין בפיננסים ובנקאות"],
  },
  {
    label: "העדפות השקעה",
    chips: [
      "אני רוצה הכנסה פסיבית מדיבידנדים",
      "אני מעדיף קרנות סל על פני מניות בודדות",
      "אני רוצה דמי ניהול נמוכים",
      "לא מעוניין בקריפטו",
    ],
  },
];

export function InputPage() {
  const [text, setText] = useState("");
  const { analyze, isAnalyzing } = useAnalysis();
  const navigate = useNavigate();

const handleSubmit = async () => {
  if (!text.trim()) return;

  console.log("1 - button clicked");

  try {
    await analyze(text.trim());

    console.log("2 - analyze finished");

    navigate("/dashboard");

    console.log("3 - navigation called");
  } catch (error) {
    console.error("ANALYZE ERROR:", error);
  }
};

  const addChip = (chip: string) => setText((t) => (t ? `${t}\n${chip}.` : `${chip}.`));

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
            שלב 1 מתוך 2
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">ספרו לנו קצת על עצמכם</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            כתבו בשפה חופשית — גיל, מטרות, ידע פיננסי, רמת סיכון, תחומי עניין. ככל שתפרטו
            יותר, הניתוח יהיה מדויק יותר. אפשר גם פשוט ללחוץ על הכפתורים למטה.
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
                placeholder={EXAMPLE}
                rows={8}
                className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm leading-relaxed outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />

              <div className="mt-5 space-y-3.5">
                {CHIP_GROUPS.map((group) => (
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
                  {text.trim().length === 0 ? "נסו את הכפתורים למעלה כדי להתחיל מהר" : `${text.trim().length} תווים`}
                </span>
                <Button size="lg" disabled={!text.trim() || isAnalyzing} onClick={handleSubmit} className="gap-2">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      מנתח את הפרופיל שלך...
                    </>
                  ) : (
                    "נתח את הפרופיל שלי"
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
