import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { useLanguage } from "@/context/languageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("footer_tagline")}
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">{t("footer_nav")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">{t("nav_home")}</Link></li>
            <li><Link to="/start" className="hover:text-foreground">{t("nav_start")}</Link></li>
            <li><Link to="/calculator" className="hover:text-foreground">{t("nav_calculator")}</Link></li>
            <li><Link to="/about" className="hover:text-foreground">{t("nav_about")}</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">{t("nav_faq")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">{t("footer_legal")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">{t("privacy")}</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">{t("terms")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("nav_contact")}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {t("footer_copyright")}</p>
          <p>{t("footer_disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
