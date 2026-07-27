import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Accordion (single-open)
// ---------------------------------------------------------------------------

interface AccordionItemData {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export function Accordion({ items, className }: { items: AccordionItemData[]; className?: string }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className={cn("divide-y divide-border rounded-xl border border-border", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right text-sm font-semibold transition-colors hover:bg-accent/60"
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tooltip (simple hover)
// ---------------------------------------------------------------------------

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="pointer-events-none absolute bottom-full right-1/2 z-50 mb-2 w-max max-w-[220px] translate-x-1/2 rounded-lg bg-foreground px-3 py-1.5 text-center text-xs font-medium text-background shadow-lg animate-fade-in">
          {label}
        </span>
      )}
    </span>
  );
}
