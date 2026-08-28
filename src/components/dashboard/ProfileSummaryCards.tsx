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

import { useLanguage } from "@/context/languageContext";

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
  technology: "💻",
  finance: "💰",
  healthcare: "🩺",
  energy: "⚡",
  real_estate: "🏢",
};

// =====================================================
// Helpers
// =====================================================

function investorTypeLabel(
  type: AnalysisResult["investor"]["type"],
  t: (key: string, fallback?: string) => string
) {
  switch (type) {
    case "conservative":
      return t("investor_type_conservative", "Conservative");
    case "balanced":
      return t("investor_type_balanced", "Balanced");
    case "growth":
      return t("investor_type_growth", "Growth");
    case "dividend":
      return t("investor_type_dividend", "Dividend");
    case "passive":
      return t("investor_type_passive", "Passive");
    case "value":
      return t("investor_type_value", "Value");
    default:
      return type;
  }
}

function riskBandLabel(
  band: string | undefined,
  t: (key: string, fallback?: string) => string
) {
  switch (band) {
    case "low":
      return t("risk_band_low", "Low");
    case "medium":
      return t("risk_band_medium", "Medium");
    case "high":
      return t("risk_band_high", "High");
    default:
      return band ?? t("risk_band_medium", "Medium");
  }
}

function interestLabel(
  interest: InterestArea,
  t: (key: string, fallback?: string) => string
) {
  switch (interest) {
    case "technology":
      return t("interest_technology", "Technology");
    case "finance":
      return t("interest_finance", "Finance");
    case "healthcare":
      return t("interest_healthcare", "Healthcare");
    case "energy":
      return t("interest_energy", "Energy");
    case "real_estate":
      return t("interest_real_estate", "Real Estate");
    default:
      return interest;
  }
}

function getHorizonLabel(
  horizon: AnalysisResult["horizon"],
  t: (key: string, fallback?: string) => string
) {
  switch (horizon) {
    case "short":
      return t("profile_short", "Short");

    case "medium":
      return t("profile_medium", "Medium");

    case "long":
      return t("profile_long", "Long");

    default:
      return t("profile_unset", "Not set");
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
  const { t } = useLanguage();

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
              {t("welcome_card_ai_profile", "AI Investor Profile")}
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
            {t("profile_summary_title", "Your Financial Profile is Ready")}
          </h2>

          <p className="
            relative
            mt-3
            max-w-2xl
            text-sm
            leading-7
            text-muted-foreground
          ">
            {t("welcome_card_subtitle", "InvestED analyzed your data and created a personal financial overview based on your goals, risk, and investment preferences.")}
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
                {t("welcome_card_ai_insight", "AI Insight")}
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
  const { t } = useLanguage();

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
               {t("investor_type_card_profile_label", "Profile")}
             </p>

             <p className="
               text-sm
               font-semibold
             ">
               {t("xai_investor_type", "Investor Type")}
             </p>
          </div>
        </div>

        <CardTitle className="
          mt-4
          text-2xl
          tracking-tight
        ">
          {investorTypeLabel(result.investor.type, t)}
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
  const { t } = useLanguage();

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
               {t("risk_card_profile_label", "Profile")}
            </p>

            <p className="
              text-sm
              font-semibold
            ">
               {t("risk_card_risk_level", "Risk Level")}
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
            {riskBandLabel(result.riskDescription?.volatility, t) ??
              t("profile_risk_na", "Risk analysis available")}
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
  const { t } = useLanguage();

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
               {t("horizon_card_time_label", "Time")}
            </p>

            <p className="
              text-sm
              font-semibold
            ">
               {t("xai_horizon", "Investment Horizon")}
            </p>
          </div>
        </div>

        <CardTitle className="
          mt-4
          text-2xl
        ">
          {getHorizonLabel(result.horizon, t)}
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
              t("horizon_card_no_info", "No information found")}
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
  const { t } = useLanguage();

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
               {t("interests_card_preferences_label", "Preferences")}
            </p>

              <CardTitle className="text-xl">
                {t("interests_card_title", "Interest Areas")}
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
                  {interestLabel(area, t)}
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
              {t("interests_card_no_interests", "No interest areas identified")}
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
  const { t } = useLanguage();

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
            {t("confidence_card_title", "Confidence AI")}
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
