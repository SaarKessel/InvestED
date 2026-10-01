import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { LEVELS, type Level } from "@/lib/copilot/levels";

/** Level popover in the composer (like a model picker). Only BASIC can be chosen for now. */
export function LevelPicker({ level, onChange }: { level: Level; onChange: (l: Level) => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={t("level_title")} title={t("level_title")} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground">
        {t(`level_${level}`)}<ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" aria-label={t("level_title")} className="absolute bottom-full end-0 z-30 mb-2 w-64 rounded-2xl border border-border bg-background p-2 shadow-2xl">
          {LEVELS.map((l) => (
            <li key={l.id} role="option" aria-selected={l.id === level} aria-disabled={!l.available}>
              <button type="button" disabled={!l.available} onClick={() => { onChange(l.id); setOpen(false); }} className={`flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2 text-start text-sm ${l.available ? "text-foreground hover:bg-accent" : "cursor-not-allowed text-muted-foreground/60"}`}>
                <span><span className="block font-medium">{t(`level_${l.id}`)}</span><span className="block text-xs text-muted-foreground">{t(`level_${l.id}_desc`)}</span></span>
                {l.available ? (l.id === level ? <span aria-hidden="true" className="text-primary">&#10003;</span> : null) : <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">{t("level_soon")}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
