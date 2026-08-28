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
        <b>{t("disclaimer_banner_bold", "For educational purposes only.")}</b>{" "}
        {t(
          "disclaimer_banner_text",
          "InvestED does not provide investment advice and does not recommend buying or selling any asset. Consult a certified financial advisor before making investment decisions."
        )}
      </p>
    </div>
  );
}
