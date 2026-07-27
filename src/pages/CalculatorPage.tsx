import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Sparkles, TrendingUp, PiggyBank, Home } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Card, CardContent, Button } from "@/components/ui/primitives";
import { InfoBadge } from "@/components/ui/InfoBadge";
import { cn } from "@/lib/utils";
import {
  ASSET_CLASSES,
  CALCULATOR_PRESETS,
  parseCalculatorQuery,
  computeProjection,
  type ProjectionResult,
} from "@/lib/calculatorEngine";
import { LOAN_PRESETS, parseLoanQuery, computeSchpitzer, type AmortizationResult } from "@/lib/loanEngine";

type Mode = "growth" | "loan";

export function CalculatorPage() {
  const [mode, setMode] = useState<Mode>("loan");

  return (
    <Layout>
      <section className="container max-w-3xl py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            מחשבון חכם בשפה חופשית
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">כתבו את הסיטואציה שלכם — קבלו תשובה</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            בלי טפסים מסובכים. לדוגמה: "לקחתי משכנתא ל-20 שנה בריבית 4.5% בשווי 800 אלף, כמה אחזיר בסוף?"
          </p>
        </motion.div>

        <div className="mx-auto mt-8 flex w-fit rounded-xl border border-border bg-muted/30 p-1">
          <button
            onClick={() => setMode("loan")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              mode === "loan" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home className="h-4 w-4" />
            הלוואה / משכנתא
          </button>
          <button
            onClick={() => setMode("growth")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              mode === "growth" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            צמיחת חיסכון
          </button>
        </div>

        {mode === "loan" ? <LoanCalculator /> : <GrowthCalculator />}

        <DisclaimerBanner className="mt-6" />
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          כל התחזיות מבוססות על הנחות פשטניות (ריבית/תשואה קבועה) ואינן משקפות תנודתיות אמיתית של השוק
          או תנאי הלוואה מלאים. לצורכי לימוד בלבד — לא ייעוץ פיננסי, לא ייעוץ משכנתאות.
        </p>
      </section>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// מחשבון הלוואה / משכנתא — צעד אחד: פרומפט -> תשובה
// ---------------------------------------------------------------------------

function LoanCalculator() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AmortizationResult | null>(null);
  const [loanAmount, setLoanAmount] = useState(0);
  const [rate, setRate] = useState(0);
  const [years, setYears] = useState(0);

  const handleAnalyze = (text: string) => {
    setQuery(text);
    const p = parseLoanQuery(text);
    setLoanAmount(p.loanAmount);
    setRate(p.annualRatePct);
    setYears(p.years);
    setResult(computeSchpitzer(p.loanAmount, p.annualRatePct, p.years));
  };

  return (
    <Card className="mt-6 p-1">
      <CardContent className="pt-6">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='לדוגמה: לקחתי משכנתא ל-20 שנה בריבית של 4.5% בשווי 800 אלף ש"ח'
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {LOAN_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handleAnalyze(preset)}
              className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {preset}
            </button>
          ))}
        </div>

        <Button className="mt-4 w-full sm:w-auto" onClick={() => handleAnalyze(query)} disabled={!query.trim()}>
          <Calculator className="h-4 w-4" />
          נתח את המשפט שלי
        </Button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4 border-t border-border pt-6">
            <p className="text-xs text-muted-foreground">
              זיהינו: הלוואה של <b className="text-foreground">₪{loanAmount.toLocaleString()}</b>, ריבית שנתית{" "}
              <b className="text-foreground">{rate}%</b>, לתקופה של <b className="text-foreground">{years} שנים</b>.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">החזר חודשי</p>
                <p className="font-display text-2xl font-extrabold text-primary">₪{result.firstMonthlyPayment.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">סה"כ תחזירו בסוף התקופה</p>
                <p className="font-display text-2xl font-extrabold">₪{result.totalRepayment.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">מזה, סה"כ ריבית</p>
                <p className="font-display text-2xl font-extrabold text-danger">₪{result.totalInterest.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
              <b>איך חושב הסכום? </b>
              החישוב מבוסס על מסלול <b>שפיצר</b> — ההחזר החודשי הנפוץ ביותר בהלוואות ומשכנתאות בישראל, שבו
              הסכום החודשי קבוע לאורך כל התקופה.
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// מחשבון צמיחת חיסכון — צעד אחד: פרומפט -> תשובה
// ---------------------------------------------------------------------------

function GrowthCalculator() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ProjectionResult | null>(null);
  const [assetLabel, setAssetLabel] = useState("");
  const [assetBlurb, setAssetBlurb] = useState("");
  const [assetReturn, setAssetReturn] = useState(0);

  const handleAnalyze = (text: string) => {
    setQuery(text);
    const p = parseCalculatorQuery(text);
    const asset = ASSET_CLASSES.find((a) => a.key === p.assetClassKey) ?? ASSET_CLASSES[ASSET_CLASSES.length - 1];
    setAssetLabel(asset.label);
    setAssetBlurb(asset.blurb);
    setAssetReturn(asset.annualReturnPct);
    setResult(computeProjection(p.principal, p.monthlyContribution, p.years, asset.annualReturnPct));
  };

  return (
    <Card className="mt-6 p-1">
      <CardContent className="pt-6">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="לדוגמה: חיסכון חודשי של 1,000 ש״ח לילד עד גיל 18"
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {CALCULATOR_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handleAnalyze(preset)}
              className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {preset}
            </button>
          ))}
        </div>

        <Button className="mt-4 w-full sm:w-auto" onClick={() => handleAnalyze(query)} disabled={!query.trim()}>
          <Calculator className="h-4 w-4" />
          נתח את המשפט שלי
        </Button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-5 border-t border-border pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">שווי משוער בסוף התקופה</p>
                <p className="font-display text-2xl font-extrabold text-primary">₪{result.finalBalance.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">סה"כ הפקדתם (הקרן)</p>
                <p className="font-display text-2xl font-extrabold">₪{result.totalContributed.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border p-4 text-center">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">רווח מריבית דריבית</p>
                <p className="font-display text-2xl font-extrabold text-success">₪{result.growth.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-bold">גרף צמיחה — קרן מול רווח</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.series} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22b17d" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#22b17d" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3ecfff" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3ecfff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tickFormatter={(v) => `שנה ${v}`} fontSize={11} />
                    <YAxis hide />
                    <RTooltip
                      formatter={(value: number, name: string) => [`₪${value.toLocaleString()}`, name === "balance" ? "שווי כולל" : 'סה"כ הפקדות']}
                      labelFormatter={(v) => `שנה ${v}`}
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#22b17d" fill="url(#balanceGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="contributed" stroke="#3ecfff" fill="url(#contribGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold">רקע חינוכי</h3>
                <InfoBadge description="הסברים קצרים על המושגים הרלוונטיים לחישוב שביצעתם." />
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
                <b>{assetLabel} — </b>
                {assetBlurb}
                <span className="mr-1 text-muted-foreground">(תשואה שנתית ממוצעת היסטורית משוערת: {assetReturn}%)</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
                <b>השפעת אינפלציה — </b>
                בהנחת אינפלציה ממוצעת של כ-3% בשנה, השווי הריאלי (בכוח קנייה של היום) של הסכום הסופי מוערך בכ-
                <b> ₪{result.realValueAfterInflation.toLocaleString()}</b>.
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
