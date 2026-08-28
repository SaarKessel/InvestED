import { useState } from "react";
import type { FinancialProfile } from "@/types/FinancialProfile";
import { useLanguage } from "@/context/languageContext";

export default function OnboardingPage() {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [profile, setProfile] = useState<FinancialProfile | null>(null);

  function analyzeProfile() {
    const newProfile: FinancialProfile = {
      age: extractNumber(text, "בן"),
      occupation: "",
      currentAssets: extractMoney(text),
      monthlyIncome: null,
      monthlyInvestment: 0,
      riskLevel: detectRisk(text),
      knowledgeLevel: detectKnowledge(text),
      interests: detectInterests(text),
      primaryGoal: detectGoal(text),
      targetAmount: null,
      targetAge: null,
      rawInput: text,
      createdAt: new Date().toISOString(),
    };
    setProfile(newProfile);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          {t("onboarding_title_v2")}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t("onboarding_subtitle_v2")}
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("onboarding_placeholder_v2")}
          className="w-full h-40 rounded-xl bg-background border border-border p-5 mb-5 text-foreground"
        />
        <button
          onClick={analyzeProfile}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold"
        >
          {t("onboarding_button_v2")}
        </button>

        {profile && (
          <div className="mt-8 bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">
              {t("onboarding_result_title_v2")}
            </h2>
            <pre className="text-sm text-muted-foreground">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function extractNumber(text: string, keyword: string) {
  const match = text.match(new RegExp(`${keyword}\\s*(\\d+)`));
  return match ? Number(match[1]) : null;
}

function extractMoney(text: string) {
  const normalized = text.replace(/,/g, "");
  const match = normalized.match(/(\d+)\s*(אלף|מיליון)?/);
  if (!match) return 0;
  let value = Number(match[1]);
  if (match[2] === "אלף") value *= 1000;
  if (match[2] === "מיליון") value *= 1000000;
  return value;
}

function detectRisk(text: string): FinancialProfile["riskLevel"] {
  if (text.includes("סיכון גבוה") || text.includes("אגרסיבי")) return "high";
  if (text.includes("סולידי") || text.includes("נמוך")) return "low";
  return "medium";
}

function detectKnowledge(text: string): FinancialProfile["knowledgeLevel"] {
  if (text.includes("מתקדם") || text.includes("מנוסה")) return "advanced";
  if (text.includes("מתחיל")) return "beginner";
  return "intermediate";
}

function detectInterests(text: string) {
  const interests: string[] = [];
  if (text.includes("S&P") || text.includes("סנופי")) interests.push("S&P 500");
  if (text.includes("AI") || text.includes("בינה מלאכותית")) interests.push("AI");
  if (text.includes("קריפטו")) interests.push("Crypto");
  return interests;
}

function detectGoal(text: string): FinancialProfile["primaryGoal"] {
  if (text.includes("פרישה") || text.includes("עצמאות כלכלית")) return "retirement";
  if (text.includes("בית") || text.includes("דירה")) return "home";
  if (text.includes("ילד")) return "children";
  if (text.includes("עושר") || text.includes("הון")) return "wealth";
  return "growth";
}
