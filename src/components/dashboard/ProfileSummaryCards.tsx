import { motion } from "framer-motion";

import {
  Target,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  BarChart3,
} from "lucide-react";

import type {
  AnalysisResult,
  InterestArea,
} from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

// =====================================================
// Animation
// =====================================================

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  show: {
    opacity: 1,
    y: 0,
  },
};

const cardStyle = `
  h-full
  border-border/70
  bg-card
  transition-all
  duration-300
  hover:-translate-y-1
  hover:border-primary/30
  hover:shadow-xl
`;

// =====================================================
// Interest Icons
// =====================================================

const INTEREST_ICONS: Record<InterestArea, string> = {
  "טכנולוגיה": "💻",
  "פיננסים": "💰",
  "בריאות": "🩺",
  "אנרגיה": "⚡",
  "נדל\"ן": "🏢",
};

// =====================================================
// Helpers
// =====================================================

function getHorizonLabel(
  horizon: AnalysisResult["horizon"]
) {
  switch (horizon) {
    case "short":
      return "קצר";

    case "medium":
      return "בינוני";

    case "long":
      return "ארוך";

    default:
      return "לא הוגדר";
  }
}

// =====================================================
// Welcome Card
// =====================================================

export function WelcomeCard({
  result,
}: {
  result: AnalysisResult;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      <Card className="overflow-hidden border-primary/20">
        <div className="
          relative
          overflow-hidden
          bg-gradient-to-br
          from-primary/15
          via-primary/5
          to-transparent
          p-6
          md:p-7
        ">
          <div className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            h-40
            w-40
            rounded-full
            bg-primary/10
            blur-3xl
          " />

          <div className="
            relative
            flex
            items-center
            gap-2
            text-primary
          ">
            <div className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-primary/10
            ">
              <Sparkles className="h-4 w-4" />
            </div>

            <span className="text-sm font-bold">
              AI Investor Profile
            </span>
          </div>

          <h2 className="
            relative
            mt-5
            text-2xl
            font-extrabold
            tracking-tight
            md:text-3xl
          ">
            הפרופיל הפיננסי שלך מוכן 🚀
          </h2>

          <p className="
            relative
            mt-3
            max-w-2xl
            text-sm
            leading-7
            text-muted-foreground
          ">
            InvestED ניתח את הנתונים שלך ויצר תמונת מצב
            פיננסית אישית המבוססת על המטרות, הסיכון
            והעדפות ההשקעה שלך.
          </p>
        </div>

        <CardContent className="space-y-4 pt-6">
          <div className="
            rounded-2xl
            border
            border-border/70
            bg-muted/50
            p-4
            text-sm
            leading-7
            italic
          ">
            "{result.profileText}"
          </div>

          {result.aiNarration?.profileSummary && (
            <div className="
              rounded-2xl
              border
              border-primary/15
              bg-primary/5
              p-4
              text-sm
              leading-7
            ">
              <div className="
                mb-2
                flex
                items-center
                gap-2
                font-semibold
                text-primary
              ">
                <Sparkles className="h-4 w-4" />
                AI Insight
              </div>

              <p>
                {result.aiNarration.profileSummary}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Investor Type
// =====================================================

export function InvestorTypeCard({
  result,
}: {
  result: AnalysisResult;
}) {
  return (
    <Card className={cardStyle}>
      <CardHeader>
        <div className="
          flex
          items-center
          gap-3
        ">
          <div className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-primary/10
            text-primary
          ">
            <Target className="h-5 w-5" />
          </div>

          <div>
            <p className="
              text-xs
              font-semibold
              text-muted-foreground
            ">
              פרופיל
            </p>

            <p className="
              text-sm
              font-semibold
            ">
              סוג משקיע
            </p>
          </div>
        </div>

        <CardTitle className="
          mt-4
          text-2xl
          tracking-tight
        ">
          {result.investor.type}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="
          rounded-2xl
          border
          border-border/60
          bg-muted/40
          p-4
        ">
          <p className="
            text-sm
            leading-7
            text-muted-foreground
          ">
            {result.investor.reason}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Risk Score
// =====================================================

export function RiskScoreCard({
  result,
}: {
  result: AnalysisResult;
}) {
  const score = result.riskScore ?? 0;
  const percentage = Math.min(
    100,
    Math.max(0, score * 10)
  );

  return (
    <Card className={cardStyle}>
      <CardHeader>
        <div className="
          flex
          items-center
          gap-3
        ">
          <div className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-primary/10
            text-primary
          ">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <p className="
              text-xs
              font-semibold
              text-muted-foreground
            ">
              פרופיל
            </p>

            <p className="
              text-sm
              font-semibold
            ">
              רמת סיכון
            </p>
          </div>
        </div>

        <div className="
          mt-4
          flex
          items-end
          gap-1
        ">
          <CardTitle className="text-3xl">
            {score}
          </CardTitle>

          <span className="
            mb-1
            text-sm
            text-muted-foreground
          ">
            /10
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="
          mb-4
          h-2
          overflow-hidden
          rounded-full
          bg-muted
        ">
          <div
            className="
              h-full
              rounded-full
              gradient-brand
              transition-all
              duration-700
            "
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

        <div className="
          flex
          items-start
          gap-3
          rounded-2xl
          border
          border-border/60
          bg-muted/40
          p-4
        ">
          <TrendingUp className="
            mt-0.5
            h-5
            w-5
            shrink-0
            text-primary
          " />

          <p className="
            text-sm
            leading-6
            text-muted-foreground
          ">
            {result.riskDescription?.volatility ??
              "ניתוח סיכון זמין"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Investment Horizon
// =====================================================

export function HorizonCard({
  result,
}: {
  result: AnalysisResult;
}) {
  return (
    <Card className={cardStyle}>
      <CardHeader>
        <div className="
          flex
          items-center
          gap-3
        ">
          <div className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-primary/10
            text-primary
          ">
            <Clock className="h-5 w-5" />
          </div>

          <div>
            <p className="
              text-xs
              font-semibold
              text-muted-foreground
            ">
              זמן
            </p>

            <p className="
              text-sm
              font-semibold
            ">
              אופק השקעה
            </p>
          </div>
        </div>

        <CardTitle className="
          mt-4
          text-2xl
        ">
          {getHorizonLabel(result.horizon)}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="
          rounded-2xl
          border
          border-border/60
          bg-muted/40
          p-4
        ">
          <p className="
            text-sm
            leading-7
            text-muted-foreground
          ">
            {result.horizonExplanation ??
              "לא נמצא מידע"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Interests
// =====================================================

export function InterestsCard({
  result,
}: {
  result: AnalysisResult;
}) {
  const areas =
    result.flags.interests ?? [];

  return (
    <Card className={cardStyle}>
      <CardHeader>
        <div className="
          flex
          items-center
          gap-3
        ">
          <div className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-primary/10
            text-primary
          ">
            <BarChart3 className="h-5 w-5" />
          </div>

          <div>
            <p className="
              text-xs
              font-semibold
              text-muted-foreground
            ">
              העדפות
            </p>

            <CardTitle className="text-xl">
              תחומי עניין
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {areas.length ? (
          <div className="
            flex
            flex-wrap
            gap-2.5
          ">
            {areas.map((area) => (
              <div
                key={area}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-border/70
                  bg-muted/40
                  px-3.5
                  py-2.5
                  text-sm
                  font-medium
                  transition-all
                  duration-200
                  hover:border-primary/30
                  hover:bg-primary/5
                "
              >
                <span className="text-base">
                  {INTEREST_ICONS[area] ?? "📊"}
                </span>

                <span>
                  {area}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="
            rounded-2xl
            border
            border-dashed
            border-border
            p-5
            text-center
          ">
            <p className="
              text-sm
              text-muted-foreground
            ">
              לא זוהו תחומי עניין
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// Confidence Card
// =====================================================

export function ConfidenceCard({
  result,
}: {
  result: AnalysisResult;
}) {
  const confidence =
    result.scenario?.confidence ?? 0;

  return (
    <Card className={cardStyle}>
      <CardHeader>
        <div className="
          flex
          items-center
          gap-3
        ">
          <div className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-primary/10
            text-primary
          ">
            <Sparkles className="h-5 w-5" />
          </div>

          <CardTitle>
            Confidence AI
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <div className="
          flex
          items-end
          gap-1
        ">
          <span className="
            text-3xl
            font-extrabold
            tracking-tight
          ">
            {confidence}
          </span>

          <span className="
            mb-1
            text-sm
            text-muted-foreground
          ">
            %
          </span>
        </div>

        <div className="
          mt-4
          h-2
          overflow-hidden
          rounded-full
          bg-muted
        ">
          <div
            className="
              h-full
              rounded-full
              gradient-brand
              transition-all
              duration-700
            "
            style={{
              width: `${Math.min(
                100,
                Math.max(0, confidence)
              )}%`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
