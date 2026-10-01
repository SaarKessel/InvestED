import { Layout } from "@/components/layout/Layout";
import { AIChatCard } from "@/components/dashboard/AIChatCard";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/languageContext";
import { Globe } from "lucide-react";

export default function AICopilotPage() {
  const { user, loading } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  // Signed out: only the sign-in panel, like the ChatGPT entry screen (no nav, no footer).
  if (!user && !loading) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <button type="button" onClick={toggleLanguage} aria-label={language === "he" ? t("nav_lang_en_label") : t("nav_lang_he_label")} className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><Globe className="h-4 w-4" aria-hidden="true" />{language === "he" ? "EN" : "HE"}</button>
        <main className="container flex flex-1 items-center justify-center py-10"><AIChatCard /></main>
        <p className="px-4 pb-4 text-center text-[10px] leading-4 text-muted-foreground/80">{t("legal_line_credit")} {t("legal_line_liability")}</p>
      </div>
    );
  }
  return (
    <Layout>
      <div className="relative">
        <section className="container relative z-10 py-6 md:py-10">
          <AIChatCard />
        </section>
      </div>
    </Layout>
  );
}
