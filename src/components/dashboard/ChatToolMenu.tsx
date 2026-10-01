import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { isOwner } from "@/lib/knowledge/knowledgeClient";
import { CHAT_TOOLS, type ChatTool } from "./chatTools";

const GROUPS: ChatTool["group"][] = ["learn", "practice", "tools", "account", "about"];

/** The "+" in the composer: every former tab, one tap away, opening inside the chat. */
export function ChatToolMenu({ query, onPlus, onPick }: { query: string | null; onPlus: () => void; onPick: () => void }) {
  const { t } = useLanguage();
  const [owner, setOwner] = useState(false);
  const box = useRef<HTMLDivElement>(null);
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
