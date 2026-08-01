import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * InfoBadge — כפתור "מה זה?" ליד פיצ'רים מרכזיים באתר.
 * עובד גם בלחיצה (מובייל) וגם ב-hover (דסקטופ), ונסגר בלחיצה בחוץ.
 */
export function InfoBadge({ title, description }: { title?: string; description: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        aria-label="מה הפיצ'ר הזה עושה?"
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
          open ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
        )}
      >
        <Info className="h-3 w-3" />
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-3 text-right text-xs leading-relaxed shadow-lg animate-fade-in start-0"
        >
          {title && <p className="mb-1 font-bold text-foreground">{title}</p>}
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  );
}
