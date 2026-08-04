import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";
import { useAnalysis } from "@/context/useAnalysis";

const EXAMPLE =
  `׳׳ ׳™ ׳‘׳ 27.\n׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳”׳©׳§׳™׳¢ ׳׳˜׳•׳•׳— ׳׳¨׳•׳.\n׳׳™׳ ׳׳™ ׳”׳¨׳‘׳” ׳™׳“׳¢ ׳‘׳”׳©׳§׳¢׳•׳×.\n׳׳ ׳™ ׳׳•׳›׳ ׳׳§׳—׳× ׳¡׳™׳›׳•׳ ׳‘׳™׳ ׳•׳ ׳™.\n׳׳ ׳™ ׳׳×׳¢׳ ׳™׳™׳ ׳‘׳˜׳›׳ ׳•׳׳•׳’׳™׳” ׳•׳‘׳¨׳™׳׳•׳×.\n׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳”׳‘׳™׳ ׳׳™׳ ׳׳‘׳ ׳•׳× ׳×׳™׳§ ׳”׳©׳§׳¢׳•׳×.`;

const CHIP_GROUPS: { label: string; chips: string[] }[] = [
  {
    label: "׳¨׳׳× ׳¡׳™׳›׳•׳",
    chips: ["׳׳ ׳™ ׳©׳׳¨׳ ׳•׳׳¢׳“׳™׳£ ׳¡׳™׳›׳•׳ ׳ ׳׳•׳", "׳׳ ׳™ ׳׳•׳›׳ ׳׳§׳—׳× ׳¡׳™׳›׳•׳ ׳‘׳™׳ ׳•׳ ׳™", "׳׳ ׳™ ׳׳•׳›׳ ׳׳§׳—׳× ׳¡׳™׳›׳•׳ ׳’׳‘׳•׳”"],
  },
  {
    label: "׳׳•׳₪׳§ ׳”׳©׳§׳¢׳”",
    chips: ["׳”׳׳•׳₪׳§ ׳©׳׳™ ׳§׳¦׳¨, ׳¢׳“ 3 ׳©׳ ׳™׳", "׳”׳׳•׳₪׳§ ׳©׳׳™ ׳”׳•׳ ׳›-5 ׳©׳ ׳™׳", "׳”׳׳•׳₪׳§ ׳©׳׳™ ׳”׳•׳ 20 ׳©׳ ׳” ׳•׳׳¢׳׳”"],
  },
  {
    label: "׳™׳“׳¢ ׳₪׳™׳ ׳ ׳¡׳™",
    chips: ["׳׳™׳ ׳׳™ ׳™׳“׳¢ ׳₪׳™׳ ׳ ׳¡׳™ ׳‘׳›׳׳", "׳™׳© ׳׳™ ׳§׳¦׳× ׳™׳“׳¢ ׳‘׳¡׳™׳¡׳™", "׳׳ ׳™ ׳׳©׳§׳™׳¢ ׳¢׳ ׳ ׳™׳¡׳™׳•׳"],
  },
  {
    label: "׳×׳—׳•׳׳™ ׳¢׳ ׳™׳™׳",
    chips: ["׳׳×׳¢׳ ׳™׳™׳ ׳‘׳˜׳›׳ ׳•׳׳•׳’׳™׳”", "׳׳×׳¢׳ ׳™׳™׳ ׳‘׳‘׳¨׳™׳׳•׳×", "׳׳×׳¢׳ ׳™׳™׳ ׳‘׳ ׳“׳\"׳ ׳•׳׳ ׳¨׳’׳™׳”", "׳׳×׳¢׳ ׳™׳™׳ ׳‘׳₪׳™׳ ׳ ׳¡׳™׳ ׳•׳‘׳ ׳§׳׳•׳×"],
  },
  {
    label: "׳”׳¢׳“׳₪׳•׳× ׳”׳©׳§׳¢׳”",
    chips: [
      "׳׳ ׳™ ׳¨׳•׳¦׳” ׳”׳›׳ ׳¡׳” ׳₪׳¡׳™׳‘׳™׳× ׳׳“׳™׳‘׳™׳“׳ ׳“׳™׳",
      "׳׳ ׳™ ׳׳¢׳“׳™׳£ ׳§׳¨׳ ׳•׳× ׳¡׳ ׳¢׳ ׳₪׳ ׳™ ׳׳ ׳™׳•׳× ׳‘׳•׳“׳“׳•׳×",
      "׳׳ ׳™ ׳¨׳•׳¦׳” ׳“׳׳™ ׳ ׳™׳”׳•׳ ׳ ׳׳•׳›׳™׳",
      "׳׳ ׳׳¢׳•׳ ׳™׳™׳ ׳‘׳§׳¨׳™׳₪׳˜׳•",
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
            ׳©׳׳‘ 1 ׳׳×׳•׳ 2
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">׳¡׳₪׳¨׳• ׳׳ ׳• ׳§׳¦׳× ׳¢׳ ׳¢׳¦׳׳›׳</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            ׳›׳×׳‘׳• ׳‘׳©׳₪׳” ׳—׳•׳₪׳©׳™׳× ג€” ׳’׳™׳, ׳׳˜׳¨׳•׳×, ׳™׳“׳¢ ׳₪׳™׳ ׳ ׳¡׳™, ׳¨׳׳× ׳¡׳™׳›׳•׳, ׳×׳—׳•׳׳™ ׳¢׳ ׳™׳™׳. ׳›׳›׳ ׳©׳×׳₪׳¨׳˜׳•
            ׳™׳•׳×׳¨, ׳”׳ ׳™׳×׳•׳— ׳™׳”׳™׳” ׳׳“׳•׳™׳§ ׳™׳•׳×׳¨. ׳׳₪׳©׳¨ ׳’׳ ׳₪׳©׳•׳˜ ׳׳׳—׳•׳¥ ׳¢׳ ׳”׳›׳₪׳×׳•׳¨׳™׳ ׳׳׳˜׳”.
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
                  {text.trim().length === 0 ? "׳ ׳¡׳• ׳׳× ׳”׳›׳₪׳×׳•׳¨׳™׳ ׳׳׳¢׳׳” ׳›׳“׳™ ׳׳”׳×׳—׳™׳ ׳׳”׳¨" : `${text.trim().length} ׳×׳•׳•׳™׳`}
                </span>
                <Button size="lg" disabled={!text.trim() || isAnalyzing} onClick={handleSubmit} className="gap-2">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      ׳׳ ׳×׳— ׳׳× ׳”׳₪׳¨׳•׳₪׳™׳ ׳©׳׳...
                    </>
                  ) : (
                    "׳ ׳×׳— ׳׳× ׳”׳₪׳¨׳•׳₪׳™׳ ׳©׳׳™"
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

