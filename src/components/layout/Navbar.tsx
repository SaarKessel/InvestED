import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, Menu, X, Sparkles, Globe } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/primitives";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/context/languageContext";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: t("nav_home") },
    { to: "/calculator", label: t("nav_calculator") },
    { to: "/about", label: t("nav_about") },
    { to: "/faq", label: t("nav_faq") },
    { to: "/contact", label: t("nav_contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="container flex h-[4.5rem] items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="shrink-0 transition-transform duration-200 hover:scale-[1.02]"
          aria-label={t("nav_aria_brand")}
        >
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 rounded-2xl border border-border/50 bg-card/50 p-1 md:flex"
          aria-label={t("nav_main")}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative rounded-xl px-4 py-2.5 text-sm font-medium",
                  "transition-all duration-200",
                  "text-muted-foreground",
                  "hover:bg-accent/70 hover:text-foreground",
                  isActive && [
                    "bg-accent text-foreground",
                    "font-semibold",
                    "shadow-sm",
                  ]
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">

          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            aria-label={language === "he" ? t("nav_lang_en_label") : t("nav_lang_he_label")}
            className="h-10 gap-1.5 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Globe className="h-4 w-4 text-primary" />
            <span>{language === "he" ? t("nav_lang_short_en", "EN") : t("nav_lang_short_he", "HE")}</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={t("nav_switch_theme")}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-[1.15rem] w-[1.15rem]" />
            ) : (
              <Moon className="h-[1.15rem] w-[1.15rem]" />
            )}
          </Button>

          {/* CTA */}
          <Link to="/start" className="hidden sm:block">
            <Button
              size="sm"
              className="group rounded-xl px-5 shadow-md"
            >
              <Sparkles className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
              {t("nav_start")}
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? t("nav_mobile_close") : t("nav_mobile_open")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <nav
            className="container flex flex-col gap-1 py-4"
            aria-label={t("nav_mobile")}
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-4 py-3 text-sm font-medium",
                    "transition-colors duration-200",
                    "text-muted-foreground",
                    "hover:bg-accent hover:text-foreground",
                    isActive &&
                      "bg-accent text-foreground font-semibold"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <Link
              to="/start"
              onClick={() => setMobileOpen(false)}
              className="mt-2"
            >
              <Button className="w-full rounded-xl">
                <Sparkles className="h-4 w-4" />
                {t("nav_start")}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}