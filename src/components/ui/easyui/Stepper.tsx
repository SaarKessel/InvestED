// Adapted from EasyUI stepper (MIT, (c) 2026 Suraj Maurya) — InvestED tokens,
// RTL-aware connector fill and reduced-motion support.
import { useEffect, useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTransitions } from "@/lib/easyui/motion";

export interface StepperStep {
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the active step. */
  current: number;
  orientation?: "horizontal" | "vertical";
  /** Connector fill direction; default ltr. */
  dir?: "ltr" | "rtl";
  /** Localized " (completed)" suffix for screen readers. */
  completedLabel?: string;
  className?: string;
}

export function Stepper({ steps, current, orientation = "horizontal", dir = "ltr", completedLabel = "(completed)", className }: StepperProps) {
  const uid = useId();
  const vertical = orientation === "vertical";
  const last = steps.length - 1;
  const systemReduced = useReducedMotion();

  const ready = useRef(false);
  useEffect(() => {
    ready.current = true;
  }, []);

  return (
    <ol aria-label="Progress" className={cn(vertical ? "flex flex-col" : "flex w-full items-center", className)}>
      {steps.map((step, i) => {
        const state = i < current ? "complete" : i === current ? "current" : "upcoming";
        return (
          <li
            key={i}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(vertical ? "relative pb-7 last:pb-0" : "flex items-center", !vertical && i < last && "flex-1")}
          >
            <div className={cn("flex gap-3", vertical ? "items-start" : "items-center")}>
              <span
                className={cn(
                  "relative grid size-7 shrink-0 place-items-center rounded-full border text-xs font-medium tabular-nums transition-colors duration-300",
                  state === "complete" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-primary text-primary",
                  state === "upcoming" && "border-border text-muted-foreground"
                )}
              >
                {state === "current" && (
                  <motion.span
                    layoutId={`${uid}-ring`}
                    transition={systemReduced ? { duration: 0 } : motionTransitions.springSnappy}
                    className="absolute -inset-[5px] rounded-full border border-primary/40"
                  />
                )}
                {state === "complete" ? (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <motion.path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      initial={ready.current && !systemReduced ? { pathLength: 0 } : false}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: systemReduced ? 0 : 0.3, delay: 0.08, ease: "easeOut" }}
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={cn("flex min-w-0 flex-col text-start", !vertical && state !== "current" && "hidden sm:flex")}>
                <span className={cn("truncate text-sm transition-colors duration-300", state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground")}>
                  {step.title}
                  {state === "complete" && <span className="sr-only"> ({completedLabel})</span>}
                </span>
                {step.description && <span className="truncate text-xs text-muted-foreground">{step.description}</span>}
              </span>
            </div>
            {i < last && (
              <span
                aria-hidden
                className={cn(
                  "overflow-hidden bg-border",
                  vertical
                    ? "absolute bottom-1 start-[13.5px] top-[34px] w-px"
                    : "relative mx-3 h-px flex-1"
                )}
              >
                <motion.span
                  initial={false}
                  animate={vertical ? { scaleY: i < current ? 1 : 0 } : { scaleX: i < current ? 1 : 0 }}
                  transition={systemReduced ? { duration: 0 } : { duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                  className={cn(
                    "absolute inset-0 bg-primary",
                    vertical ? "origin-top" : dir === "rtl" ? "origin-right" : "origin-left"
                  )}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
