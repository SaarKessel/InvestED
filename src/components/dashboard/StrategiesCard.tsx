import { motion } from "framer-motion";
import { Layers, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { STRATEGIES } from "@/lib/strategies";

export function StrategiesCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">אסטרטגיות השקעה</span>
          </div>
          <CardTitle className="text-xl">היכרות עם סגנונות השקעה מרכזיים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {STRATEGIES.map((s) => (
              <div key={s.id} className="rounded-xl border border-border p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-display font-bold">{s.name}</h4>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    סיכון {s.riskLevel}/10
                  </span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{s.whatItIs}</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="mb-1 font-semibold text-success">יתרונות</p>
                    <ul className="space-y-1">
                      {s.pros.map((p) => (
                        <li key={p} className="flex items-start gap-1.5 text-muted-foreground">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-danger">חסרונות</p>
                    <ul className="space-y-1">
                      {s.cons.map((c) => (
                        <li key={c} className="flex items-start gap-1.5 text-muted-foreground">
                          <X className="mt-0.5 h-3 w-3 shrink-0 text-danger" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  <b className="text-foreground">למי זה מתאים: </b>
                  {s.suitableFor}
                </p>

                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
                    דוגמאות מוכרות לנכסים בסגנון הזה <span className="text-primary">*המלצה בלבד*</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.stocks.map((ticker) => (
                      <span key={ticker} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                        {ticker}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
