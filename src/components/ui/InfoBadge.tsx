import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/languageContext";

export function InfoBadge({ title, description }: { title?: string; description: string }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const descriptionId = useId();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
        aria-expanded={open}
        aria-controls={descriptionId}
        aria-label={t("info_badge_label", "What does this feature do?")}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          open ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
        )}
      >
        <Info className="h-3 w-3" />
      </button>

      {open && (
        <div
          id={descriptionId}
          onMouseLeave={() => setOpen(false)}
          className="absolute end-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 text-start text-xs leading-relaxed shadow-lg animate-fade-in"
        >
          {title && <p className="mb-1 font-bold text-foreground">{title}</p>}
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  );
}
