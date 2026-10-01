import { Bookmark, MessageSquarePlus, Trash2, X } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import type { ChatConversation } from "@/lib/copilot/chatHistory";
import type { SavedAnswer } from "@/lib/copilot/savedAnswers";

export interface SidebarMode { id: string; label: string; prompt: string }
interface Props {
  open: boolean; onClose: () => void; onNew: () => void;
  conversations: ChatConversation[]; onOpenConversation: (id: string) => void; onDeleteConversation: (id: string) => void;
  saved: SavedAnswer[]; onAskSaved: (question: string) => void; onRemoveSaved: (id: string) => void;
  modes: SidebarMode[]; onMode: (prompt: string) => void;
}
const head = "px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
/** Optional drawer on the physical left in both languages. Closed by default. Conversations, Saved and starter modes only. */
export function ChatSidebar(p: Props) {
  const { t, language } = useLanguage();
  if (!p.open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 lg:bg-black/20" onClick={p.onClose} aria-hidden="true" />
      <aside dir="ltr" aria-label={t("sidebar_title")} className="fixed bottom-0 left-0 top-0 z-[70] flex w-72 max-w-[85vw] flex-col border-e border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-3 py-3">
          <span className="text-sm font-semibold">{t("sidebar_title")}</span>
          <button type="button" onClick={p.onClose} aria-label={t("tool_close")} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <div className="flex-1 overflow-y-auto pb-6 [scrollbar-width:thin]" dir={language === "he" ? "rtl" : "ltr"}>
          <button type="button" onClick={() => { p.onNew(); p.onClose(); }} className="mx-3 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted"><MessageSquarePlus className="h-4 w-4" aria-hidden="true" />{t("copilot_clear")}</button>
          <p className={head}>{t("sidebar_modes")}</p>
          <ul className="px-2">{p.modes.map((m) => <li key={m.id}><button type="button" onClick={() => { p.onMode(m.prompt); p.onClose(); }} className="w-full truncate rounded-lg px-2 py-1.5 text-start text-sm hover:bg-muted">{m.label}</button></li>)}</ul>
          <p className={head}>{t("sidebar_saved")}</p>
          {p.saved.length === 0 ? <p className="px-3 text-xs text-muted-foreground">{t("sidebar_saved_empty")}</p> : (
            <ul className="px-2">{p.saved.map((s) => (
              <li key={s.id} className="flex items-center gap-1"><Bookmark className="ms-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <button type="button" onClick={() => { p.onAskSaved(s.question); p.onClose(); }} className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-start text-sm hover:bg-muted">{s.question}</button>
                <button type="button" aria-label={t("history_delete")} onClick={() => p.onRemoveSaved(s.id)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button></li>))}</ul>
          )}
          <p className={head}>{t("history_title")}</p>
          {p.conversations.length === 0 ? <p className="px-3 text-xs text-muted-foreground">{t("history_empty")}</p> : (
            <ul className="px-2">{p.conversations.map((c) => (
              <li key={c.id} className="flex items-center gap-1">
                <button type="button" onClick={() => { p.onOpenConversation(c.id); p.onClose(); }} className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-start text-sm hover:bg-muted">{c.title || "..."}</button>
                <button type="button" aria-label={t("history_delete")} onClick={() => p.onDeleteConversation(c.id)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button></li>))}</ul>
          )}
        </div>
      </aside>
    </>
  );
}
