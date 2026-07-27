import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
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
          <Link to="/start" className="hidden sm:block">
            <Button size="sm">התחל ללמוד</Button>
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
          {NAV_LINKS.map((link) => (
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
              התחל ללמוד
            </Button>
          </Link>
        </nav>
      )}
    </header>
  );
}
