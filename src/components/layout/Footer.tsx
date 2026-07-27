import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            InvestED היא פלטפורמה חינוכית ללימוד עולם ההשקעות באמצעות AI. המערכת אינה
            נותנת ייעוץ השקעות ואינה ממליצה במה להשקיע — כל התוכן מוצג לצורכי לימוד בלבד.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">ניווט</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">בית</Link></li>
            <li><Link to="/start" className="hover:text-foreground">התחל ללמוד</Link></li>
            <li><Link to="/calculator" className="hover:text-foreground">מחשבון חכם</Link></li>
            <li><Link to="/about" className="hover:text-foreground">אודות</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">שאלות נפוצות</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">משפטי</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">מדיניות פרטיות</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">תנאי שימוש</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">צור קשר</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} InvestED. פותח על ידי סער קסל.</p>
          <p>לצורכי לימוד בלבד — לא ייעוץ השקעות.</p>
        </div>
      </div>
    </footer>
  );
}
