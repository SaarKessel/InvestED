import { motion } from "framer-motion";
import { TrendingUp, Target, Clock, Sparkles } from "lucide-react";
import type { AnalysisResult, InterestArea } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/primitives";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const INTEREST_ICONS: Record<string, string> = {
  "טכנולוגיה": "💻",
  "פיננסים": "💰",
  "בריאות": "🩺",
  "אנרגיה": "⚡",
  "נדל\"ן": "🏢",
};

export function WelcomeCard({ result }: { result: AnalysisResult }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Card className="overflow-hidden">
        <div className="gradient-brand p-6 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            הניתוח שלך מוכן
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold">ברוכים הבאים לדשבורד האישי שלכם</h2>
          <p className="mt-2 max-w-xl text-sm text-white/90">
            בהתבסס על מה שסיפרת לנו, בנינו עבורך פרופיל השקעה חינוכי מלא — כולל הסברים,
            אסטרטגיות ותיק לדוגמה.
          </p>
        </div>
        <CardContent className="pt-4">
          <p className="text-sm italic leading-relaxed text-muted-foreground">"{result.profileText}"</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function InvestorTypeCard({ result }: { result: AnalysisResult }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Target className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">סוג המשקיע</span>
          </div>
          <CardTitle className="text-2xl">{result.investor.type}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{result.investor.reason}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RiskScoreCard({ result }: { result: AnalysisResult }) {
  const pct = (result.riskScore / 10) * 100;
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">רמת סיכון</span>
          </div>
          <CardTitle className="text-2xl">
            {result.riskScore}/10 · {result.riskDescription.band}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full gradient-brand"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{result.riskDescription.volatility}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{result.riskDescription.psychology}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function HorizonCard({ result }: { result: AnalysisResult }) {
  const stages: Array<{ label: "קצר" | "בינוני" | "ארוך" }> = [
    { label: "קצר" },
    { label: "בינוני" },
    { label: "ארוך" },
  ];
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">אופק השקעה</span>
          </div>
          <CardTitle className="text-2xl">{result.horizon}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-1.5">
            {stages.map((s) => (
              <div
                key={s.label}
                className={`flex-1 rounded-full py-1.5 text-center text-xs font-semibold transition-colors ${
                  s.label === result.horizon
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{result.horizonExplanation}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function InterestsCard({ result }: { result: AnalysisResult }) {
  const allAreas: InterestArea[] = ["טכנולוגיה", "פיננסים", "בריאות", "אנרגיה", "נדל\"ן"];
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">תחומי עניין</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allAreas.map((area) => {
              const active = result.flags.interests.includes(area);
              return (
                <Badge key={area} variant={active ? "default" : "outline"} className={active ? "" : "opacity-50"}>
                  <span>{INTEREST_ICONS[area]}</span>
                  {area}
                </Badge>
              );
            })}
          </div>
          {result.flags.interests.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              לא זיהינו תחומי עניין ספציפיים — ניתן להוסיף אותם בניתוח הבא.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
