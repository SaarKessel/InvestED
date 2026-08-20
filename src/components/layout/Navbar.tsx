import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/primitives";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "בית" },
  { to: "/calculator", label: "מחשבון חכם" },
  { to: "/about", label: "אודות" },
  { to: "/faq", label: "שאלות נפוצות" },
  { to: "/contact", label: "צור קשר" },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="container flex h-[4.5rem] items-center justify-between">
        
        {/* Logo */}
        <Link
          to="/"
          className="shrink-0 transition-transform duration-200 hover:scale-[1.02]"
          aria-label="InvestED - דף הבית"
        >
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 rounded-2xl border border-border/50 bg-card/50 p-1 md:flex"
          aria-label="ניווט ראשי"
        >
          {NAV_LINKS.map((link) => (
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
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="החלף מצב תצוגה"
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
              התחל ללמוד
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "סגור תפריט" : "פתח תפריט"}
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
            aria-label="ניווט נייד"
          >
            {NAV_LINKS.map((link) => (
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
                התחל ללמוד
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}