import { useState } from "react";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { STRATEGIES } from "@/lib/strategies";
import { cn } from "@/lib/utils";

const ROWS: { label: string; render: (id: string) => string }[] = [
  {
    label: "רמת סיכון",
    render: (id) => `${STRATEGIES.find((s) => s.id === id)?.riskLevel}/10`,
  },
  {
    label: "פיזור",
    render: (id) => (id === "passive" ? "רחב מאוד" : id === "growth" ? "בינוני-נמוך" : "בינוני"),
  },
  {
    label: "מאפיין מרכזי",
    render: (id) =>
      id === "passive"
        ? "עלות נמוכה ופשטות"
        : id === "dividend"
          ? "הכנסה שוטפת"
          : id === "growth"
            ? "פוטנציאל תשואה גבוה"
            : "חיפוש \"מציאות\" בשוק",
  },
  {
    label: "יתרון עיקרי",
    render: (id) => STRATEGIES.find((s) => s.id === id)?.pros[0] ?? "",
  },
  {
    label: "חיסרון עיקרי",
    render: (id) => STRATEGIES.find((s) => s.id === id)?.cons[0] ?? "",
  },
];

export function ComparisonCard() {
  const [selected, setSelected] = useState<string[]>(["passive", "dividend", "growth"]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Scale className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">השוואת אסטרטגיות</span>
          </div>
          <CardTitle className="text-xl">איזו גישה מתאימה לי יותר?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex flex-wrap gap-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  selected.includes(s.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 border-b border-border py-2 text-right text-xs font-semibold text-muted-foreground">
                    מאפיין
                  </th>
                  {selected.map((id) => (
                    <th key={id} className="border-b border-border py-2 text-right font-display font-bold">
                      {STRATEGIES.find((s) => s.id === id)?.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pl-2 text-xs font-semibold text-muted-foreground">{row.label}</td>
                    {selected.map((id) => (
                      <td key={id} className="py-3 pl-4 leading-relaxed">
                        {row.render(id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
