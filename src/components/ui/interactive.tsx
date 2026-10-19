import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTransitions } from "@/lib/easyui/motion";

// ---------------------------------------------------------------------------
// Accordion (single-open) — smooth physics height motion adapted from
// EasyUI SmoothAccordion (MIT, (c) 2026 Suraj Maurya).
// ---------------------------------------------------------------------------

interface AccordionItemData {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export function Accordion({ items, className }: { items: AccordionItemData[]; className?: string }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const systemReduced = useReducedMotion();
  const transition = systemReduced ? { duration: 0 } : motionTransitions.springGentle;
  const chevronTransition = systemReduced ? { duration: 0 } : motionTransitions.springSnappy;

  return (
    <div className={cn("divide-y divide-border rounded-xl border border-border", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-semibold transition-colors hover:bg-accent/60"
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={chevronTransition} className="shrink-0 text-muted-foreground">
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transition}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tooltip (hover/focus) — direction-aware entry motion adapted from
// EasyUI DirectionalTooltip (MIT, (c) 2026 Suraj Maurya).
// ---------------------------------------------------------------------------

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const systemReduced = useReducedMotion();
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onKeyDown={(event) => { if (event.key === "Escape") setVisible(false); }}
      aria-describedby={visible ? id : undefined}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            id={id}
            role="tooltip"
            initial={systemReduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={systemReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 4 }}
            transition={systemReduced ? { duration: 0.01 } : motionTransitions.springSnappy}
            className="pointer-events-none absolute bottom-full right-1/2 z-50 mb-2 w-max max-w-[220px] translate-x-1/2 rounded-lg bg-foreground px-3 py-1.5 text-center text-xs font-medium text-background shadow-lg"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
