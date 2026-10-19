// Adapted from EasyUI Loader (MIT, (c) 2026 Suraj Maurya) — colors moved to
// InvestED design tokens and reduced motion detected automatically.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size in pixels. Default 32. */
  size?: number;
  /** Visual variant. Default 'arc'. */
  variant?: "arc" | "dots" | "line" | "rings";
  /** Accessible label. Pass null for a decorative loader inside another live region. */
  label?: string | null;
  /** Force reduced motion; defaults to the user's system preference. */
  reduceMotion?: boolean;
}

export function Loader({
  size = 32,
  variant = "arc",
  label = "Loading...",
  reduceMotion,
  className,
  ...props
}: LoaderProps) {
  const systemReduced = useReducedMotion();
  const reduced = reduceMotion ?? systemReduced ?? false;
  const decorative = label === null;

  return (
    <div
      role={decorative ? undefined : "status"}
      aria-busy={decorative ? undefined : true}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={cn("inline-flex flex-col items-center justify-center gap-2 text-primary", className)}
      {...props}
    >
      {variant === "arc" && (
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
          <svg
            className={cn("h-full w-full", !reduced && "animate-spin")}
            style={{ animationDuration: "2.5s" }}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="16" strokeWidth="3" className="stroke-border opacity-60" />
            <motion.circle
              cx="20" cy="20" r="16"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round"
              strokeDasharray="100" strokeDashoffset="65"
            />
          </svg>
        </div>
      )}

      {variant === "dots" && (
        <div style={{ width: size * 1.5, height: size * 0.4 }} className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="rounded-full bg-current"
              style={{ width: Math.max(4, size * 0.18), height: Math.max(4, size * 0.18) }}
              animate={
                reduced
                  ? { opacity: [0.3, 0.8, 0.3] }
                  : { scale: [0.8, 1.25, 0.8], opacity: [0.3, 1, 0.3] }
              }
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      {variant === "line" && (
        <div
          style={{ width: size * 2, height: Math.max(3, size * 0.08) }}
          className="relative overflow-hidden rounded-full bg-muted"
        >
          <motion.div
            className="absolute bottom-0 top-0 rounded-full bg-current"
            style={{ width: "35%" }}
            animate={reduced ? { opacity: [0.4, 1, 0.4] } : { left: ["-35%", "100%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}

      {variant === "rings" && (
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-current"
              animate={
                reduced
                  ? { opacity: [0.2, 0.6, 0.2] }
                  : { scale: [0.6, 1.15], opacity: [0.8, 0] }
              }
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
            />
          ))}
          <span
            className="rounded-full bg-current"
            style={{ width: Math.max(4, size * 0.2), height: Math.max(4, size * 0.2) }}
          />
        </div>
      )}

      {!decorative && label && <span className="sr-only">{label}</span>}
    </div>
  );
}
