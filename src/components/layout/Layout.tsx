import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/languageContext";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function DisclaimerBanner({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground ${className ?? ""}`}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p>
        <b>{t("disclaimer_banner_bold", "לצורכי לימוד בלבד.")}</b>{" "}
        {t(
          "disclaimer_banner_text",
          "InvestED אינה מייעצת בהשקעות ואינה ממליצה לקנות או למכור נכס כלשהו. יש להתייעץ עם בעל רישיון מוסמך לפני קבלת החלטות השקעה."
        )}
      </p>
    </div>
  );
}
