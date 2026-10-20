import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Bot, History, LogOut, Paperclip, Plus, Table2, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { isOwner } from "@/lib/knowledge/knowledgeClient";
import { LEVELS, type Level } from "@/lib/copilot/levels";
import { CHAT_TOOLS, type ChatTool } from "./chatTools";
import { stashGapSheetImport } from "@/features/gapsheet/lib/pendingImport";

const GROUPS: ChatTool["group"][] = ["learn", "practice", "tools", "account", "about"];

/** The "+" in the composer: every former tab, one tap away, opening inside the chat. */
export type ChatActionId = "history" | "agents" | "saved" | "signout";
const CHAT_ACTIONS: { id: ChatActionId; labelKey: string; icon: LucideIcon }[] = [
  { id: "history", labelKey: "history_open", icon: History },
  { id: "agents", labelKey: "action_agents", icon: Bot },
  { id: "saved", labelKey: "sidebar_saved", icon: Bookmark },
  { id: "signout", labelKey: "auth_sign_out", icon: LogOut },
];

export function ChatToolMenu({ query, onPlus, onPick, onAttach, onAction, level, onLevel }: { query: string | null; onPlus: () => void; onPick: () => void; onAttach: () => void; onAction: (id: ChatActionId) => void; level: Level; onLevel: (l: Level) => void }) {
  const { t } = useLanguage();
  const [owner, setOwner] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const dataFile = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const open = query !== null;
  useEffect(() => { void isOwner().then(setOwner); }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) onPick(); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onPick]);
  const needle = (query ?? "").trim().toLowerCase();
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={onPlus} aria-expanded={open} aria-haspopup="menu" aria-label={t("tools_menu")} title={t("tools_menu")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"><Plus className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /></button>
      {open && (
        <div role="menu" className="absolute bottom-full start-0 z-30 mb-2 max-h-[min(60vh,26rem)] w-64 overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-2xl [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
          <div className="py-1">
            <button type="button" role="menuitem" onClick={() => { onPick(); onAttach(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-foreground hover:bg-accent"><Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />{t("tools_attach_file")}</button>
            <button type="button" role="menuitem" onClick={() => dataFile.current?.click()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-foreground hover:bg-accent"><Table2 className="h-4 w-4 shrink-0" aria-hidden="true" />{t("tools_attach_data")}</button>
            <input ref={dataFile} type="file" accept=".csv,text/csv" className="hidden" tabIndex={-1} aria-hidden="true" onChange={(event) => { const f = event.target.files?.[0]; event.target.value = ""; if (f) { stashGapSheetImport(f); onPick(); navigate("/gapsheet"); } }} />
            <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("level_title")}</p>
            <div role="listbox" aria-label={t("level_title")} className="px-1 pb-1">
              {LEVELS.map((l) => (
                <button key={l.id} type="button" role="option" aria-selected={l.id === level} disabled={!l.available} onClick={() => { onLevel(l.id); onPick(); }} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-start text-sm ${l.available ? "text-foreground hover:bg-accent" : "cursor-not-allowed text-muted-foreground/60"}`}>
                  <span><span className="block font-medium">{t(`level_${l.id}`)}</span><span className="block text-xs text-muted-foreground">{t(`level_${l.id}_desc`)}</span></span>
                  {l.available ? (l.id === level ? <span aria-hidden="true" className="text-primary">&#10003;</span> : null) : <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">{t("level_soon")}</span>}
                </button>
              ))}
            </div>
            <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("tools_group_chat")}</p>
            {CHAT_ACTIONS.filter((a) => !needle || t(a.labelKey).toLowerCase().includes(needle) || a.id.includes(needle)).map((a) => (
              <button key={a.id} type="button" role="menuitem" onClick={() => { onPick(); onAction(a.id); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-foreground hover:bg-accent"><a.icon className="h-4 w-4 shrink-0" aria-hidden="true" />{t(a.labelKey)}</button>
            ))}
          </div>
          {GROUPS.map((group) => {
            const items = CHAT_TOOLS.filter((x) => x.group === group && (x.id !== "knowledge" || owner) && (!needle || t(x.labelKey).toLowerCase().includes(needle) || x.id.includes(needle)));
            if (!items.length) return null;
            return (
              <div key={group} className="py-1">
                <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t(`tools_group_${group}`)}</p>
                {items.map((item) => <Link key={item.id} to={item.path} role="menuitem" onClick={onPick} className="block rounded-xl px-3 py-2 text-sm text-foreground hover:bg-accent">{t(item.labelKey)}</Link>)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
