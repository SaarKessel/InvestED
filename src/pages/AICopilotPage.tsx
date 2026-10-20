import { TerminalShell } from "@/components/terminal/TerminalShell";
import { AIChatCard } from "@/components/dashboard/AIChatCard";
import { NewsPopup } from "@/components/layout/NewsPopup";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/languageContext";
import { useTheme } from "@/hooks/useTheme";
import { Globe, LayoutDashboard, Moon, Sun } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

export default function AICopilotPage() {
  const { user, loading } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  // Signed out: only the sign-in panel, like the ChatGPT entry screen (no nav, no footer).
  if (!user && !loading) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <button type="button" onClick={toggleLanguage} aria-label={language === "he" ? t("nav_lang_en_label") : t("nav_lang_he_label")} className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><Globe className="h-4 w-4" aria-hidden="true" />{language === "he" ? "EN" : "HE"}</button>
        <main className="container flex flex-1 items-center justify-center py-10"><AIChatCard /></main>
      </div>
    );
  }
  // The classic workstation stays available as an explicit fallback until its removal is approved.
  if (params.get("shell") === "terminal") {
    return <TerminalShell><AIChatCard workstation /></TerminalShell>;
  }
  // Chat-only home: the whole product lives inside the conversation.
  return (
    <div className="chat-shell">
      <div className="fx-aurora" aria-hidden="true"><i /><i /><i /></div>
      <div className="fx-waves" aria-hidden="true">
        <svg viewBox="0 0 2880 320" preserveAspectRatio="none"><path d="M0 192 C240 120 480 264 720 192 C960 120 1200 264 1440 192 C1680 120 1920 264 2160 192 C2400 120 2640 264 2880 192 L2880 320 L0 320 Z" /></svg>
        <svg viewBox="0 0 2880 320" preserveAspectRatio="none"><path d="M0 232 C240 152 480 296 720 232 C960 168 1200 296 1440 232 C1680 168 1920 296 2160 232 C2400 168 2640 296 2880 232 L2880 320 L0 320 Z" /></svg>
      </div>
      <header className="chat-shell-top">
        <Link to={{ pathname, search: "?shell=terminal" }} aria-label={t("shell_workstation_view")} title={t("shell_workstation_view")} className="chat-shell-action"><LayoutDashboard className="h-4 w-4" aria-hidden="true" /></Link>
        <button type="button" onClick={toggleTheme} aria-label={t("nav_switch_theme")} title={t("nav_switch_theme")} className="chat-shell-action">{theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}</button>
        <button type="button" onClick={toggleLanguage} aria-label={language === "he" ? t("nav_lang_en_label") : t("nav_lang_he_label")} className="chat-shell-action"><Globe className="h-4 w-4" aria-hidden="true" />{language === "he" ? "EN" : "HE"}</button>
      </header>
      <main className="flex flex-1 flex-col px-3 sm:px-6"><AIChatCard /></main>
      <NewsPopup />
    </div>
  );
}
