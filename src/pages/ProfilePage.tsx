import { useState } from "react";
import { analyzeProfile, saveProfile } from "@/engine/ProfileEngine";
import type { FinancialProfile } from "@/engine/ProfileEngine";
import { useLanguage } from "@/context/languageContext";

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<FinancialProfile | null>(null);

  const riskLabels: Record<string, string> = {
    low: t("ai_explanation_risk_low"),
    medium: t("ai_explanation_risk_medium"),
    high: t("ai_explanation_risk_high"),
  };

  const goalLabels: Record<string, string> = {
    financial_independence: t("calc_ex_independence"),
    early_retirement: t("ai_explanation_goal_early_retirement"),
    wealth_building: t("ai_explanation_goal_growth"),
    home_purchase: t("ai_explanation_goal_house"),
    general: t("calc_ex_general"),
  };

  const experienceLabels: Record<string, string> = {
    beginner: t("profile_experience_beginner"),
    intermediate: t("profile_experience_intermediate"),
    advanced: t("profile_experience_advanced"),
  };

  const interestLabels: Record<string, string> = {
    stocks: t("interest_stocks"),
    real_estate: t("interest_real_estate"),
    crypto: t("interest_crypto"),
  };

  function createProfile() {
    if (!input.trim()) return;
    const result = analyzeProfile(input);
    saveProfile(result);
    setProfile(result);
  }

  return (
    <div dir={language === "he" ? "rtl" : "ltr"} className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-5xl mx-auto">
         <h1 className="text-4xl font-bold mb-4">{t("profile_page_heading")}</h1>
        <p className="text-muted-foreground mb-8">
          {t("profile_page_title")}
        </p>

        <div className="bg-card border border-border rounded-3xl p-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${t("profile_page_example")}\n${t("profile_page_example_text")}`}
            className="w-full h-40 bg-background border border-border rounded-xl p-4 text-foreground resize-none"
          />
          <button
            onClick={createProfile}
            className="mt-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl"
          >
            {t("profile_page_button")}
          </button>
        </div>

        {profile && (
          <div className="grid md:grid-cols-2 gap-5 mt-8">
            <Card title={t("profile_page_field_age")} value={`${profile.age}`} />
            <Card title={t("profile_page_field_assets")} value={`${profile.currentAssets.toLocaleString(language === "he" ? "he-IL" : "en-US")} ₪`} />
            <Card title={t("profile_page_field_risk")} value={riskLabels[profile.riskLevel] ?? profile.riskLevel} />
            <Card title={t("profile_page_field_goal")} value={goalLabels[profile.goal] ?? profile.goal} />
            <Card title={t("profile_page_field_experience")} value={experienceLabels[profile.experience] ?? profile.experience} />
            <Card
              title={t("profile_page_field_interests")}
              value={profile.interests.length ? profile.interests.map(i => interestLabels[i] ?? i).join(", ") : t("profile_general")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
