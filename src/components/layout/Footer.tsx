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
            {t(
              "footer_tagline",
              "InvestED היא פלטפורמה חינוכית ללימוד עולם ההשקעות באמצעות AI. המערכת אינה נותנת ייעוץ השקעות ואינה ממליצה במה להשקיע — כל התוכן מוצג לצורכי לימוד בלבד."
            )}
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">{t("footer_nav", "ניווט")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">{t("nav_home", "בית")}</Link></li>
            <li><Link to="/start" className="hover:text-foreground">{t("nav_start", "התחל ללמוד")}</Link></li>
            <li><Link to="/calculator" className="hover:text-foreground">{t("nav_calculator", "מחשבון חכם")}</Link></li>
            <li><Link to="/about" className="hover:text-foreground">{t("nav_about", "אודות")}</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">{t("nav_faq", "שאלות נפוצות")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">{t("footer_legal", "משפטי")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">{t("privacy", "מדיניות פרטיות")}</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">{t("terms", "תנאי שימוש")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("nav_contact", "צור קשר")}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {t("footer_copyright", "InvestED. פותח על ידי סער קסל.")}</p>
          <p>{t("footer_disclaimer", "לצורכי לימוד בלבד — לא ייעוץ השקעות.")}</p>
        </div>
      </div>
    </footer>
  );
}
