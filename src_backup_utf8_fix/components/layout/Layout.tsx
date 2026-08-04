import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ShieldAlert } from "lucide-react";

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
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground ${className ?? ""}`}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p>
        <b>׳׳¦׳•׳¨׳›׳™ ׳׳™׳׳•׳“ ׳‘׳׳‘׳“.</b> InvestED ׳׳™׳ ׳” ׳׳™׳™׳¢׳¦׳× ׳‘׳”׳©׳§׳¢׳•׳× ׳•׳׳™׳ ׳” ׳׳׳׳™׳¦׳” ׳׳§׳ ׳•׳× ׳׳• ׳׳׳›׳•׳¨ ׳ ׳›׳¡
        ׳›׳׳©׳”׳•. ׳™׳© ׳׳”׳×׳™׳™׳¢׳¥ ׳¢׳ ׳‘׳¢׳ ׳¨׳™׳©׳™׳•׳ ׳׳•׳¡׳׳ ׳׳₪׳ ׳™ ׳§׳‘׳׳× ׳”׳—׳׳˜׳•׳× ׳”׳©׳§׳¢׳”.
      </p>
    </div>
  );
}

