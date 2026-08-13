import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, Menu, X, Globe2 } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/primitives";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/context/languageContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = {
  he: [
    { to: "/", label: "בית" },
    { to: "/calculator", label: "מחשבון חכם" },
    { to: "/about", label: "אודות" },
    { to: "/faq", label: "שאלות נפוצות" },
    { to: "/contact", label: "צור קשר" },
  ],
  en: [
    { to: "/", label: "Home" },
    { to: "/calculator", label: "Smart Calculator" },
    { to: "/about", label: "About" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
  ],
};

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = NAV_LINKS[language];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  isActive && "bg-accent text-foreground"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="החלף מצב תצוגה">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Switch language">
            <Globe2 className="h-4 w-4" />
          </Button>
          <Link to="/start" className="hidden sm:block">
            <Button size="sm">{language === "he" ? "התחל ללמוד" : "Start learning"}</Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="תפריט"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="container flex flex-col gap-1 border-t border-border/60 py-3 md:hidden animate-fade-in">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3.5 py-2.5 text-sm font-medium text-muted-foreground",
                  isActive && "bg-accent text-foreground"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/start" onClick={() => setMobileOpen(false)}>
            <Button size="sm" className="mt-2 w-full">
              {language === "he" ? "התחל ללמוד" : "Start learning"}
            </Button>
          </Link>
        </nav>
      )}
    </header>
  );
}
