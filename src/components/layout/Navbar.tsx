import { Link } from "react-router-dom";
import { Moon, Sun, Globe } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/primitives";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/context/languageContext";

/** Slim top bar: the emblem, the language and the theme. Everything else lives in the chat. */
export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="shrink-0" aria-label={t("nav_aria_brand")}><Logo /></Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} aria-label={language === "he" ? t("nav_lang_en_label") : t("nav_lang_he_label")} className="h-10 gap-1.5 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground">
            <Globe className="h-4 w-4 text-primary" /><span>{language === "he" ? t("nav_lang_short_en", "EN") : t("nav_lang_short_he", "HE")}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("nav_switch_theme")} className="rounded-xl text-muted-foreground hover:text-foreground">
            {theme === "dark" ? <Sun className="h-[1.15rem] w-[1.15rem]" /> : <Moon className="h-[1.15rem] w-[1.15rem]" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
