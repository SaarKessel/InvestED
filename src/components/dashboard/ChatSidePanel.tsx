// GPT-canvas style side panel: when an answer carries graphs or explanations
// (a stock, a calculation, a learning answer) they open beside the chat.
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { ChatChartCard } from "./ChatChartCard";

export function ChatSidePanel({ symbols, onClose, children }: { symbols: string[]; onClose: () => void; children: ReactNode }) {
  const { t, language } = useLanguage();
  return (
    <aside dir={language === "he" ? "rtl" : "ltr"} aria-label={t("panel_title")} className="sticky top-16 flex max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card/70 shadow-[0_0_40px_-18px_hsl(var(--primary)/0.5)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <span className="text-sm font-semibold">{t("panel_title")}</span>
        <button type="button" onClick={onClose} aria-label={t("tool_close")} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>
      <div className="space-y-3 overflow-y-auto p-3 text-xs [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
        {symbols.slice(0, 2).map((s) => <ChatChartCard key={s} symbol={s} />)}
        {children}
      </div>
    </aside>
  );
}
